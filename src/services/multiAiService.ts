import axios from 'axios';
import { checkAndReportApiError } from '../lib/apiErrorHelper';
import { AI_SECRETS } from '../lib/aiSecrets';
import { isNativeApp } from '../lib/platform';
import {
  NVIDIA_BASE_URL,
  NVIDIA_MODELS,
  isNimProvider,
  isNimVisionProvider,
  nimRequestDefaultsFor,
  resolveProviderModel,
  type AlternativeAiProvider,
} from '../lib/aiModels';

// Provider ids, endpoints and model slugs come from the frozen registry in
// `src/lib/aiModels.ts` (single source of truth — see AGENTS.md §1).
//
// Every non-Gemini engine is served by NVIDIA NIM:
//   reasoning → nvidia-nemotron-ultra, nvidia-deepseek-flash,
//               nvidia-nemotron-lightning, nvidia-nemotron-nano
//   vision    → nvidia-nemotron-super-vl, nvidia-llama-vision
// Alibaba Model Studio (Qwen) is REMOVED — deepseek-v4.1-flash replaced it.
export type AIProvider = AlternativeAiProvider;

const cleanKey = (raw: unknown): string =>
  String(raw ?? '').trim().replace(/^['"\s]+|['"\s]+$/g, '');

/** NVIDIA NIM key resolution shared by the text and vision paths. */
const resolveNimKey = (): string =>
  cleanKey(
    (process.env as any).NVIDIA_API_KEY ||
      (import.meta as any).env?.VITE_NVIDIA_API_KEY ||
      AI_SECRETS.NVIDIA_API_KEY ||
      '',
  );

/**
 * A caller-supplied `model` is honoured ONLY when it is one of the frozen NIM
 * slugs. A provider id, a legacy id or a retired Qwen slug is ignored in favour
 * of the frozen slug for that provider, so no request can reach a removed model.
 */
const pickNimModel = (provider: string, requested?: string): string => {
  const requestedSlug = String(requested ?? '').trim();
  const frozen = resolveProviderModel(provider);
  if (!frozen) throw new Error(`Unknown NVIDIA NIM model: ${provider}`);
  if (
    requestedSlug &&
    !/qwen|aliyuncs|model-?studio/i.test(requestedSlug) &&
    Object.values(NVIDIA_MODELS).includes(requestedSlug)
  ) {
    return requestedSlug;
  }
  return frozen;
};

const executeClientMultiAi = async (provider: AIProvider | string, messages: any[], model?: string) => {
  if (!isNimProvider(provider)) {
    throw new Error(
      `Provider ${provider} is not served by NVIDIA NIM. Text and vision engines are ` +
        `nvidia-* ids (see src/lib/aiModels.ts); Gemini has its own client.`,
    );
  }

  const selectedModel = pickNimModel(provider, model);
  const apiKey = resolveNimKey();

  if (!apiKey) {
    throw new Error(`API key (NVIDIA_API_KEY) for NVIDIA NIM is not configured. Please add it.`);
  }

  const payload: any = {
    ...nimRequestDefaultsFor(provider),
    model: selectedModel,
    messages,
  };

  const response = await axios.post(`${NVIDIA_BASE_URL}/chat/completions`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const msg = response.data.choices?.[0]?.message || {};
  return msg.content || msg.reasoning_content || '';
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

export const callMultiAi = async (provider: AIProvider | string, messages: any[], model?: string) => {
  // Native app: no backend — call the provider API directly.
  if (isNativeApp()) {
    try {
      return await executeClientMultiAi(provider, messages, model);
    } catch (clientErr: any) {
      console.log(`[AI Routing] Native client call for ${provider} failed, transitioning to the next engine.`);
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

    console.log(`[AI Routing] Provider ${provider} unavailable or transitioned (Status: ${status || 'Network'}). Seamlessly routing to the next engine.`);
    throw new Error(`Provider ${provider} unavailable, transitioning to the next engine: ${errorMsg}`);
  }
};

/**
 * Vision/OCR call — scanned worksheets, diagrams, handwritten work.
 *
 * Sends the image parts straight to the NIM vision model in the standard
 * OpenAI `image_url` shape, so the same payload works on the Express proxy and
 * in the standalone APK (where `callMultiAi` posts to NIM directly).
 */
export const callVisionAi = async (
  provider: AIProvider | string,
  messages: any[],
  model?: string,
) => {
  if (!isNimVisionProvider(provider)) {
    throw new Error(
      `Provider ${provider} is not a NIM vision engine. Use one of the ` +
        `NIM_VISION_PROVIDERS ids from src/lib/aiModels.ts.`,
    );
  }
  return await callMultiAi(provider as AIProvider, messages, model ?? NVIDIA_MODELS[provider]);
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
