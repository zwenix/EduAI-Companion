import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AI_PROVIDERS,
  AIProvider,
  PRIMARY_REASONING_PROVIDER,
  PRIMARY_VISION_PROVIDER,
  VISION_PROVIDER_CHAIN,
  isLegacyProvider,
  legacyProviderTarget,
  type OcrProvider,
} from '../lib/aiModels';

// The five frozen provider ids live in exactly one place — `src/lib/aiModels.ts`
// (see AGENTS.md §1). Do not inline them here.
export type { AIProvider } from '../lib/aiModels';
export type TTSProvider = 'browser' | 'groq-whisper' | 'huggingface' | 'google-tts';
// OCR / vision engines come from the frozen vision chain in the registry
// (Nemotron 3.5 Super VL → Gemini multimodal → Llama 3.2 90B Vision → OCR.space).
export type OCRProvider = OcrProvider;
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
const VALID_OCR: OCRProvider[] = [...VISION_PROVIDER_CHAIN];
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
      // Retired ids (Qwen 3.8 Max, Groq-era aliases) now mean the NVIDIA NIM
      // DeepSeek engine. Active NIM ids are never remapped.
      if (isLegacyProvider(saved)) {
        const migrated = legacyProviderTarget();
        localStorage.setItem('eduai_provider', migrated);
        return migrated as AIProvider;
      }
      if (saved && VALID_PROVIDERS.includes(saved as AIProvider)) {
        return saved as AIProvider;
      }
      // Nemotron 3 Ultra is the primary reasoning engine for lesson plans,
      // assessments and learner diagnosis (24 Nov 2026).
      return PRIMARY_REASONING_PROVIDER;
    } catch (e) {
      return PRIMARY_REASONING_PROVIDER;
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
      if (saved && VALID_OCR.includes(saved)) return saved;
      // Anything else (retired or unknown) starts the frozen vision chain at
      // its head — the user's saved "gemini"/"ocrspace" values still resolve,
      // because both remain members of that chain.
      return PRIMARY_VISION_PROVIDER;
    } catch {
      return PRIMARY_VISION_PROVIDER;
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
