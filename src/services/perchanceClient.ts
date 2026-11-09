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
 *   1. Preflight — one memoised "may this runtime use the engine?" check per
 *      session. The docs' sample warms Cloudflare up by framing
 *      `https://perchance.org`, but that homepage answers
 *      `X-Frame-Options: SAMEORIGIN` and can never be displayed; the framed
 *      API page below is itself the visit Cloudflare needs, so nothing else
 *      is loaded (see `warmUpPerchance()`).
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
 *   • ONLY `perchance-ai-api` may ever be framed — never the bare
 *     `perchance.org` homepage, which answers `X-Frame-Options: SAMEORIGIN`
 *     and logs "Refused to display … in a frame" on every warm-up. The
 *     generator pages (`ai-text-to-image-generator`, `ai-images-generator`)
 *     send the same header; that is what killed the pre-22-Oct-2026 iframe
 *     bridge. Never reintroduce any of them.
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
/** `event.data.api` marker from the official postMessage contract. */
export const PERCHANCE_API_MARKER = 'perchance-image-api';

const PERCHANCE_ORIGINS = ['https://perchance.org', 'https://null.perchance.org'];

/**
 * Per-image budget before the chain moves on.
 *
 * The docs sample waits **180 s**, because the generation runs inside the
 * framed page on the caller's own device. 60 s was too short on the hardware
 * this product ships to (school laptops, low-end Android in the APK): the
 * engine timed out, the chain fell through to FLUX/Pollinations — which
 * usually have no key — and the teacher got the placeholder. That read as
 * "Perchance does not work". Matches the documented 180 s now.
 */
export const PERCHANCE_TIMEOUT_MS = 180_000;
/**
 * How many hidden iframes may generate at once.
 *
 * Kept at 2: each one is a real page running a diffusion model on the user's
 * device, and browsers throttle background tabs hard. More would make every
 * request slower rather than more parallel.
 */
export const PERCHANCE_MAX_CONCURRENT = 2;
/**
 * After this many consecutive failures the engine is benched…
 *
 * Deliberately higher than it used to be (2). The frame's own load plus the
 * model's first run is slow and flaky on a cold cache, and two unlucky
 * timeouts used to bench Perchance for ten minutes — which is exactly the
 * "it worked yesterday, today there are no images" report.
 */
export const PERCHANCE_BENCH_AFTER_FAILURES = 3;
/** …for this long, so one dead endpoint cannot stall a whole illustration batch. */
export const PERCHANCE_BENCH_MS = 10 * 60_000;
/**
 * Failures closer together than this count towards the breaker; a success or
 * a long gap resets the streak. Without it, two unrelated hiccups hours apart
 * would bench the engine.
 */
export const PERCHANCE_FAILURE_WINDOW_MS = 10 * 60_000;

/**
 * Safety net for a school product: the API's own default negative prompt is
 * "NSFW, nudity, blurry, low quality, text, watermark"; we send our own and
 * never allow it to be weakened from the UI. ("text" is deliberately absent —
 * CAPS posters need legible text.)
 */
export const PERCHANCE_NEGATIVE_PROMPT =
  'NSFW, nudity, violence, gore, scary, blood, blurry, low quality, watermark';

/**
 * Style for the generation iframe.
 *
 * This used to be `width:1px;height:1px;opacity:0;top:-9999px`, copied from the
 * docs sample. It is the single most important thing to get right here:
 * **the framed page runs the diffusion model in the browser**, so it needs a
 * running rendering pipeline. A 1×1, fully transparent, far-offscreen frame is
 * exactly what browsers classify as a throttled/occluded renderer — Chrome
 * then clamps `requestAnimationFrame` (and the timers the generator polls
 * with) to a crawl, and the generation silently never completes. The symptom
 * is a timeout with no error, which is why "Perchance does not work" had no
 * useful console message.
 *
 * It must stay: a real (if tiny) layout box, inside the viewport, and NOT
 * `opacity: 0` / `visibility: hidden` / `display: none` — those all trigger
 * the same throttling. `clip-path` + `pointer-events: none` hides it visually
 * while keeping the renderer live. `transform` keeps it out of the way of the
 * document layout.
 */
