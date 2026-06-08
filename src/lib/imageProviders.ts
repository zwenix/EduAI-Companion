import { ImageProvider } from '../contexts/AiContext';

export interface ProviderConfig {
  name: ImageProvider;
  displayName: string;
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  description: string;
  priority: number; // Lower = higher priority
}

export const IMAGE_PROVIDERS: Record<ImageProvider, ProviderConfig> = {
  'pollinations-flux': {
    name: 'pollinations-flux',
    displayName: 'Pollinations FLUX (Recommended)',
    requiresApiKey: false,
    description: 'Free, highly reliable, no API key required',
    priority: 1
  },
  'pollinations-turbo': {
    name: 'pollinations-turbo',
    displayName: 'Pollinations Turbo',
    requiresApiKey: false,
    description: 'Ultra-fast inference speed, free',
    priority: 2
  },
  'pollinations-schnell': {
    name: 'pollinations-schnell',
    displayName: 'Pollinations Schnell',
    requiresApiKey: false,
    description: 'Optimized speed & quality, free',
    priority: 3
  },
  'pollinations-klein': {
    name: 'pollinations-klein',
    displayName: 'Pollinations FLUX Pro',
    requiresApiKey: false,
    description: 'High fidelity detailing, free',
    priority: 4
  },
  'gemini-imagen': {
    name: 'gemini-imagen',
    displayName: 'Google Gemini Imagen 3',
    requiresApiKey: true,
    apiKeyEnvVar: 'GEMINI_API_KEY',
    description: 'Immersive, high-quality illustrations from Google',
    priority: 5
  },
  'qwen-image-2.0-pro': {
    name: 'qwen-image-2.0-pro',
    displayName: 'Qwen Image 2.0 Pro',
    requiresApiKey: true,
    apiKeyEnvVar: 'QWEN_API_KEY',
    description: 'Professional quality illustration engine from Alibaba',
    priority: 6
  },
  'wan2.1-t2i-plus': {
    name: 'wan2.1-t2i-plus',
    displayName: 'Wan 2.1 Text-to-Image Plus',
    requiresApiKey: true,
    apiKeyEnvVar: 'QWEN_API_KEY',
    description: 'State-of-the-art Chinese model suite from Alibaba',
    priority: 7
  },
  'qwen-image-2512': {
    name: 'qwen-image-2512',
    displayName: 'Qwen Image 2512 via NVIDIA',
    requiresApiKey: true,
    apiKeyEnvVar: 'NVIDIA_API_KEY',
    description: 'NVIDIA NIM-hosted visual illustration generator',
    priority: 8
  },
  'huggingface': {
    name: 'huggingface',
    displayName: 'Hugging Face FLUX',
    requiresApiKey: true,
    apiKeyEnvVar: 'HUGGINGFACE_API_KEY',
    description: 'FLUX.1-schnell hosted via Hugging Face Hub',
    priority: 9
  }
};

export function getAvailableProviders(): ImageProvider[] {
  return Object.values(IMAGE_PROVIDERS)
    .sort((a, b) => a.priority - b.priority)
    .map(p => p.name);
}

export function getDefaultProvider(): ImageProvider {
  return 'pollinations-flux';
}
