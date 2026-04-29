import axios from 'axios';

export type AIProvider = 'llama-primary' | 'llama-secondary' | 'groq-qwen' | 'groq-vision';

export const callMultiAi = async (provider: AIProvider, messages: any[], model?: string) => {
  try {
    const response = await axios.post(`/api/ai/${provider}`, { messages, model });
    return response.data.choices[0].message.content;
  } catch (error: any) {
    const backendError = error.response?.data?.error || {};
    const status = error.response?.status;
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
    console.error("OCR error:", error);
    throw new Error("OCR failed");
  }
};
