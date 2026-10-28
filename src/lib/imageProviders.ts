/**
 * Image-provider registry — the single source of truth shared by the React
 * client (`src/lib/imageGeneration.ts`) and the Express API (`server.ts`).
 *
 * ENGINES (28 Oct 2026):
 *   1. `perchance`    — Perchance **Image API v1** (`perchance.org/perchance-ai-api`),
 *                       the purpose-built cross-origin API: hidden iframe +
 *                       postMessage, no keys, no CORS, unlimited. Runs entirely
 *                       in the teacher's browser (see `src/services/perchanceClient.ts`).
 *   2. `flux`         — FLUX.1-schnell via Hugging Face Inference Providers
 *                       (or Cloudflare Workers AI). Free, Apache-2.0.
 *   3. `gemini`       — Google Imagen / Gemini image models (own key).
 *   4. `pollinations` — keyless, but throttled to ~1 image / 45 s per IP
 *                       (HTTP 402 `FREE_LIMIT`) unless `POLLINATIONS_API_KEY`
 *                       is set. Always the last resort.
 *
 * RETIRED — aliases only, resolvable but never offered again:
 *   • `qwen` / `qwen-image` / `nvidia-qwen` — the NVIDIA NIM image slugs
 *     `qwen/qwen-image` and `qwen/qwen-image-2512` both answer 404. They
 *     resolve to `flux` so a stale `localStorage` value can never strand a
 *     teacher on a dead engine.
 *
 * HISTORY: `perchance` was retired on 22 Oct 2026 because the OLD bridge
 * framed the generator pages (`ai-text-to-image-generator`), which send
 * `X-Frame-Options: SAMEORIGIN` and could never load. It was REINSTATED on
 * 28 Oct 2026 via the documented Image API v1, which is designed for exactly
 * this use case. The generator pages stay forbidden — only `perchance-ai-api`
 * may ever be framed.
 *
 * This module is intentionally dependency-free (no React, no Node APIs) so the
 * browser bundle and the server can import the exact same constants.
 */

export type ImageProviderId = 'perchance' | 'flux' | 'pollinations' | 'gemini';

/** Settings value → engine id. `gemini-imagen` is kept for stored settings. */
export type ImageProviderSetting = 'perchance' | 'flux' | 'pollinations' | 'gemini-imagen';

export const DEFAULT_IMAGE_PROVIDER: ImageProviderId = 'perchance';

export const IMAGE_PROVIDER_PRIORITY: readonly ImageProviderId[] = [
  'perchance',
  'flux',
  'gemini',
  'pollinations'
];

/**
 * Fallback graph — ORDER MATTERS (last revised 28 Oct 2026, when Perchance
 * Image API v1 rejoined the chain as the default engine).
 *
 * Pollinations stays the LAST resort, not the second engine. Its anonymous
 * tier throttles to "1 image every 45 s per IP" and answers **HTTP 402
 * `{code:"FREE_LIMIT"}`**, so putting it second burned 60+ seconds of retries
 * on a quota that was already spent and pushed working engines to the end of
 * the chain. Perchance (unlimited, keyless) leads; Gemini has a key in every
 * build of this app and keeps the second slot; Pollinations keeps the
 * guaranteed-keyless slot.
 */
export const IMAGE_PROVIDER_FALLBACKS: Record<ImageProviderId, readonly ImageProviderId[]> = {
  perchance: ['flux', 'gemini', 'pollinations'],
  flux: ['perchance', 'gemini', 'pollinations'],
  gemini: ['perchance', 'flux', 'pollinations'],
  pollinations: ['perchance', 'gemini', 'flux']
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
  // Perchance Image API v1 (browser iframe engine)
  perchance: 'perchance',
  'perchance-image-api': 'perchance',
  'perchance-ai-api': 'perchance',

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

  // Google Imagen / Gemini image models
  gemini: 'gemini',
  'gemini-imagen': 'gemini',
  'google-imagen': 'gemini',
  imagen: 'gemini',

  // RETIRED (22 Oct 2026) — kept so old settings and cached clients keep working.
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
export const POLLINATIONS_MODEL = 'flux';
export const POLLINATIONS_FALLBACK_MODEL = 'turbo';

/* ── Perchance Image API v1 (browser-only iframe engine) ───────────────────── */

/**
 * The purpose-built, documented endpoint: "Works from any domain … No keys, no
 * CORS, no backend. The app loads the API in a hidden iframe and receives the
 * result via postMessage." The constants live in the shared registry so the
 * server's `/api/images/status` can describe the engine without importing the
 * DOM client (`src/services/perchanceClient.ts`).
 */
export const PERCHANCE_API_URL = 'https://perchance.org/perchance-ai-api';
/** Framing mirror documented by Perchance's embed-generator FAQ — automatic fallback host. */
export const PERCHANCE_EMBED_API_URL = 'https://null.perchance.org/perchance-ai-api';
/** `event.data.api` marker from the official postMessage contract. */
export const PERCHANCE_API_MARKER = 'perchance-image-api';