const HIDDEN_FRAME_STYLE =
  'width:320px;height:320px;border:0;position:fixed;left:0;bottom:0;' +
  'opacity:0.01;pointer-events:none;z-index:-1;clip-path:inset(100%);' +
  'transform:translateZ(0);';

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

let preflighted = false;
let preflightPromise: Promise<boolean> | null = null;
let consecutiveFailures = 0;
/** When the current failure streak started — the breaker only counts one window. */
let failureStreakStartedAt = 0;
let benchUntil = 0;
/** Sticky host preference — flips to the embed mirror after a primary failure. */
let useEmbedMirror = false;
const resultCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();
let activeRequests = 0;
const waitQueue: Array<() => void> = [];

/** Clears every memoised decision (tests, "Try Again" debug flows). */
export const resetPerchanceClient = (): void => {
  preflighted = false;
  preflightPromise = null;
  consecutiveFailures = 0;
  failureStreakStartedAt = 0;
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
  const now = Date.now();
  // Only failures inside one window form a streak: two unrelated hiccups an
  // hour apart must never add up to a bench.
  if (!failureStreakStartedAt || now - failureStreakStartedAt > PERCHANCE_FAILURE_WINDOW_MS) {
    failureStreakStartedAt = now;
    consecutiveFailures = 0;
  }
  consecutiveFailures += 1;
  // Only flip the host when the CURRENT host is failing repeatedly. Flipping on
  // every single failure meant one flaky request sent the next image to the
  // mirror even though the primary was healthy.
  if (consecutiveFailures > 1) useEmbedMirror = !useEmbedMirror;
  if (consecutiveFailures >= PERCHANCE_BENCH_AFTER_FAILURES) {
    benchUntil = now + PERCHANCE_BENCH_MS;
    console.warn(
      `[Perchance AI] ${consecutiveFailures} consecutive failures — benched for ${PERCHANCE_BENCH_MS / 60000} min.`
    );
  }
};

