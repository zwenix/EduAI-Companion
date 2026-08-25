/**
 * EduAI Companion - Multi-Provider Image Generation System
 *
 * Provider priority (identical on web AND inside the Android APK):
 *   1. Perchance AI             (primary → Qwen → Pollinations → Gemini)
 *   2. Qwen-Image (NVIDIA NIM)  (premium SA-context → Pollinations)
 *   3. Google Imagen / Gemini   (secondary → Pollinations AI)
 *   4. Pollinations AI          (tertiary fallback)
 *
 * The default starts with Perchance. A deliberate provider choice in Settings
 * can make Qwen, Gemini, or Pollinations the first attempt, but the provider-specific
 * fallback graph remains fixed and every provider stays available.
 *
 * NEW: Qwen-Image via NVIDIA NIM (model qwen/qwen-image) provides SA-context
 * enhanced educational visuals with superior text rendering and cultural accuracy.
 */

import { generatePerchanceImageClient } from '../services/perchanceService';
import { callGeminiClientDirect } from '../services/geminiClient';
import { isNativeApp } from './platform';
import { AI_SECRETS } from './aiSecrets';

export interface ImageGenerationResult {
  url: string;
  provider: 'perchance' | 'gemini' | 'pollinations' | 'qwen';
  prompt: string;
  width: number;
  height: number;
  model?: string;
  enhancedPrompt?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  model?: string;
  seed?: number;
  grade?: string;
  subject?: string;
  saContext?: boolean;
  placement?: 'header' | 'inline' | 'full_width' | 'sidebar';
}

export type ImageProviderId = 'perchance' | 'gemini' | 'pollinations' | 'qwen';

export const IMAGE_PROVIDER_PRIORITY: readonly ImageProviderId[] = [
  'perchance',
  'qwen',
  'gemini',
  'pollinations'
];

