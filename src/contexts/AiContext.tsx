import React, { createContext, useContext, useState, useEffect } from 'react';
import { AI_PROVIDERS, AIProvider, PRIMARY_REASONING_PROVIDER, isLegacyProvider } from '../lib/aiModels';

// The five frozen provider ids live in exactly one place — `src/lib/aiModels.ts`
// (see AGENTS.md §1). Do not inline them here.
export type { AIProvider } from '../lib/aiModels';
export type TTSProvider = 'browser' | 'groq-whisper' | 'huggingface' | 'google-tts';
// OCR/Vision engine options: `nvidia-vision` (NVIDIA NIM Vision/OCR chain —
// Nemotron 3.5 Super-VL → Llama 3.2 90B Vision), `gemini` (Google Gemini
// multimodal OCR/Imaging) and `ocrspace` (OCR.space). `gemini` previously
// meant the vision engine; that value migrates to `nvidia-vision` on read so
// existing users keep their current engine.
export type OCRProvider = 'nvidia-vision' | 'gemini' | 'ocrspace';
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
const VALID_OCR: OCRProvider[] = ['nvidia-vision', 'gemini', 'ocrspace'];
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
      // Migrate retired provider ids to the primary reasoning engine
      // (Nemotron 3 Ultra). `nvidia-nemotron-ultra` (and the nano/lightning
      // ids) are ACTIVE NVIDIA NIM providers — they must never be remapped
      // away from NVIDIA NIM.
      if (isLegacyProvider(saved)) {
        localStorage.setItem('eduai_provider', PRIMARY_REASONING_PROVIDER);
        return PRIMARY_REASONING_PROVIDER;
      }
      if (saved && VALID_PROVIDERS.includes(saved as AIProvider)) {
        return saved as AIProvider;
      }
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
      // Migrate the pre-migration `gemini` value (which meant the NVIDIA
      // Vision/OCR engine) to `nvidia-vision` so existing users keep the same
      // engine; `gemini` now explicitly selects Google Gemini OCR/Imaging.
      if (saved === 'gemini') {
        localStorage.setItem('eduai_ocr_provider', 'nvidia-vision');
        return 'nvidia-vision';
      }
      return saved && VALID_OCR.includes(saved) ? saved : 'nvidia-vision';
    } catch {
      return 'nvidia-vision';
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
