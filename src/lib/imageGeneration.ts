/**
 * EduAI Companion - Multi-Provider Image Generation System
 * Priority: Gemini (Primary) -> Perchance (Secondary) -> Pollinations (Tertiary)
 */

export interface ImageGenerationResult {
  url: string;
  provider: 'gemini' | 'perchance' | 'pollinations';
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

/**
 * Generate image using Gemini API (Primary)
 */
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
        input: {
          prompt,
          width,
          height,
          model: 'imagen-3'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error('No image URL returned from Gemini');
    }

    return data.imageUrl;
  } catch (error) {
    console.error('Gemini image generation failed:', error);
    throw error;
  }
};

/**
 * Generate image using Perchance API (Secondary)
 */
export const generateImagePerchance = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    // Use backend proxy to avoid CORS
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider: 'perchance',
        width,
        height,
        seed
      })
    });

    if (!response.ok) {
      throw new Error(`Perchance API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('No image URL returned from Perchance');
    }

    return data.url;
  } catch (error) {
    console.error('Perchance image generation failed:', error);
    throw error;
  }
};

/**
 * Generate image using Pollinations API (Tertiary/Fallback)
 */
export const generateImagePollinations = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    // Use backend proxy to avoid CORS
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider: 'pollinations',
        width,
        height,
        seed
      })
    });

    if (!response.ok) {
      throw new Error(`Pollinations API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('No image URL returned from Pollinations');
    }

    return data.url;
  } catch (error) {
    console.error('Pollinations image generation failed:', error);
    throw error;
  }
};

/**
 * Main image generation function with fallback chain
 */
export const generateImageWithFallback = async (
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> => {
  const { prompt, aspectRatio = 'square' } = options;
  const dimensions = ASPECT_RATIOS[aspectRatio];
  const width = options.width || dimensions.width;
  const height = options.height || dimensions.height;
  const seed = options.seed ?? Math.floor(Math.random() * 10000);

  // Retrieve preferred provider from local storage
  const preferredProvider = typeof window !== 'undefined'
    ? window.localStorage.getItem('eduai_image_provider') || 'gemini-imagen'
    : 'gemini-imagen';

  console.log(`Preferred image provider from settings: ${preferredProvider}`);

  // Determine fallback order based on user preference
  const order: Array<'gemini' | 'perchance' | 'pollinations'> = [];
  if (preferredProvider === 'perchance') {
    order.push('perchance', 'gemini', 'pollinations');
  } else if (preferredProvider === 'pollinations') {
    order.push('pollinations', 'perchance', 'gemini');
  } else {
    // gemini-imagen or default
    order.push('gemini', 'perchance', 'pollinations');
  }

  for (const prov of order) {
    if (prov === 'gemini') {
      try {
        console.log('Attempting Gemini image generation...');
        const imageUrl = await generateImageGemini(prompt, width, height);
        return {
          url: imageUrl,
          provider: 'gemini',
          prompt,
          width,
          height
        };
      } catch (error) {
        console.warn('Gemini failed, trying next fallback...');
      }
    } else if (prov === 'perchance') {
      try {
        console.log('Attempting Perchance image generation...');
        const imageUrl = await generateImagePerchance(prompt, width, height, seed);
        return {
          url: imageUrl,
          provider: 'perchance',
          prompt,
          width,
          height
        };
      } catch (error) {
        console.warn('Perchance failed, trying next fallback...');
      }
    } else if (prov === 'pollinations') {
      try {
        console.log('Using Pollinations image generation...');
        const imageUrl = await generateImagePollinations(prompt, width, height, seed);
        return {
          url: imageUrl,
          provider: 'pollinations',
          prompt,
          width,
          height
        };
      } catch (error) {
        console.warn('Pollinations failed, trying next fallback...');
      }
    }
  }

  // Fallback to Pollinations directly if everything somehow fails
  console.log('All attempted image providers failed. Defaulting to Pollinations...');
  const imageUrl = await generateImagePollinations(prompt, width, height, seed);
  return {
    url: imageUrl,
    provider: 'pollinations',
    prompt,
    width,
    height
  };
};

/**
 * Enhance prompt for educational image generation
 */
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

  const phase = getPhaseByGrade(grade);
  
  return `Educational illustration for South African Grade ${grade} ${subject}: ${topic}. 
${context || ''}. 
Style: ${phaseGuidance[phase] || phaseGuidance['Intermediate Phase']}. 
High quality, classroom-ready, culturally appropriate, no text overlays, professional educational resource.`;
};

function getPhaseByGrade(grade: string): string {
  if (!grade) return 'Intermediate Phase';
  const numGrade = parseInt(grade.replace(/\D/g, '')) || 0;
  if (grade === 'R' || grade.includes('Reception') || numGrade <= 3) return 'Foundation Phase';
  if (numGrade <= 6) return 'Intermediate Phase';
  if (numGrade <= 9) return 'Senior Phase';
  return 'FET Phase';
}

export default {
  generateImageWithFallback,
  generateImageGemini,
  generateImagePerchance,
  generateImagePollinations,
  enhanceEducationalImagePrompt
};
