/**
 * Provider request contracts for the illustration pipeline.
 *
 * Everything in this module is pure and dependency-free so the exact request
 * shapes can be unit-tested and shared by the Express API (`server.ts`) and
 * the on-device/client-side Gemini engine (`src/services/geminiClient.ts`).
 *
 * WHY THIS EXISTS
 * ---------------
 * Illustration generation failed with "No image data returned from Gemini
 * models" on every attempt. Gemini's native image models default to **text**
 * output: unless the request asks for the IMAGE response modality, the model
 * answers with a description (or a refusal) and no `inlineData` part, so the
 * server saw no bytes and fell through to the next provider.
 *
 * The retired Imagen IDs had the same effect from the other direction: Google
 * shut `imagen-3.0-generate-002` down on 10 November 2025 and every remaining
 * Imagen model followed by 17 August 2026, so those calls could only 404.
 *
 * Keep both invariants pinned by `tests/image-providers.test.ts`.
 */

/**
 * Gemini native image models, cheapest/fastest first.
 *
 * `imagen-*` must never return here — the whole family is retired on the
 * Gemini API. Use `gemini-3-pro-image` when a higher-fidelity render is worth
 * the extra latency.
 */
export const GEMINI_IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-3-pro-image',
] as const;

export type GeminiImageModel = (typeof GEMINI_IMAGE_MODELS)[number];

/** Retired image model ids that must never be called again. */
export const RETIRED_GEMINI_IMAGE_MODELS = [
  'imagen-3.0-generate-002',
  'imagen-3.0-generate-001',
  'imagen-3.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-ultra-generate-001',
] as const;

/** Aspect ratios accepted by the Gemini image models. */
const SUPPORTED_ASPECT_RATIOS: ReadonlyArray<{ label: string; value: number }> = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
];

/**
 * Snap an arbitrary pixel size to the closest aspect ratio Gemini accepts.
 *
 * Compared in log space so 3:4 and 4:3 are equally "far" from 1:1 and a
 * landscape request can never be snapped to a portrait ratio (or vice versa).
 */
export const geminiAspectRatio = (width?: number, height?: number): string => {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return '1:1';

  const target = Math.log(w / h);
  let best = SUPPORTED_ASPECT_RATIOS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of SUPPORTED_ASPECT_RATIOS) {
    const distance = Math.abs(Math.log(candidate.value) - target);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best.label;
};

/**
 * `generateContent` configuration for a Gemini image model.
 *
 * `responseModalities: ['IMAGE']` is mandatory — without it the model replies
 * with text only and the caller sees "no inline image data".
 */
export const buildGeminiImageConfig = (width?: number, height?: number) => ({
  responseModalities: ['IMAGE'] as string[],
  imageConfig: {
    aspectRatio: geminiAspectRatio(width, height),
  },
});

export interface GeminiInlineImage {
  base64: string;
  mimeType: string;
}

const readInlineImage = (part: any): GeminiInlineImage | null => {
  if (!part) return null;
  // The SDK normalises REST snake_case fields to camelCase, but a mocked or
  // proxied response may still arrive in the wire format — accept both.
  const inline = part.inlineData || part.inline_data;
  const data = inline?.data;
  if (typeof data !== 'string' || data.length === 0) return null;
  const mimeType =
    inline?.mimeType ||
    inline?.mime_type ||
    part.mimeType ||
    part.mime_type ||
    'image/png';
  return { base64: data, mimeType };
};

/** First inline image part of a `generateContent` response, if any. */
export const extractGeminiInlineImage = (response: any): GeminiInlineImage | null => {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    const image = readInlineImage(part);
    if (image) return image;
  }
  return null;
};

/**
 * Human-readable reason a response carried no image.
 *
 * A blocked prompt or a text-only answer used to be reported as the opaque
 * "No image data returned from Gemini models", which hid the real cause from
 * the logs. Surface the block reason / finish reason / text instead.
 */
export const describeGeminiImageResponse = (response: any): string => {
  const blockReason =
    response?.promptFeedback?.blockReason ||
    response?.prompt_feedback?.block_reason;
  if (blockReason) return `the prompt was blocked (${blockReason})`;

  const candidate = response?.candidates?.[0];
  const finishReason = candidate?.finishReason || candidate?.finish_reason;
  const parts = candidate?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  if (text) {
    const snippet = text.length > 160 ? `${text.slice(0, 157)}...` : text;
    return `the model answered with text instead of an image${finishReason ? ` (${finishReason})` : ''}: "${snippet}"`;
  }
  if (finishReason) return `the model returned no image (${finishReason})`;
  return 'the model returned no image data';
};

export const POLLINATIONS_KEYLESS_MODEL = 'flux';
export const POLLINATIONS_KEYED_MODEL = 'flux';

export interface PollinationsImageUrlOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number | string;
  /** Secret key. When absent the keyless legacy endpoint is used. */
  key?: string;
}

/**
 * Build a Pollinations image URL that can actually serve a picture.
 *
 * `turbo` + `enhance=true` is the combination Pollinations' free tier answers
 * with **HTTP 402 (Payment Required)**, which is what used to leave a broken
 * `<img>` in every generated document. `flux` is the free model; the keyless
 * legacy endpoint is throttled (roughly one request per 15 s per IP) but needs
 * no account, so it is a genuine last-resort provider.
 */
export const buildPollinationsImageUrl = ({
  prompt,
  width = 1024,
  height = 1024,
  seed = Math.floor(Math.random() * 100000),
  key = '',
}: PollinationsImageUrlOptions): string => {
  const cleanPrompt = prompt.length > 1000 ? `${prompt.slice(0, 997)}...` : prompt;
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    model: key ? POLLINATIONS_KEYED_MODEL : POLLINATIONS_KEYLESS_MODEL,
  });

  if (key) {
    params.set('nologo', 'true');
    return `https://gen.pollinations.ai/image/${encodeURIComponent(cleanPrompt)}?${params.toString()}`;
  }

  // Legacy keyless endpoint: no `nologo`/`enhance` (both are account features).
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?${params.toString()}`;
};

export default {
  GEMINI_IMAGE_MODELS,
  RETIRED_GEMINI_IMAGE_MODELS,
  geminiAspectRatio,
  buildGeminiImageConfig,
  extractGeminiInlineImage,
  describeGeminiImageResponse,
  buildPollinationsImageUrl,
  POLLINATIONS_KEYLESS_MODEL,
  POLLINATIONS_KEYED_MODEL,
};
