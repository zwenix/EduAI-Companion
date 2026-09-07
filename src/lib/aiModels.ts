/**
 * EduAI Companion — Central Text-Engine Registry
 * ------------------------------------------------------------------
 * Single source of truth for every text-generation engine the app can
 * route to. Shared by:
 *   • server.ts               (Express proxy — /api/ai/:provider)
 *   • src/services/multiAiService.ts (native / direct browser calls)
 *   • src/contexts/AiContext.tsx     (persisted user preference)
 *   • src/components/Settings.tsx    (engine picker UI)
 *
 * IMPORTANT: this module must stay dependency-free and must NOT touch
 * `import.meta` or `process.env` at module scope — it is bundled into the
 * Node server (esbuild → CJS) as well as the browser bundle.
 */

export type TextEngineId =
  | 'gemini'
  | 'alibaba-qwen'
  | 'nvidia-nemotron-3-ultra'
  | 'nvidia-nemotron-3-lightning'
  | 'nvidia-nemotron-3-omni';

export type EngineTier = 'flagship' | 'balanced' | 'lightning' | 'omni';

export interface ReasoningProfile {
  /** Model exposes NVIDIA's hybrid `enable_thinking` chat-template flag. */
  supported: boolean;
  /**
   * Default state for EduAI content generation. Structured HTML/JSON
   * deliverables are cleaner (and much faster) with thinking OFF; deep
   * reasoning is switched on explicitly for grading / tutoring / analysis.
   */
  defaultEnabled: boolean;
  /** Token budget granted to the chain-of-thought when thinking is ON. */
  budget?: number;
  /** Tokens the model gets to land the plane after the budget is spent. */
  gracePeriod?: number;
}

export interface TextEngineSpec {
  id: TextEngineId;
  /** Human label shown in the UI. */
  label: string;
  /** Short label for tight spaces (chips, latency grid). */
  shortLabel: string;
  vendor: string;
  /** Exact model slug sent to the provider API. */
  model: string;
  /** OpenAI-compatible base URL ('' for Gemini, which uses the Google SDK). */
  baseUrl: string;
  /** Environment variable that holds the credential. */
  keyName: string;
  tier: EngineTier;
  badge: string;
  description: string;
  /** Marketing/ops note surfaced in Settings. */
  note: string;
  contextWindow: number;
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  reasoning: ReasoningProfile;
  modalities: { text: boolean; image: boolean; audio: boolean; video: boolean };
  /** True when the endpoint is free to call (NVIDIA build.nvidia.com NIM). */
  free: boolean;
  /** Ordered degradation chain used when this engine is unavailable. */
  fallbacks: TextEngineId[];
  /** Tailwind accent used by the Settings / Admin badges. */
  accent: { dotBg: string; dotText: string; activeBorder: string };
}

/** NVIDIA's hosted, OpenAI-compatible NIM gateway (build.nvidia.com keys). */
export const NVIDIA_NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/** Alibaba Cloud Model Studio workspace endpoint (OpenAI-compatible). */
export const ALIBABA_DEFAULT_BASE_URL =
  'https://ws-8ldb9u90tetxcada.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1';

