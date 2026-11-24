/**
 * EduAI Companion — FROZEN AI model registry (single source of truth).
 *
 * ⚠️ READ `AGENTS.md` §1 BEFORE EDITING THIS FILE.
 *
 * The five text provider ids and their exact model slugs below are frozen. No
 * agent, assistant, service or future change may swap, alias, upgrade, downgrade
 * or re-route them to other versions, providers or fallback engines. Every
 * allowed model must be called directly and exactly as specified.
 *
 * This module exists so that the frozen list lives in exactly ONE place and is
 * imported by every call site:
 *   • `server.ts`                     — the `/api/ai/:provider` proxy
 *   • `src/services/multiAiService.ts`— the native/standalone client path
 *   • `src/services/unifiedAiService.ts` — the client routing/fallback chain
 *   • `src/services/geminiService.ts` — the browser-side last-resort chain
 *   • `src/contexts/AiContext.tsx`    — the selectable provider ids
 *   • `src/App.tsx`                   — the AI-engine picker
 *
 * Regression tests in `tests/ai-models.test.ts` assert these values against the
 * table in AGENTS.md, so an accidental re-map fails CI rather than shipping.
 *
 * ── What changed on 24 Nov 2026 (explicit user instruction) ────────────────
 *   • Google Gemini is no longer the primary reasoning engine.
 *   • NVIDIA NEMOTRON 3 ULTRA is now the PRIMARY engine for lesson plans,
 *     assessments and learner diagnosis.
 *   • Alibaba Qwen 3.8 Max is REMOVED completely. NVIDIA NIM
 *     `deepseek-v4.1-flash` takes its slot as the SECONDARY engine.
 *   • Vision/OCR is now NVIDIA NIM primary: `nemotron-3.5-super-vl-120b-a12b`,
 *     with `llama-3.2-90b-vision-instruct` added to the chain.
 *
 * Excluded from this file on purpose: image generation and TTS / voice
 * pipelines. Those are separate systems with their own provider graphs.
 */

// ─── Text / reasoning providers ─────────────────────────────────────────────

/**
 * Provider ids exposed in the app, in fallback-priority order (active,
 * non-legacy). The first entry is the primary reasoning engine.
 */
export const AI_PROVIDERS = [
  'nvidia-nemotron-ultra',
  'nvidia-deepseek',
  'gemini',
  'nvidia-nemotron-lightning',
  'nvidia-nemotron-nano',
] as const;

/** Union of the five frozen text provider ids. */
export type AIProvider = (typeof AI_PROVIDERS)[number];

/**
 * Providers served by the alternative-engine client path (everything except
 * Gemini, which has its own client in `src/services/geminiClient.ts`).
 */
export type AlternativeAiProvider = Exclude<AIProvider, 'gemini'>;

/** The three NVIDIA NIM Nemotron text provider ids. */
export const NEMOTRON_PROVIDERS = [
  'nvidia-nemotron-ultra',
  'nvidia-nemotron-lightning',
  'nvidia-nemotron-nano',
] as const;

// ─── Vision / OCR providers (separate pipeline, NVIDIA NIM hosted) ──────────

/**
 * Vision/OCR provider ids. These are NOT part of the text-generation picker:
 * they exist only for the scanned-worksheet / diagram / handwriting pipeline
 * (`runOCRScan` / `runOCRAndGrade`).
 */
export const VISION_PROVIDERS = [
  'nvidia-nemotron-vl',
  'nvidia-llama-vision',
] as const;

export type VisionProvider = (typeof VISION_PROVIDERS)[number];

/** Union of every OCR provider id the app can route to. */
export type OcrProvider = VisionProvider | 'gemini' | 'ocrspace';

/**
 * The OCR / vision fallback chain, in priority order (explicit user
 * instruction): Nemotron 3.5 Super VL 120B → Gemini multimodal →
 * Llama 3.2 90B Vision → OCR.space.
 */
export const VISION_PROVIDER_CHAIN: readonly OcrProvider[] = [
  'nvidia-nemotron-vl',
  'gemini',
  'nvidia-llama-vision',
  'ocrspace',
];

/** The primary vision/OCR engine — NVIDIA NIM Nemotron 3.5 Super VL. */
export const PRIMARY_VISION_PROVIDER: OcrProvider = VISION_PROVIDER_CHAIN[0];

// ─── Retired ids (aliases only, never resurrected as models) ────────────────

/**
 * Retired provider ids kept ONLY so stale saved settings keep working. They
 * resolve to the DeepSeek engine (the engine that replaced Qwen) and never
 * appear in any picker.
 */
export const LEGACY_PROVIDER_IDS = [
  'alibaba-qwen',
  'groq-qwen',
  'qwen',
  'qwen-image',
  'nvidia-nemotron',
  'nvidia-nemotron-ultra-legacy',
] as const;

// ─── Google Gemini ──────────────────────────────────────────────────────────

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

/** The current latest GA Gemini model (tertiary reasoning engine + vision). */
export const GEMINI_PRIMARY_MODEL = GEMINI_MODEL_CHAIN[0];

// ─── NVIDIA NIM ─────────────────────────────────────────────────────────────

/** NVIDIA NIM endpoint — mandatory for EVERY Nemotron / DeepSeek / vision model. */
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/** Exact NVIDIA NIM model slug per provider id (text + vision). */
export const NVIDIA_MODELS: Record<string, string> = {
  // Text / reasoning
  'nvidia-nemotron-ultra': 'nvidia/nemotron-ultra-550b-a55b',
  'nvidia-deepseek': 'nvidia/deepseek-v4.1-flash',
  'nvidia-nemotron-lightning': 'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia-nemotron-nano': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  // Vision / OCR
  'nvidia-nemotron-vl': 'nvidia/nemotron-3.5-super-vl-120b-a12b',
  'nvidia-llama-vision': 'meta/llama-3.2-90b-vision-instruct',
} as const;