const markSuccess = (): void => {
  consecutiveFailures = 0;
  failureStreakStartedAt = 0;
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

/* ── preflight (memoised once per session, no DOM and no network) ──────────── */

/**
 * Preflight, not a warm-up. The official sample loads the bare homepage in a
 * hidden iframe "so Cloudflare passes the browser", but that page answers
 * `X-Frame-Options: SAMEORIGIN`: the browser refuses to display it and logs
 * `Refused to display 'https://perchance.org/' in a frame …` on the first
 * image of every session. It is also unnecessary — the request iframe loads a
 * page on the very same origin, which is what actually earns the Cloudflare
 * clearance.
 *
 * So this is now a frame-free capability check: it resolves `true` in a
 * browser (and `false` on the server / in Node), memoised per session, and it
 * never throws. Kept under the old name so existing callers and debug tools
 * keep working. NEVER put an iframe (or a `fetch`) behind it again.
 */
export const warmUpPerchance = (): Promise<boolean> => {
  if (!isPerchanceRuntimeAvailable()) return Promise.resolve(false);
  if (preflighted) return Promise.resolve(true);
  preflighted = true;
  preflightPromise = Promise.resolve(true);
  return preflightPromise;
};

/* ── generation ────────────────────────────────────────────────────────────── */

/** True for the per-request budget expiring (as opposed to a real failure). */
const isTimeoutError = (error: Error): boolean => /timed out/i.test(error.message);

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

        // Diagnostics: the framed page is a third-party document, so when it is
        // blocked (Cloudflare challenge, CSP, an offline school network) there is
        // NO postMessage and NO exception — only a silent timeout. `onload`
        // proves the document was actually served; a load followed by silence
        // means the renderer is working, a *missing* load means it was blocked.
        let frameLoaded = false;
        frame.onload = () => {
          frameLoaded = true;
        };
        frame.onerror = () => {
          finish(
            new Error(
              `Perchance could not load the framed API page (host ${new URL(apiBase).host}). ` +
                'A network filter, CSP frame-src rule or offline device is blocking it.'
            )
          );
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
          // Say WHERE it stopped — "timed out" alone gave no way to tell a
          // Cloudflare challenge from a slow render from a blocked frame.
          finish(
            new Error(
              frameLoaded
                ? `Perchance image generation timed out after ${Math.round(timeoutMs / 1000)}s ` +
                    `(host ${new URL(apiBase).host}). The framed page loaded and is still ` +
                    'rendering — this device is slower than the generation budget.'
                : `Perchance never loaded the framed API page after ${Math.round(timeoutMs / 1000)}s ` +
                    `(host ${new URL(apiBase).host}). The iframe is blocked before it can run: ` +
                    'check the network filter / CSP / whether perchance.org is reachable.'
            )
          );
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
    const error = err instanceof Error ? err : new Error(String(err));
    // A timeout is NOT proof the engine is broken — it usually means this
    // device is still rendering. Counting it towards the breaker is what made
    // a slow school laptop bench Perchance for ten minutes. Timeouts still
    // reject, so the provider chain moves on immediately.
    if (!isTimeoutError(error)) markFailure();
    else console.warn(`[Perchance AI] ${error.message} — not counted against the circuit breaker.`);
    throw error;
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

/* ── diagnostics ───────────────────────────────────────────────────────────── */

export interface PerchanceDiagnostics {
  /** Is this a browser where the iframe transport can run at all? */
  runtimeAvailable: boolean;
  /** Is the circuit breaker currently holding the engine back? */
  benched: boolean;
  /** Milliseconds until the bench lifts (0 when not benched). */
  benchRemainingMs: number;
  /** Which host would the next request use? */
  host: 'perchance.org' | 'null.perchance.org';
  /** How the framed page is laid out — must never be 1×1 / hidden. */
  frameStyle: string;
  /** Per-image budget currently in force. */
  timeoutMs: number;
  /** Consecutive failures that count towards the breaker right now. */
  consecutiveFailures: number;
}

/**
 * Snapshot of the engine's state, for the Settings → Diagnostics panel and for
 * "images don't work" reports. Pure read: it never touches the network and
 * never changes the breaker, which is why a health check can be shown to a
 * teacher safely.
 */
export const getPerchanceDiagnostics = (): PerchanceDiagnostics => {
  const now = Date.now();
  return {
    runtimeAvailable: isPerchanceRuntimeAvailable(),
    benched: isPerchanceBenching(now),
    benchRemainingMs: Math.max(0, benchUntil - now),
    host: useEmbedMirror ? 'null.perchance.org' : 'perchance.org',
    frameStyle: HIDDEN_FRAME_STYLE,
    timeoutMs: PERCHANCE_TIMEOUT_MS,
    consecutiveFailures
  };
};

/**
 * End-to-end probe: actually renders one small image through the API and
 * reports how long it took. This is the only honest answer to "does Perchance
 * work on this device?" — every cheaper check (runtime, DNS, frame load) can
 * pass while generation still fails.
 *
 * It is deliberately small (512×512) and uses a throwaway prompt, and it does
 * NOT count towards the circuit breaker: a teacher pressing "Test" must never
 * bench the engine.
 */
export const probePerchance = async (
  timeoutMs: number = PERCHANCE_TIMEOUT_MS
): Promise<{ ok: boolean; url?: string; elapsedMs: number; error?: string }> => {
  const started = Date.now();
  try {
    const url = await generatePerchanceImageClient(
      'a simple smiling sun, flat vector icon',
      512,
      512,
      undefined,
      timeoutMs
    );
    // The probe result must not poison the cache used by real illustrations.
    resultCache.delete(
      cacheKeyFor(
        { prompt: 'a simple smiling sun, flat vector icon', width: 512, height: 512 },
        pickPerchanceResolution(512, 512)
      )
    );
    return { ok: true, url, elapsedMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      elapsedMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err)
    };
  }
};
