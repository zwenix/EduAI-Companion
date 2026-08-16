/**
 * EduAI Companion - Multi-Provider Image Generation System
 *
 * Provider chain is user-selectable (Settings → Creative Image Generator) and
 * degrades gracefully:
 *   perchance (browser only) → gemini (backend or baked-in client key) → pollinations
 *
 * IMPORTANT (Android / Capacitor): the native APK ships without the Node
 * backend, and Capacitor's local server answers unknown routes such as
 * `/api/...` with a 200 HTML page. Any provider that depends on the backend
 * must therefore be skipped on native, otherwise images silently resolve to
 * HTML and render as broken placeholders. Perchance is also skipped on native
 * because its cross-origin iframe bridge never resolves inside the WebView and
 * would block every illustration for 15s before falling through.
 */

import { generatePerchanceImageClient } from '../services/perchanceService';
import { callGeminiClientDirect } from '../services/geminiClient';
import { isNativeApp } from './platform';

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

/** Direct, dependency-free image URL — works on web AND inside the APK. */
export const buildPollinationsUrl = (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 100000)
): string => {
  const cleanPrompt = prompt.length > 1000 ? `${prompt.substring(0, 997)}...` : prompt;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=turbo&enhance=true`;
};

/**
 * URL to use directly inside an `<img src>` (no async round trip).
 * Web keeps the backend proxy (it bypasses school-network filters); the native
 * app has no backend, so it points straight at the public image API.
 */
export const buildDirectImageUrl = (
  prompt: string,
  width: number = 800,
  height: number = 600,
  seed: number = Math.floor(Math.random() * 100000)
): string => {
  if (isNativeApp()) return buildPollinationsUrl(prompt, width, height, seed);
  return `/api/image-proxy?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}`;
};

export const generateImageGemini = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<string> => {
  // Native app: no backend to proxy through — use the client SDK directly.
  if (isNativeApp()) {
    const data = await callGeminiClientDirect('generate-image', { prompt, width, height });
    if (data?.imageUrl) return data.imageUrl;
    throw new Error('No image URL returned from client-side Gemini engine');
  }

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
    console.error('Gemini image generation failed (backend), trying client-side engine:', error);
    try {
      const data = await callGeminiClientDirect('generate-image', { prompt, width, height });
      if (data.imageUrl) return data.imageUrl;
    } catch (clientErr) {
      console.error('Client-side Gemini image generation failed:', clientErr);
    }
    throw error;
  }
};

export const generateImagePerchance = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  // The Perchance bridge relies on a cross-origin iframe + postMessage, which
  // is not reachable from the Capacitor WebView.
  if (isNativeApp()) {
    throw new Error('Perchance is not available in the native app');
  }

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
  const imageUrl = buildPollinationsUrl(prompt, width, height, seed);

  // Verify the image loads by creating a temporary image object. If the probe
  // cannot run (or stalls), still hand back the URL — the <img> tag itself will
  // retry the fetch and Android is far more tolerant than the probe.
  if (typeof Image === 'undefined') return imageUrl;

  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve(imageUrl);
    img.onload = done;
    img.onerror = done;
    setTimeout(done, 25000);
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

  const native = isNativeApp();

  const preferredProvider = typeof window !== 'undefined'
    ? window.localStorage.getItem('eduai_image_provider') || (native ? 'gemini-imagen' : 'perchance')
    : 'perchance';

  // Normalise the stored settings value onto the internal provider ids.
  const normalise = (p: string): 'perchance' | 'gemini' | 'pollinations' =>
    p === 'gemini-imagen' || p === 'gemini' ? 'gemini'
      : p === 'pollinations' ? 'pollinations'
        : 'perchance';

  const preferred = normalise(preferredProvider);

  // Honour the user's choice first, then walk the remaining providers.
  const defaultOrder: Array<'perchance' | 'gemini' | 'pollinations'> = ['perchance', 'gemini', 'pollinations'];
  let order = [preferred, ...defaultOrder.filter((p) => p !== preferred)];

  // Perchance cannot work inside the APK — drop it so images are not delayed.
  if (native) order = order.filter((p) => p !== 'perchance');

  console.log(`[Image Gen] Preferred provider: ${preferred}${native ? ' (native app)' : ''} | chain: ${order.join(' → ')}`);

  for (const prov of order) {
    if (prov === 'perchance') {
      try {
        console.log('[Image Gen] Attempting Perchance...');
        const imageUrl = await generateImagePerchance(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'perchance', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Perchance failed, trying next fallback...', error);
      }
    } else if (prov === 'gemini') {
      try {
        console.log('[Image Gen] Attempting Gemini...');
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Gemini failed, trying next fallback...', error);
      }
    } else if (prov === 'pollinations') {
      try {
        console.log('[Image Gen] Attempting Pollinations...');
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Pollinations failed.', error);
      }
    }
  }

  // Absolute fallback: Direct Pollinations URL if all promises reject
  console.log('[Image Gen] All providers failed. Defaulting to Pollinations direct URL...');

  return {
    url: buildPollinationsUrl(styledPrompt, width, height, seed),
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
  enhanceEducationalImagePrompt,
  buildDirectImageUrl,
  buildPollinationsUrl
};
