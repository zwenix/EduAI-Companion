/**
 * EduAI Companion — FROZEN AI model registry (single source of truth).
 *
 * ⚠️ READ `AGENTS.md` §1 BEFORE EDITING THIS FILE.
 *
 * The provider ids and their exact model slugs below are frozen. No agent,
 * assistant, service or future change may swap, alias, upgrade, downgrade or
 * re-route them to other versions, providers or fallback engines. Every allowed
 * model must be called directly and exactly as specified.
 *
 * ── MODEL ROLES (owner instruction, 23 Nov 2026) ────────────────────────────
 *
 *   REASONING — lesson plans, assessments, learner diagnosis, tutor chat:
 *     1. Primary     `nvidia-nemotron-ultra`     nvidia/nemotron-3-ultra-550b-a55b
 *     2. Secondary   `nvidia-deepseek-flash`     deepseek-ai/deepseek-v4.1-flash
 *     3. Tertiary    `gemini`                    gemini-3.8-flash (+ chain)
 *     4. Quaternary  `nvidia-nemotron-lightning` nvidia/nemotron-3.5-lightning-30b-a3b
 *
 *   VISION / OCR — scanned worksheets, diagrams, handwritten work:
 *     1. Primary     `nvidia-nemotron-super-vl`  nvidia/nemotron-3.5-super-vl-120b-a12b
 *     2. Secondary   `nvidia-llama-vision`       meta/llama-3.2-90b-vision-instruct
 *     3. Tertiary    `gemini`                    gemini-3.8-flash (+ chain)
 *     4. Last resort `ocrspace`                  OCR.space engine (no LLM)
 *
 *   Alibaba Qwen 3.8 Max is REMOVED from the app. `deepseek-v4.1-flash` on
 *   NVIDIA NIM takes its place. Every retired Qwen id is still recognised so a
 *   stale saved setting migrates instead of breaking, and every one of them
 *   resolves to `nvidia-deepseek-flash` — nothing ever calls Qwen again.
 *
 * This module exists so that the frozen list lives in exactly ONE place and is
 * imported by every call site:
 *   • `server.ts`                       — the `/api/ai/:provider` proxy
 *   • `src/services/multiAiService.ts` — the native/standalone client path
 *   • `src/services/unifiedAiService.ts` — the engine/fallback router
 *   • `src/services/geminiClient.ts`   — reuses `GEMINI_MODEL_CHAIN`
 *   • `src/contexts/AiContext.tsx`     — the selectable provider ids
 *   • `src/App.tsx` / `Settings.tsx`   — the AI-engine pickers
 *
 * Regression tests in `tests/ai-models.test.ts` assert these values against the
 * tables in AGENTS.md, so an accidental re-map fails CI rather than shipping.
 *
 * Excluded from this file on purpose: image generation, TTS / voice pipelines.
 * Those are separate systems with their own provider graphs
 * (`src/lib/imageProviders.ts`).
 */

/** Reasoning / text providers exposed in the app, in fallback-priority order. */
export const AI_PROVIDERS = [
  'nvidia-nemotron-ultra',
  'nvidia-deepseek-flash',
  'gemini',
  'nvidia-nemotron-lightning',
  'nvidia-nemotron-nano',
] as const;

/** Union of the permitted reasoning provider ids. */
export type AIProvider = (typeof AI_PROVIDERS)[number];

/**
 * Providers served by the NVIDIA NIM client path (everything except Gemini,
 * which has its own client in `src/services/geminiClient.ts`).
 */
export type AlternativeAiProvider = Exclude<AIProvider, 'gemini'>;

/** Default engine for a fresh install: Nemotron 3 Ultra is the PRIMARY model. */
export const DEFAULT_AI_PROVIDER: AIProvider = 'nvidia-nemotron-ultra';

/** The NVIDIA NIM Nemotron reasoning/text provider ids. */
export const NEMOTRON_PROVIDERS = [
  'nvidia-nemotron-ultra',
  'nvidia-nemotron-lightning',
  'nvidia-nemotron-nano',
] as const;