/** The DeepSeek engine that replaced Qwen 3.8 Max. */
export const DEEPSEEK_DEFAULT_MODEL = NVIDIA_MODELS['nvidia-deepseek'];

/** True for the three NVIDIA NIM Nemotron text provider ids. */
export const isNemotronProvider = (provider: string): boolean =>
  (NEMOTRON_PROVIDERS as readonly string[]).includes(provider);

/** True for the NVIDIA NIM vision/OCR provider ids. */
export const isVisionProvider = (provider: string): boolean =>
  (VISION_PROVIDERS as readonly string[]).includes(provider);

/**
 * True for every provider id served by the NVIDIA NIM client (Nemotron text,
 * DeepSeek text and the vision models). Everything else is Gemini or OCR.space.
 */
export const isNvidiaNimProvider = (provider: string): boolean =>
  Object.prototype.hasOwnProperty.call(NVIDIA_MODELS, provider);

/** True for retired ids that must now resolve to the DeepSeek engine. */
export const isLegacyProvider = (provider: string | null | undefined): boolean =>
  !!provider && (LEGACY_PROVIDER_IDS as readonly string[]).includes(provider);

// ─── Reasoning chain: the app's one fallback priority ───────────────────────

/**
 * The reasoning fallback chain, in the exact priority the product owner
 * specified:
 *
 *   1. PRIMARY   — NVIDIA Nemotron 3 Ultra (550B-A55B)
 *   2. SECONDARY — NVIDIA DeepSeek V4.1 Flash
 *   3. TERTIARY  — Google Gemini (gemini-3.8-flash, with the Gemini chain)
 *   4. LAST      — NVIDIA Nemotron 3.5 Lightning
 *
 * Every model has a fallback: a request that starts on any member of this
 * chain walks the members that follow it and then the ones that precede it, so
 * a provider fault can never leave a classroom without a response.
 */
export const REASONING_CHAIN = [
  'nvidia-nemotron-ultra',
  'nvidia-deepseek',
  'gemini',
  'nvidia-nemotron-lightning',
] as const;

/** The primary reasoning engine for lesson plans, assessments and diagnosis. */
export const PRIMARY_REASONING_PROVIDER = REASONING_CHAIN[0];

/**
 * Ordered fallback providers for `provider`.
 *
 * Starts after `provider` in {@link REASONING_CHAIN}, wraps around to the
 * members before it, and always excludes `provider` itself and duplicates.
 * Unknown ids get the whole chain.
 */
export const reasoningFallbacksFor = (provider: string): string[] => {
  const chain: readonly string[] = REASONING_CHAIN;

  if (!chain.includes(provider)) {
    // Not a chain member (e.g. Nemotron 3 Nano, or a legacy alias): the whole
    // frozen chain is its fallback list.
    return [...chain];
  }

  const start = chain.indexOf(provider);
  const after = chain.slice(start + 1);
  const before = chain.slice(0, start);
  return [...after, ...before];
};

/**
 * Exact model slug for a provider id.
 *
 * Legacy ids resolve to the DeepSeek engine (they are aliases, not models).
 * Gemini returns the primary GA model. Unknown ids return an empty string so
 * the caller can decide how to fail.
 */
export const resolveProviderModel = (provider: string): string => {
  if (isNvidiaNimProvider(provider)) return NVIDIA_MODELS[provider] ?? '';
  if (isLegacyProvider(provider)) return DEEPSEEK_DEFAULT_MODEL;
  if (provider === 'gemini') return GEMINI_PRIMARY_MODEL;
  return '';
};

/**
 * The engine a legacy id now stands for. Stale saved settings are migrated to
 * this id on read (see `src/contexts/AiContext.tsx`).
 */
export const legacyProviderTarget = (): string => 'nvidia-deepseek';

/**
 * Ordered vision/OCR providers to try for a selected OCR engine: the rest of
 * {@link VISION_PROVIDER_CHAIN} after the selection, then the ones before it.
 */
export const visionFallbacksFor = (provider: string): OcrProvider[] => {
  const chain = VISION_PROVIDER_CHAIN;
  const start = chain.indexOf(provider as OcrProvider);
  const ordered = start === -1 ? [...chain] : [...chain.slice(start + 1), ...chain.slice(0, start)];
  return ordered.filter((p) => p !== provider);
};

/** UI labels for the five frozen text provider ids (kept beside the ids so the
 *  picker can never drift from the registry). */
export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  'nvidia-nemotron-ultra': 'Nemotron 3 Ultra (550B)',
  'nvidia-deepseek': 'DeepSeek V4.1 Flash',
  gemini: 'Gemini 3.8 Flash',
  'nvidia-nemotron-lightning': 'Nemotron 3.5 Lightning',
  'nvidia-nemotron-nano': 'Nemotron 3 Nano (30B)',
};

/** UI labels for the vision/OCR engines. */
export const OCR_PROVIDER_LABELS: Record<string, string> = {
  'nvidia-nemotron-vl': 'Nemotron 3.5 Super VL 120B (NVIDIA NIM)',
  'nvidia-llama-vision': 'Llama 3.2 90B Vision (NVIDIA NIM)',
  gemini: 'Gemini Multimodal Vision',
  ocrspace: 'OCR.space Engine',
};
