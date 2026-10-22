/**
 * EduAI Companion — Multi-Provider Image Generation System
 *
 * Provider priority (identical on web AND inside the Android APK):
 *   1. FLUX.1-schnell (Hugging Face Inference) — free, open-weights model
 *   2. Pollinations AI                          — keyless, always-on fallback
 *   3. Google Imagen / Gemini                   — secondary, own API key
 *
 * A deliberate provider choice in Settings can make Pollinations or Gemini the
 * first attempt, but the fallback graph below stays fixed and every provider
 * stays reachable.
 *
 * REMOVED (22 Oct 2026):
 *   • Perchance — perchance.org now sends `X-Frame-Options: SAMEORIGIN` and
 *     serves a Cloudflare challenge, so the hidden-iframe engine can never
 *     load. Any iframe/postMessage/DOM-driver approach is dead by design.
 *   • Qwen-Image on NVIDIA NIM — `qwen/qwen-image` and `qwen/qwen-image-2512`
 *     both 404 at the NVIDIA gateway. FLUX.1-schnell replaces it: it is a
 *     free, Apache-2.0, text-to-image model that renders the bright 3D
 *     children's-book style this app asks for.
 */

import { callGeminiClientDirect } from '../services/geminiClient';
import { isNativeApp } from './platform';
import { AI_SECRETS } from './aiSecrets';
import {
  DEFAULT_IMAGE_PROVIDER,
  FLUX_CONFIG,
  IMAGE_PROVIDER_FALLBACKS,
  IMAGE_PROVIDER_PRIORITY,
  POLLINATIONS_FALLBACK_MODEL,
  POLLINATIONS_MODEL,
  getImageProviderOrder,
  normaliseFluxSize,
  normaliseImageProviderId,
  type ImageProviderId,
  type ImageProviderSetting
} from './imageProviders';

// The provider registry lives in `./imageProviders` so the Express API and the
// React client share one table. Re-exported here for existing imports.
export {
  DEFAULT_IMAGE_PROVIDER,
  FLUX_CONFIG,
  IMAGE_PROVIDER_ALIASES,
  IMAGE_PROVIDER_FALLBACKS,
  IMAGE_PROVIDER_PRIORITY,
  POLLINATIONS_FALLBACK_MODEL,
  POLLINATIONS_MODEL,
  getImageProviderOrder,
  normaliseImageProviderId,
  normaliseFluxSize,
  fluxModels,
  type ImageProviderId,
  type ImageProviderSetting
} from './imageProviders';

export interface ImageGenerationResult {
  url: string;
  provider: 'flux' | 'gemini' | 'pollinations';
  prompt: string;
  width: number;
  height: number;
  model?: string;
  enhancedPrompt?: string;
}

/**
 * Requested render boxes per aspect ratio (FLUX clamps these onto its own
 * 64 px grid in `fluxDimensions`).
 */
const ASPECT_RATIOS = {
  square: { width: 1024, height: 1024 },
  video: { width: 1024, height: 576 },
  portrait: { width: 768, height: 1024 },
  landscape: { width: 1024, height: 768 }
};

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


