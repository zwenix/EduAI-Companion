/**
 * Image-provider registry — the single source of truth shared by the React
 * client (`src/lib/imageGeneration.ts`) and the Express API (`server.ts`).
 *
 * ENGINES:
 *   1. `flux`         — FLUX.1-schnell via Hugging Face Inference Providers
 *                       (or Cloudflare Workers AI). Free, Apache-2.0. DEFAULT.
 *   2. `perchance`    — Perchance Image API v1. Free and unmetered, but
 *                       BROWSER-ONLY (see `BROWSER_ONLY_IMAGE_PROVIDERS`) and
 *                       capped at 768 px. Re-added 25 Oct 2026 against the
 *                       real documented protocol; see
 *                       `src/services/perchanceImageApi.ts` for why the earlier
 *                       integration could never load.
 *   3. `gemini`       — Google Gemini image models (own key).
 *   4. `pollinations` — keyless, but throttled to ~1 image / 45 s per IP
 *                       (HTTP 402 `FREE_LIMIT`) unless `POLLINATIONS_API_KEY`
 *                       is set. Always the last resort.
 *
 * RETIRED — aliases only, resolvable but never offered again:
 *   • `qwen` / `qwen-image` / `nvidia-qwen` — the NVIDIA NIM image slugs
 *     `qwen/qwen-image` and `qwen/qwen-image-2512` both answer 404.
 *
 * Retired ids resolve to `flux` so a stale `localStorage` value or an old
 * client can never strand a teacher on a dead engine.
 *
 * This module is intentionally dependency-free (no React, no Node APIs) so the
 * browser bundle and the server can import the exact same constants.
 */

export type ImageProviderId = 'flux' | 'perchance' | 'gemini' | 'pollinations';

/** Settings value → engine id. `gemini-imagen` is kept for stored settings. */
export type ImageProviderSetting = 'flux' | 'perchance' | 'pollinations' | 'gemini-imagen';

/**
 * FLUX stays the default. Perchance is a free, unmetered engine but it depends
 * on a third-party iframe that Cloudflare can challenge at any time, so it is
 * an opt-in choice and a fallback rather than the first attempt.
 */
export const DEFAULT_IMAGE_PROVIDER: ImageProviderId = 'flux';

/**
 * Engines that can ONLY run in a browser. Perchance generates inside the
 * caller's own frame ("it happens on the caller's quota, not yours"), so no
 * Express route can serve it. `serverSideImageProvider()` maps these onto the
 * best server-side engine so a client that asks the API for `perchance` still
 * gets an image instead of a 400.
 */
export const BROWSER_ONLY_IMAGE_PROVIDERS: readonly ImageProviderId[] = ['perchance'];

export const isBrowserOnlyImageProvider = (id: string): boolean =>
  BROWSER_ONLY_IMAGE_PROVIDERS.includes(id as ImageProviderId);

/** Browser-only engine → the engine the Express API should use instead. */
export const serverSideImageProvider = (id: ImageProviderId): ImageProviderId =>
  isBrowserOnlyImageProvider(id) ? DEFAULT_IMAGE_PROVIDER : id;

export const IMAGE_PROVIDER_PRIORITY: readonly ImageProviderId[] = [
  'flux',
  'perchance',
  'gemini',
  'pollinations'
];

/**
 * Fallback graph — ORDER MATTERS, and it changed on 22 Oct 2026.
 *
 * Pollinations is the LAST resort, not the second engine. Its anonymous tier
 * throttles to "1 image every 45 s per IP" and answers **HTTP 402
 * `{code:"FREE_LIMIT"}`**, so putting it second burned 60+ seconds of retries
 * on a quota that was already spent.
 *
 * Perchance sits second: it is free and unmetered, and unlike Gemini (whose
 * image models have no free API tier) it needs no key at all. Gemini keeps the
 * third slot for deployments that do pay for it; Pollinations keeps the
 * guaranteed-keyless slot so a deployment with zero configuration still
 * renders images.
 *
 * Every chain must list all four engines exactly once and must end with a
 * keyless provider — `tests/image-providers.test.ts` asserts both.
 */
