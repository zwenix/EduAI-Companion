import React, { createContext, useContext, useState, useEffect } from 'react';

export type AIProvider = 'gemini' | 'llama-primary' | 'llama-secondary' | 'groq-qwen' | 'groq-vision';
export type TTSProvider = 'browser' | 'elevenlabs';
export type OCRProvider = 'gemini' | 'ocrspace';
export type ImageProvider = 'pollinations' | 'glm-image';

interface AiContextType {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  ttsProvider: TTSProvider;
  setTtsProvider: (provider: TTSProvider) => void;
  ocrProvider: OCRProvider;
  setOcrProvider: (provider: OCRProvider) => void;
  imageProvider: ImageProvider;
  setImageProvider: (provider: ImageProvider) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

const VALID_PROVIDERS: AIProvider[] = ['gemini', 'llama-primary', 'llama-secondary', 'groq-qwen', 'groq-vision'];
const VALID_TTS: TTSProvider[] = ['browser', 'elevenlabs'];
const VALID_OCR: OCRProvider[] = ['gemini', 'ocrspace'];
const VALID_IMAGE: ImageProvider[] = ['pollinations', 'glm-image'];

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_provider') as AIProvider;
      if (saved && VALID_PROVIDERS.includes(saved)) {
        return saved;
      }
      return 'llama-primary';
    } catch (e) {
      return 'llama-primary';
    }
  });

  const [ttsProvider, setTtsProvider] = useState<TTSProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_tts_provider') as TTSProvider;
      return saved && VALID_TTS.includes(saved) ? saved : 'browser';
    } catch {
      return 'browser';
    }
  });

  const [ocrProvider, setOcrProvider] = useState<OCRProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_ocr_provider') as OCRProvider;
      return saved && VALID_OCR.includes(saved) ? saved : 'gemini';
    } catch {
      return 'gemini';
    }
  });

  const [imageProvider, setImageProvider] = useState<ImageProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_image_provider') as ImageProvider;
      return saved && VALID_IMAGE.includes(saved) ? saved : 'pollinations';
    } catch {
      return 'pollinations';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduai_provider', provider);
      localStorage.setItem('eduai_tts_provider', ttsProvider);
      localStorage.setItem('eduai_ocr_provider', ocrProvider);
      localStorage.setItem('eduai_image_provider', imageProvider);
    } catch (e) {
      console.error('Failed to save provider to localStorage', e);
    }
  }, [provider, ttsProvider, ocrProvider, imageProvider]);

  return (
    <AiContext.Provider value={{ provider, setProvider, ttsProvider, setTtsProvider, ocrProvider, setOcrProvider, imageProvider, setImageProvider }}>
      {children}
    </AiContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) throw new Error('useAi must be used within an AiProvider');
  return context;
};