export function enhancePromptForSA(prompt: string, grade?: string, subject?: string): string {
  const gradeContext = grade ? ` for ${grade}` : '';
  const subjectContext = subject ? ` ${subject}` : '';
  return `${prompt}

Style: Clean flat vector illustration, educational poster design, ${gradeContext ? `suitable for ${grade}` : 'classroom-ready'}.
South African school context — diverse learners representing South Africa's rainbow nation, inclusive, culturally sensitive.
Bright colours suitable${gradeContext}. White or light background, professional educational material quality.
All text in the image must be clearly legible, correctly spelled, in English.
No photorealistic elements, no low-quality clipart, no watermarks.
Age-appropriate, inclusive, and culturally sensitive.${subjectContext ? ` Subject: ${subjectContext}.` : ''}
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
  seed: number = Math.floor(Math.random() * 100000),
  model: string = POLLINATIONS_MODEL
): string => {
  const cleanPrompt = prompt.length > 1000 ? `${prompt.substring(0, 997)}...` : prompt;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${encodeURIComponent(model)}&enhance=true`;
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

/* ── FLUX.1-schnell (Hugging Face) ─────────────────────────────────────────── */

/** Which free backend rendered the image (both serve FLUX.1-schnell). */
export type FluxBackend = 'huggingface' | 'cloudflare';

export interface FluxImageResult {
  url: string;
  model: string;
  backend: FluxBackend;
}

/** Human-readable engine label for the UI badge and generated-file metadata. */
export const describeFluxBackend = (backend?: FluxBackend): string =>
  backend === 'cloudflare'
    ? 'FLUX.1-schnell · Cloudflare Workers AI'
    : 'FLUX.1-schnell · Hugging Face';

const fluxPrompt = (prompt: string, grade?: string, subject?: string, saContext = true): string => {
  let enhanced = saContext ? enhancePromptForSA(prompt, grade, subject) : prompt;
  const styleSuffix = ', Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours';
  if (!enhanced.toLowerCase().includes('disney 3d animation character')) {
    enhanced += styleSuffix;
  }
  return enhanced;
};

const fluxDimensions = (width: number, height: number, placement?: string): { width: number; height: number; size: string } => {
  // Placement wins; otherwise clamp the requested box onto FLUX's 64 px grid.
  const size = normaliseFluxSize(placement ? FLUX_CONFIG.sizeMap[placement] : `${width}x${height}`);
  const [w, h] = size.split('x').map(Number);
  return { width: w, height: h, size };
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the generated image'));
    reader.readAsDataURL(blob);
  });

/** Marks an error as "this engine will not work in this deployment". */
const providerUnavailable = (message: string): Error => {
  const err = new Error(message);
  (err as any).providerUnavailable = true;
  return err;
};

// A missing HUGGINGFACE_API_KEY (or a laptop/APK build without one) will not
// fix itself, so FLUX is skipped for the rest of the session after the first
// "not configured" answer. This keeps batch illustration generation from
// paying a round-trip per image.
let fluxDisabledForSession = false;

export const resetFluxAvailability = (): void => {
  fluxDisabledForSession = false;
};

export const isFluxAvailable = (): boolean => !fluxDisabledForSession;

export const generateImageFlux = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  options: {
    grade?: string;
    subject?: string;
    placement?: string;
    saContext?: boolean;
  } = {}
): Promise<FluxImageResult> => {
  const { grade, subject, placement, saContext = true } = options;
  const enhancedPrompt = fluxPrompt(prompt, grade, subject, saContext);
  const { width: w, height: h, size } = fluxDimensions(width, height, placement);

  console.log(
    `[Image Gen] FLUX.1-schnell request: "${enhancedPrompt.substring(0, 60)}..." | size: ${size} | grade: ${grade || 'N/A'}`
  );

  if (isNativeApp()) {
    // No backend behind the APK WebView — call the HF router directly. Hugging
    // Face's inference router is CORS-enabled for browser clients.
    const hfKey = String(AI_SECRETS.HUGGINGFACE_API_KEY || '').trim();
    if (!hfKey) {
      fluxDisabledForSession = true;
      throw providerUnavailable(
        'FLUX.1-schnell needs a Hugging Face key; none is bundled in this APK build'
      );
    }

    let lastError = 'No FLUX model available';
    for (const model of FLUX_CONFIG.models) {
      try {
        const response = await fetch(`${FLUX_CONFIG.routerBaseUrl}/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hfKey}`
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: { width: w, height: h }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `FLUX ${model} failed (${response.status}): ${errText.slice(0, 200)}`;
          console.warn(`[Image Gen] ${lastError}`);
          if (response.status === 401 || response.status === 403) {
            fluxDisabledForSession = true;
            throw providerUnavailable(`Hugging Face rejected the API key (HTTP ${response.status})`);
          }
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          const errText = await response.text();
          lastError = `FLUX ${model} returned ${contentType || 'no content-type'}: ${errText.slice(0, 200)}`;
          console.warn(`[Image Gen] ${lastError}`);
          continue;
        }

        const dataUrl = await blobToDataUrl(await response.blob());
        if (dataUrl) return { url: dataUrl, model, backend: 'huggingface' };
        lastError = `FLUX ${model} returned an empty image`;
      } catch (err: any) {
        if (err?.providerUnavailable) throw err;
        lastError = err?.message || String(err);
        console.warn(`[Image Gen] FLUX direct attempt failed (${model}):`, err);
      }
    }
    throw new Error(lastError);
  }

  const response = await fetch(buildApiUrl('/api/images/flux-generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: enhancedPrompt,
      width: w,
      height: h,
      size,
      placement,
      grade,
      subject
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({} as any));
    if (errData?.configured === false || response.status === 501) {
      fluxDisabledForSession = true;
      throw providerUnavailable(
        errData?.error || 'FLUX.1-schnell is not configured on this deployment (HUGGINGFACE_API_KEY missing)'
      );
    }
    throw new Error(errData?.error || `FLUX backend failed: ${response.status}`);
  }

  const data = await response.json().catch(() => ({} as any));
  const backend: FluxBackend = data?.backend === 'cloudflare' ? 'cloudflare' : 'huggingface';
  if (data?.url) return { url: data.url, model: data.model || FLUX_CONFIG.model, backend };
  if (data?.b64_json) {
    return { url: `data:image/png;base64,${data.b64_json}`, model: data.model || FLUX_CONFIG.model, backend };
  }
  throw new Error('No image payload in the FLUX backend response');
};