export const IMAGE_PROVIDER_FALLBACKS: Record<ImageProviderId, readonly ImageProviderId[]> = {
  flux: ['perchance', 'gemini', 'pollinations'],
  perchance: ['flux', 'gemini', 'pollinations'],
  gemini: ['flux', 'perchance', 'pollinations'],
  pollinations: ['gemini', 'flux', 'perchance']
};

/**
 * Pollinations throttling contract (anonymous / free tier).
 *
 * `image.pollinations.ai/prompt/…` needs no key but allows roughly one image
 * per 45 s per IP. Over the limit it answers **402** with
 * `{error:{code:'FREE_LIMIT', message, retryAfter}}` (and sometimes a 200 HTML
 * banner). A key from enter.pollinations.ai removes the throttle; a `sk_`
 * secret key has no IP limit at all.
 */
export const POLLINATIONS_FREE_INTERVAL_MS = 45_000;
/** Stop retrying a rate-limited Pollinations for the rest of the session. */
export const POLLINATIONS_COOLDOWN_MS = POLLINATIONS_FREE_INTERVAL_MS;

export const getImageProviderOrder = (preferred: ImageProviderId): ImageProviderId[] => [
  preferred,
  ...IMAGE_PROVIDER_FALLBACKS[preferred]
];

/**
 * Every id the app may see — current, spaced-out spellings, and retired
 * engines. Anything unknown falls back to `flux`.
 */
export const IMAGE_PROVIDER_ALIASES: Record<string, ImageProviderId> = {
  // FLUX.1-schnell (Hugging Face)
  flux: 'flux',
  'hf-flux': 'flux',
  huggingface: 'flux',
  'flux-schnell': 'flux',
  'flux.1-schnell': 'flux',
  'black-forest-labs/flux.1-schnell': 'flux',

  // Pollinations (keyless)
  pollinations: 'pollinations',
  'pollinations-turbo': 'pollinations',
  turbo: 'pollinations',

  // Google Gemini image models. `gemini-imagen` / `google-imagen` / `imagen`
  // are STORED-SETTINGS ids, kept so saved preferences keep resolving; no
  // Imagen model is called any more (see GEMINI_IMAGE_MODELS).
  gemini: 'gemini',
  'gemini-imagen': 'gemini',
  'google-imagen': 'gemini',
  imagen: 'gemini',

  // Perchance Image API v1 (browser-only) — re-added 25 Oct 2026.
  perchance: 'perchance',
  'perchance-ai': 'perchance',
  'perchance-image-api': 'perchance',

  // RETIRED — kept so old settings and cached clients keep working.
  qwen: 'flux',
  'qwen-image': 'flux',
  'nvidia-qwen': 'flux',
  nvidia: 'flux'
};

/** Maps any stored/legacy provider value to a live engine id. */
export const normaliseImageProviderId = (value?: string | null): ImageProviderId => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return DEFAULT_IMAGE_PROVIDER;
  return IMAGE_PROVIDER_ALIASES[raw] ?? DEFAULT_IMAGE_PROVIDER;
};

/* ── FLUX.1-schnell ────────────────────────────────────────────────────────── */

export const FLUX_DEFAULT_MODELS: readonly string[] = ['black-forest-labs/FLUX.1-schnell'];
export const FLUX_ROUTER_BASE_URL = 'https://router.huggingface.co/hf-inference/models';
/** Legacy serverless host — still valid for models routed through hf-inference. */
export const FLUX_LEGACY_BASE_URL = 'https://api-inference.huggingface.co/models';

/**
 * Placement-aware sizes. FLUX.1-schnell renders on a 64 px grid with a
 * 1024 px ceiling, so every entry below is a multiple of 64 and ≤ 1024.
 */
