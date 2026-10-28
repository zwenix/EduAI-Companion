/**
 * EduAI Companion — Multi-Provider Image Generation System
 *
 * Provider priority (identical on web AND inside the Android APK):
 *   1. FLUX.1-schnell (Hugging Face Inference) — free, open-weights model
 *   2. Pollinations AI                          — keyless, always-on fallback
 *   3. Google Gemini image models               — secondary, own API key
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
  POLLINATIONS_COOLDOWN_MS,
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
  BROWSER_ONLY_IMAGE_PROVIDERS,
  DEFAULT_IMAGE_PROVIDER,
  FLUX_CONFIG,
  IMAGE_PROVIDER_ALIASES,
  isBrowserOnlyImageProvider,
  serverSideImageProvider,
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

import {
  generatePerchanceImage,
  isPerchanceAvailable,
  nearestPerchanceResolution
} from '../services/perchanceImageApi';

export interface ImageGenerationResult {
  url: string;
  /**
   * `placeholder` means every engine was unavailable and `url` is a self-
   * contained SVG — still a real, renderable image, never a broken link.
   */
  provider: 'flux' | 'perchance' | 'gemini' | 'pollinations' | 'placeholder';
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
        input: { prompt, width, height }
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({} as any));
      throw new Error(payload?.error || `Gemini API failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.imageUrl) throw new Error('No image URL returned from Gemini');
    // A proxy/fallback URL is not a Gemini image: treat it as a failure so the
    // provider chain keeps its own ordering instead of stopping here.
    if (data.isFallback || (data.provider && data.provider !== 'gemini')) {
      throw new Error(data.error || 'Gemini returned a fallback URL instead of an image');
    }
    return data.imageUrl;
  } catch (error) {
    console.error('Gemini image generation failed (backend), trying client-side engine:', error);
    try {
      const data = await callGeminiClientDirect('generate-image', { prompt, width, height });
      if (data?.imageUrl && !data.isFallback) return data.imageUrl;
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

/**
 * OPTIONAL browser-side Hugging Face key (`VITE_HUGGINGFACE_API_KEY`).
 *
 * Some deployments cannot open a TLS connection to `router.huggingface.co` from
 * the Node runtime ("fetch failed" / ECONNRESET) while the teacher's BROWSER
 * can. In that case the client retries FLUX directly — Hugging Face's router is
 * CORS-enabled, which is also how the APK talks to it.
 *
 * A `VITE_` variable is compiled into the public bundle, so this is opt-in and
 * should use a dedicated, rate-limited token — never an account-wide one.
 */
const getBrowserHuggingFaceKey = (): string => {
  try {
    const env = (import.meta as any)?.env;
    const key = env?.VITE_HUGGINGFACE_API_KEY;
    return typeof key === 'string' ? key.trim() : '';
  } catch {
    return '';
  }
};

const isNetworkFailure = (message: string): boolean =>
  /unreachable|fetch failed|network|ECONNRESET|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|aborted/i.test(message);

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

  const browserKey = getBrowserHuggingFaceKey();
  let serverFailure = '';

  try {
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
      serverFailure = errData?.error || `FLUX backend failed: ${response.status}`;
    } else {
      const data = await response.json().catch(() => ({} as any));
      const backend: FluxBackend = data?.backend === 'cloudflare' ? 'cloudflare' : 'huggingface';
      if (data?.url) return { url: data.url, model: data.model || FLUX_CONFIG.model, backend };
      if (data?.b64_json) {
        return { url: `data:image/png;base64,${data.b64_json}`, model: data.model || FLUX_CONFIG.model, backend };
      }
      serverFailure = 'No image payload in the FLUX backend response';
    }
  } catch (err: any) {
    if (err?.providerUnavailable) throw err;
    serverFailure = err?.message || String(err);
  }

  // The deployment could not reach Hugging Face (TLS/DNS/proxy). If this build
  // carries an optional browser key, the teacher's own network can still render
  // the same model — Hugging Face's router allows browser clients.
  if (browserKey && isNetworkFailure(serverFailure)) {
    console.warn(`[Image Gen] Server FLUX unreachable (${serverFailure}); retrying from the browser...`);
    for (const model of FLUX_CONFIG.models) {
      try {
        const response = await fetch(`${FLUX_CONFIG.routerBaseUrl}/${model}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${browserKey}`,
            'x-wait-for-model': 'true'
          },
          body: JSON.stringify({ inputs: enhancedPrompt, parameters: { width: w, height: h } })
        });
        if (!response.ok) {
          serverFailure = `Browser FLUX failed (${response.status})`;
          continue;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) continue;
        const dataUrl = await blobToDataUrl(await response.blob());
        if (dataUrl) {
          console.log('[Image Gen] FLUX rendered in the browser (server egress blocked).');
          return { url: dataUrl, model, backend: 'huggingface' };
        }
      } catch (err: any) {
        serverFailure = `Browser FLUX failed: ${err?.message || err}`;
      }
    }
  }

  throw new Error(serverFailure || 'FLUX.1-schnell failed');

};

/* ── Pollinations AI (keyless, throttled) ─────────────────────────────────── */

/**
 * Pollinations' anonymous tier allows roughly one image per 45 s per IP and
 * refuses the rest with **HTTP 402 `{error:{code:'FREE_LIMIT'}}`**. The old code
 * could not see that status (an `<img>` probe only fires `onerror`) and retried
 * four times with fresh seeds, so a spent quota cost ~90 s and still failed.
 */
export class PollinationsRateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds = 45) {
    super(message);
    this.name = 'PollinationsRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Retry-after we honour once Pollinations says the quota is spent. */
let pollinationsCooldownUntil = 0;

export const resetPollinationsCooldown = (): void => {
  pollinationsCooldownUntil = 0;
};

export const isPollinationsCoolingDown = (now = Date.now()): boolean =>
  now < pollinationsCooldownUntil;

export const pollinationsCooldownActive = (): boolean => isPollinationsCoolingDown();

const markPollinationsCoolingDown = (retryAfterSeconds: number): void => {
  pollinationsCooldownUntil = Date.now() + Math.max(
    POLLINATIONS_COOLDOWN_MS,
    (retryAfterSeconds || 0) * 1000
  );
};

const parseRetryAfter = (payload: any, headerValue: string | null): number => {
  const fromBody =
    payload?.error?.retryAfter ??
    payload?.error?.retry_after ??
    payload?.retryAfter ??
    payload?.retry_after;
  if (typeof fromBody === 'number' && Number.isFinite(fromBody)) return fromBody;
  const fromHeader = Number(headerValue);
  if (Number.isFinite(fromHeader) && fromHeader > 0) return fromHeader;
  return 45;
};

/** Resolves once the browser has actually decoded the image. */
const probeImageUrl = (url: string, timeoutMs = 25000): Promise<string> => {
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

/**
 * Fetches an image URL and reports WHY it failed.
 *
 * Returns `'ok'`, `'rate-limited'` (402/429), `'error'` (any other status) or
 * `'unknown'` when CORS prevented us from reading the response at all — in that
 * case the caller falls back to the `<img>` probe, which still renders the
 * image if the browser can load it.
 */
const classifyImageResponse = async (
  url: string,
  timeoutMs = 20000
): Promise<{ verdict: 'ok' | 'rate-limited' | 'error' | 'unknown'; retryAfter?: number; message?: string }> => {
  if (typeof fetch !== 'function') return { verdict: 'unknown' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
    if (response.ok) {
      const type = response.headers.get('content-type') || '';
      if (type.startsWith('image/')) return { verdict: 'ok' };
      // A 200 that is HTML means Pollinations served its "free limit" banner.
      const text = await response.text().catch(() => '');
      if (/free limit|rate limit|pollen/i.test(text)) {
        return { verdict: 'rate-limited', retryAfter: 45, message: text.slice(0, 200) };
      }
      return { verdict: 'error', message: `unexpected content-type ${type || 'unknown'}` };
    }
    if (response.status === 402 || response.status === 429) {
      const text = await response.text().catch(() => '');
      let payload: any = null;
      try { payload = JSON.parse(text); } catch { payload = null; }
      const retryAfter = parseRetryAfter(payload, response.headers.get('retry-after'));
      const message =
        payload?.error?.message || payload?.message || `Pollinations rate limit (HTTP ${response.status})`;
      return { verdict: 'rate-limited', retryAfter, message: String(message).slice(0, 200) };
    }
    return { verdict: 'error', message: `HTTP ${response.status}` };
  } catch (err: any) {
    // Network/CORS failures are indistinguishable here — let the <img> probe
    // decide, since the browser may still be able to load the picture.
    return { verdict: 'unknown', message: err?.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
};

/** One attempt: read the status when possible, otherwise probe the URL. */
const attemptPollinationsUrl = async (url: string, timeoutMs: number): Promise<string> => {
  const classified = await classifyImageResponse(url, timeoutMs);
  if (classified.verdict === 'ok') return url;
  if (classified.verdict === 'rate-limited') {
    throw new PollinationsRateLimitError(
      classified.message || 'Pollinations free limit reached',
      classified.retryAfter ?? 45
    );
  }
  // 'error' and 'unknown' both fall back to letting the browser try.
  return probeImageUrl(url, timeoutMs);
};

/** Server-side proxy — carries the deployment's Pollinations key and IP. */
const generateImagePollinationsViaApi = async (
  prompt: string,
  width: number,
  height: number,
  seed: number,
  timeoutMs: number
): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(buildApiUrl('/api/images/pollinations-generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height, seed, model: POLLINATIONS_MODEL }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 402 || response.status === 429) {
    const payload = await response.json().catch(() => ({} as any));
    throw new PollinationsRateLimitError(
      payload?.error || 'Pollinations free limit reached',
      Number(payload?.retryAfter) || 45
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as any));
    throw new Error(payload?.error || `Pollinations proxy failed: ${response.status}`);
  }
  const data = await response.json().catch(() => ({} as any));
  if (data?.url) return data.url;
  throw new Error('No image payload in the Pollinations proxy response');
};

export const generateImagePollinations = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed: number = Math.floor(Math.random() * 10000)
): Promise<string> => {
  if (isPollinationsCoolingDown()) {
    throw new PollinationsRateLimitError(
      'Pollinations free limit already reached — waiting for the quota window to reset'
    );
  }

  // Two different IPs are involved: the deployment's (the proxy route) and the
  // teacher's (a direct URL). One being throttled does not mean the other is,
  // so both are tried exactly once — and the moment BOTH report 402 we stop
  // instead of burning the whole image budget on a spent quota.
  const attempts: Array<{ label: string; run: () => Promise<string> }> = [];

  if (!isNativeApp()) {
    attempts.push({
      label: 'server proxy',
      run: () => generateImagePollinationsViaApi(prompt, width, height, seed, 25000)
    });
  }

  const directFlux = buildPollinationsUrl(prompt, width, height, seed, POLLINATIONS_MODEL);
  attempts.push({ label: 'direct flux', run: () => attemptPollinationsUrl(directFlux, 22000) });

  let rateLimited = 0;
  let lastError: Error = new Error('Pollinations AI image request failed');

  for (const [index, attempt] of attempts.entries()) {
    try {
      return await attempt.run();
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof PollinationsRateLimitError) {
        rateLimited += 1;
        console.warn(
          `[Image Gen] Pollinations ${attempt.label} is rate-limited (${lastError.message}); trying the next path...`
        );
        continue;
      }
      console.warn(`[Image Gen] Pollinations ${attempt.label} failed: ${lastError.message}`);
    }
    if (index < attempts.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  if (rateLimited > 0) {
    markPollinationsCoolingDown(lastError instanceof PollinationsRateLimitError ? lastError.retryAfterSeconds : 45);
    throw lastError instanceof PollinationsRateLimitError ? lastError : new PollinationsRateLimitError(lastError.message);
  }

  // Last chance inside this provider: the lighter model, once.
  try {
    return await attemptPollinationsUrl(
      buildPollinationsUrl(prompt, width, height, seed + 7, POLLINATIONS_FALLBACK_MODEL),
      20000
    );
  } catch (err: any) {
    if (err instanceof PollinationsRateLimitError) markPollinationsCoolingDown(err.retryAfterSeconds);
    throw err instanceof Error ? err : lastError;
  }
};

/* ── Guaranteed-visible placeholder ────────────────────────────────────────── */

const PLACEHOLDER_PALETTE = ['#007749', '#FFB81C', '#002395', '#E31E24', '#0f766e', '#7c3aed'];

const escapeSvgText = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/** Wraps the prompt onto at most `maxLines` lines of ~34 characters. */
const wrapPrompt = (prompt: string, maxLines = 3): string[] => {
  const words = prompt.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= 34) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  return lines.slice(0, maxLines);
};

/**
 * Self-contained SVG data URL used when every engine is unavailable.
 *
 * This exists because the old final fallback returned a *Pollinations URL*: when
 * the quota was spent, the `<img>` just rendered a broken-image icon with no
 * explanation. An inline SVG always renders — offline, in print, in the APK,
 * and inside exported packages — and tells the teacher what happened.
 */
export const buildPlaceholderImageUrl = (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  reason: string = 'Illustration service busy'
): string => {
  const w = Math.max(320, Math.round(width));
  const h = Math.max(240, Math.round(height));
  const accent = PLACEHOLDER_PALETTE[hashString(prompt) % PLACEHOLDER_PALETTE.length];
  const lines = wrapPrompt(prompt);
  const titleSize = Math.round(Math.min(w, h) * 0.052);
  const lineSize = Math.round(titleSize * 0.78);
  const startY = h / 2 - (lines.length * lineSize) / 2;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${w / 2}" y="${Math.round(startY + index * lineSize * 1.35)}">${escapeSvgText(line)}</tspan>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeSvgText(prompt)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${w}" height="${Math.round(h * 0.012)}" fill="${accent}"/>
  <rect x="0" y="${h - Math.round(h * 0.012)}" width="${w}" height="${Math.round(h * 0.012)}" fill="#FFB81C"/>
  <circle cx="${w / 2}" cy="${Math.round(h * 0.26)}" r="${Math.round(Math.min(w, h) * 0.075)}" fill="${accent}" opacity="0.12"/>
  <text x="${w / 2}" y="${Math.round(h * 0.285)}" text-anchor="middle" font-family="Fredoka, Nunito, system-ui, sans-serif" font-size="${Math.round(Math.min(w, h) * 0.085)}" fill="${accent}">✎</text>
  <text text-anchor="middle" font-family="Fredoka, Nunito, system-ui, sans-serif" font-size="${titleSize}" font-weight="700" fill="#0f172a">${tspans}</text>
  <text x="${w / 2}" y="${Math.round(h * 0.78)}" text-anchor="middle" font-family="Nunito, system-ui, sans-serif" font-size="${Math.round(lineSize * 0.72)}" fill="#475569">${escapeSvgText(reason)}</text>
  <text x="${w / 2}" y="${Math.round(h * 0.84)}" text-anchor="middle" font-family="Nunito, system-ui, sans-serif" font-size="${Math.round(lineSize * 0.62)}" fill="#64748b">Tap “Try Again” to regenerate · EduAI Companion</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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

/**
 * Perchance Image API v1 — free and unmetered, but BROWSER-ONLY: Perchance runs
 * the generation inside the caller's own hidden iframe ("it happens on the
 * caller's quota, not yours"), so no Express route can serve it. `server.ts`
 * maps a `perchance` request onto FLUX via `serverSideImageProvider()`.
 *
 * Returns a self-contained `data:` URL whenever Perchance supplies one, which
 * matters for PDF export: a cross-origin `user.uploads.dev` URL can taint the
 * canvas html2canvas renders, a data URL cannot.
 *
 * Resolution is capped at 768 px by the API — `nearestPerchanceResolution()`
 * maps the requested box onto the closest accepted preset.
 */
export const generateImagePerchance = async (
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed?: number
): Promise<{ url: string; resolution: string; isDataUrl: boolean }> => {
  if (!isPerchanceAvailable()) {
    throw new Error('Perchance is unavailable for this session');
  }
  const result = await generatePerchanceImage({ prompt, width, height, seed });
  return { url: result.url, resolution: result.resolution, isDataUrl: result.isDataUrl };
};

export { nearestPerchanceResolution };

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
    } else if (prov === 'perchance') {
      // Browser-only. During SSR / on the server there is no frame to run in,
      // and once the session memo trips we must not keep paying its timeout.
      if (typeof window === 'undefined' || !isPerchanceAvailable()) {
        console.log('[Image Gen] Perchance is unavailable here; skipping.');
        continue;
      }
      try {
        const role = preferred === 'perchance' ? 'Primary' : 'Fallback';
        console.log(`[Image Gen] Attempting Perchance Image API (${role})...`);
        const result = await generateImagePerchance(styledPrompt, width, height, seed);
        return {
          url: result.url,
          provider: 'perchance',
          prompt: styledPrompt,
          width,
          height,
          model: `Perchance Image API · ${result.resolution}${result.isDataUrl ? ' · inline' : ''}`,
          enhancedPrompt: saContext ? enhancePromptForSA(styledPrompt, grade, subject) : styledPrompt
        };
      } catch (error: any) {
        console.warn('[Image Gen] Perchance failed; continuing...', error?.message || error);
      }
    } else if (prov === 'gemini') {
      try {
        const role = preferred === 'gemini' ? 'Secondary' : 'Recovery';
        console.log(`[Image Gen] Attempting Gemini image models (${role})...`);
        const imageUrl = await generateImageGemini(styledPrompt, width, height);
        return { url: imageUrl, provider: 'gemini', prompt: styledPrompt, width, height, model: 'Gemini image' };
      } catch (error: any) {
        console.warn('[Image Gen] Gemini image models failed; continuing...', error?.message || error);
      }
    } else if (prov === 'pollinations') {
      try {
        const role = preferred === 'pollinations' ? 'Keyless primary' : 'Last resort';
        console.log(`[Image Gen] Attempting Pollinations AI (${role})...`);
        const imageUrl = await generateImagePollinations(styledPrompt, width, height, seed);
        return { url: imageUrl, provider: 'pollinations', prompt: styledPrompt, width, height, model: POLLINATIONS_MODEL };
      } catch (error: any) {
        if (error instanceof PollinationsRateLimitError) {
          console.warn(
            `[Image Gen] Pollinations AI is rate-limited (${error.message}). It will be skipped for ~${error.retryAfterSeconds}s.`
          );
        } else {
          console.warn('[Image Gen] Pollinations AI failed; continuing...', error?.message || error);
        }
      }
    }
  }

  // Never hand back a URL that is already known to fail: a dead Pollinations
  // link renders as a broken-image icon with no explanation. The inline SVG
  // always renders (offline, in the APK, in printed packs) and says what
  // happened, so the teacher can retry with context.
  const reason = pollinationsCooldownActive()
    ? 'Image services are busy — free image quota reached'
    : 'Illustration service unavailable';
  console.warn(`[Image Gen] All provider attempts failed. Using the built-in placeholder (${reason}).`);
  return {
    url: buildPlaceholderImageUrl(styledPrompt, width, height, reason),
    provider: 'placeholder',
    prompt: styledPrompt,
    width,
    height,
    model: 'EduAI placeholder'
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
  buildPlaceholderImageUrl,
  generateAllEducationalImages,
  enhanceEducationalImagePrompt,
  enhancePromptForSA,
  normaliseImageProviderId,
  buildDirectImageUrl,
  buildPollinationsUrl,
  buildApiUrl,
  FLUX_CONFIG
};