/* ── Pollinations AI (keyless) ─────────────────────────────────────────────── */

/** Resolves once the browser has actually decoded the image. */
const probeImageUrl = (url: string, timeoutMs = 30000): Promise<string> => {
  if (typeof Image === 'undefined') return Promise.resolve(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Pollinations AI image request timed out'));
    }, timeoutMs);

    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(url);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(new Error('Pollinations AI image request failed'));
    };
    img.src = url;
  });
};

export const generateImagePollinations = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  // 1. Direct `flux` render, 2. one retry with a fresh seed (transient 429s),
  // 3. the same-origin proxy if the browser blocked image.pollinations.ai
  //    directly (ad blockers / school filters are the usual culprits), and
  //    finally 4. the lighter `turbo` model.
  const candidates = [
    buildPollinationsUrl(prompt, width, height, seed, POLLINATIONS_MODEL),
    buildPollinationsUrl(prompt, width, height, seed + 1, POLLINATIONS_MODEL),
    buildDirectImageUrl(prompt, width, height, seed + 2),
    buildPollinationsUrl(prompt, width, height, seed + 3, POLLINATIONS_FALLBACK_MODEL)
  ];

  let lastError: Error = new Error('Pollinations AI image request failed');
  for (const [index, url] of candidates.entries()) {
    try {
      return await probeImageUrl(url);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Image Gen] Pollinations attempt ${index + 1}/${candidates.length} failed: ${lastError.message}`
      );
      // Small pause between attempts so a rate-limit window can clear.
      if (index < candidates.length - 1) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastError;
};

/* ── Batch helper (SA content pipeline) ────────────────────────────────────── */

export async function generateAllEducationalImages(
  specs: Array<{ imageId: string; sectionId: number; prompt: string; placement: string; altText?: string }>,
  grade: string,
  subject?: string,
  concurrency: number = 2
): Promise<Array<{ imageId: string; sectionId: number; url: string; altText?: string; success: boolean }>> {
  console.log(`[Image Gen] Generating ${specs.length} images with concurrency ${concurrency}...`);
  const results: Array<{ imageId: string; sectionId: number; url: string; altText?: string; success: boolean }> = [];

  for (let i = 0; i < specs.length; i += concurrency) {
    const batch = specs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (spec) => {
        try {
          // Walk the full provider graph — a single dead engine must never
          // leave a section without an illustration.
          const result = await generateImageWithFallback({
            prompt: spec.prompt,
            width: 1024,
            height: 1024,
            grade,
            subject,
            placement: spec.placement as ImageGenerationOptions['placement'],
            saContext: true
          });
          return { imageId: spec.imageId, sectionId: spec.sectionId, url: result.url, altText: spec.altText, success: true };
        } catch (e: any) {
          console.warn(`[Image Gen] Failed ${spec.imageId}: ${e?.message || e}`);
          return { imageId: spec.imageId, sectionId: spec.sectionId, url: '', altText: spec.altText, success: false };
        }
      })
    );
    results.push(...batchResults);
    if (i + concurrency < specs.length) {
      // Rate-limit pause between batches (free tiers).
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const ok = results.filter(r => r.success).length;
  console.log(`[Image Gen] Completed: ${ok}/${specs.length} successful`);
  return results;
}

/* ── Provider chain ────────────────────────────────────────────────────────── */

export const generateImageWithFallback = async (
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> => {
  const { prompt, aspectRatio = 'square', grade, subject, saContext = true, placement } = options;
  const dimensions = ASPECT_RATIOS[aspectRatio];
  const width = options.width || dimensions.width;
  const height = options.height || dimensions.height;
  const seed = options.seed ?? Math.floor(Math.random() * 10000);

  let styledPrompt = prompt;
  const styleSuffix = ', Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours';
  const lowerPrompt = styledPrompt.toLowerCase();
  if (styledPrompt && (!lowerPrompt.includes('disney 3d animation character') || !lowerPrompt.includes('3d cute icon'))) {
    styledPrompt += styleSuffix;
  }

  const native = isNativeApp();
  const preferred = normaliseImageProviderId(
    typeof window !== 'undefined' ? window.localStorage.getItem('eduai_image_provider') : null
  );
  const order = getImageProviderOrder(preferred);

  console.log(
    `[Image Gen] Provider priority: ${IMAGE_PROVIDER_PRIORITY.join(' → ')} | selected: ${preferred}${native ? ' (native app)' : ''} | fallback chain: ${order.join(' → ')} | SA context: ${saContext}`
  );

  for (const prov of order) {
    if (prov === 'flux') {
      if (fluxDisabledForSession) {
        console.log('[Image Gen] FLUX.1-schnell is unavailable in this session; skipping.');
        continue;
      }
      try {
        const role = preferred === 'flux' ? 'Primary' : 'Fallback';
        console.log(`[Image Gen] Attempting FLUX.1-schnell (Hugging Face) (${role}) — SA-enhanced...`);
        const result = await generateImageFlux(styledPrompt, width, height, {
          grade,
          subject,
          placement: placement || aspectRatio,
          saContext
        });
        return {
          url: result.url,
          provider: 'flux',
          prompt: styledPrompt,
          width,
          height,
          model: describeFluxBackend(result.backend),
          enhancedPrompt: saContext ? enhancePromptForSA(styledPrompt, grade, subject) : styledPrompt
        };
      } catch (error: any) {
        if (error?.providerUnavailable) {
          fluxDisabledForSession = true;
        }
        console.warn('[Image Gen] FLUX.1-schnell failed; continuing...', error?.message || error);
      }
    } else if (prov === 'pollinations') {
      try {
        const role = preferred === 'pollinations' ? 'Keyless primary' : 'Keyless fallback';
        console.log(`[Image Gen] Attempting Pollinations AI (${role})...`);
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height, model: POLLINATIONS_MODEL };
      } catch (error: any) {
        console.warn('[Image Gen] Pollinations AI failed; continuing...', error?.message || error);
      }
    } else if (prov === 'gemini') {
      try {
        const role = preferred === 'gemini' ? 'Secondary' : 'Final recovery';
        console.log(`[Image Gen] Attempting Gemini/Imagen (${role})...`);
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height, model: 'imagen-3' };
      } catch (error: any) {
        console.warn('[Image Gen] Gemini/Imagen failed; continuing...', error?.message || error);
      }
    }
  }

  console.log('[Image Gen] All provider attempts failed. Returning a direct Pollinations URL so the image can still resolve lazily...');
  return {
    url: buildPollinationsUrl(styledPrompt, width, height, seed),
    provider: 'pollinations',
    prompt: styledPrompt,
    width,
    height,
    model: POLLINATIONS_MODEL
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
Optimized for ${FLUX_CONFIG.model} — clear, legible, educational poster design.`;
};

export default {
  generateImageWithFallback,
  generateImageGemini,
  generateImageFlux,
  generateImagePollinations,
  generateAllEducationalImages,
  enhanceEducationalImagePrompt,
  enhancePromptForSA,
  normaliseImageProviderId,
  buildDirectImageUrl,
  buildPollinationsUrl,
  buildApiUrl,
  FLUX_CONFIG
};
