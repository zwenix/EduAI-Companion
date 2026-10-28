import React, { createContext, useContext, useState, useEffect } from 'react';
import { AI_PROVIDERS, AIProvider, isLegacyProvider } from '../lib/aiModels';

// The five frozen provider ids live in exactly one place — `src/lib/aiModels.ts`
// (see AGENTS.md §1). Do not inline them here.
export type { AIProvider } from '../lib/aiModels';
export type TTSProvider = 'browser' | 'groq-whisper' | 'huggingface' | 'google-tts';
export type OCRProvider = 'gemini' | 'ocrspace';
// Image engines. `perchance` is the Perchance Image API v1 browser engine
// (see src/services/perchanceClient.ts). `qwen`/`qwen-image` are RETIRED and
// migrate on read — never offered again.
export type ImageProvider = 'perchance' | 'flux' | 'pollinations' | 'gemini-imagen';

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

const VALID_PROVIDERS: readonly AIProvider[] = AI_PROVIDERS;
const VALID_TTS: TTSProvider[] = ['browser', 'groq-whisper', 'huggingface', 'google-tts'];
const VALID_OCR: OCRProvider[] = ['gemini', 'ocrspace'];
const VALID_IMAGE: ImageProvider[] = ['perchance', 'flux', 'pollinations', 'gemini-imagen'];
// Stored values from retired/renamed engines. `flux` (FLUX.1-schnell on Hugging
// Face) is the free replacement for the retired Qwen-Image.
const LEGACY_IMAGE_PROVIDERS: Record<string, ImageProvider> = {
  qwen: 'flux',
  'qwen-image': 'flux',
  'nvidia-qwen': 'flux',
  'hf-flux': 'flux',
  huggingface: 'flux',
  gemini: 'gemini-imagen',
  'google-imagen': 'gemini-imagen',
};

export const AiProvider = ({ children }: { children: React.ReactNode }) => {
  const [provider, setProvider] = useState<AIProvider>(() => {
    try {
      const saved = localStorage.getItem('eduai_provider');
      // Migrate only provider ids that are NOT active NIM models anymore.
      // `nvidia-nemotron-ultra` (and the nano/lightning ids) are ACTIVE NVIDIA
      // NIM providers again — they must never be remapped away from NVIDIA NIM.
      if (isLegacyProvider(saved)) {
        localStorage.setItem('eduai_provider', 'alibaba-qwen');
        return 'alibaba-qwen';
      }
      if (saved && VALID_PROVIDERS.includes(saved as AIProvider)) {
        return saved as AIProvider;
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
    // Perchance Image API v1 is the primary engine on every platform
    // (unlimited, keyless); FLUX.1-schnell, Imagen and keyless Pollinations
    // form the automatic fallback chain.
    const fallback: ImageProvider = 'perchance';
    try {
      const saved = localStorage.getItem('eduai_image_provider');
      if (!saved) return fallback;
      if (VALID_IMAGE.includes(saved as ImageProvider)) return saved as ImageProvider;
      const migrated = LEGACY_IMAGE_PROVIDERS[saved];
      if (migrated) {
        localStorage.setItem('eduai_image_provider', migrated);
        return migrated;
      }
      return fallback;
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
