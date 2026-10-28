/**
 * Perchance Image API v1 client — browser-only, iframe + postMessage.
 *
 * Perchance ships a purpose-built **Image API v1** at
 * `https://perchance.org/perchance-ai-api` designed to be consumed from any
 * site (the documentation lives at the endpoint itself): "Works from any
 * domain — your custom app, a localhost page, any site. No keys, no CORS, no
 * backend. The app loads the API in a hidden iframe and receives the result
 * via postMessage." Unlimited — no usage caps.
 *
 * CONTRACT (official docs, verified 28 Oct 2026):
 *   1. Warm-up — a hidden iframe visits `https://perchance.org` once per
 *      session so Cloudflare passes this browser.
 *   2. Request — hidden iframe at
 *      `…/perchance-ai-api?prompt=…&format=json&id=<random>` plus optional
 *      `resolution` (512x512 | 512x768 | 768x512 | 768x768), `seed`,
 *      `guidanceScale`, `negativePrompt`, `removeBackground`.
 *   3. Reply — `postMessage` carrying
 *      `{ api: "perchance-image-api", result: { id, ok, url, dataUrl, seed, error } }`.
 *      The message is accepted only from a Perchance origin AND only for the
 *      matching request id.
 *   4. Results are permanent `user.uploads.dev` URLs (never challenged), so
 *      they are cached aggressively: same prompt + params ⇒ same URL and no
 *      second generation.
 *
 * HARD RULES (guarded by `tests/image-providers.test.ts`):
 *   • ONLY `perchance-ai-api` may ever be framed. The generator pages
 *     (`ai-text-to-image-generator`, `ai-images-generator`) send
 *     `X-Frame-Options: SAMEORIGIN` and can never load — that is what killed
 *     the pre-22-Oct-2026 iframe bridge. Never reintroduce them.
 *   • Never `fetch()` perchance.org from client or server — bare HTTP is
 *     answered by a Cloudflare 403. The hidden iframe IS the transport.
 *   • This module is browser-only. The Express server must never import it.
 *
 * The embed FAQ (`perchance.org/embed-generator`) also documents a
 * `null.perchance.org` mirror that may be framed; it is kept as an automatic
 * alternate host when the primary endpoint never answers (e.g. a stale
 * Cloudflare rule), and the whole engine stays skippable — every failure falls
 * through to the next provider in the chain (FLUX → Gemini → Pollinations).
 */

/** The documented API endpoint. This exact URL is what the product uses. */
export const PERCHANCE_API_URL = 'https://perchance.org/perchance-ai-api';
/** Framing mirror documented by Perchance's embed-generator FAQ. */
export const PERCHANCE_EMBED_API_URL = 'https://null.perchance.org/perchance-ai-api';
/** Warm-up target from the official sample ("visits perchance.org so Cloudflare passes them"). */
export const PERCHANCE_WARMUP_URL = 'https://perchance.org/';
/** `event.data.api` marker from the official postMessage contract. */
export const PERCHANCE_API_MARKER = 'perchance-image-api';

const PERCHANCE_ORIGINS = ['https://perchance.org', 'https://null.perchance.org'];

/** Per-image budget before the chain moves on (docs sample waits 180 s; the classroom does not). */
export const PERCHANCE_TIMEOUT_MS = 60_000;
/** How many hidden iframes may generate at once. */
export const PERCHANCE_MAX_CONCURRENT = 2;
/** After this many consecutive failures the engine is benched… */
export const PERCHANCE_BENCH_AFTER_FAILURES = 2;
/** …for this long, so one dead endpoint cannot stall a whole illustration batch. */
export const PERCHANCE_BENCH_MS = 10 * 60_000;

/**
 * Safety net for a school product: the API's own default negative prompt is
 * "NSFW, nudity, blurry, low quality, text, watermark"; we send our own and
 * never allow it to be weakened from the UI. ("text" is deliberately absent —
 * CAPS posters need legible text.)
 */
export const PERCHANCE_NEGATIVE_PROMPT =
  'NSFW, nudity, violence, gore, scary, blood, blurry, low quality, watermark';

const HIDDEN_FRAME_STYLE =
  'width:1px;height:1px;border:0;position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';