export const FLUX_CONFIG = {
  model: 'black-forest-labs/FLUX.1-schnell',
  models: FLUX_DEFAULT_MODELS,
  routerBaseUrl: FLUX_ROUTER_BASE_URL,
  sizeMap: {
    header: '1024x576',
    full_width: '1024x576',
    inline: '1024x1024',
    sidebar: '768x1024',
    square: '1024x1024',
    portrait: '768x1024',
    landscape: '1024x768',
    video: '1024x576'
  } as Record<string, string>
};

export const FLUX_SIZE_MAP: Record<string, string> = FLUX_CONFIG.sizeMap;

/** Model list for this deployment; `HUGGINGFACE_IMAGE_MODEL` overrides the slug. */
export const fluxModels = (override?: string | null): string[] => {
  const custom = String(override ?? '').trim();
  if (!custom) return [...FLUX_DEFAULT_MODELS];
  return [custom, ...FLUX_DEFAULT_MODELS.filter((m) => m !== custom)];
};

/**
 * Clamps a `WxH` string onto FLUX.1-schnell's 64 px grid (256–1024 px).
 * Anything unparseable becomes the square default.
 */
export const normaliseFluxSize = (raw?: string | null): string => {
  const clamp = (n: number) => Math.min(1024, Math.max(256, Math.round(n / 64) * 64));
  const match = /^(\d{2,4})\s*[x×]\s*(\d{2,4})$/i.exec(String(raw ?? '').trim());
  if (!match) return '1024x1024';
  return `${clamp(Number(match[1]))}x${clamp(Number(match[2]))}`;
};

/** Pollinations model slugs — `flux` for quality, `turbo` for speed. */
/**
 * Gemini image models, in attempt order. Shared by `server.ts` and
 * `src/services/geminiClient.ts` so the two lists can never diverge again —
 * they had already drifted, and the drift is what hid the dead ids below.
 *
 * Status from Google's own deprecations table
 * (ai.google.dev/gemini-api/docs/deprecations, checked 25 Oct 2026):
 *
 *   gemini-nano-banana-2.1        GA  6 Oct 2026   no shutdown date   <- current
 *   gemini-3.1-flash-lite-image   GA 30 Jun 2026   no shutdown date
 *   gemini-3.1-flash-image        GA 28 May 2026   no shutdown date   (deprecated;
 *                                                    replacement = nano-banana-2.1)
 *   gemini-2.5-flash-image        GA  2 Oct 2025   shuts down 15 Mar 2027
 *
 * All four answer `generateContent` with an `inlineData` part, so one loop
 * covers them. Nano Banana 2.1 leads: it is Google's current recommendation,
 * costs roughly half of 3.1-flash-image per 1K image, and renders legible text
 * better — which matters for worksheet illustrations. The deprecated
 * 3.1-flash-image is kept as a bridge, because Google announced NO shutdown
 * date for it (a launch-day note citing 29 Oct 2026 was withdrawn the next
 * day), and the long-lived 2.5 id stays last so a renamed 3.x alias cannot take
 * the whole engine down.
 *
 * IMAGEN IS GONE, deliberately. Every Imagen id Google shipped on the Developer
 * API has passed its shutdown date: `imagen-3.0-generate-002` (10 Nov 2025) and
 * all three `imagen-4.0-*` ids (17 Aug 2026). Google names
 * `gemini-nano-banana-2.1` as the replacement for every one of them — a
 * `generateContent` model already covered above — so the separate
 * `generateImages` loop was deleted rather than repopulated. It was making two
 * guaranteed-failing API calls on every Gemini-keyed image request. Do not add
 * an Imagen id back without re-reading that table.
 *
 * These are DEVELOPER API ids (GEMINI_API_KEY), which is what this app uses.
 * Vertex AI runs a different, later retirement schedule.
 */
export const GEMINI_IMAGE_MODELS: readonly string[] = [
  'gemini-nano-banana-2.1',
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
];

export const POLLINATIONS_MODEL = 'flux';
export const POLLINATIONS_FALLBACK_MODEL = 'turbo';
