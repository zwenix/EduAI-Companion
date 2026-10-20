import { describe, it, expect, vi, beforeEach } from 'vitest';

const geminiDirect = vi.fn();
vi.mock('../src/services/geminiClient', () => ({ callGeminiClientDirect: (...a: any[]) => geminiDirect(...a) }));
vi.mock('../src/services/perchanceService', () => ({
  generatePerchanceImageClient: vi.fn(async () => { throw new Error('perchance down'); }),
}));
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), onSnapshot: vi.fn(), query: vi.fn(), setDoc: vi.fn(), doc: vi.fn(),
  Timestamp: { now: () => ({}) },
}));

import { generatePerchanceImageClient } from '../src/services/perchanceService';
import {
  IMAGE_PROVIDER_PRIORITY,
  getImageProviderOrder,
  generateImageWithFallback,
  peekGeneratedImage,
} from '../src/lib/imageGeneration';
import { replaceImagePlaceholders, finalizeImagesForExport, PENDING_IMAGE_SRC } from '../src/lib/imageReplacer';

describe('image provider chain', () => {
  it('keeps the agreed priority', () => {
    expect(IMAGE_PROVIDER_PRIORITY).toEqual(['perchance', 'qwen', 'gemini', 'cloudflare', 'flux', 'pollinations']);
  });

  it('wires every fallback exactly as specified (FLUX engines slot in after the required step)', () => {
    expect(getImageProviderOrder('perchance')).toEqual(['perchance', 'gemini', 'cloudflare', 'flux', 'pollinations']);
    expect(getImageProviderOrder('qwen')).toEqual(['qwen', 'gemini', 'cloudflare', 'flux', 'pollinations']);
    expect(getImageProviderOrder('gemini')).toEqual(['gemini', 'cloudflare', 'flux', 'pollinations']);
    expect(getImageProviderOrder('pollinations')).toEqual(['pollinations', 'gemini', 'cloudflare', 'flux']);
    expect(getImageProviderOrder('cloudflare')).toEqual(['cloudflare', 'flux', 'gemini', 'pollinations']);
    expect(getImageProviderOrder('flux')).toEqual(['flux', 'cloudflare', 'gemini', 'pollinations']);
  });

  it('always puts Gemini/Imagen before the FLUX engines for the required chains', () => {
    for (const first of ['perchance', 'qwen'] as const) {
      const order = getImageProviderOrder(first);
      expect(order.indexOf('gemini')).toBeLessThan(order.indexOf('cloudflare'));
    }
  });
});

describe('generateImageWithFallback', () => {
  beforeEach(() => geminiDirect.mockReset());

  it('falls from Perchance to Gemini and never touches Pollinations when Gemini works', async () => {
    geminiDirect.mockResolvedValue({ imageUrl: 'data:image/jpeg;base64,AAAA', provider: 'gemini' });
    const r = await generateImageWithFallback({ prompt: 'a cat', width: 800, height: 600 });
    expect(r.provider).toBe('gemini');
    expect(r.url).toBe('data:image/jpeg;base64,AAAA');
  });

  it('caches results so repeat requests do not re-run the chain', async () => {
    geminiDirect.mockResolvedValue({ imageUrl: 'data:image/jpeg;base64,BBBB', provider: 'gemini' });
    await generateImageWithFallback({ prompt: 'a dog', width: 800, height: 600 });
    await generateImageWithFallback({ prompt: 'a dog', width: 800, height: 600 });
    expect(geminiDirect).toHaveBeenCalledTimes(1);
    expect(peekGeneratedImage('a dog', 800, 600)).toBe('data:image/jpeg;base64,BBBB');
  });

  it('treats a Gemini "isFallback" Pollinations URL as a failure, not a Gemini image', async () => {
    geminiDirect.mockResolvedValue({ imageUrl: 'https://image.pollinations.ai/prompt/x', isFallback: true });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: 'not configured' }) })));
    const r = await generateImageWithFallback({ prompt: 'a bird', width: 800, height: 600 });
    expect(r.provider).toBe('pollinations');
    expect(r.url).toContain('image.pollinations.ai');
    vi.unstubAllGlobals();
  });
});

describe('provider circuit breaker', () => {
  it('benches a provider that has never worked so later images skip its timeout', async () => {
    geminiDirect.mockReset();
    geminiDirect.mockResolvedValue({ imageUrl: 'data:image/jpeg;base64,CCCC', provider: 'gemini' });
    // Earlier tests already hit the (mocked, always failing) Perchance once.
    const before = vi.mocked(generatePerchanceImageClient).mock.calls.length;
    await generateImageWithFallback({ prompt: 'a fresh prompt one', width: 800, height: 600 });
    await generateImageWithFallback({ prompt: 'a fresh prompt two', width: 800, height: 600 });
    expect(vi.mocked(generatePerchanceImageClient).mock.calls.length).toBe(before);
  });
});

describe('illustration placeholders', () => {
  it('start pending — nothing is requested from Pollinations up front', () => {
    const out = replaceImagePlaceholders('<p>[Illustration: a lion in the Kruger]</p>');
    expect(out).toContain(PENDING_IMAGE_SRC);
    expect(out).toContain('data-eduai-pending="1"');
    expect(out).not.toContain('pollinations.ai');
    expect(out).not.toContain('/api/image-proxy');
  });

  it('exports get a loadable URL instead of a blank pixel', () => {
    const out = finalizeImagesForExport(replaceImagePlaceholders('<p>[Illustration: a zebra]</p>'));
    expect(out).not.toContain('data-eduai-pending');
    expect(out).not.toContain(PENDING_IMAGE_SRC);
    expect(out).toMatch(/<img[^>]+src="https:\/\/image\.pollinations\.ai\//);
  });
});