export interface PerchanceImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  /** Explicit seeds render deterministically; omitted seeds are cache-friendly. */
  seed?: number;
  guidanceScale?: number;
  negativePrompt?: string;
}

/** Perchance renders only these four sizes — pick the closest to the request. */
export const pickPerchanceResolution = (width: number, height: number): string => {
  const ratio = width / Math.max(1, height);
  if (ratio > 1.15) return '768x512';
  if (ratio < 0.87) return '512x768';
  return '768x768';
};

/** Builds the documented query string. Pure — unit-tested without a DOM. */
export const buildPerchanceRequestUrl = (
  baseUrl: string,
  request: PerchanceImageRequest,
  requestId: string
): string => {
  const params = new URLSearchParams({
    prompt: request.prompt,
    format: 'json',
    id: requestId
  });
  params.set(
    'resolution',
    pickPerchanceResolution(request.width ?? 1024, request.height ?? 1024)
  );
  // The child-safety negative prompt is always sent; callers may only extend it.
  const extraNegatives = String(request.negativePrompt || '').trim();
  params.set(
    'negativePrompt',
    extraNegatives ? `${PERCHANCE_NEGATIVE_PROMPT}, ${extraNegatives}` : PERCHANCE_NEGATIVE_PROMPT
  );
  if (typeof request.seed === 'number' && Number.isFinite(request.seed)) {
    params.set('seed', String(Math.trunc(request.seed)));
  }
  if (typeof request.guidanceScale === 'number' && Number.isFinite(request.guidanceScale)) {
    params.set('guidanceScale', String(Math.min(30, Math.max(1, request.guidanceScale))));
  }
  return `${baseUrl}?${params.toString()}`;
};

const isPerchanceOrigin = (origin: string): boolean => PERCHANCE_ORIGINS.includes(origin);

const isUsableImageUrl = (value: unknown): value is string =>
  typeof value === 'string' && (/^https:\/\//i.test(value) || /^data:image\//i.test(value));

/** True when the module is running inside a browser (the APK WebView counts). */
export const isPerchanceRuntimeAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined' && typeof document.createElement === 'function';

/* ── session state ─────────────────────────────────────────────────────────── */

let warmedUp = false;
let warmUpPromise: Promise<boolean> | null = null;
let consecutiveFailures = 0;
let benchUntil = 0;
/** Sticky host preference — flips to the embed mirror after a primary failure. */
let useEmbedMirror = false;
const resultCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();
let activeRequests = 0;
const waitQueue: Array<() => void> = [];

/** Clears every memoised decision (tests, "Try Again" debug flows). */
export const resetPerchanceClient = (): void => {
  warmedUp = false;
  warmUpPromise = null;
  consecutiveFailures = 0;
  benchUntil = 0;
  useEmbedMirror = false;
  resultCache.clear();
  inFlight.clear();
  activeRequests = 0;
  waitQueue.length = 0;
};

/** Is the engine benched right now (circuit breaker)? */
export const isPerchanceBenching = (now = Date.now()): boolean => now < benchUntil;

export const isPerchanceAvailable = (): boolean =>
  isPerchanceRuntimeAvailable() && !isPerchanceBenching();

const markFailure = (): void => {
  consecutiveFailures += 1;
  useEmbedMirror = !useEmbedMirror;
  if (consecutiveFailures >= PERCHANCE_BENCH_AFTER_FAILURES) {
    benchUntil = Date.now() + PERCHANCE_BENCH_MS;
    console.warn(
      `[Perchance AI] ${consecutiveFailures} consecutive failures — benched for ${PERCHANCE_BENCH_MS / 60000} min.`
    );
  }
};

const markSuccess = (): void => {
  consecutiveFailures = 0;
  benchUntil = 0;
};

/* ── concurrency (max PERCHANCE_MAX_CONCURRENT hidden iframes) ─────────────── */

const acquireSlot = (): Promise<void> => {
  if (activeRequests < PERCHANCE_MAX_CONCURRENT) {
    activeRequests += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeRequests += 1;
      resolve();
    });
  });
};

const releaseSlot = (): void => {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = waitQueue.shift();
  if (next) next();
};

/* ── warm-up ("once per user — visits perchance.org so Cloudflare passes them") */

