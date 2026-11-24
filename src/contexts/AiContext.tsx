import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AI_PROVIDERS,
  AIProvider,
  DEFAULT_AI_PROVIDER,
  DEFAULT_VISION_PROVIDER,
  VISION_PROVIDERS,
  VisionProvider,
  LEGACY_PROVIDER_TARGET,
  isLegacyProvider,
  normalizeProviderId,
} from '../lib/aiModels';

// The frozen provider ids live in exactly one place — `src/lib/aiModels.ts`
// (see AGENTS.md §1). Do not inline them here.
export type { AIProvider } from '../lib/aiModels';
export type TTSProvider = 'browser' | 'groq-whisper' | 'huggingface' | 'google-tts';
/** Vision/OCR engines (Super VL → Llama Vision → Gemini → OCR.space). */
export type OCRProvider = VisionProvider;
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
const VALID_OCR: readonly VisionProvider[] = VISION_PROVIDERS;
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
      // Retired Qwen ids migrate to DeepSeek V4.1 Flash so a stale saved
      // setting can never start a request on the removed engine.
      if (saved && isLegacyProvider(saved)) {
        localStorage.setItem('eduai_provider', LEGACY_PROVIDER_TARGET);
        return LEGACY_PROVIDER_TARGET;
      }
      if (saved && VALID_PROVIDERS.includes(saved as AIProvider)) {
        return saved as AIProvider;
      }
      // Fresh installs start on the PRIMARY reasoning engine (Nemotron 3 Ultra).
      return DEFAULT_AI_PROVIDER;
    } catch (e) {
      return DEFAULT_AI_PROVIDER;
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
      return saved && VALID_OCR.includes(saved) ? saved : DEFAULT_VISION_PROVIDER;
    } catch {
      return DEFAULT_VISION_PROVIDER;
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

  // Guard at the setter boundary too: any old caller passing a Qwen id gets
  // normalised to DeepSeek rather than storing an unusable provider.
  const setSafeProvider = (next: AIProvider) => setProvider(normalizeProviderId(next));

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
    <AiContext.Provider value={{ provider, setProvider: setSafeProvider, ttsProvider, setTtsProvider, ocrProvider, setOcrProvider, imageProvider, setImageProvider }}>
      {children}
    </AiContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) throw new Error('useAi must be used within an AiProvider');
  return context;
};
