/**
 * EduAI Companion - Multi-Provider Image Generation System
 * UPDATED: Perchance is now the PRIMARY image generator, followed by Gemini, then Pollinations.
 */

import { generatePerchanceImageClient } from '../services/perchanceService';

export interface ImageGenerationResult {
  url: string;
  provider: 'perchance' | 'gemini' | 'pollinations';
  prompt: string;
  width: number;
  height: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  model?: string;
  seed?: number;
}

const ASPECT_RATIOS = {
  square: { width: 1024, height: 1024 },
  video: { width: 1024, height: 576 },
  portrait: { width: 768, height: 1024 },
  landscape: { width: 1024, height: 768 }
};

export const generateImageGemini = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate-image',
        input: { prompt, width, height, model: 'imagen-3' }
      })
    });

    if (!response.ok) throw new Error(`Gemini API failed: ${response.status}`);
    const data = await response.json();
    if (!data.imageUrl) throw new Error('No image URL returned from Gemini');
    return data.imageUrl;
  } catch (error) {
    console.error('Gemini image generation failed:', error);
    throw error;
  }
};

export const generateImagePerchance = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  try {
    if (typeof window !== 'undefined') {
      try {
        const clientUrl = await generatePerchanceImageClient(prompt, width, height, seed);
        if (clientUrl) return clientUrl;
      } catch (clientErr) {
        console.warn('Perchance client-side iframe generation timed out or failed, transitioning to backend proxy...', clientErr);
      }
    }
    
    // Fallback to backend proxy if client-side fails
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, provider: 'perchance', width, height, seed })
    });

    if (!response.ok) throw new Error(`Perchance API failed: ${response.status}`);
    const data = await response.json();
    if (!data.url) throw new Error('No image URL returned from Perchance');
    return data.url;
  } catch (error) {
    console.error('Perchance image generation failed:', error);
    throw error;
  }
};

export const generateImagePollinations = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  // Direct, reliable public API fallback that bypasses backend proxy issues entirely
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  
  // Verify the image loads by creating a temporary image object
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(imageUrl);
    img.onerror = () => reject(new Error("Pollinations image failed to load"));
    img.src = imageUrl;
  });
};

export const generateImageWithFallback = async (
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> => {
  const { prompt, aspectRatio = 'square' } = options;
  const dimensions = ASPECT_RATIOS[aspectRatio];
  const width = options.width || dimensions.width;
  const height = options.height || dimensions.height;
  const seed = options.seed ?? Math.floor(Math.random() * 10000);

  let styledPrompt = prompt;
  const styleSuffix = ", 3D vector, 3D cute icon, 3D animation Disney character style, educational, high quality, vibrant colors";
  if (styledPrompt && !styledPrompt.toLowerCase().includes("3d vector") && !styledPrompt.toLowerCase().includes("3d cute icon")) {
    styledPrompt += styleSuffix;
  }

  // UPDATED: Perchance is now the default and primary provider
  const preferredProvider = typeof window !== 'undefined'
    ? window.localStorage.getItem('eduai_image_provider') || 'perchance'
    : 'perchance';

  console.log(`[Image Gen] Preferred provider: ${preferredProvider}`);

  // UPDATED: Priority chain is now Perchance -> Gemini -> Pollinations
  const order: Array<'perchance' | 'gemini' | 'pollinations'> = ['perchance', 'gemini', 'pollinations'];

  for (const prov of order) {
    if (prov === 'perchance') {
      try {
        console.log('[Image Gen] Attempting Perchance (Primary)...');
        const imageUrl = await generateImagePerchance(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'perchance', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Perchance failed, trying next fallback...', error);
      }
    } else if (prov === 'gemini') {
      try {
        console.log('[Image Gen] Attempting Gemini (Secondary)...');
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Gemini failed, trying next fallback...', error);
      }
    } else if (prov === 'pollinations') {
      try {
        console.log('[Image Gen] Attempting Pollinations (Tertiary)...');
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Pollinations failed.', error);
      }
    }
  }

  // Absolute fallback: Direct Pollinations URL if all promises reject
  console.log('[Image Gen] All providers failed. Defaulting to Pollinations direct URL...');
  const encodedPrompt = encodeURIComponent(styledPrompt);
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  
  return {
    url: fallbackUrl,
    provider: 'pollinations',
    prompt: styledPrompt,
    width,
    height
  };
};

export const enhanceEducationalImagePrompt = (
  topic: string,
  grade: string,
  subject: string,
  context?: string
): string => {
  const phaseGuidance: Record<string, string> = {
    'Foundation Phase': 'Simple, friendly, colorful illustration suitable for young learners',
    'Intermediate Phase': 'Engaging educational illustration with moderate detail',
    'Senior Phase': 'Professional educational diagram with clear visual hierarchy',
    'FET Phase': 'Academic-quality illustration suitable for exam preparation'
  };

  const numGrade = parseInt(grade.replace(/\D/g, '')) || 0;
  let phase = 'Intermediate Phase';
  if (grade === 'R' || grade.includes('Reception') || numGrade <= 3) phase = 'Foundation Phase';
  else if (numGrade <= 6) phase = 'Intermediate Phase';
  else if (numGrade <= 9) phase = 'Senior Phase';
  else phase = 'FET Phase';

  return `Educational illustration for South African Grade ${grade} ${subject}: ${topic}.
${context || ''}.
Style: ${phaseGuidance[phase] || phaseGuidance['Intermediate Phase']}.
High quality, classroom-ready, culturally appropriate, no text overlays, professional educational resource.`;
};

export default {
  generateImageWithFallback,
  generateImageGemini,
  generateImagePerchance,
  generateImagePollinations,
  enhanceEducationalImagePrompt
};
