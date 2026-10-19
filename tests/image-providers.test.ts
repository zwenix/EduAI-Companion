/**
 * Illustration provider contracts (`src/lib/imageProviders.ts`).
 *
 * Regression guards for the two defects that made every generated document
 * render a broken/blank illustration:
 *
 *  • Gemini image models were called without `responseModalities: ['IMAGE']`.
 *    They default to TEXT, so no response ever contained an inline image and
 *    the server reported "No image data returned from Gemini models".
 *  • `imagen-3.0-generate-002` (shut down 10 Nov 2025) and later every Imagen
 *    model (17 Aug 2026) were still in the chain, so that fallback could only
 *    404.
 *
 * The wiring checks at the bottom keep `server.ts` and the client-side engine
 * on the shared helpers instead of re-inlining the request shape.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GEMINI_IMAGE_MODELS,
  RETIRED_GEMINI_IMAGE_MODELS,
  buildGeminiImageConfig,
  buildPollinationsImageUrl,
  describeGeminiImageResponse,
  extractGeminiInlineImage,
  geminiAspectRatio,
} from '../src/lib/imageProviders';

const repoFile = (relativePath: string) =>
  readFileSync(resolve(__dirname, '..', relativePath), 'utf8');

describe('Gemini image request', () => {
  it('always requests the IMAGE response modality', () => {
    const config = buildGeminiImageConfig(1024, 1024);
    expect(config.responseModalities).toEqual(['IMAGE']);
    expect(config.imageConfig.aspectRatio).toBe('1:1');
  });

  it('snaps pixel sizes to a supported aspect ratio', () => {
    expect(geminiAspectRatio(1024, 1024)).toBe('1:1');
    expect(geminiAspectRatio(800, 600)).toBe('4:3');
    expect(geminiAspectRatio(600, 800)).toBe('3:4');
    expect(geminiAspectRatio(1024, 576)).toBe('16:9');
    expect(geminiAspectRatio(576, 1024)).toBe('9:16');
    expect(geminiAspectRatio(1792, 1024)).toBe('16:9');
    expect(geminiAspectRatio(1024, 1792)).toBe('9:16');
  });

  it('falls back to a square for missing or invalid dimensions', () => {
    expect(geminiAspectRatio(undefined, undefined)).toBe('1:1');
    expect(geminiAspectRatio(0, 0)).toBe('1:1');
    expect(geminiAspectRatio(-10, 200)).toBe('1:1');
    expect(geminiAspectRatio(Number.NaN, 200)).toBe('1:1');
  });

  it('never calls a retired Imagen model', () => {
    for (const retired of RETIRED_GEMINI_IMAGE_MODELS) {
      expect(GEMINI_IMAGE_MODELS).not.toContain(retired);
    }
    expect(GEMINI_IMAGE_MODELS).toContain('gemini-3.1-flash-image');
    expect(GEMINI_IMAGE_MODELS).toContain('gemini-3-pro-image');
  });
});

describe('extractGeminiInlineImage', () => {
  it('returns the first inline image part (camelCase SDK shape)', () => {
    const image = extractGeminiInlineImage({
      candidates: [
        {
          content: {
            parts: [
              { text: 'Here is your illustration.' },
              { inlineData: { mimeType: 'image/png', data: 'QUJD' } },
            ],
          },
        },
      ],
    });
    expect(image).toEqual({ base64: 'QUJD', mimeType: 'image/png' });
  });

  it('accepts the REST snake_case shape', () => {
    const image = extractGeminiInlineImage({
      candidates: [{ content: { parts: [{ inline_data: { mime_type: 'image/jpeg', data: 'REVG' } }] } }],
    });
    expect(image).toEqual({ base64: 'REVG', mimeType: 'image/jpeg' });
  });

  it('returns null for a text-only response', () => {
    expect(
      extractGeminiInlineImage({ candidates: [{ content: { parts: [{ text: 'I cannot draw that.' }] } }] }),
    ).toBeNull();
    expect(extractGeminiInlineImage({})).toBeNull();
    expect(extractGeminiInlineImage(null)).toBeNull();
  });
});

describe('describeGeminiImageResponse', () => {
  it('reports a blocked prompt instead of the opaque "no image data"', () => {
    expect(describeGeminiImageResponse({ promptFeedback: { blockReason: 'SAFETY' } })).toContain('SAFETY');
  });

  it('surfaces the text the model answered with', () => {
    const reason = describeGeminiImageResponse({
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'I can only describe the scene.' }] } }],
    });
    expect(reason).toContain('text instead of an image');
    expect(reason).toContain('I can only describe the scene.');
    expect(reason).toContain('STOP');
  });

  it('uses the finish reason when there is neither text nor image', () => {
    expect(describeGeminiImageResponse({ candidates: [{ finishReason: 'IMAGE_SAFETY' }] })).toContain(
      'IMAGE_SAFETY',
    );
  });
});

describe('buildPollinationsImageUrl', () => {
  it('uses the free keyless flux endpoint and drops the paid options', () => {
    const url = new URL(
      buildPollinationsImageUrl({ prompt: 'water cycle over Table Mountain', width: 800, height: 600, seed: 7 }),
    );
    expect(url.host).toBe('image.pollinations.ai');
    expect(url.pathname.startsWith('/prompt/')).toBe(true);
    expect(url.searchParams.get('model')).toBe('flux');
    expect(url.searchParams.get('width')).toBe('800');
    expect(url.searchParams.get('height')).toBe('600');
    expect(url.searchParams.get('seed')).toBe('7');
    // These are the exact options the free tier answers with HTTP 402.
    expect(url.searchParams.has('enhance')).toBe(false);
    expect(url.searchParams.get('model')).not.toBe('turbo');
    expect(url.searchParams.has('token')).toBe(false);
  });

  it('uses the authenticated gateway when a key is available', () => {
    const url = new URL(buildPollinationsImageUrl({ prompt: 'a protea', key: 'sk_test' }));
    expect(url.host).toBe('gen.pollinations.ai');
    expect(url.pathname.startsWith('/image/')).toBe(true);
    expect(url.searchParams.get('model')).toBe('flux');
    expect(url.searchParams.get('nologo')).toBe('true');
    // The key travels in the Authorization header, never in the URL.
    expect(url.searchParams.has('token')).toBe(false);
    expect(url.searchParams.has('key')).toBe(false);
  });

  it('truncates very long prompts before encoding', () => {
    const url = buildPollinationsImageUrl({ prompt: 'x'.repeat(2000) });
    expect(decodeURIComponent(url.split('/prompt/')[1].split('?')[0])).toHaveLength(1000);
  });
});

describe('wiring', () => {
  const server = repoFile('server.ts');
  const clientEngine = repoFile('src/services/geminiClient.ts');

  it('server.ts uses the shared Gemini image config and model list', () => {
    expect(server).toContain('buildGeminiImageConfig');
    expect(server).toContain('GEMINI_IMAGE_MODELS');
    expect(server).toContain('extractGeminiInlineImage');
    // The retired fallback must not be re-inlined anywhere in the server.
    expect(server).not.toContain('imagen-3.0-generate-002');
    expect(server).not.toContain('gemini-3.1-flash-lite-image');
  });

  it('the on-device engine uses the same contract', () => {
    expect(clientEngine).toContain('buildGeminiImageConfig');
    expect(clientEngine).toContain('GEMINI_IMAGE_MODELS');
    expect(clientEngine).not.toContain('imagen-3.0-generate-002');
    expect(clientEngine).not.toContain('gemini-3.1-flash-lite-image');
  });

  it('the image proxy keeps a keyless Pollinations attempt', () => {
    expect(server).toContain('pollinations-free');
    expect(server).toContain('pollinationsKey');
  });
});