export const TEXT_ENGINES: Record<TextEngineId, TextEngineSpec> = {
  gemini: {
    id: 'gemini',
    label: 'Gemini 3.8 Flash',
    shortLabel: 'Gemini 3.8',
    vendor: 'Google',
    model: 'gemini-3.8-flash',
    baseUrl: '',
    keyName: 'GEMINI_API_KEY',
    tier: 'balanced',
    badge: 'Primary',
    description: 'Latest GA Flash model — CAPS lesson planning, auto-grading, vision OCR and the voice tutor.',
    note: 'Universal safety net: every other engine degrades to Gemini automatically.',
    contextWindow: 1_048_576,
    maxOutputTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
    reasoning: { supported: false, defaultEnabled: false },
    modalities: { text: true, image: true, audio: true, video: false },
    free: false,
    fallbacks: ['alibaba-qwen', 'nvidia-nemotron-3-ultra'],
    accent: { dotBg: 'bg-violet-500/20', dotText: 'text-violet-400', activeBorder: 'border-violet-500/40 bg-violet-500/10' },
  },

  'nvidia-nemotron-3-ultra': {
    id: 'nvidia-nemotron-3-ultra',
    label: 'Nemotron 3 Ultra 550B',
    shortLabel: 'Nemotron Ultra',
    vendor: 'NVIDIA',
    model: 'nvidia/nemotron-3-ultra-550b-a55b',
    baseUrl: NVIDIA_NIM_BASE_URL,
    keyName: 'NVIDIA_API_KEY',
    tier: 'flagship',
    badge: 'World Class · Free NIM',
    description:
      'Open frontier reasoning model — 550B total / 55B active LatentMoE (Mamba-2 + Transformer). Highest-fidelity CAPS lesson plans, ATPs, exam papers and memoranda.',
    note: 'Free NVIDIA NIM endpoint (integrate.api.nvidia.com) · 1M-token context · hybrid thinking.',
    contextWindow: 1_048_576,
    maxOutputTokens: 16384,
    temperature: 0.6,
    topP: 0.95,
    reasoning: { supported: true, defaultEnabled: false, budget: 16384, gracePeriod: 1024 },
    modalities: { text: true, image: false, audio: false, video: false },
    free: true,
    fallbacks: ['nvidia-nemotron-3-lightning', 'alibaba-qwen', 'gemini'],
    accent: { dotBg: 'bg-emerald-500/20', dotText: 'text-emerald-400', activeBorder: 'border-emerald-500/40 bg-emerald-500/10' },
  },

  'nvidia-nemotron-3-lightning': {
    id: 'nvidia-nemotron-3-lightning',
    label: 'Nemotron 3.5 Lightning 30B',
    shortLabel: 'Nemotron Lightning',
    vendor: 'NVIDIA',
    model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    baseUrl: NVIDIA_NIM_BASE_URL,
    keyName: 'NVIDIA_API_KEY',
    tier: 'lightning',
    badge: 'Fast Text Generation',
    description:
      'Distilled from Nemotron 3 Ultra — 30B total / 3B active. Built for high-volume text generation: worksheets, notices, report comments, rubrics and batch admin documents.',
    note: 'Free NVIDIA NIM endpoint · 1M-token context · NVIDIA-recommended sampling (temp 1.0 / top_p 0.95).',
    contextWindow: 1_048_576,
    maxOutputTokens: 16384,
    temperature: 1.0,
    topP: 0.95,
    reasoning: { supported: true, defaultEnabled: false, budget: 8192, gracePeriod: 1024 },
    modalities: { text: true, image: false, audio: false, video: false },
    free: true,
    fallbacks: ['nvidia-nemotron-3-ultra', 'alibaba-qwen', 'gemini'],
    accent: { dotBg: 'bg-lime-500/20', dotText: 'text-lime-400', activeBorder: 'border-lime-500/40 bg-lime-500/10' },
  },

  'nvidia-nemotron-3-omni': {
    id: 'nvidia-nemotron-3-omni',
    label: 'Nemotron 3 Nano Omni 30B (Reasoning)',
    shortLabel: 'Nemotron Omni',
    vendor: 'NVIDIA',
    model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    baseUrl: NVIDIA_NIM_BASE_URL,
    keyName: 'NVIDIA_API_KEY',
    tier: 'omni',
    badge: 'Multimodal Reasoning',
    description:
      'Omni-modal 30B-A3B reasoning model — reads text, images, documents, audio and video. Ideal for handwriting OCR, marking scanned scripts, chart/diagram analysis and evidence-based intervention notes.',
    note: 'Free NVIDIA NIM endpoint · 256k context · chain-of-thought on demand · best-in-class OCRBench/document intelligence.',
    contextWindow: 262_144,
    maxOutputTokens: 20480,
    temperature: 0.6,
    topP: 0.95,
    reasoning: { supported: true, defaultEnabled: true, budget: 16384, gracePeriod: 1024 },
    modalities: { text: true, image: true, audio: true, video: true },
    free: true,
    fallbacks: ['nvidia-nemotron-3-ultra', 'gemini'],
    accent: { dotBg: 'bg-cyan-500/20', dotText: 'text-cyan-400', activeBorder: 'border-cyan-500/40 bg-cyan-500/10' },
  },

  'alibaba-qwen': {
    id: 'alibaba-qwen',
    label: 'Qwen 3.8 Max',
    shortLabel: 'Qwen 3.8',
    vendor: 'Alibaba Model Studio',
    model: 'qwen3.8-max',
    baseUrl: ALIBABA_DEFAULT_BASE_URL,
    keyName: 'ALIBABA_API_KEY',
    tier: 'balanced',
    badge: 'Multilingual',
    description: 'Strong multilingual authoring engine — useful for isiZulu / Afrikaans / Sesotho home-language material.',
    note: 'Alibaba Model Studio workspace endpoint (qwen3.8-max) · falls back to Gemini.',
    contextWindow: 262_144,
    maxOutputTokens: 16384,
    temperature: 0.7,
    topP: 0.95,
    reasoning: { supported: false, defaultEnabled: false },
    modalities: { text: true, image: false, audio: false, video: false },
    free: false,
    fallbacks: ['nvidia-nemotron-3-ultra', 'gemini'],
    accent: { dotBg: 'bg-orange-500/20', dotText: 'text-orange-400', activeBorder: 'border-orange-500/40 bg-orange-500/10' },
  },
};

