/**
 * EduAI Companion — AI model registry (single source of truth).
 *
 * ⚠️ READ `AGENTS.md` §1 BEFORE EDITING THIS FILE.
 *
 * The provider ids and their exact model slugs below define the models the app
 * may call. Every allowed model must be called directly and exactly as
 * specified. This module exists so the list lives in exactly ONE place and is
 * imported by every call site:
 *   • `server.ts`                     — the `/api/ai/:provider` proxy + OCR
 *   • `src/services/multiAiService.ts`— the native/standalone client path
 *   • `src/contexts/AiContext.tsx`    — the selectable provider ids
 *   • `src/App.tsx`                   — the AI-engine picker
 *
 * Regression tests in `tests/ai-models.test.ts` assert these values against the
 * table in AGENTS.md, so an accidental re-map fails CI rather than shipping.
 *
 * ── Change log (17 Nov 2026, explicit user instruction) ──────────────────────
 * The primary/reasoning engine changed from Google Gemini to NVIDIA Nemotron
 * 3 Ultra. Qwen was removed entirely and DeepSeek v4.1 Flash (served through
 * NVIDIA NIM) added in its place. A shared ordered fallback chain gives every
 * reasoning model a fallback on error:
 *   Nemotron 3 Ultra → DeepSeek v4.1 Flash → Gemini → Nemotron 3.5 Lightning
 *   (→ Nemotron 3 Nano as the final safety net).
 * The Vision/OCR pipeline (scanned worksheets, diagrams, handwritten work) is
 * a separate NVIDIA NIM graph: Nemotron 3.5 Super-VL primary, Llama 3.2 90B
 * Vision as its fallback.
 *
 * Excluded from this file on purpose: image generation and TTS/voice pipelines.
 * Those are separate systems with their own provider graphs.
 */

/** Provider ids exposed in the app (active, non-legacy). Primary first. */
export const AI_PROVIDERS = [
  'nvidia-nemotron-ultra',
  'nvidia-deepseek',
  'gemini',
  'nvidia-nemotron-nano',
  'nvidia-nemotron-lightning',
] as const;

/** Union of the provider ids. */
export type AIProvider = (typeof AI_PROVIDERS)[number];

/**
 * Providers served by the alternative-engine client path (everything except
 * Gemini, which has its own client in `src/services/geminiClient.ts`).
 */
export type AlternativeAiProvider = Exclude<AIProvider, 'gemini'>;

/** The three NVIDIA NIM Nemotron provider ids. */
export const NEMOTRON_PROVIDERS = [
  'nvidia-nemotron-nano',
  'nvidia-nemotron-ultra',
  'nvidia-nemotron-lightning',
] as const;

/** Every provider routed through the NVIDIA NIM endpoint (Nemotron + DeepSeek). */
export const NVIDIA_NIM_PROVIDERS = [
  'nvidia-nemotron-nano',
  'nvidia-nemotron-ultra',
  'nvidia-nemotron-lightning',
  'nvidia-deepseek',
] as const;

/** Union of the NVIDIA NIM provider ids. */
export type NvidiaNimProvider = (typeof NVIDIA_NIM_PROVIDERS)[number];

/** Retired ids kept ONLY so stale saved settings keep working. */
export const LEGACY_PROVIDER_IDS = [
  'groq-qwen',
  'nvidia-nemotron',
  'nvidia-nemotron-ultra-legacy',
] as const;

/** The app's primary reasoning provider id (default engine). */
export const PRIMARY_REASONING_PROVIDER = 'nvidia-nemotron-ultra' as const;

/** Google Gemini candidate chain — tried in this exact order. */
export const GEMINI_MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
] as const;

/** The current latest GA Gemini model — always the primary Gemini engine. */
export const GEMINI_PRIMARY_MODEL = GEMINI_MODEL_CHAIN[0];

/** NVIDIA NIM endpoint — mandatory for EVERY Nemotron and DeepSeek model. */
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/** Exact NVIDIA NIM model slug per provider id (DeepSeek included). */
export const NVIDIA_MODELS: Record<string, string> = {
  'nvidia-nemotron-nano': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'nvidia-nemotron-ultra': 'nvidia/nemotron-3-ultra-550b-a55b',
  'nvidia-nemotron-lightning': 'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia-deepseek': 'deepseek-v4.1-flash',
};

