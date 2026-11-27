import axios from 'axios';
import { checkAndReportApiError } from '../lib/apiErrorHelper';
import { AI_SECRETS } from '../lib/aiSecrets';
import { isNativeApp } from '../lib/platform';
import {
  NVIDIA_BASE_URL,
  NVIDIA_MODELS,
  isNvidiaNimProvider,
  isVisionProvider,
  isLegacyProvider,
  type AlternativeAiProvider,
} from '../lib/aiModels';

// Provider ids, endpoints and model slugs come from the frozen registry in
// `src/lib/aiModels.ts` (single source of truth — see AGENTS.md §1).
export type AIProvider = AlternativeAiProvider;

// ─── Endpoint & model slugs ─────────────────────────────────────────────────
// EVERY alternative engine is hosted on the FREE NVIDIA NIM endpoint
// (`https://integrate.api.nvidia.com/v1`): Nemotron 3 Ultra (primary),
// DeepSeek V4.1 Flash (secondary), Nemotron 3.5 Lightning (last) and the two
// vision models. Alibaba Model Studio / Qwen was removed on 24 Nov 2026.
// All values are imported from the frozen registry — do not inline literals.

/** Resolve the NVIDIA NIM key (env → VITE env → baked APK key). */
const resolveNimKey = (): string =>
  String(
    (process.env as any).NVIDIA_API_KEY ||
    (import.meta as any).env?.VITE_NVIDIA_API_KEY ||
    AI_SECRETS.NVIDIA_API_KEY || ""
  ).trim().replace(/^['"\s]+|['"\s]+$/g, "");

/**
 * The exact model slug for one NVIDIA NIM engine. A caller-supplied model is
 * honoured only when it is a genuine slug for that same engine family —
 * never a legacy alias, and never another provider's model.
 */
const nimModelFor = (provider: string, model?: string): string => {
  const registered = NVIDIA_MODELS[provider];
  if (!registered) {
    throw new Error(`Unknown NVIDIA NIM model: ${provider}`);
  }
  if (
    !model ||
    model === provider ||
    isLegacyProvider(model) ||
    isNvidiaNimProvider(model) ||
    !/^[\w.-]+\/[\w.:-]+$/.test(model)
  ) {
    return registered;
  }
  return model;
};

const executeClientMultiAi = async (provider: AIProvider | string, messages: any[], model?: string) => {
  // Every alternative engine in this app is an NVIDIA NIM model.
  if (!isNvidiaNimProvider(provider)) {
    // Qwen / Model Studio ids are retired aliases: they now mean DeepSeek.
    if (!isLegacyProvider(provider)) {
      throw new Error(`Unknown AI provider "${provider}". Only NVIDIA NIM engines are served here.`);
    }
  }

  const nimProvider = isNvidiaNimProvider(provider) ? provider : 'nvidia-deepseek';
  const selectedModel = nimModelFor(nimProvider, model);

  const apiKey = resolveNimKey();
  if (!apiKey) {
    throw new Error(`API key (NVIDIA_API_KEY) for NVIDIA NIM is not configured. Please add it.`);
  }

  const payload: any = {
    model: selectedModel,
    messages,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 16384,
  };

  if (isVisionProvider(nimProvider)) {
    // Vision models reject sampling knobs and reasoning-only fields.
    delete payload.top_p;
  }

  const response = await axios.post(
    `${NVIDIA_BASE_URL}/chat/completions`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  const msg = response.data.choices[0]?.message || {};
  return msg.content || msg.reasoning_content || "";
};

const executeClientOCR = async (base64Image: string, language: string = "eng") => {
  const apiKey = (process.env as any).OCR_SPACE_API_KEY || (import.meta as any).env?.VITE_OCR_SPACE_API_KEY || "K82110486088957";
  const formData = new URLSearchParams();
  formData.append("base64Image", base64Image);
  formData.append("language", language);
  formData.append("apikey", apiKey);

  const response = await axios.post("https://api.ocr.space/parse/image", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
    return response.data.ParsedResults[0].ParsedText;
  }
  return "";
};

export const callMultiAi = async (provider: AIProvider, messages: any[], model?: string) => {
  // Native app: no backend — call the provider API directly.
  if (isNativeApp()) {
    try {
      return await executeClientMultiAi(provider, messages, model);
    } catch (clientErr: any) {
      console.log(`[AI Routing] Native client call for ${provider} failed, walking the fallback chain.`);
      throw clientErr;
    }
  }

  try {
    const response = await axios.post(`/api/ai/${provider}`, { messages, model });
    const msg = response.data.choices[0]?.message || {};
    return msg.content || msg.reasoning_content || "";
  } catch (error: any) {
    const status = error.response?.status;
    const backendError = error.response?.data?.error || {};
    const errorMsg = typeof backendError === 'string' ? backendError : backendError?.message || error?.message || '';

    console.log(`[AI Routing] Provider ${provider} unavailable or transitioned (Status: ${status || 'Network'}). Walking the reasoning chain.`);
    throw new Error(`Provider ${provider} unavailable, transitioning to the next reasoning engine: ${errorMsg}`);
  }
};

export const performOCR = async (base64Image: string, language: string = 'eng') => {
  if (isNativeApp()) {
    return await executeClientOCR(base64Image, language);
  }
  try {
    const response = await axios.post('/api/ocr', { image: base64Image, language });
    if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      return response.data.ParsedResults[0].ParsedText;
    }
    return "";
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 404 || !error.response) {
      console.warn(`Express backend /api/ocr returned 404 or network issue. Running direct browser fallback...`);
      try {
        return await executeClientOCR(base64Image, language);
      } catch (clientErr: any) {
        checkAndReportApiError(clientErr, 'OCR Space');
        throw clientErr;
      }
    }
    console.error("OCR error:", error);
    checkAndReportApiError(error, 'OCR Space');
    throw new Error("OCR failed");
  }
};