/** Display order used by every engine picker in the app. */
export const TEXT_ENGINE_ORDER: TextEngineId[] = [
  'gemini',
  'nvidia-nemotron-3-ultra',
  'nvidia-nemotron-3-lightning',
  'nvidia-nemotron-3-omni',
  'alibaba-qwen',
];

export const TEXT_ENGINE_LIST: TextEngineSpec[] = TEXT_ENGINE_ORDER.map((id) => TEXT_ENGINES[id]);

export const NVIDIA_ENGINE_IDS: TextEngineId[] = [
  'nvidia-nemotron-3-ultra',
  'nvidia-nemotron-3-lightning',
  'nvidia-nemotron-3-omni',
];

/**
 * Historical provider ids that still live in localStorage / Firestore logs.
 * They are silently upgraded to the current Nemotron 3 line-up.
 */
export const LEGACY_ENGINE_MAP: Record<string, TextEngineId> = {
  'nvidia-nemotron': 'nvidia-nemotron-3-lightning',
  'nvidia-nemotron-ultra': 'nvidia-nemotron-3-ultra',
  'nvidia-nemotron-omni': 'nvidia-nemotron-3-omni',
  'nemotron': 'nvidia-nemotron-3-ultra',
  'nemotron-ultra': 'nvidia-nemotron-3-ultra',
  'nemotron-lightning': 'nvidia-nemotron-3-lightning',
  'groq-qwen': 'alibaba-qwen',
  'alibaba-deepseek': 'alibaba-qwen',
  'qwen': 'alibaba-qwen',
};

export const isTextEngineId = (value: unknown): value is TextEngineId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(TEXT_ENGINES, value);

/** Map any historical/aliased id onto a currently-supported engine id. */
export const normalizeEngineId = (value?: string | null): TextEngineId | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (isTextEngineId(raw)) return raw;
  const mapped = LEGACY_ENGINE_MAP[raw];
  return mapped || null;
};

export const getEngine = (value?: string | null): TextEngineSpec =>
  TEXT_ENGINES[normalizeEngineId(value) || 'gemini'];