export const IMAGE_PROVIDER_FALLBACKS: Record<ImageProviderId, readonly ImageProviderId[]> = {
  perchance: ['qwen', 'pollinations', 'gemini'],
  qwen: ['pollinations', 'gemini', 'perchance'],
  gemini: ['pollinations', 'perchance', 'qwen'],
  pollinations: ['perchance', 'qwen', 'gemini']
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

export const QWEN_CONFIG = {
  model: "qwen/qwen-image",
  baseURL: "https://integrate.api.nvidia.com/v1",
  sizeMap: {
    header: "1792x1024",
    full_width: "1792x1024",
    inline: "1024x1024",
    sidebar: "1024x1792",
    square: "1024x1024",
    portrait: "1024x1792",
    landscape: "1792x1024",
    video: "1792x1024"
  } as Record<string, string>
};

export function enhancePromptForSA(prompt: string, grade?: string, subject?: string): string {
  const gradeContext = grade ? ` for ${grade}` : "";
  const subjectContext = subject ? ` ${subject}` : "";
  return `${prompt}

Style: Clean flat vector illustration, educational poster design, ${gradeContext ? `suitable for ${grade}` : "classroom-ready"}.
South African school context — diverse learners representing South Africa's rainbow nation, inclusive, culturally sensitive.
Bright colours suitable${gradeContext}. White or light background, professional educational material quality.
All text in the image must be clearly legible, correctly spelled, in English.
No photorealistic elements, no low-quality clipart, no watermarks.
Age-appropriate, inclusive, and culturally sensitive.${subjectContext ? ` Subject: ${subjectContext}.` : ""}
SA elements: Table Mountain, Kruger wildlife, local flora (protea, fynbos) where relevant.
Ultra-detailed digital illustration, 300 DPI print quality, award-winning children's non-fiction book style.`;
}

export const NATIVE_BACKEND_BASE = 'https://eduai-companion.vercel.app';

export const buildApiUrl = (path: string): string => {
  if (isNativeApp()) return `${NATIVE_BACKEND_BASE.replace(/\/$/, '')}${path}`;
  return path;
};

export const buildPollinationsUrl = (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 100000)
): string => {
  const cleanPrompt = prompt.length > 1000 ? `${prompt.substring(0, 997)}...` : prompt;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=turbo&enhance=true`;
};

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
  try {
    if (typeof window !== 'undefined') {
      try {
        const clientUrl = await generatePerchanceImageClient(
          prompt, width, height, seed, isNativeApp() ? 6000 : 15000
        );
        if (clientUrl) return clientUrl;
      } catch (clientErr) {
        console.warn('Perchance client-side iframe generation timed out or failed, handing off...', clientErr);
      }
    }
    throw new Error('Perchance AI is unavailable; use fallback');
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
  const imageUrl = buildPollinationsUrl(prompt, width, height, seed);
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

export const generateImageQwen = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  options: {
    grade?: string;
    subject?: string;
    placement?: string;
    seed?: number;
    saContext?: boolean;
  } = {}
): Promise<string> => {
  const { grade, subject, placement = 'square', saContext = true } = options;
  let enhancedPrompt = saContext ? enhancePromptForSA(prompt, grade, subject) : prompt;
  const styleSuffix = ", Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours";
  if (!enhancedPrompt.toLowerCase().includes("disney 3d animation character")) {
    enhancedPrompt += styleSuffix;
  }
  const sizeKey = placement || 'square';
  const sizeStr = QWEN_CONFIG.sizeMap[sizeKey] || `${width}x${height}`;

  console.log(`[Image Gen] Qwen-Image request: "${enhancedPrompt.substring(0, 60)}..." | size: ${sizeStr} | grade: ${grade || 'N/A'}`);

  if (isNativeApp()) {
    try {
      const nvidiaKey = AI_SECRETS.NVIDIA_API_KEY || "";
      if (!nvidiaKey) throw new Error("NVIDIA API key not configured for Qwen-Image");
      const response = await fetch(`${QWEN_CONFIG.baseURL}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: QWEN_CONFIG.model,
          prompt: enhancedPrompt,
          n: 1,
          size: sizeStr as any,
          response_format: "b64_json"
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Qwen NVIDIA API failed ${response.status}: ${errText.slice(0, 200)}`);
      }
      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error("No b64_json in Qwen response");
      return `data:image/png;base64,${b64}`;
    } catch (err) {
      console.error("[Image Gen] Qwen direct API failed:", err);
      throw err;
    }
  }

  try {
    const response = await fetch(buildApiUrl('/api/images/qwen-generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        width,
        height,
        placement: sizeKey,
        grade,
        subject,
        model: QWEN_CONFIG.model
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Qwen backend failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.url) return data.url;
    if (data.imageUrl) return data.imageUrl;
    if (data.b64_json) return `data:image/png;base64,${data.b64_json}`;
    if (data.b64) return `data:image/png;base64,${data.b64}`;
    throw new Error("No image URL or b64 in Qwen backend response");
  } catch (backendErr) {
    console.warn("[Image Gen] Qwen backend failed, trying direct NVIDIA API as fallback:", backendErr);
    try {
      const nvidiaKey = (typeof window !== 'undefined' ? (window as any).__NVIDIA_KEY__ : null) || AI_SECRETS.NVIDIA_API_KEY || "";
      let key = nvidiaKey;
      if (!key && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('eduai_nvidia_key') || localStorage.getItem('nvidia_api_key');
          if (stored) key = stored;
        } catch {}
      }
      if (!key) throw backendErr;
      const response = await fetch(`${QWEN_CONFIG.baseURL}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: QWEN_CONFIG.model,
          prompt: enhancedPrompt,
          n: 1,
          size: sizeStr as any,
          response_format: "b64_json"
        })
      });
      if (!response.ok) throw new Error(`Qwen direct fallback failed ${response.status}`);
      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error("No b64 in direct Qwen fallback");
      return `data:image/png;base64,${b64}`;
    } catch (directErr) {
      console.error("[Image Gen] Qwen direct fallback also failed:", directErr);
      throw backendErr;
    }
  }
};

export async function generateAllQwenImages(
  specs: Array<{ imageId: string; sectionId: number; prompt: string; placement: string; altText?: string }>,
  grade: string,
  subject?: string,
  concurrency: number = 2
): Promise<Array<{ imageId: string; sectionId: number; url: string; altText?: string; success: boolean }>> {
  console.log(`[Qwen] Generating ${specs.length} images with concurrency ${concurrency}...`);
  const results: Array<{ imageId: string; sectionId: number; url: string; altText?: string; success: boolean }> = [];
  for (let i = 0; i < specs.length; i += concurrency) {
    const batch = specs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (spec) => {
        try {
          const url = await generateImageQwen(spec.prompt, 1024, 1024, {
            grade,
            subject,
            placement: spec.placement,
            saContext: true
          });
          return { imageId: spec.imageId, sectionId: spec.sectionId, url, altText: spec.altText, success: true };
        } catch (e: any) {
          console.warn(`[Qwen] Failed ${spec.imageId}: ${e.message}`);
          return { imageId: spec.imageId, sectionId: spec.sectionId, url: "", altText: spec.altText, success: false };
        }
      })
    );
    results.push(...batchResults);
    if (i + concurrency < specs.length) {
      console.log("[Qwen] Rate limit pause (2s)...");
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  const ok = results.filter(r => r.success).length;
  console.log(`[Qwen] Completed: ${ok}/${specs.length} successful`);
  return results;
}