/**
 * Vision / OCR engine ids, in fallback-priority order. These read images:
 * scanned worksheets, diagrams, handwritten work. `ocrspace` is not an LLM —
 * it is the final keyless text-extraction resort.
 */
export const VISION_PROVIDERS = [
  'nvidia-nemotron-super-vl',
  'nvidia-llama-vision',
  'gemini',
  'ocrspace',
] as const;

export type VisionProvider = (typeof VISION_PROVIDERS)[number];

/** Vision engines selectable for a fresh install: Super VL is PRIMARY. */
export const DEFAULT_VISION_PROVIDER: VisionProvider = 'nvidia-nemotron-super-vl';

/** The two NIM vision ids (the ones that actually send images to a model). */
export const NIM_VISION_PROVIDERS = [
  'nvidia-nemotron-super-vl',
  'nvidia-llama-vision',
] as const;

/** Retired ids kept ONLY so stale saved settings keep working. */
export const LEGACY_PROVIDER_IDS = [
  'alibaba-qwen',
  'groq-qwen',
  'nvidia-nemotron',
  'nvidia-nemotron-ultra-legacy',
] as const;

/** What every retired id now resolves to (Qwen is gone — DeepSeek replaces it). */
export const LEGACY_PROVIDER_TARGET: AIProvider = 'nvidia-deepseek-flash';

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

/** The current latest GA Gemini model — the primary engine of its own chain. */
export const GEMINI_PRIMARY_MODEL = GEMINI_MODEL_CHAIN[0];

/** NVIDIA NIM endpoint — mandatory for EVERY Nemotron, DeepSeek and vision model. */
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/**
 * Exact NVIDIA NIM model slug per provider id.
 *
 * Text/reasoning + vision/OCR live in the same map because they share one
 * endpoint and one client.
 */
export const NVIDIA_MODELS: Record<string, string> = {
  // ── Reasoning / text ──────────────────────────────────────────────────────
  // Verified 24 Nov 2026 against the model card: the -3- form is the callable
  // one; `nvidia/nemotron-ultra-550b-a55b` does NOT exist on NIM (HTTP 404).
  'nvidia-nemotron-ultra': 'nvidia/nemotron-3-ultra-550b-a55b',
  'nvidia-deepseek-flash': 'deepseek-ai/deepseek-v4.1-flash',
  'nvidia-nemotron-lightning': 'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia-nemotron-nano': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  // ── Vision / OCR ──────────────────────────────────────────────────────────
  'nvidia-nemotron-super-vl': 'nvidia/nemotron-3.5-super-vl-120b-a12b',
  'nvidia-llama-vision': 'meta/llama-3.2-90b-vision-instruct',
};

/**
 * Authoritative model cards for every frozen NIM id above. Verified on
 * 24 Nov 2026: each page prints the exact copy-ready `model="…"` string used
 * in `NVIDIA_MODELS`. These links are the audit trail — re-check them before
 * changing any slug.
 */
export const NIM_MODEL_CARDS: Record<string, string> = {
  'nvidia-nemotron-ultra': 'https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b',
  'nvidia-deepseek-flash': 'https://build.nvidia.com/deepseek-ai/deepseek-v4.1-flash',
  'nvidia-nemotron-lightning':
    'https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia-nemotron-nano':
    'https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'nvidia-nemotron-super-vl':
    'https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b',
  'nvidia-llama-vision':
    'https://build.nvidia.com/meta/llama-3.2-90b-vision-instruct',
};

/**
 * Per-model request defaults taken from those model cards.
 *
 * These are NOT cosmetic tuning: the "thinking" models expect
 * `chat_template_kwargs.enable_thinking` / `reasoning_budget`, and Llama 3.2
 * 90B Vision has a 4K output ceiling (16384 is not accepted). Every NIM call
 * site MUST spread `nimRequestDefaultsFor(provider)` into its payload.
 */
export interface NimRequestDefaults {
  temperature: number;
  top_p: number;
  max_tokens: number;
  reasoning_budget?: number;
  chat_template_kwargs?: { enable_thinking: boolean };
}

