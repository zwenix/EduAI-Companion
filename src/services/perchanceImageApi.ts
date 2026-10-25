/**
 * Perchance Image API v1 — a BROWSER-SIDE image engine.
 *
 * Perchance ships a purpose-built image API for exactly this use case
 * (https://perchance.org/perchance-ai-api): "Works from any domain — your
 * custom app, a localhost page, any site. No keys, no CORS, no backend. Your
 * app loads the API in a hidden iframe and receives the result via
 * postMessage." It is unmetered ("Unlimited — no usage caps"), which is why it
 * is worth having alongside the throttled keyless Pollinations tier.
 *
 * THREE things the previous (removed) integration got wrong, all fixed here:
 *
 *  1. WRONG PAGE. It framed Perchance's community text-to-image UI page, which
 *     has no message listener, and posted an invented `{type:"generate"}`
 *     payload at it. The real endpoint is `perchance-ai-api` with
 *     `format=json` and an `id` correlation parameter, and it replies
 *     `{api:"perchance-image-api", result:{id, ok, url, dataUrl, seed}}`.
 *  2. WRONG HOST. The apex `perchance.org` sends `X-Frame-Options:
 *     SAMEORIGIN`, which is what made the old hidden iframe dead on arrival.
 *     Perchance's own embed FAQ says to frame generators through the
 *     `null.perchance.org` subdomain instead, so that is the host used here.
 *  3. NO WARM-UP. Perchance sits behind a Cloudflare challenge. Their
 *     reference implementation visits `perchance.org` once in a throwaway
 *     iframe first so the visitor is passed, then generates. Without that
 *     step the generation frame can be challenged and never answers.
 *
 * HARD CONSTRAINTS — read before relying on this engine:
 *
 *  • BROWSER ONLY. Perchance runs the generation in the *caller's* browser
 *    ("it happens on the caller's quota, not yours"), so there is no
 *    server-side form of this. `/api/image-proxy` and the other Express image
 *    routes cannot use it; `server.ts` maps `perchance` to `flux`. The upside
 *    is that each teacher uses their own browser and IP, so this engine has no
 *    shared per-IP quota to exhaust.
 *  • 768 px CEILING. Only `512x512`, `512x768`, `768x512` and `768x768` are
 *    accepted, so `nearestPerchanceResolution()` maps any requested box onto
 *    the closest preset. A 1024 px header will be rendered at 768 px.
 *  • SLOW. Each call loads a full page in a hidden iframe and generates
 *    in-browser; Perchance's own reference code allows 180 s. We cap far below
 *    that and disable the engine for the session after repeated failures, so a
 *    blocked or slow Perchance can never make every illustration wait.
 *  • NOT THE DEFAULT. `DEFAULT_IMAGE_PROVIDER` stays `flux`. This is an
 *    opt-in engine and a fallback, because a third-party iframe that depends
 *    on Cloudflare tolerating a hidden 1x1 frame can stop working without
 *    notice — it already changed once.
 */

/** Perchance's dedicated embeddable host (see perchance.org/embed-generator). */
export const PERCHANCE_EMBED_ORIGIN = 'https://null.perchance.org';
/** Apex host, visited once per session so Cloudflare passes the visitor. */
export const PERCHANCE_WARMUP_URL = 'https://perchance.org';
export const PERCHANCE_API_PATH = '/perchance-ai-api';
/** Value of `result.api` in every reply — part of the documented protocol. */
export const PERCHANCE_MESSAGE_API = 'perchance-image-api';

/** The only resolutions the API accepts. */
export const PERCHANCE_RESOLUTIONS: readonly string[] = [
  '512x512',
  '512x768',
  '768x512',
  '768x768'
];

/**
 * Generation cap. Perchance's reference code waits 180 s; that is far too long
 * inside a fallback chain, so we give up sooner and let the next engine run.
 */
export const PERCHANCE_REQUEST_TIMEOUT_MS = 45_000;
export const PERCHANCE_WARMUP_TIMEOUT_MS = 15_000;
/** Consecutive failures before the engine is dropped for the rest of the session. */
export const PERCHANCE_FAILURE_LIMIT = 2;

export interface PerchanceImageResult {
  /** A `data:` URL when Perchance returned one, otherwise the hosted URL. */
  url: string;
  /** True when `url` is a self-contained `data:` URL. */
  isDataUrl: boolean;
  resolution: string;
  seed?: number;
  cached: boolean;
}