export const isNvidiaEngine = (value?: string | null): boolean => {
  const id = normalizeEngineId(value);
  return !!id && NVIDIA_ENGINE_IDS.includes(id);
};

/**
 * Resolve the model slug to send to the provider.
 * Never lets a provider-id, a legacy alias, or a foreign vendor slug leak
 * through as a model name (that is what produced the old "model not found"
 * 400s when Nemotron ids were forwarded to Model Studio).
 */
export const resolveModelSlug = (engineId: string, requestedModel?: string | null): string => {
  const engine = getEngine(engineId);
  const requested = (requestedModel || '').trim();
  if (!requested) return engine.model;
  if (requested === engineId) return engine.model;
  if (normalizeEngineId(requested)) return engine.model;

  const isNvidiaSlug = /^nvidia\//i.test(requested);
  const isQwenSlug = /^qwen/i.test(requested);
  const engineIsNvidia = isNvidiaEngine(engineId);

  // Only honour an explicit slug when it belongs to this engine's vendor.
  if (engineIsNvidia && isNvidiaSlug) return requested;
  if (engineId === 'alibaba-qwen' && isQwenSlug) return requested;
  if (engineId === 'gemini' && /^gemini/i.test(requested)) return requested;
  return engine.model;
};

export interface ChatPayloadOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  /** Force hybrid reasoning on/off; defaults to the engine profile. */
  reasoning?: boolean;
  stream?: boolean;
  model?: string;
}

/**
 * Build a provider-correct OpenAI-compatible chat payload, including the
 * NVIDIA `chat_template_kwargs` / reasoning-budget extras when relevant.
 */
export const buildChatPayload = (
  engineId: string,
  messages: any[],
  options: ChatPayloadOptions = {}
): Record<string, any> => {
  const engine = getEngine(engineId);
  const payload: Record<string, any> = {
    model: resolveModelSlug(engineId, options.model),
    messages,
    temperature: typeof options.temperature === 'number' ? options.temperature : engine.temperature,
    top_p: typeof options.topP === 'number' ? options.topP : engine.topP,
    max_tokens: Math.min(options.maxTokens || engine.maxOutputTokens, engine.maxOutputTokens),
  };

  if (options.stream) payload.stream = true;

  if (engine.reasoning.supported) {
    const thinking =
      typeof options.reasoning === 'boolean' ? options.reasoning : engine.reasoning.defaultEnabled;
    payload.chat_template_kwargs = { enable_thinking: thinking };
    if (thinking) {
      if (engine.reasoning.budget) payload.reasoning_budget = engine.reasoning.budget;
      if (engine.reasoning.gracePeriod) payload.grace_period = engine.reasoning.gracePeriod;
    }
  }

  return payload;
};

/**
 * Hybrid-reasoning models can emit their chain-of-thought inline. Strip it so
 * downstream HTML/JSON parsers only ever see the final deliverable.
 */
export const stripReasoningTraces = (text: string): string => {
  if (!text) return '';
  return String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    // Unterminated trace (hit the token ceiling mid-thought) — drop the head.
    .replace(/^[\s\S]*?<\/think>/i, '')
    .trim();
};

/** Pull the assistant text out of an OpenAI-compatible response message. */
export const extractMessageText = (message: any): string => {
  if (!message) return '';
  const raw =
    (typeof message.content === 'string' ? message.content : '') ||
    (Array.isArray(message.content)
      ? message.content.map((p: any) => p?.text || '').join('')
      : '') ||
    message.reasoning_content ||
    '';
  return stripReasoningTraces(raw);
};

/** Ordered attempt chain for an engine (itself first, then its fallbacks). */
export const buildFallbackChain = (engineId: string): TextEngineId[] => {
  const engine = getEngine(engineId);
  const chain: TextEngineId[] = [engine.id, ...engine.fallbacks];
  if (!chain.includes('gemini')) chain.push('gemini');
  return chain.filter((id, index) => chain.indexOf(id) === index);
};

export default TEXT_ENGINES;
