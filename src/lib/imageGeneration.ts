/**
 * EduAI Companion - Multi-Provider Image Generation System
 *
 * Provider priority (identical on web AND inside the Android APK):
 *   1. Perchance AI             (PRIMARY   → falls back to Gemini / Imagen)
 *   2. Qwen-Image (NVIDIA NIM)  (SECONDARY → falls back to Gemini / Imagen)
 *   3. Google Imagen / Gemini   (TERTIARY  → falls back to Pollinations)
 *   4. Pollinations AI          (LAST      → falls back to Gemini / Imagen)
 *
 * The default starts with Perchance. A deliberate provider choice in Settings
 * can make Qwen, Gemini, or Pollinations the first attempt, but the
 * provider-specific fallback graph below stays fixed.
 *
 * Pollinations' free tier is rate-limited ("free limit reached"), which is why
 * it is the LAST resort in every chain except its own — it must never be the
 * first thing an illustration asks for.
 *
 * Qwen-Image via NVIDIA NIM provides SA-context enhanced educational visuals
 * with superior text rendering and cultural accuracy.
 */

import { generatePerchanceImageClient } from '../services/perchanceService';
import { callGeminiClientDirect } from '../services/geminiClient';
import { isNativeApp } from './platform';
import { AI_SECRETS } from './aiSecrets';

export interface ImageGenerationResult {
  url: string;
  provider: 'perchance' | 'gemini' | 'pollinations' | 'qwen' | 'cloudflare' | 'flux';
  prompt: string;
  width: number;
  height: number;
  model?: string;
  enhancedPrompt?: string;
  /** Every provider failed; `url` is an unverified direct Pollinations link. */
  isLastResort?: boolean;
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
  /** Ignore (and replace) any cached result — used when a cached URL failed to load. */
  skipCache?: boolean;
}

export type ImageProviderId = 'perchance' | 'gemini' | 'pollinations' | 'qwen' | 'cloudflare' | 'flux';

export const IMAGE_PROVIDER_PRIORITY: readonly ImageProviderId[] = [
  'perchance',
  'qwen',
  'gemini',
  // Free FLUX engines (server-side keys): Cloudflare Workers AI, then Hugging Face.
  'cloudflare',
  'flux',
  'pollinations'
];

// The required orders are unchanged — Perchance → Gemini/Imagen, Qwen → Gemini/
// Imagen, Gemini/Imagen → Pollinations, Pollinations → Gemini/Imagen. The two
// free FLUX engines (Cloudflare, then Hugging Face) are slotted in AFTER the
// required step of every chain, so they catch whatever the required providers
// could not produce before the chain ends on Pollinations.
export const IMAGE_PROVIDER_FALLBACKS: Record<ImageProviderId, readonly ImageProviderId[]> = {
  // Perchance (primary)   → Gemini/Imagen → Cloudflare FLUX → HF FLUX → Pollinations
  perchance: ['gemini', 'cloudflare', 'flux', 'pollinations'],
  // Qwen (secondary)      → Gemini/Imagen → Cloudflare FLUX → HF FLUX → Pollinations
  qwen: ['gemini', 'cloudflare', 'flux', 'pollinations'],
  // Gemini/Imagen (tertiary) → Cloudflare FLUX → HF FLUX → Pollinations
  gemini: ['cloudflare', 'flux', 'pollinations'],
  // Pollinations          → Gemini/Imagen → Cloudflare FLUX → HF FLUX
  pollinations: ['gemini', 'cloudflare', 'flux'],
  // Cloudflare FLUX       → HF FLUX → Gemini/Imagen → Pollinations
  cloudflare: ['flux', 'gemini', 'pollinations'],
  // Hugging Face FLUX     → Cloudflare FLUX → Gemini/Imagen → Pollinations
  flux: ['cloudflare', 'gemini', 'pollinations']
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
  // NVIDIA retires slugs (qwen/qwen-image → qwen/qwen-image-2512). The
  // preferred slug comes first; the legacy slug stays as a fallback.
  model: "qwen/qwen-image-2512",
  models: ["qwen/qwen-image-2512", "qwen/qwen-image"],
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
  // When every Gemini/Imagen model fails, the backend and the client engine
  // both answer with a raw Pollinations URL flagged `isFallback`. That is NOT a
  // Gemini image — accepting it would silently route traffic to the
  // rate-limited provider and skip the real chain — so treat it as a failure.
  const accept = (data: any): string | null => {
    if (!data?.imageUrl || data.isFallback) return null;
    return data.imageUrl as string;
  };

  if (isNativeApp()) {
    const data = await callGeminiClientDirect('generate-image', { prompt, width, height });
    const url = accept(data);
    if (url) return url;
    throw new Error('Gemini/Imagen produced no image (client-side engine)');
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
    const url = accept(await response.json());
    if (!url) throw new Error('Gemini/Imagen produced no image (backend)');
    return url;
  } catch (error) {
    console.error('Gemini image generation failed (backend), trying client-side engine:', error);
    try {
      const url = accept(await callGeminiClientDirect('generate-image', { prompt, width, height }));
      if (url) return url;
    } catch (clientErr) {
      console.error('Client-side Gemini image generation failed:', clientErr);
    }
    throw error;
  }
};