export interface PerchanceImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
  guidanceScale?: number;
  removeBackground?: boolean;
  timeoutMs?: number;
}

/* ── Session state ─────────────────────────────────────────────────────────── */

let warmedUp = false;
let warmUpInFlight: Promise<boolean> | null = null;
let consecutiveFailures = 0;
let disabledForSession = false;

/** Test hook — clears the warm-up memo and the failure counter. */
export function resetPerchanceSession(): void {
  warmedUp = false;
  warmUpInFlight = null;
  consecutiveFailures = 0;
  disabledForSession = false;
}

export const isPerchanceAvailable = (): boolean => !disabledForSession;

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/**
 * Maps any requested box onto the closest resolution Perchance accepts.
 *
 * Orientation is decided FIRST, then area. A weighted ratio+area score looks
 * tidier but gets portraits wrong: for a 768x1024 sidebar the area term pulls
 * the choice to 768x768 (square) because 512x768 is further from the requested
 * pixel count. Never hand a teacher a square image for a portrait slot.
 */
export function nearestPerchanceResolution(width?: number, height?: number): string {
  const w = Number(width) || 768;
  const h = Number(height) || 768;
  const bucket = w > h ? ['768x512'] : h > w ? ['512x768'] : ['768x768', '512x512'];
  let best = bucket[0];
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of bucket) {
    const [cw, ch] = candidate.split('x').map(Number);
    const delta = Math.abs(cw * ch - w * h);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = candidate;
    }
  }
  return best;
}

/**
 * Accepts only a genuine Perchance origin. The removed implementation used
 * `event.origin.includes('perchance.org')`, which `https://perchance.org.
 * evil.example` would have satisfied.
 */
export function isPerchanceOrigin(origin: string): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  return host === 'perchance.org' || host === 'null.perchance.org' || host.endsWith('.perchance.org');
}

function makeHiddenFrame(src: string, title: string): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = title;
  frame.setAttribute('aria-hidden', 'true');
  // `allow-scripts` is required for the generator to run. `allow-same-origin`
  // is deliberately omitted: the frame is a third-party origin and Perchance
  // needs no access to our storage, so an opaque origin is the safer choice.
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.cssText =
    'width:1px;height:1px;border:0;position:absolute;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
  return frame;
}

/* ── Warm-up ───────────────────────────────────────────────────────────────── */

/**
 * Visits `perchance.org` once per session in a throwaway frame so Cloudflare
 * passes this visitor. Resolves false (never throws) if the warm-up could not
 * complete — generation is still attempted, because a suppressed `load` event
 * is not proof the challenge failed.
 */
export function warmUpPerchance(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if (warmedUp) return Promise.resolve(true);
  if (warmUpInFlight) return warmUpInFlight;

  warmUpInFlight = new Promise<boolean>((resolve) => {
    const frame = makeHiddenFrame(PERCHANCE_WARMUP_URL, 'Perchance warm-up');
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      frame.remove();
      warmedUp = ok;
      resolve(ok);
    };

    const timer = setTimeout(() => {
      console.warn('[Perchance] Warm-up timed out; attempting generation anyway.');
      finish(false);
    }, PERCHANCE_WARMUP_TIMEOUT_MS);

    frame.addEventListener('load', () => {
      // Give the challenge a moment to settle before the frame is removed.
      setTimeout(() => finish(true), 500);
    });
    frame.addEventListener('error', () => finish(false));

    document.body.appendChild(frame);
  });

  return warmUpInFlight;
}

/* ── Generation ────────────────────────────────────────────────────────────── */

/** Per-prompt cache: Perchance URLs are permanent, so repeat prompts are free. */
const resultCache = new Map<string, PerchanceImageResult>();

/** Test hook. */
export function clearPerchanceCache(): void {
  resultCache.clear();
}

/**
 * Generates one image through Perchance's Image API v1.
 *
 * Rejects (never resolves with a broken value) when the engine is unavailable,
 * the frame is challenged, the reply does not correlate, or the cap expires —
 * so `generateImageWithFallback` can move straight to the next engine.
 */
