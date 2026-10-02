/**
 * EduAI Companion — FROZEN AI model registry (single source of truth).
 *
 * ⚠️ READ `AGENTS.md` §1 BEFORE EDITING THIS FILE.
 *
 * The five provider ids and their exact model slugs below are frozen. No agent,
 * assistant, service or future change may swap, alias, upgrade, downgrade or
 * re-route them to other versions, providers or fallback engines. Every allowed
 * model must be called directly and exactly as specified.
 *
 * This module exists so that the frozen list lives in exactly ONE place and is
 * imported by every call site:
 *   • `server.ts`                     — the `/api/ai/:provider` proxy
 *   • `src/services/multiAiService.ts`— the native/standalone client path
 *   • `src/contexts/AiContext.tsx`    — the selectable provider ids
 *   • `src/App.tsx`                   — the AI-engine picker
 *
 * Regression tests in `tests/ai-models.test.ts` assert these values against the
 * table in AGENTS.md, so an accidental re-map fails CI rather than shipping.
 *
 * Excluded from this file on purpose: image generation, OCR engines and TTS /
 * voice pipelines. Those are separate systems with their own provider graphs.
 */

/** Provider ids exposed in the app (active, non-legacy). */
export const AI_PROVIDERS = [
  'gemini',
  'alibaba-qwen',
  'nvidia-nemotron-nano',
  'nvidia-nemotron-ultra',
  'nvidia-nemotron-lightning',
] as const;

/** Union of the five frozen provider ids. */
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

/** Retired ids kept ONLY so stale saved settings keep working. */
export const LEGACY_PROVIDER_IDS = [
  'groq-qwen',
  'nvidia-nemotron',
  'nvidia-nemotron-ultra-legacy',
] as const;

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

/** The current latest GA Gemini model — always the primary engine. */
export const GEMINI_PRIMARY_MODEL = GEMINI_MODEL_CHAIN[0];

/** Alibaba Cloud Model Studio (OpenAI-compatible) defaults. */
export const QWEN_DEFAULT_MODEL = 'qwen3.8-max';
export const QWEN_BASE_URL =
  'https://ws-8ldb9u90tetxcada.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1';

/** NVIDIA NIM endpoint — mandatory for EVERY Nemotron model. */
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/** Exact NVIDIA NIM model slug per Nemotron provider id. */
export const NVIDIA_MODELS: Record<string, string> = {
  'nvidia-nemotron-nano': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'nvidia-nemotron-ultra': 'nvidia/nemotron-ultra-550b-a55b',
  'nvidia-nemotron-lightning': 'nvidia/nemotron-3.5-lightning-30b-a3b',
};

/** True for the three NVIDIA NIM Nemotron provider ids. */
export const isNemotronProvider = (provider: string): boolean =>
  (NEMOTRON_PROVIDERS as readonly string[]).includes(provider);

/** True for retired ids that must now resolve to Qwen 3.8 Max. */
export const isLegacyProvider = (provider: string): boolean =>
  (LEGACY_PROVIDER_IDS as readonly string[]).includes(provider);

/**
 * Exact model slug for a provider id.
 *
 * Legacy ids resolve to the Qwen engine (they are aliases, not models) and
 * Gemini returns the primary GA model. Unknown ids return an empty string so
 * the caller can decide how to fail.
 */
export const resolveProviderModel = (provider: string): string => {
  if (isNemotronProvider(provider)) return NVIDIA_MODELS[provider] ?? '';
  if (provider === 'alibaba-qwen' || isLegacyProvider(provider)) return QWEN_DEFAULT_MODEL;
  if (provider === 'gemini') return GEMINI_PRIMARY_MODEL;
  return '';
};

/**
 * Sibling engine to try once when an alternative provider is down (gateway
 * timeout / 5xx / rate limit) before spending the remaining time budget on the
 * Gemini fallback. Mirrors the long-standing routing behaviour in `server.ts`.
 */
export const alternativeProviderFor = (provider: string): string => {
  switch (provider) {
    case 'nvidia-nemotron-ultra':
      return 'nvidia-nemotron-lightning';
    case 'nvidia-nemotron-lightning':
      return 'nvidia-nemotron-nano';
    case 'nvidia-nemotron-nano':
      return 'alibaba-qwen';
    case 'alibaba-qwen':
      return 'nvidia-nemotron-lightning';
    default:
      return '';
  }
};

/** UI labels for the five frozen provider ids (kept beside the ids so the
 *  picker can never drift from the registry). */
export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: 'Gemini 3.8 Flash',
  'alibaba-qwen': 'Qwen 3.8 Max',
  'nvidia-nemotron-nano': 'Nemotron 3 Nano (30B)',
  'nvidia-nemotron-ultra': 'Nemotron 3 Ultra (550B)',
  'nvidia-nemotron-lightning': 'Nemotron 3.5 Lightning',
};