export const NIM_REQUEST_DEFAULTS: Record<string, NimRequestDefaults> = {
  'nvidia-nemotron-ultra': {
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    chat_template_kwargs: { enable_thinking: true },
  },
  'nvidia-deepseek-flash': { temperature: 0.7, top_p: 0.95, max_tokens: 16384 },
  'nvidia-nemotron-lightning': {
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    reasoning_budget: 16384,
    chat_template_kwargs: { enable_thinking: true },
  },
  'nvidia-nemotron-nano': {
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 65536,
    reasoning_budget: 16384,
  },
  'nvidia-nemotron-super-vl': {
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    chat_template_kwargs: { enable_thinking: true },
  },
  // NVIDIA's NIM reference accepts 1–8192 max_tokens. 4096 is our safe
  // frozen default; the proxy clamps caller overrides to this value.
  'nvidia-llama-vision': { temperature: 0.7, top_p: 0.95, max_tokens: 4096 },
};

/** Exact payload defaults for a provider id; safe fallback for unknown ids. */
export const nimRequestDefaultsFor = (provider: string): NimRequestDefaults =>
  NIM_REQUEST_DEFAULTS[provider] ?? { temperature: 0.7, top_p: 0.95, max_tokens: 16384 };

/**
 * Reasoning fallback chain — ORDER IS THE PRODUCT CONTRACT.
 * Primary → Secondary → Tertiary → Quaternary.
 */
export const REASONING_CHAIN = [
  'nvidia-nemotron-ultra',
  'nvidia-deepseek-flash',
  'gemini',
  'nvidia-nemotron-lightning',
] as const satisfies readonly AIProvider[];

/**
 * Browser last-resort list (`geminiService.ts`): after the backend and the
 * on-device Gemini engine both fail, these NIM engines are tried in order.
 * Qwen 3.8 Max is gone — DeepSeek V4.1 Flash takes its place.
 */
export const FALLBACK_LAST_RESORT = [
  'nvidia-deepseek-flash',
  'nvidia-nemotron-lightning',
  'nvidia-nemotron-nano',
] as const satisfies readonly AIProvider[];

/**
 * Vision / OCR fallback chain — ORDER IS THE PRODUCT CONTRACT.
 * `ocrspace` is appended by `visionFallbackChainFor()` as the keyless last resort.
 */
export const VISION_CHAIN = [
  'nvidia-nemotron-super-vl',
  'nvidia-llama-vision',
  'gemini',
] as const satisfies readonly VisionProvider[];

/** True for the NVIDIA NIM Nemotron reasoning provider ids. */
export const isNemotronProvider = (provider: string): boolean =>
  (NEMOTRON_PROVIDERS as readonly string[]).includes(provider);

/** True for ANY provider served by NVIDIA NIM (reasoning or vision). */
export const isNimProvider = (provider: string): boolean =>
  Object.prototype.hasOwnProperty.call(NVIDIA_MODELS, provider);

/** True for the NIM vision/OCR provider ids. */
export const isNimVisionProvider = (provider: string): boolean =>
  (NIM_VISION_PROVIDERS as readonly string[]).includes(provider);

/** True for retired ids that must now resolve to DeepSeek V4.1 Flash. */
export const isLegacyProvider = (provider: string): boolean =>
  (LEGACY_PROVIDER_IDS as readonly string[]).includes(provider);

/**
 * Exact model slug for a provider id.
 *
 * Legacy ids resolve to the DeepSeek engine (they are aliases, not models) and
 * Gemini returns the primary GA model. Unknown ids return an empty string so
 * the caller can decide how to fail.
 */
export const resolveProviderModel = (provider: string): string => {
  if (isNimProvider(provider)) return NVIDIA_MODELS[provider] ?? '';
  if (isLegacyProvider(provider)) return NVIDIA_MODELS[LEGACY_PROVIDER_TARGET] ?? '';
  if (provider === 'gemini') return GEMINI_PRIMARY_MODEL;
  if (provider === 'ocrspace') return 'ocrspace';
  return '';
};

/**
 * Map ANY stored/legacy provider reference onto a live reasoning id.
 *
 * This is what makes "completely remove Qwen" safe: a stale `alibaba-qwen`
 * (or `groq-qwen`) value in localStorage, a DB row or an old API client can
 * never become the first hop of a chain — it becomes DeepSeek V4.1 Flash.
 * Unknown values start at the primary engine.
 */