export async function generatePerchanceImage(
  request: PerchanceImageRequest
): Promise<PerchanceImageResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(
      'Perchance Image API is browser-only — the caller\'s browser runs the generation, so there is no server-side form.'
    );
  }
  if (disabledForSession) {
    throw new Error('Perchance is unavailable for this session');
  }
  if (!request.prompt || !request.prompt.trim()) {
    throw new Error('Perchance requires a prompt');
  }

  const resolution = nearestPerchanceResolution(request.width, request.height);
  const seed = request.seed ?? Math.floor(Math.random() * 100_000);
  const cacheKey = `${request.prompt}|${resolution}|${seed}|${request.negativePrompt ?? ''}|${request.guidanceScale ?? ''}`;
  const cached = resultCache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  await warmUpPerchance();

  // Correlation id: the reply must echo it back, so a stray message from any
  // other frame can never be mistaken for our image.
  const requestId = `eduai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const params = new URLSearchParams({
    prompt: request.prompt,
    format: 'json',
    id: requestId,
    resolution
  });
  params.set('seed', String(seed));
  if (request.negativePrompt) params.set('negativePrompt', request.negativePrompt);
  if (request.guidanceScale) params.set('guidanceScale', String(request.guidanceScale));
  if (request.removeBackground) params.set('removeBackground', 'true');

  const src = `${PERCHANCE_EMBED_ORIGIN}${PERCHANCE_API_PATH}?${params.toString()}`;
  const timeoutMs = request.timeoutMs ?? PERCHANCE_REQUEST_TIMEOUT_MS;

  console.log(`[Perchance] Generating ${resolution} | seed ${seed} | "${request.prompt.slice(0, 60)}..."`);

  try {
    const result = await new Promise<PerchanceImageResult>((resolve, reject) => {
      const frame = makeHiddenFrame(src, 'Perchance image generation');
      let settled = false;

      const finish = (error?: Error, value?: PerchanceImageResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        frame.remove();
        if (value) resolve(value);
        else reject(error ?? new Error('Perchance generation failed'));
      };

      const onMessage = (event: MessageEvent) => {
        if (!isPerchanceOrigin(event.origin)) return;
        const data: any = event.data;
        if (!data || data.api !== PERCHANCE_MESSAGE_API) return;
        const result = data.result;
        if (!result || result.id !== requestId) return;

        if (!result.ok) {
          finish(new Error(String(result.error || 'Perchance reported a generation failure')));
          return;
        }
        // Prefer the data URL: it is self-contained, so it cannot taint the
        // canvas that html2canvas renders for PDF export. A cross-origin
        // `user.uploads.dev` URL can, if that host omits CORS headers.
        const image = typeof result.dataUrl === 'string' && result.dataUrl
          ? result.dataUrl
          : typeof result.url === 'string' && result.url
            ? result.url
            : '';
        if (!image) {
          finish(new Error('Perchance reply carried no image URL'));
          return;
        }
        finish(undefined, {
          url: image,
          isDataUrl: image.startsWith('data:'),
          resolution,
          seed: typeof result.seed === 'number' ? result.seed : seed,
          cached: false
        });
      };

      const timer = setTimeout(() => {
        finish(new Error(`Perchance generation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      window.addEventListener('message', onMessage);
      frame.addEventListener('error', () => {
        finish(new Error('Perchance frame failed to load (framing may be blocked)'));
      });
      document.body.appendChild(frame);
    });

    consecutiveFailures = 0;
    resultCache.set(cacheKey, result);
    console.log(`[Perchance] Generated ${result.resolution} (${result.isDataUrl ? 'data URL' : 'hosted URL'})`);
    return result;
  } catch (error) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= PERCHANCE_FAILURE_LIMIT) {
      disabledForSession = true;
      console.warn(
        `[Perchance] ${consecutiveFailures} consecutive failures — disabling Perchance for this session so the chain stops waiting on it.`
      );
    }
    throw error;
  }
}

export default {
  PERCHANCE_EMBED_ORIGIN,
  PERCHANCE_API_PATH,
  PERCHANCE_MESSAGE_API,
  PERCHANCE_RESOLUTIONS,
  PERCHANCE_REQUEST_TIMEOUT_MS,
  PERCHANCE_FAILURE_LIMIT,
  clearPerchanceCache,
  generatePerchanceImage,
  isPerchanceAvailable,
  isPerchanceOrigin,
  nearestPerchanceResolution,
  resetPerchanceSession,
  warmUpPerchance
};
