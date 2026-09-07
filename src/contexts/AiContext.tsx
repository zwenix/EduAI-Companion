import React, { createContext, useContext, useState, useEffect } from 'react';
import { TEXT_ENGINE_ORDER, TextEngineId, normalizeEngineId } from '../lib/aiModels';

export type AIProvider = TextEngineId;
export type TTSProvider = 'browser' | 'groq-whisper' | 'huggingface' | 'google-tts';
export type OCRProvider = 'gemini' | 'ocrspace' | 'nemotron-omni';
export type ImageProvider = 'gemini-imagen' | 'perchance' | 'pollinations' | 'qwen' | 'qwen-image';

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

const VALID_PROVIDERS: AIProvider[] = [...TEXT_ENGINE_ORDER];
const VALID_TTS: TTSProvider[] = ['browser', 'groq-whisper', 'huggingface', 'google-tts'];
const VALID_OCR: OCRProvider[] = ['gemini', 'ocrspace', 'nemotron-omni'];
const VALID_IMAGE: ImageProvider[] = ['gemini-imagen', 'perchance', 'pollinations', 'qwen', 'qwen-image'];

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_provider');
      // Upgrade any historical id (retired NVIDIA/Groq slugs) to a current engine.
      const normalized = normalizeEngineId(saved);
      if (normalized) {
        if (normalized !== saved) localStorage.setItem('eduai_provider', normalized);
        return normalized;
      }
      return 'gemini';
    } catch (e) {
      return 'gemini';
    }
  });

  const [ttsProvider, setTtsProvider] = useState<TTSProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_tts_provider') as TTSProvider;
      return saved && VALID_TTS.includes(saved) ? saved : 'groq-whisper';
    } catch {
      return 'groq-whisper';
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
    // Perchance is the PRIMARY image generator on every platform. Its first
    // fallback is Pollinations AI; Gemini/Imagen remains the secondary choice.
    const fallback: ImageProvider = 'perchance';
    try {
      const saved = localStorage.getItem('eduai_image_provider') as any;
      return saved && VALID_IMAGE.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
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