export const normalizeProviderId = (provider?: string | null): AIProvider => {
  const value = String(provider ?? '').trim().toLowerCase();
  if (isLegacyProvider(value) || /qwen|alibaba|model-?studio/i.test(value)) {
    return LEGACY_PROVIDER_TARGET;
  }
  if ((AI_PROVIDERS as readonly string[]).includes(value)) return value as AIProvider;
  return DEFAULT_AI_PROVIDER;
};

/**
 * Ordered engines to try AFTER `provider` fails — this is the fallback graph
 * every call site uses, so "each model has a fallback" is enforced in one place.
 *
 *   nvidia-nemotron-ultra     → deepseek-flash → gemini → lightning
 *   nvidia-deepseek-flash     → gemini → lightning
 *   gemini                    → lightning
 *   nvidia-nemotron-lightning → gemini
 *   nvidia-nemotron-nano      → ultra → deepseek-flash → gemini → lightning
 *
 * Gemini is always present as the final safety net (it is the only engine with
 * a baked key in every build), except when it is already in the list.
 */
export const fallbackChainFor = (provider: string): AIProvider[] => {
  const chain = [...REASONING_CHAIN] as AIProvider[];
  const start = chain.indexOf(provider as AIProvider);
  const after = start === -1 ? chain : chain.slice(start + 1);
  const next = after.filter((p) => p !== provider);
  if (provider !== 'gemini' && !next.includes('gemini')) next.push('gemini');
  return next;
};

/**
 * Sibling engine to try once when an alternative provider is down. Thin alias
 * over `fallbackChainFor()` kept for the server's single-hop logging.
 */
export const alternativeProviderFor = (provider: string): string =>
  fallbackChainFor(provider)[0] ?? '';

/**
 * Ordered vision engines to try after `provider` fails. The chain is a
 * rotation of `VISION_PROVIDERS`, so even the terminal OCR.space engine has a
 * fallback (it wraps back to Super VL → Llama Vision → Gemini) — no engine can
 * dead-end a scanning or grading run.
 *
 *   nvidia-nemotron-super-vl → llama-vision → gemini → ocrspace
 *   nvidia-llama-vision      → gemini → ocrspace → super-vl
 *   gemini                   → ocrspace → super-vl → llama-vision
 *   ocrspace                 → super-vl → llama-vision → gemini
 */
export const visionFallbackChainFor = (provider: string): VisionProvider[] => {
  const chain = [...VISION_PROVIDERS] as VisionProvider[];
  const start = chain.indexOf(provider as VisionProvider);
  if (start === -1) return chain.slice(1);
  return [...chain.slice(start + 1), ...chain.slice(0, start)];
};

/** Full ordered attempt list for a vision/OCR request, primary first. */
export const visionAttemptOrder = (provider?: string): VisionProvider[] => {
  const first = (VISION_PROVIDERS as readonly string[]).includes(String(provider))
    ? (provider as VisionProvider)
    : DEFAULT_VISION_PROVIDER;
  return [first, ...visionFallbackChainFor(first)];
};

/** UI labels for the reasoning provider ids (kept beside the ids so the picker
 *  can never drift from the registry). */
export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  'nvidia-nemotron-ultra': 'Nemotron 3 Ultra (550B) — Primary',
  'nvidia-deepseek-flash': 'DeepSeek V4.1 Flash (NIM)',
  gemini: 'Gemini 3.8 Flash',
  'nvidia-nemotron-lightning': 'Nemotron 3.5 Lightning',
  'nvidia-nemotron-nano': 'Nemotron 3 Nano (30B)',
};

/** UI labels for the vision / OCR engine ids. */
export const VISION_PROVIDER_LABELS: Record<VisionProvider, string> = {
  'nvidia-nemotron-super-vl': 'Nemotron 3.5 Super VL (120B) — Primary',
  'nvidia-llama-vision': 'Llama 3.2 90B Vision',
  gemini: 'Gemini 3.8 Flash Vision',
  ocrspace: 'OCR.space Engine (last resort)',
};
