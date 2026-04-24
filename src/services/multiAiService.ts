import axios from 'axios';

export type AIProvider = 'deepseek' | 'groq' | 'mistral' | 'anthropic' | 'fireworks';

export const callMultiAi = async (provider: AIProvider, messages: any[], model?: string) => {
  try {
    if (provider === 'anthropic') {
      const response = await axios.post('/api/anthropic', { messages, model });
      return response.data.content[0].text;
    } else {
      const response = await axios.post(`/api/ai/${provider}`, { messages, model });
      return response.data.choices[0].message.content;
    }
  } catch (error: any) {
    console.error(`Error with ${provider}:`, error);
    const backendError = error.response?.data?.error || {};
    const status = error.response?.status;
    const errorMsg = typeof backendError === 'string' ? backendError : backendError?.message || '';
    
    if (status === 402 || errorMsg.includes('credit balance is too low') || errorMsg.includes('Insufficient Balance')) {
      throw new Error(`Insufficient Balance: Your ${provider} account needs a top-up to continue.`);
    }
    
    if (status === 401) {
      throw new Error(`Unauthorized: Your ${provider} API key is invalid or has expired.`);
    }

    throw new Error(errorMsg || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError)) || `Failed to call ${provider} (Status: ${status || 'Unknown'})`);
  }
};

export const performOCR = async (base64Image: string) => {
  try {
    const response = await axios.post('/api/ocr', { image: base64Image });
    if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      return response.data.ParsedResults[0].ParsedText;
    }
    return "";
  } catch (error: any) {
    console.error("OCR error:", error);
    throw new Error("OCR failed");
  }
};

export const generateSpeech = async (text: string, voiceId?: string) => {
  try {
    const response = await axios.post('/api/tts', { text, voiceId }, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  } catch (error: any) {
    console.error("TTS error:", error);
    throw new Error("Text-to-speech failed");
  }
};
