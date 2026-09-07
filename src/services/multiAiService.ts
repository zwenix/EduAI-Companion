import axios from 'axios';
import { checkAndReportApiError } from '../lib/apiErrorHelper';
import { AI_SECRETS } from '../lib/aiSecrets';
import { isNativeApp } from '../lib/platform';
import {
  ALIBABA_DEFAULT_BASE_URL,
  TextEngineId,
  buildChatPayload,
  buildFallbackChain,
  extractMessageText,
  getEngine,
  isNvidiaEngine,
  normalizeEngineId,
} from '../lib/aiModels';

export type AIProvider = TextEngineId;

/**
 * Resolve the credential for an engine. Order of preference:
 *   1. Vite build-time env (VITE_*)
 *   2. Node/Define-injected process.env
 *   3. Locally stored override (Settings → API keys)
 *   4. Baked-in key (Android APK, where there is no backend to proxy)
 */
const readEnv = (name: string): string => {
  try {
    const viteEnv = (import.meta as any)?.env || {};
    const nodeEnv = (typeof process !== 'undefined' ? (process as any).env : {}) || {};
    return String(viteEnv[`VITE_${name}`] || viteEnv[name] || nodeEnv[name] || '').trim();
  } catch {
    return '';
  }
};

const readLocalOverride = (keys: string[]): string => {
  try {
    if (typeof localStorage === 'undefined') return '';
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) return value.trim();
    }
  } catch {
    /* localStorage unavailable (SSR / privacy mode) */
  }
  return '';
};

const resolveEngineKey = (engineId: TextEngineId): string => {
  const engine = getEngine(engineId);
  const clean = (v: string) => v.replace(/^['"\s]+|['"\s]+$/g, '');

  if (isNvidiaEngine(engineId)) {
    return clean(
      readEnv('NVIDIA_API_KEY') ||
        readLocalOverride(['eduai_nvidia_key', 'nvidia_api_key']) ||
        AI_SECRETS.NVIDIA_API_KEY ||
        ''
    );
  }

  if (engine.id === 'alibaba-qwen') {
    return clean(
      readEnv('ALIBABA_API_KEY') ||
        readEnv('DASHSCOPE_API_KEY') ||
        readLocalOverride(['eduai_alibaba_key', 'alibaba_api_key']) ||
        AI_SECRETS.ALIBABA_API_KEY ||
        ''
    );
  }

  return clean(readEnv('GEMINI_API_KEY') || AI_SECRETS.GEMINI_API_KEY || '');
};

const resolveEngineBaseUrl = (engineId: TextEngineId): string => {
  const engine = getEngine(engineId);
  if (engine.id === 'alibaba-qwen') {
    const override = readEnv('ALIBABA_API_BASE') || readEnv('DASHSCOPE_BASE_URL');
    return (override || ALIBABA_DEFAULT_BASE_URL).replace(/\/+$/, '');
  }
  if (isNvidiaEngine(engineId)) {
    const override = readEnv('NVIDIA_API_BASE');
    return (override || engine.baseUrl).replace(/\/+$/, '');
  }
  return engine.baseUrl.replace(/\/+$/, '');
};

interface CallOptions {
  model?: string;
  reasoning?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Direct browser → provider call (used by the Android APK, and as a rescue
 * path when the Express proxy is unreachable).
 */
const executeClientMultiAi = async (
  provider: AIProvider | string,
  messages: any[],
  options: CallOptions = {}
): Promise<string> => {
  const engineId = normalizeEngineId(provider) || 'alibaba-qwen';
  const engine = getEngine(engineId);
  const apiKey = resolveEngineKey(engineId);

  if (!apiKey) {
    throw new Error(
      `API key (${engine.keyName}) for ${engine.label} is not configured in settings or environment. Please add it.`
    );
  }

  const url = `${resolveEngineBaseUrl(engineId)}/chat/completions`;
  const payload = buildChatPayload(engineId, messages, {
    model: options.model,
    reasoning: options.reasoning,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });

  const response = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 180000,
  });

  return extractMessageText(response.data?.choices?.[0]?.message);
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

/**
 * Call a text engine.
 *
 * Web  → POST /api/ai/:provider (the Express proxy keeps keys server-side and
 *        owns the Gemini safety net).
 * APK  → direct provider call, walking the engine's own fallback chain
 *        (e.g. Nemotron Ultra → Nemotron Lightning → Qwen) before surfacing an
 *        error so unifiedAiService can hand over to Gemini.
 */
export const callMultiAi = async (
  provider: AIProvider,
  messages: any[],
  model?: string,
  options: CallOptions = {}
) => {
  const engineId = normalizeEngineId(provider) || 'gemini';

  // Native app: no backend — call the provider APIs directly.
  if (isNativeApp()) {
    const chain = buildFallbackChain(engineId).filter((id) => id !== 'gemini');
    let lastErr: any = null;
    for (const candidate of chain) {
      try {
        const text = await executeClientMultiAi(candidate, messages, { ...options, model: candidate === engineId ? model : undefined });
        if (text && text.trim()) return text;
      } catch (clientErr: any) {
        lastErr = clientErr;
        console.log(`[AI Routing] Native client call for ${candidate} failed, trying next engine in the chain.`);
      }
    }
    console.log(`[AI Routing] All native engines exhausted for ${engineId}, transitioning to Gemini fallback.`);
    throw lastErr || new Error(`No native engine available for ${engineId}`);
  }

  try {
    const response = await axios.post(`/api/ai/${engineId}`, {
      messages,
      model,
      ...(typeof options.reasoning === 'boolean' ? { reasoning: options.reasoning } : {}),
      ...(typeof options.temperature === 'number' ? { temperature: options.temperature } : {}),
      ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
    });
    return extractMessageText(response.data?.choices?.[0]?.message);
  } catch (error: any) {
    const status = error.response?.status;
    const backendError = error.response?.data?.error || {};
    const errorMsg = typeof backendError === 'string' ? backendError : backendError?.message || error?.message || '';

    console.log(`[AI Routing] Provider ${engineId} unavailable or transitioned (Status: ${status || 'Network'}). Seamlessly routing to Gemini.`);
    throw new Error(`Provider ${engineId} unavailable, transitioning to Gemini fallback: ${errorMsg}`);
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

/**
 * Multimodal call for Nemotron 3 Nano Omni — accepts images (and, on the NIM
 * endpoint, audio/video frames) alongside text. Used by the OCR / marking and
 * document-intelligence paths.
 */
export const callOmniVision = async (
  messages: any[],
  options: CallOptions = {}
): Promise<string> => {
  const engineId: TextEngineId = 'nvidia-nemotron-3-omni';
  if (isNativeApp()) {
    return await executeClientMultiAi(engineId, messages, options);
  }
  const response = await axios.post(`/api/ai/${engineId}`, {
    messages,
    ...(typeof options.reasoning === 'boolean' ? { reasoning: options.reasoning } : {}),
  });
  return extractMessageText(response.data?.choices?.[0]?.message);
};
