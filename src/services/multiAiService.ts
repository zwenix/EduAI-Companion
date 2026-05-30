import axios from 'axios';

export type AIProvider = 'qwen-primary' | 'qwen-secondary' | 'alibaba-qwen' | 'groq-vision';

const executeClientMultiAi = async (provider: AIProvider, messages: any[], model?: string) => {
  let url = "";
  let apiKey = "";
  let selectedModel = model;

  if (provider === 'qwen-primary' || provider === 'qwen-secondary') {
    url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
    apiKey = (process.env as any).ALIBABA_API_KEY || (import.meta as any).env?.VITE_ALIBABA_API_KEY || (process.env as any).GROQ_API_KEY || (import.meta as any).env?.VITE_GROQ_API_KEY || "";
    if (!selectedModel) {
      selectedModel = provider === 'qwen-primary' ? "qwen-plus" : "qwen-max";
    }
  } else if (provider === 'groq-vision') {
    url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
    apiKey = (process.env as any).ALIBABA_API_KEY || (import.meta as any).env?.VITE_ALIBABA_API_KEY || "";
    if (!selectedModel) {
      selectedModel = "qwen-max";
    }
  } else if (provider === 'alibaba-qwen') {
    url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
    apiKey = (process.env as any).ALIBABA_API_KEY || (import.meta as any).env?.VITE_ALIBABA_API_KEY || "";
    if (!selectedModel) {
      selectedModel = "qwen-max";
    }
  }

  if (selectedModel === "qwen3.6-plus") {
    selectedModel = "qwen-plus";
  } else if (selectedModel === "qwen3.7-max") {
    selectedModel = "qwen-max";
  }

  if (!apiKey) {
    throw new Error(`API key for ${provider} is not configured in settings or environment. Please add it to your server/Vercel settings.`);
  }

  const response = await axios.post(
    url,
    {
      model: selectedModel,
      messages,
      temperature: 0.7,
      max_completion_tokens: 8192,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  return response.data.choices[0].message.content;
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
  try {
    const response = await axios.post(`/api/ai/${provider}`, { messages, model });
    return response.data.choices[0].message.content;
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 404 || !error.response) {
      console.warn(`Express backend /api/ai/${provider} returned 404. Running direct browser fallback...`);
      return await executeClientMultiAi(provider, messages, model);
    }

    const backendError = error.response?.data?.error || {};
    const errorMsg = typeof backendError === 'string' ? backendError : backendError?.message || '';

    // Instead of console.error, console.warn since we expect to fallback gracefully.
    if (status) {
      console.warn(`[multiAiService] API issue with ${provider} (Status: ${status}): ${errorMsg || 'Unknown Error'}`);
    } else {
      console.warn(`[multiAiService] Error with ${provider}:`, error.message);
    }
    
    if (status === 402 || errorMsg.includes('credit balance is too low') || errorMsg.includes('Insufficient Balance')) {
      throw new Error(`Insufficient Balance: Your ${provider} account needs a top-up to continue.`);
    }
    
    if (status === 401) {
      throw new Error(`Unauthorized (401): Your ${provider} API key is invalid or has expired. Please check your AI Studio settings and ensure the key has no trailing spaces.`);
    }

    throw new Error(errorMsg || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError)) || `Failed to call ${provider} (Status: ${status || 'Unknown'})`);
  }
};

export const performOCR = async (base64Image: string, language: string = 'eng') => {
  try {
    const response = await axios.post('/api/ocr', { image: base64Image, language });
    if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      return response.data.ParsedResults[0].ParsedText;
    }
    return "";
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 404 || !error.response) {
      console.warn(`Express backend /api/ocr returned 404. Running direct browser fallback...`);
      return await executeClientOCR(base64Image, language);
    }
    console.error("OCR error:", error);
    throw new Error("OCR failed");
  }
};