// Every Perchance request loads a full generator in a hidden iframe that runs the
// model in this browser, so cap how many run at once (each request has its own
// id, so replies cannot be mixed up).
const PERCHANCE_MAX_CONCURRENT = 2;
/** Timeout while Perchance has never worked this session (blocked frame = no reply). */
const PERCHANCE_FIRST_TRY_MS = 30000;
let perchanceActive = 0;
const perchanceWaiters: Array<() => void> = [];

const acquirePerchanceSlot = (): Promise<void> => {
  if (perchanceActive < PERCHANCE_MAX_CONCURRENT) {
    perchanceActive += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => perchanceWaiters.push(() => { perchanceActive += 1; resolve(); }));
};

const releasePerchanceSlot = () => {
  perchanceActive -= 1;
  perchanceWaiters.shift()?.();
};

export const generateImagePerchance = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Perchance AI is unavailable; use fallback');
  }

  await acquirePerchanceSlot();
  try {
    // Generation + Cloudflare check can take a while; give it room before the
    // chain moves on to Gemini.
    // Until Perchance has produced one image this session, give up quickly: if
    // Perchance refuses to be framed (X-Frame-Options) nothing ever comes
    // back, and waiting a full minute per illustration just stalls the document.
    const proven = providerHealth.perchance?.everWorked === true;
    const clientUrl = await generatePerchanceImageClient(
      prompt, width, height, seed, proven ? (isNativeApp() ? 45000 : 60000) : PERCHANCE_FIRST_TRY_MS
    );
    if (!clientUrl) throw new Error('Perchance AI returned no image');
    return clientUrl;
  } catch (clientErr) {
    console.warn('Perchance image generation timed out or failed, handing off...', clientErr);
    throw clientErr;
  } finally {
    releasePerchanceSlot();
  }
};

/**
 * Cloudflare Workers AI / Hugging Face FLUX.1-schnell, called through OUR backend
 * (`/api/images/flux-generate`) so the tokens never reach the browser. Resolves to
 * a `data:` URL. A missing/rejected token (HTTP 400/401/402) is flagged `fatal`,
 * which benches the provider at once instead of retrying a call that cannot work.
 */
export class FluxClientError extends Error {
  constructor(message: string, public readonly status: number, public readonly fatal: boolean) {
    super(message);
    this.name = 'FluxClientError';
  }
}

export const generateImageFlux = async (
  provider: 'cloudflare' | 'huggingface',
  prompt: string,
  width: number = 1024,
  height: number = 768,
  seed: number = Math.floor(Math.random() * 100000)
): Promise<string> => {
  const response = await fetch(buildApiUrl('/api/images/flux-generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, provider, width, height, seed })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as any));
    throw new FluxClientError(
      data?.error || `FLUX (${provider}) backend failed: ${response.status}`,
      response.status,
      response.status === 400 || response.status === 401 || response.status === 402
    );
  }
  const data = await response.json();
  const url: string | undefined = data?.url || data?.imageUrl;
  if (!url) throw new Error(`FLUX (${provider}) returned no image`);
  return url;
};

// Pollinations' anonymous tier answers a burst of parallel requests with its
// "free limit reached" picture / 429. Requests therefore go through ONE queue,
// a few seconds apart, and a failed one is retried once after a pause.
const POLLINATIONS_GAP_MS = 2500;
const POLLINATIONS_RETRY_DELAY_MS = 6000;
let pollinationsTail: Promise<unknown> = Promise.resolve();
let pollinationsLastStart = 0;

const loadPollinationsOnce = (imageUrl: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Pollinations AI image request timed out'));
    }, 45000);

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