export const generateImageWithFallback = async (
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> => {
  const { prompt, aspectRatio = 'square', grade, subject, saContext = true, placement } = options;
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
  const preferredProvider = typeof window !== 'undefined'
    ? window.localStorage.getItem('eduai_image_provider') || 'perchance'
    : 'perchance';

  const normalise = (p: string): ImageProviderId => {
    if (p === 'gemini-imagen' || p === 'gemini') return 'gemini';
    if (p === 'pollinations') return 'pollinations';
    if (p === 'qwen' || p === 'qwen-image' || p === 'nvidia-qwen') return 'qwen';
    return 'perchance';
  };

  const preferred = normalise(preferredProvider);
  const order = getImageProviderOrder(preferred);

  console.log(`[Image Gen] Provider priority: ${IMAGE_PROVIDER_PRIORITY.join(' → ')} | selected: ${preferred}${native ? ' (native app)' : ''} | fallback chain: ${order.join(' → ')} | SA context: ${saContext}`);

  for (const prov of order) {
    if (prov === 'perchance') {
      try {
        const role = preferred === 'perchance' ? 'Primary' : 'Fallback';
        console.log(`[Image Gen] Attempting Perchance AI (${role})...`);
        const imageUrl = await generateImagePerchance(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'perchance', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Perchance AI failed; continuing...', error);
      }
    } else if (prov === 'qwen') {
      try {
        const role = preferred === 'qwen' ? 'Premium SA' : 'Fallback';
        console.log(`[Image Gen] Attempting Qwen-Image (NVIDIA NIM) (${role}) — SA-enhanced...`);
        const imageUrl = await generateImageQwen(styledPrompt, width, height, {
          grade,
          subject,
          placement: placement || aspectRatio,
          saContext
        });
        return { url: imageUrl, provider: 'qwen', prompt: styledPrompt, width, height, model: QWEN_CONFIG.model, enhancedPrompt: saContext ? enhancePromptForSA(styledPrompt, grade, subject) : styledPrompt };
      } catch (error) {
        console.warn('[Image Gen] Qwen-Image failed; continuing...', error);
      }
    } else if (prov === 'gemini') {
      try {
        const role = preferred === 'gemini' ? 'Secondary' : 'Final Recovery';
        console.log(`[Image Gen] Attempting Gemini/Imagen (${role})...`);
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Gemini/Imagen failed; continuing...', error);
      }
    } else if (prov === 'pollinations') {
      try {
        const role = preferred === 'pollinations' ? 'Tertiary' : 'Fallback';
        console.log(`[Image Gen] Attempting Pollinations AI (${role})...`);
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height };
      } catch (error) {
        console.warn('[Image Gen] Pollinations AI failed; continuing...', error);
      }
    }
  }

  console.log('[Image Gen] All provider attempts failed. Returning direct Pollinations URL...');
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
    'Foundation Phase': 'Simple, friendly, colorful illustration suitable for young learners, large friendly characters, high contrast',
    'Intermediate Phase': 'Engaging educational illustration with moderate detail, relatable SA scenarios',
    'Senior Phase': 'Professional educational diagram with clear visual hierarchy, conceptual depth',
    'FET Phase': 'Academic-quality illustration suitable for exam preparation, sophisticated visual metaphors'
  };

  const numGrade = parseInt(grade.replace(/\D/g, '')) || 0;
  let phase = 'Intermediate Phase';
  if (grade === 'R' || grade.includes('Reception') || numGrade <= 3) phase = 'Foundation Phase';
  else if (numGrade <= 6) phase = 'Intermediate Phase';
  else if (numGrade <= 9) phase = 'Senior Phase';
  else phase = 'FET Phase';

  const saEnhanced = enhancePromptForSA(`${topic}. ${context || ''}`, grade, subject);

  return `Educational illustration for South African Grade ${grade} ${subject}: ${topic}.
${context || ''}.
Style: ${phaseGuidance[phase] || phaseGuidance['Intermediate Phase']}.
${saEnhanced}
High quality, classroom-ready, culturally appropriate, no text overlays, professional educational resource, 300 DPI.
SA Context: Diverse learners representing rainbow nation, local landmarks (Table Mountain, Kruger), indigenous flora/fauna.
Optimized for ${QWEN_CONFIG.model} — clear, legible, educational poster design.`;
};

export default {
  generateImageWithFallback,
  generateImageGemini,
  generateImagePerchance,
  generateImagePollinations,
  generateImageQwen,
  generateAllQwenImages,
  enhanceEducationalImagePrompt,
  enhancePromptForSA,
  buildDirectImageUrl,
  buildPollinationsUrl,
  buildApiUrl,
  QWEN_CONFIG
};
