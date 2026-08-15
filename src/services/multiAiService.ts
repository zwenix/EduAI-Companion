import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { checkAndReportApiError } from '../lib/apiErrorHelper';
import { AI_SECRETS } from '../lib/aiSecrets';

const isNativeApp = (): boolean => {
  try { return typeof Capacitor !== 'undefined' && !!Capacitor.isNativePlatform?.(); }
  catch { return false; }
};

export type AIProvider = 'nvidia-nemotron' | 'nvidia-nemotron-ultra' | 'groq-qwen';

const executeClientMultiAi = async (provider: AIProvider, messages: any[], model?: string) => {
  let url = "https://api.groq.com/openai/v1/chat/completions";
  let apiKey = ((process.env as any).GROQ_API_KEY || (import.meta as any).env?.VITE_GROQ_API_KEY || AI_SECRETS.GROQ_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
  let selectedModel = model;
  const isAltModel = provider === 'nvidia-nemotron' || provider === 'nvidia-nemotron-ultra' || provider === 'groq-qwen';

  if (isAltModel) {
    if (provider === 'nvidia-nemotron') {
      url = "https://integrate.api.nvidia.com/v1/chat/completions";
      apiKey = ((process.env as any).NVIDIA_API_KEY || (import.meta as any).env?.VITE_NVIDIA_API_KEY || (process.env as any).OPENROUTER_API_KEY || (import.meta as any).env?.VITE_OPENROUTER_API_KEY || AI_SECRETS.NVIDIA_API_KEY || AI_SECRETS.OPENROUTER_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
      if (!selectedModel || selectedModel === 'nvidia-nemotron') {
        selectedModel = "nvidia/llama-3.3-nemotron-super-49b-v1";
      }
    } else if (provider === 'nvidia-nemotron-ultra' || provider === 'groq-qwen') {
      url = "https://integrate.api.nvidia.com/v1/chat/completions";
      apiKey = ((process.env as any).NVIDIA_API_KEY || (import.meta as any).env?.VITE_NVIDIA_API_KEY || (process.env as any).OPENROUTER_API_KEY || (import.meta as any).env?.VITE_OPENROUTER_API_KEY || AI_SECRETS.NVIDIA_API_KEY || AI_SECRETS.OPENROUTER_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
      if (!selectedModel || selectedModel === 'nvidia-nemotron-ultra' || selectedModel === 'groq-qwen') {
        selectedModel = "nvidia/nemotron-3-ultra-550b-a55b";
      }
    }
  } else {
    if (provider === 'nvidia-nemotron') {
      if (!selectedModel || selectedModel === 'nvidia-nemotron') {
        selectedModel = "nvidia/llama-3.3-nemotron-super-49b-v1";
      }
    } else if (provider === 'nvidia-nemotron-ultra' || provider === 'groq-qwen') {
      if (!selectedModel || selectedModel === 'nvidia-nemotron-ultra' || selectedModel === 'groq-qwen') {
        selectedModel = "nvidia/nemotron-3-ultra-550b-a55b";
      }
    }
  }

  if (!apiKey) {
    const keyName = (provider === 'nvidia-nemotron' || provider === 'nvidia-nemotron-ultra' || provider === 'groq-qwen') ? 'NVIDIA_API_KEY' : 'GROQ_API_KEY';
    throw new Error(`API key (${keyName}) for ${provider} is not configured in settings or environment. Please add it.`);
  }

  const payload: any = {
    model: selectedModel,
    messages,
    temperature: 0.7,
  };

  if (provider === 'nvidia-nemotron') {
    payload.temperature = 0.6;
    payload.top_p = 0.95;
    payload.max_tokens = 16384;
    payload.frequency_penalty = 0;
    payload.presence_penalty = 0;
  } else if (provider === 'nvidia-nemotron-ultra' || provider === 'groq-qwen') {
    payload.temperature = 0.7;
    payload.top_p = 0.95;
    payload.max_tokens = 16384;
  }

  // Let the prompt dictate JSON mode, do not force it which causes issues with certain models on openrouter

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