/** Never throws: a failed warm-up only means generation may answer slower. */
export const warmUpPerchance = (timeoutMs = 15_000): Promise<boolean> => {
  if (!isPerchanceRuntimeAvailable()) return Promise.resolve(false);
  if (warmedUp) return Promise.resolve(true);
  if (warmUpPromise) return warmUpPromise;

  warmUpPromise = new Promise<boolean>((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.title = 'Perchance warm-up';
    frame.style.cssText = HIDDEN_FRAME_STYLE;

    const finish = (ok: boolean) => {
      clearTimeout(timer);
      frame.remove();
      if (ok) warmedUp = true;
      warmUpPromise = null;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    frame.onload = () => setTimeout(() => finish(true), 500);
    frame.src = PERCHANCE_WARMUP_URL;
    document.body.appendChild(frame);
  });
  return warmUpPromise;
};

/* ── generation ────────────────────────────────────────────────────────────── */

const cacheKeyFor = (request: PerchanceImageRequest, resolution: string): string =>
  [request.prompt, resolution, request.seed ?? '', request.guidanceScale ?? '', request.negativePrompt ?? ''].join('|');

const generateOnce = async (
  request: PerchanceImageRequest,
  timeoutMs: number
): Promise<string> => {
  await warmUpPerchance();

  const resolution = pickPerchanceResolution(request.width ?? 1024, request.height ?? 1024);
  const key = cacheKeyFor(request, resolution);
  const cached = resultCache.get(key);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const run = (async (): Promise<string> => {
    await acquireSlot();
    const requestId = `eduai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const apiBase = useEmbedMirror ? PERCHANCE_EMBED_API_URL : PERCHANCE_API_URL;

    console.log(
      `[Perchance AI] Generating via ${useEmbedMirror ? 'embed mirror' : 'Image API v1'} | ${requestId} | res ${resolution} | "${request.prompt.slice(0, 60)}..."`
    );

    try {
      return await new Promise<string>((resolve, reject) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.title = 'Perchance Image API';
        // Third-party origin: it keeps its own storage/cookies (same-origin
        // with itself) so Cloudflare clearance and the plugin can run.
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
        frame.style.cssText = HIDDEN_FRAME_STYLE;

        let settled = false;
        const finish = (error: Error | null, url?: string) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          window.removeEventListener('message', onMessage);
          frame.remove();
          if (error) reject(error);
          else resolve(url as string);
        };

        const onMessage = (event: MessageEvent) => {
          // Origin AND request-id are both checked: a hostile page must never
          // be able to inject an image URL into the lesson content pipeline.
          if (!isPerchanceOrigin(event.origin)) return;
          const data: any = event.data || {};
          if (data.api !== PERCHANCE_API_MARKER || !data.result || data.result.id !== requestId) return;

          const result = data.result;
          const url = isUsableImageUrl(result.url)
            ? result.url
            : isUsableImageUrl(result.dataUrl)
              ? result.dataUrl
              : null;
          if (result.ok && url) finish(null, url);
          else finish(new Error(result.error || 'Perchance generation failed'));
        };

        const timeoutId = setTimeout(() => {
          finish(new Error('Perchance image generation timed out'));
        }, timeoutMs);

        window.addEventListener('message', onMessage);
        frame.src = buildPerchanceRequestUrl(apiBase, request, requestId);
        document.body.appendChild(frame);
      }).then((url) => {
        resultCache.set(key, url);
        markSuccess();
        return url;
      });
    } finally {
      releaseSlot();
    }
  })();

  inFlight.set(key, run);
  try {
    return await run;
  } catch (err) {
    markFailure();
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    inFlight.delete(key);
  }
};

/**
 * Generates one illustration through the Perchance Image API and resolves to
 * the permanent hosted URL (or a `data:` URL). Rejects on timeout/failure so
 * the provider chain can move on — this engine never breaks the chain.
 */
export const generatePerchanceImageClient = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed?: number,
  timeoutMs: number = PERCHANCE_TIMEOUT_MS,
  negativePrompt?: string
): Promise<string> => {
  if (!isPerchanceRuntimeAvailable()) {
    throw new Error('Perchance image client can only run in a browser environment');
  }
  if (isPerchanceBenching()) {
    throw new Error('Perchance Image API is temporarily benched after repeated failures');
  }
  return generateOnce(
    { prompt, width, height, seed, negativePrompt },
    timeoutMs
  );
};
