/**
 * EduAI Companion - Multi-Provider Image Generation System
 *
 * Provider priority (identical on web AND inside the Android APK):
 *   1. Perchance AI             (primary → Pollinations AI)
 *   2. Google Imagen / Gemini   (secondary → Pollinations AI)
 *   3. Pollinations AI          (tertiary → Perchance AI)
 *
 * The default starts with Perchance. A deliberate provider choice in Settings
 * can make Gemini or Pollinations the first attempt, but the provider-specific
 * fallback graph remains fixed and every provider stays available. Perchance
 * is never dropped on native.
 *
 * IMPORTANT (Android / Capacitor): the native APK ships without the Node
 * backend, and Capacitor's local server answers unknown routes such as
 * `/api/...` with a 200 HTML page. Any provider that depends on the backend is
 * therefore routed to the hosted backend through an absolute URL on native,
 * while the web app keeps using same-origin relative paths.
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

export type ImageProviderId = 'perchance' | 'gemini' | 'pollinations';

/**
 * Provider roles and their explicit first fallback. The second entry in each
 * list is a final recovery path so a manually selected provider can still use
 * the complete pipeline without creating a retry loop.
 */
export const IMAGE_PROVIDER_PRIORITY: readonly ImageProviderId[] = [
  'perchance',
  'gemini',
  'pollinations'
];

export const IMAGE_PROVIDER_FALLBACKS: Record<ImageProviderId, readonly ImageProviderId[]> = {
  perchance: ['pollinations', 'gemini'],
  gemini: ['pollinations', 'perchance'],
  pollinations: ['perchance', 'gemini']
};

export const getImageProviderOrder = (preferred: ImageProviderId): ImageProviderId[] => [
  preferred,
  ...IMAGE_PROVIDER_FALLBACKS[preferred]
];

const ASPECT_RATIOS = {
  square: { width: 1024, height: 1024 },
  video: { width: 1024, height: 576 },
  portrait: { width: 768, height: 1024 },
  landscape: { width: 1024, height: 768 }
};

/**
 * Hosted backend origin used by the native APK (no local Node backend). The web
 * app talks to its own origin via relative paths; the APK points here so
 * backend-backed providers (Perchance proxy, Gemini proxy) still resolve.
 */
export const NATIVE_BACKEND_BASE = 'https://eduai-companion.vercel.app';

/** Resolve an API path against the right origin for the current runtime. */
export const buildApiUrl = (path: string): string => {
  if (isNativeApp()) return `${NATIVE_BACKEND_BASE.replace(/\/$/, '')}${path}`;
  return path;
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
    const response = await fetch(buildApiUrl('/api/gemini/action'), {
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
  // Perchance is the PRIMARY generator on every platform and is attempted via
  // the real client-side iframe bridge. If the bridge is unavailable, this
  // function throws so the explicit outer fallback goes to Pollinations AI.
  // Keeping the hand-off here explicit prevents a Pollinations response from
  // being misreported as a successful Perchance generation.
  try {
    if (typeof window !== 'undefined') {
      try {
        // Native WebViews can be slow to settle the cross-origin iframe; give it
        // a shorter window so the chain falls through without a long stall.
        const clientUrl = await generatePerchanceImageClient(
          prompt, width, height, seed, isNativeApp() ? 6000 : 15000
        );
        if (clientUrl) return clientUrl;
      } catch (clientErr) {
        console.warn('Perchance client-side iframe generation timed out or failed, handing off to Pollinations AI...', clientErr);
      }
    }

    // Do not disguise a Pollinations response as Perchance. Let the outer
    // provider graph perform the explicit Perchance → Pollinations fallback.
    throw new Error('Perchance AI is unavailable; use the Pollinations AI fallback');
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

  // Verify the image loads before reporting success. A failed or timed-out
  // probe rejects so the configured next provider can take over.
  if (typeof Image === 'undefined') return imageUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Pollinations AI image request timed out'));
    }, 25000);

    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(imageUrl);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(new Error('Pollinations AI image request failed'));
    };
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
  const styleSuffix = ", Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours";
  const lowerPrompt = styledPrompt.toLowerCase();
  if (styledPrompt && (!lowerPrompt.includes("disney 3d animation character") || !lowerPrompt.includes("3d cute icon"))) {
    styledPrompt += styleSuffix;
  }

  const native = isNativeApp();

  // Perchance is the default/primary generator on every platform.
  const preferredProvider = typeof window !== 'undefined'
    ? window.localStorage.getItem('eduai_image_provider') || 'perchance'
    : 'perchance';

  // Normalise the stored settings value onto the internal provider ids. The
  // default remains Perchance, while a deliberate Settings selection can make
  // Gemini or Pollinations the first attempt for that request.
  const normalise = (p: string): ImageProviderId =>
    p === 'gemini-imagen' || p === 'gemini' ? 'gemini'
      : p === 'pollinations' ? 'pollinations'
        : 'perchance';

  const preferred = normalise(preferredProvider);
  const order = getImageProviderOrder(preferred);

  console.log(`[Image Gen] Provider priority: ${IMAGE_PROVIDER_PRIORITY.join(' → ')} | selected: ${preferred}${native ? ' (native app)' : ''} | fallback chain: ${order.join(' → ')}`);

  for (const prov of order) {
    if (prov === 'perchance') {
      try {
        const role = preferred === 'perchance' ? 'Primary' : 'Fallback';
        console.log(`[Image Gen] Attempting Perchance AI (${role})...`);
        const imageUrl = await generateImagePerchance(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'perchance', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Perchance AI failed; continuing to its configured fallback...', error);
      }
    } else if (prov === 'gemini') {
      try {
        const role = preferred === 'gemini' ? 'Secondary' : 'Final Recovery';
        console.log(`[Image Gen] Attempting Gemini/Imagen (Google) (${role})...`);
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Gemini/Imagen failed; continuing to its configured fallback...', error);
      }
    } else if (prov === 'pollinations') {
      try {
        const role = preferred === 'pollinations' ? 'Tertiary' : 'Fallback';
        console.log(`[Image Gen] Attempting Pollinations AI (${role})...`);
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Pollinations AI failed; continuing to its configured fallback...', error);
      }
    }
  }

  // Absolute network-safe fallback. At this point both the configured primary
  // provider and its fallback path have failed, so return a direct Pollinations
  // URL for the <img> element to retry rather than leaving a blank asset.
  console.log('[Image Gen] All provider attempts failed. Returning a direct Pollinations AI URL...');

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
  buildPollinationsUrl,
  buildApiUrl
};
