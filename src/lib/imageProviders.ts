/**
 * Image-provider registry — the single source of truth shared by the React
 * client (`src/lib/imageGeneration.ts`) and the Express API (`server.ts`).
 *
 * ENGINES (22 Oct 2026):
 *   1. `flux`         — FLUX.1-schnell via Hugging Face Inference Providers.
 *                       Free, Apache-2.0, needs `HUGGINGFACE_API_KEY`.
 *   2. `pollinations` — keyless, always available. The guaranteed fallback.
 *   3. `gemini`       — Google Imagen 3 / Gemini image models (own key).
 *
 * RETIRED — aliases only, resolvable but never offered again:
 *   • `perchance` — perchance.org sends `X-Frame-Options: SAMEORIGIN` + a
 *     Cloudflare challenge, so no iframe/postMessage/DOM-driver engine can load.
 *   • `qwen` / `qwen-image` / `nvidia-qwen` — the NVIDIA NIM image slugs
 *     `qwen/qwen-image` and `qwen/qwen-image-2512` both answer 404.
 *
 * Both resolve to `flux` so a stale `localStorage` value or an old client can
 * never strand a teacher on a dead engine.
 *
 * This module is intentionally dependency-free (no React, no Node APIs) so the
 * browser bundle and the server can import the exact same constants.
 */

export type ImageProviderId = 'flux' | 'pollinations' | 'gemini';

/** Settings value → engine id. `gemini-imagen` is kept for stored settings. */
export type ImageProviderSetting = 'flux' | 'pollinations' | 'gemini-imagen';

export const DEFAULT_IMAGE_PROVIDER: ImageProviderId = 'flux';

export const IMAGE_PROVIDER_PRIORITY: readonly ImageProviderId[] = [
  'flux',
  'pollinations',
  'gemini'
];

export const IMAGE_PROVIDER_FALLBACKS: Record<ImageProviderId, readonly ImageProviderId[]> = {
  flux: ['pollinations', 'gemini'],
  pollinations: ['flux', 'gemini'],
  gemini: ['pollinations', 'flux']
};

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

  // Google Imagen / Gemini image models
  gemini: 'gemini',
  'gemini-imagen': 'gemini',
  'google-imagen': 'gemini',
  imagen: 'gemini',

  // RETIRED — kept so old settings and cached clients keep working.
  perchance: 'flux',
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