export const generateImagePollinations = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  const imageUrl = buildPollinationsUrl(prompt, width, height, seed);
  if (typeof Image === 'undefined') return imageUrl;

  const run = async (): Promise<string> => {
    const wait = pollinationsLastStart + POLLINATIONS_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    pollinationsLastStart = Date.now();
    try {
      return await loadPollinationsOnce(imageUrl);
    } catch (firstError) {
      await new Promise((r) => setTimeout(r, POLLINATIONS_RETRY_DELAY_MS));
      pollinationsLastStart = Date.now();
      // Fresh seed: a rate-limited URL can be cached negatively by the CDN.
      return await loadPollinationsOnce(buildPollinationsUrl(prompt, width, height, seed + 1)).catch(() => {
        throw firstError;
      });
    }
  };

  const job = pollinationsTail.then(run, run);
  pollinationsTail = job.catch(() => undefined);
  return job;
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
    const nvidiaKey = AI_SECRETS.NVIDIA_API_KEY || "";
    if (!nvidiaKey) throw new Error("NVIDIA API key not configured for Qwen-Image");
    // Native apps are exempt from CORS, so the bundled key can call NVIDIA
    // directly. Walk the slug list (NVIDIA retires slugs — 2512 is current,
    // the legacy slug is kept as a fallback).
    let lastError = "No Qwen model available";
    for (const model of QWEN_CONFIG.models) {
      try {
        const response = await fetch(`${QWEN_CONFIG.baseURL}/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify({
            model,
            prompt: enhancedPrompt,
            n: 1,
            size: sizeStr as any,
            response_format: "b64_json"
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          lastError = `Qwen NVIDIA API (${model}) failed ${response.status}: ${errText.slice(0, 200)}`;
          console.warn(`[Image Gen] ${lastError}`);
          continue;
        }
        const data = await response.json();
        const b64 = data.data?.[0]?.b64_json;
        if (!b64) throw new Error("No b64_json in Qwen response");
        return `data:image/png;base64,${b64}`;
      } catch (err: any) {
        lastError = err.message || String(err);
        console.warn(`[Image Gen] Qwen direct API attempt failed (${model}):`, err);
      }
    }
    throw new Error(lastError);
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
    // Web: the backend route is the ONLY viable path. Direct browser calls to
    // integrate.api.nvidia.com are always CORS-blocked (NVIDIA sends no
    // Access-Control-Allow-Origin), so a "direct fallback" could never work
    // here — it only added noise to the console. Rethrow so the provider
    // fallback chain (Qwen → Gemini → Pollinations) takes over.
    // (The native app uses its own direct path above, where CORS does not apply.)
    console.warn("[Image Gen] Qwen backend failed; continuing to next provider:", backendErr);
    throw backendErr;
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

// ── Session cache ────────────────────────────────────────────────────────────
// The same illustration is requested many times per session (preview iframe
// rebuilds on every edit, print preview, exports…). Without a cache every one of
// those re-ran the whole provider chain and burned free-tier quota — which is
// how "a couple of images, then the limit is reached" happened. Results are
// remembered per prompt + size, and identical in-flight requests are shared.
const IMAGE_CACHE_MAX = 200;
const generatedImageCache = new Map<string, ImageGenerationResult>();
const inFlightImages = new Map<string, Promise<ImageGenerationResult>>();

const imageCacheKey = (prompt: string, width: number, height: number) => `${width}x${height}|${prompt}`;

/** Return an already-generated image for this prompt + size, if the session has one. */
export const peekGeneratedImage = (prompt: string, width: number = 800, height: number = 600): string | undefined =>
  generatedImageCache.get(imageCacheKey(prompt, width, height))?.url;

export const generateImageWithFallback = async (
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> => {
  // Cache / de-duplicate on the prompt the caller passed in (before styling).
  const cacheWidth = options.width || ASPECT_RATIOS[options.aspectRatio || 'square'].width;
  const cacheHeight = options.height || ASPECT_RATIOS[options.aspectRatio || 'square'].height;
  const key = imageCacheKey(options.prompt, cacheWidth, cacheHeight);

  if (options.skipCache) generatedImageCache.delete(key);
  const cached = generatedImageCache.get(key);
  if (cached) return cached;
  const pending = inFlightImages.get(key);
  if (pending) return pending;

  const job = runImageProviderChain(options)
    .then((result) => {
      if (result.isLastResort !== true) {
        if (generatedImageCache.size >= IMAGE_CACHE_MAX) {
          const oldest = generatedImageCache.keys().next().value;
          if (oldest !== undefined) generatedImageCache.delete(oldest);
        }
        generatedImageCache.set(key, result);
      }
      return result;
    })
    .finally(() => {
      inFlightImages.delete(key);
    });
  inFlightImages.set(key, job);
  return job;
};

// ── Provider health (circuit breaker) ───────────────────────────────────────
// Some providers fail for reasons that will not fix themselves within a session:
// Gemini image models answer 429 "limit: 0" on free API keys (retry in ~11h),
// NVIDIA's hosted Qwen-Image 404s on accounts without access, and perchance.org
// can be unreachable from school networks (Cloudflare).
// Without this, EVERY illustration burned 15-30s on each dead provider before
// reaching one that works. After repeated failures a provider is skipped for a
// cool-down, then retried. Pollinations (the end of every chain) is never skipped.
const PROVIDER_COOLDOWN_MS = 10 * 60 * 1000;
// A Perchance that has NEVER worked here is almost certainly blocked outright
// (perchance.org sends X-Frame-Options: sameorigin to embedders, or a school
// network blocks it) — that does not fix itself, so remember it across reloads.
const PERCHANCE_BLOCKED_COOLDOWN_MS = 30 * 60 * 1000;
const PERCHANCE_BENCH_KEY = 'eduai_perchance_bench_until';
const providerHealth: Record<string, { failures: number; everWorked: boolean; skipUntil: number }> = {};

const readPersistedBench = (id: ImageProviderId): number => {
  if (id !== 'perchance' || typeof window === 'undefined') return 0;
  try {
    return parseInt(window.localStorage.getItem(PERCHANCE_BENCH_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
};

const healthOf = (id: ImageProviderId) =>
  (providerHealth[id] ||= { failures: 0, everWorked: false, skipUntil: readPersistedBench(id) });

const isCoolingDown = (id: ImageProviderId): boolean =>
  id !== 'pollinations' && Date.now() < healthOf(id).skipUntil;

const recordProviderSuccess = (id: ImageProviderId) => {
  const h = healthOf(id);
  h.failures = 0;
  h.everWorked = true;
  h.skipUntil = 0;
  if (id === 'perchance') {
    try { window.localStorage.removeItem(PERCHANCE_BENCH_KEY); } catch { /* ignore */ }
  }
};

/** Forget every benched provider (e.g. after the user changes network / settings). */
export const resetImageProviderHealth = () => {
  for (const key of Object.keys(providerHealth)) delete providerHealth[key];
  try { window.localStorage.removeItem(PERCHANCE_BENCH_KEY); } catch { /* ignore */ }
};

const FATAL_COOLDOWN_MS = 30 * 60 * 1000;

const recordProviderFailure = (id: ImageProviderId, fatal = false) => {
  if (id === 'pollinations') return;
  const h = healthOf(id);
  if (fatal) {
    // Not configured / token rejected / credit used up: retrying cannot help.
    h.skipUntil = Date.now() + FATAL_COOLDOWN_MS;
    h.failures = 0;
    console.warn(`[Image Gen] ${id} is unavailable (not configured or rejected) — skipping it for ${FATAL_COOLDOWN_MS / 60000} min.`);
    return;
  }
  h.failures += 1;
  // Perchance that never worked: one failure benches it (hours). Any other
  // provider that has never produced an image is benched after TWO failures;
  // a proven one gets three.
  const neverWorkedPerchance = id === 'perchance' && !h.everWorked;
  const limit = neverWorkedPerchance ? 1 : h.everWorked ? 3 : 2;
  if (h.failures >= limit) {
    const cooldown = neverWorkedPerchance ? PERCHANCE_BLOCKED_COOLDOWN_MS : PROVIDER_COOLDOWN_MS;
    h.skipUntil = Date.now() + cooldown;
    h.failures = 0;
    if (id === 'perchance') {
      try { window.localStorage.setItem(PERCHANCE_BENCH_KEY, String(h.skipUntil)); } catch { /* ignore */ }
    }
    console.warn(`[Image Gen] ${id} is failing — skipping it for ${Math.round(cooldown / 60000)} min, then retrying.`);
  }
};

const runImageProviderChain = async (
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
    if (p === 'cloudflare' || p === 'cloudflare-flux') return 'cloudflare';
    if (p === 'flux' || p === 'huggingface' || p === 'hf-flux') return 'flux';
    return 'perchance';
  };

  const preferred = normalise(preferredProvider);
  const order = getImageProviderOrder(preferred);

  console.log(`[Image Gen] Provider priority: ${IMAGE_PROVIDER_PRIORITY.join(' → ')} | selected: ${preferred}${native ? ' (native app)' : ''} | fallback chain: ${order.join(' → ')} | SA context: ${saContext}`);

  for (const prov of order) {
    if (isCoolingDown(prov)) {
      console.log(`[Image Gen] Skipping ${prov} (cooling down after repeated failures).`);
      continue;
    }
    if (prov === 'perchance') {
      try {
        const role = preferred === 'perchance' ? 'Primary' : 'Fallback';
        console.log(`[Image Gen] Attempting Perchance AI (${role})...`);
        const imageUrl = await generateImagePerchance(styledPrompt, width, height, seed);
        recordProviderSuccess('perchance');
        return { url: imageUrl, provider: 'perchance', prompt: styledPrompt, width, height };
      } catch (error) {
        recordProviderFailure('perchance');
        console.warn('[Image Gen] Perchance AI failed; continuing...', error);
      }
    } else if (prov === 'qwen') {
      try {
        const role = preferred === 'qwen' ? 'Secondary' : 'Fallback';
        console.log(`[Image Gen] Attempting Qwen-Image (NVIDIA NIM) (${role}) — SA-enhanced...`);
        const imageUrl = await generateImageQwen(styledPrompt, width, height, {
          grade,
          subject,
          placement: placement || aspectRatio,
          saContext
        });
        recordProviderSuccess('qwen');
        return { url: imageUrl, provider: 'qwen', prompt: styledPrompt, width, height, model: QWEN_CONFIG.model, enhancedPrompt: saContext ? enhancePromptForSA(styledPrompt, grade, subject) : styledPrompt };
      } catch (error) {
        recordProviderFailure('qwen');
        console.warn('[Image Gen] Qwen-Image failed; continuing...', error);
      }
    } else if (prov === 'gemini') {
      try {
        const role = preferred === 'gemini' ? 'Tertiary' : 'Fallback';
        console.log(`[Image Gen] Attempting Gemini/Imagen (${role})...`);
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        recordProviderSuccess('gemini');
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height };
      } catch (error) {
        recordProviderFailure('gemini');
        console.warn('[Image Gen] Gemini/Imagen failed; continuing...', error);
      }
    } else if (prov === 'cloudflare' || prov === 'flux') {
      const label = prov === 'cloudflare' ? 'Cloudflare FLUX.1-schnell' : 'Hugging Face FLUX.1-schnell';
      const engine = prov === 'cloudflare' ? 'cloudflare' : 'huggingface';
      try {
        const role = preferred === prov ? 'Selected' : 'Fallback';
        console.log(`[Image Gen] Attempting ${label} (${role})...`);
        const imageUrl = await generateImageFlux(engine, styledPrompt, width, height, seed);
        recordProviderSuccess(prov);
        return { url: imageUrl, provider: prov, prompt: styledPrompt, width, height, model: prov === 'cloudflare' ? '@cf/black-forest-labs/flux-1-schnell' : 'black-forest-labs/FLUX.1-schnell' };
      } catch (error: any) {
        recordProviderFailure(prov, error instanceof FluxClientError && error.fatal);
        console.warn(`[Image Gen] ${label} failed; continuing...`, error?.message || error);
      }
    } else if (prov === 'pollinations') {
      try {
        const role = preferred === 'pollinations' ? 'Last resort' : 'Fallback';
        console.log(`[Image Gen] Attempting Pollinations AI (${role})...`);
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        recordProviderSuccess('pollinations');
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height };
      } catch (error) {
        recordProviderFailure('pollinations');
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
    height,
    isLastResort: true
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
