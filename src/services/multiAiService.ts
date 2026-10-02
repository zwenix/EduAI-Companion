import axios from 'axios';
import { checkAndReportApiError } from '../lib/apiErrorHelper';
import { AI_SECRETS } from '../lib/aiSecrets';
import { isNativeApp } from '../lib/platform';
import {
  NVIDIA_BASE_URL,
  NVIDIA_MODELS,
  QWEN_BASE_URL,
  QWEN_DEFAULT_MODEL,
  isNemotronProvider,
  isLegacyProvider,
  type AlternativeAiProvider,
} from '../lib/aiModels';

// Provider ids, endpoints and model slugs come from the frozen registry in
// `src/lib/aiModels.ts` (single source of truth — see AGENTS.md §1).
export type AIProvider = AlternativeAiProvider;

// ─── Endpoints & model slugs ────────────────────────────────────────────────
// Qwen 3.8 Max → Alibaba Cloud Model Studio (OpenAI-compatible, workspace
// scoped; override with VITE_ALIBABA_API_BASE / ALIBABA_API_BASE).
// Nemotron    → NVIDIA NIM ONLY (never Groq/OpenRouter).
// All values are imported from the frozen registry — do not inline literals.

const executeClientMultiAi = async (provider: AIProvider | string, messages: any[], model?: string) => {
  // Handle NVIDIA NIM providers
  if (provider && isNemotronProvider(provider)) {
    const nvidiaModel = NVIDIA_MODELS[provider];
    if (!nvidiaModel) {
      throw new Error(`Unknown NVIDIA Nemotron model: ${provider}`);
    }
    
    const baseUrl = NVIDIA_BASE_URL;
    const url = `${baseUrl}/chat/completions`;
    const apiKey = String(
      (process.env as any).NVIDIA_API_KEY ||
      (import.meta as any).env?.VITE_NVIDIA_API_KEY ||
      AI_SECRETS.NVIDIA_API_KEY || ""
    ).trim().replace(/^['"\s]+|['"\s]+$/g, "");
    
    if (!apiKey) {
      throw new Error(`API key (NVIDIA_API_KEY) for NVIDIA NIM is not configured. Please add it.`);
    }
    
    const selectedModel = model && !/nemotron|nvidia\//i.test(model) ? model : nvidiaModel;
    
    const payload: any = {
      model: selectedModel,
      messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 16384,
    };
    
    const response = await axios.post(
      url,
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
  }
  
  // Handle Alibaba Qwen providers
  const baseUrl = String(
    (import.meta as any).env?.VITE_ALIBABA_API_BASE ||
    (process.env as any).ALIBABA_API_BASE ||
    QWEN_BASE_URL
  ).trim().replace(/\/+$/, "");
  const url = `${baseUrl}/chat/completions`;
  const apiKey = String(
    (process.env as any).ALIBABA_API_KEY ||
    (import.meta as any).env?.VITE_ALIBABA_API_KEY ||
    (process.env as any).DASHSCOPE_API_KEY ||
    AI_SECRETS.ALIBABA_API_KEY || ""
  ).trim().replace(/^['"\s]+|['"\s]+$/g, "");

  // Never forward a legacy provider id or NVIDIA model slug to Model Studio.
  let selectedModel = model;
  if (
    !selectedModel ||
    selectedModel === provider ||
    isLegacyProvider(selectedModel) ||
    /nemotron|nvidia\//i.test(selectedModel)
  ) {
    selectedModel = QWEN_DEFAULT_MODEL;
  }

  if (!apiKey) {
    throw new Error(`API key (ALIBABA_API_KEY / Model Studio) for Qwen 3.8 is not configured in settings or environment. Please add it.`);
  }

  const payload: any = {
    model: selectedModel,
    messages,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 16384,
  };

  // Let the prompt dictate JSON mode, do not force it which causes issues with certain models

  const response = await axios.post(
    url,
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
      console.log(`[AI Routing] Native client call for ${provider} failed, transitioning to Gemini fallback.`);
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

    console.log(`[AI Routing] Provider ${provider} unavailable or transitioned (Status: ${status || 'Network'}). Seamlessly routing to Gemini.`);
    throw new Error(`Provider ${provider} unavailable, transitioning to Gemini fallback: ${errorMsg}`);
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
