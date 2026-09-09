import axios from 'axios';
import { checkAndReportApiError } from '../lib/apiErrorHelper';
import { AI_SECRETS } from '../lib/aiSecrets';
import { isNativeApp } from '../lib/platform';

export type AIProvider = 'alibaba-qwen' | 'nvidia-nemotron-nano' | 'nvidia-nemotron-ultra' | 'nvidia-nemotron-lightning';

// ─── Qwen 3.8 via Alibaba Cloud Model Studio (OpenAI-compatible) ─────────────
// Workspace-scoped endpoint (see Model Studio → API KEY dialog). Override with
// VITE_ALIBABA_API_BASE / ALIBABA_API_BASE if the workspace or region changes.
const QWEN_BASE_URL = "https://ws-8ldb9u90tetxcada.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";
const QWEN_DEFAULT_MODEL = "qwen3.8-max";

// Legacy NVIDIA Nemotron / Groq ids — the Nemotron LLMs were removed for text
// generation and replaced by Qwen 3.8 Max (Alibaba Model Studio). Every one of
// these provider ids transparently resolves to the Qwen 3.8 engine so saved
// user preferences and old configs keep generating content.
const LEGACY_PROVIDERS = ['groq-qwen'];

const executeClientMultiAi = async (provider: AIProvider | string, messages: any[], model?: string) => {
  // Alibaba Qwen providers (including every legacy NVIDIA Nemotron / Groq id)
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
    LEGACY_PROVIDERS.includes(selectedModel) ||
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