/**
 * Ordered reasoning fallback chain. Primary → Secondary → Tertiary →
 * Quaternary → final safety net. Every reasoning model rolls to the next one
 * in this list on any error, so the classroom never loses a generation because
 * one engine is having a bad day.
 */
export const REASONING_FALLBACK_CHAIN = [
  'nvidia-nemotron-ultra',
  'nvidia-deepseek',
  'gemini',
  'nvidia-nemotron-lightning',
  'nvidia-nemotron-nano',
] as const;

/**
 * Providers to try after `provider`, in strict priority order. The chain is
 * rotated to start at the entry immediately after `provider`, so a Secondary
 * engine that fails rolls to the Tertiary, and so on — wrapping back to the
 * Primary only once every later tier has been tried. Unknown ids yield the
 * full chain so callers can still fall back deliberately.
 */
export const reasoningFallbacksFor = (provider: string): string[] => {
  const chain = REASONING_FALLBACK_CHAIN as readonly string[];
  const idx = chain.indexOf(provider);
  if (idx === -1) return [...chain];
  return [...chain.slice(idx + 1), ...chain.slice(0, idx)];
};

/** True for the three NVIDIA NIM Nemotron provider ids. */
export const isNemotronProvider = (provider: string): boolean =>
  (NEMOTRON_PROVIDERS as readonly string[]).includes(provider);

/** True for every provider routed through the NVIDIA NIM endpoint. */
export const isNvidiaNimProvider = (provider: string): boolean =>
  (NVIDIA_NIM_PROVIDERS as readonly string[]).includes(provider);

/** True for retired ids that must now resolve to the primary reasoning engine. */
export const isLegacyProvider = (provider: string): boolean =>
  (LEGACY_PROVIDER_IDS as readonly string[]).includes(provider);

/**
 * Exact model slug for a provider id.
 *
 * Legacy ids resolve to the primary reasoning engine (they are aliases, not
 * models) and Gemini returns the primary GA model. Unknown ids return an empty
 * string so the caller can decide how to fail.
 */
export const resolveProviderModel = (provider: string): string => {
  if (isNvidiaNimProvider(provider)) return NVIDIA_MODELS[provider] ?? '';
  if (provider === 'gemini') return GEMINI_PRIMARY_MODEL;
  if (isLegacyProvider(provider)) return NVIDIA_MODELS[PRIMARY_REASONING_PROVIDER];
  return '';
};

/**
 * Sibling engine to try once when a provider is down (gateway timeout / 5xx /
 * rate limit) before spending the remaining time budget on the rest of the
 * chain. This is simply the immediate next entry of the ordered reasoning
 * fallback chain. Unknown ids have no sibling.
 */
export const alternativeProviderFor = (provider: string): string => {
  if (!(AI_PROVIDERS as readonly string[]).includes(provider)) return '';
  return reasoningFallbacksFor(provider)[0] ?? '';
};

/**
 * Vision/OCR model chain (scanned worksheets, diagrams, handwritten work).
 * Primary is Nemotron 3.5 Super-VL; Llama 3.2 90B Vision is its fallback.
 * Both are served through NVIDIA NIM (see `NVIDIA_BASE_URL`).
 */
export const VISION_OCR_MODELS = [
  'nemotron-3.5-super-vl-120b-a12b',
  'llama-3.2-90b-vision',
] as const;

/** The primary Vision/OCR model. */
export const VISION_OCR_PRIMARY_MODEL = VISION_OCR_MODELS[0];

/** UI labels for the provider ids (kept beside the ids so the picker can
 *  never drift from the registry). */
export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  'nvidia-nemotron-ultra': 'Nemotron 3 Ultra (550B)',
  'nvidia-deepseek': 'DeepSeek v4.1 Flash (NIM)',
  gemini: 'Gemini 3.8 Flash',
  'nvidia-nemotron-nano': 'Nemotron 3 Nano (30B)',
  'nvidia-nemotron-lightning': 'Nemotron 3.5 Lightning',
};
