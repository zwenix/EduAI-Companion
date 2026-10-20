import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import {
  generateCloudflareFlux,
  generateHuggingFaceFlux,
  isFluxProviderConfigured,
  resolveCloudflareCredentials,
  resolveHuggingFaceToken,
  FluxProviderError,
  HF_FLUX_ENDPOINT,
} from '../src/lib/freeFluxProviders';
import { generateImageWithFallback, resetImageProviderHealth } from '../src/lib/imageGeneration';

// 1x1 JPEG header-ish payload (only the magic bytes matter for MIME sniffing).
const JPEG_B64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(200).fill(7)]).toString('base64');
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...new Array(200).fill(1)]);

const okJson = (body: any) => ({ ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body, headers: new Headers({ 'content-type': 'application/json' }) });
const errJson = (status: number, body: any) => ({ ok: false, status, text: async () => JSON.stringify(body), json: async () => body, headers: new Headers() });

const ENV = { CLOUDFLARE_API_TOKEN: 'cf-test', CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), HF_TOKEN: 'hf-test' };

describe('Cloudflare Workers AI FLUX (server)', () => {
  it('calls the account-scoped flux-1-schnell endpoint with a bearer token', async () => {
    const f = vi.fn(async () => okJson({ success: true, result: { image: JPEG_B64 } }));
    const r = await generateCloudflareFlux({ prompt: 'a lion', seed: 5 }, { env: ENV, fetchImpl: f });
    const [url, init] = f.mock.calls[0] as any;
    expect(url).toBe(`https://api.cloudflare.com/client/v4/accounts/${'a'.repeat(32)}/ai/run/@cf/black-forest-labs/flux-1-schnell`);
    expect(init.headers.Authorization).toBe('Bearer cf-test');
    expect(JSON.parse(init.body)).toMatchObject({ prompt: 'a lion', steps: 4, seed: 5 });
    expect(r.url.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('accepts the bare Worker-binding shape and clamps prompts to the 2048 limit', async () => {
    const f = vi.fn(async () => okJson({ image: JPEG_B64 }));
    const r = await generateCloudflareFlux({ prompt: 'x'.repeat(5000) }, { env: ENV, fetchImpl: f });
    expect(JSON.parse((f.mock.calls[0] as any)[1].body).prompt.length).toBeLessThanOrEqual(2048);
    expect(r.provider).toBe('cloudflare');
  });

  it('derives the account id from an R2 endpoint when CLOUDFLARE_ACCOUNT_ID is unset', () => {
    const id = 'b'.repeat(32);
    expect(resolveCloudflareCredentials({ CLOUDFLARE_API_TOKEN: 't', CLOUDFLARE_R2_ENDPOINT: `https://${id}.r2.cloudflarestorage.com` }).accountId).toBe(id);
  });

  it('reports a missing config as 400 and a rejected token as 401 with a useful message', async () => {
    await expect(generateCloudflareFlux({ prompt: 'x' }, { env: {} })).rejects.toMatchObject({ status: 400 });
    const f = vi.fn(async () => errJson(403, { success: false, errors: [{ message: 'Authentication error' }] }));
    const err: any = await generateCloudflareFlux({ prompt: 'x' }, { env: ENV, fetchImpl: f }).catch((e) => e);
    expect(err).toBeInstanceOf(FluxProviderError);
    expect(err.status).toBe(401);
    expect(err.message).toContain('Workers AI');
  });
});

describe('Hugging Face FLUX (server)', () => {
  it('posts to the router and turns raw image bytes into a data URL', async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, headers: new Headers({ 'content-type': 'image/png' }), arrayBuffer: async () => PNG_BYTES.buffer }));
    const r = await generateHuggingFaceFlux({ prompt: 'a zebra', width: 1000, height: 700, seed: 3 }, { env: ENV, fetchImpl: f });
    const [url, init] = f.mock.calls[0] as any;
    expect(url).toBe(HF_FLUX_ENDPOINT);
    expect(url).toContain('router.huggingface.co');
    expect(init.headers.Authorization).toBe('Bearer hf-test');
    const body = JSON.parse(init.body);
    expect(body.inputs).toBe('a zebra');
    expect(body.parameters.width % 16).toBe(0);
    expect(r.url.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('maps 402 (free credit gone) and 401 to clear errors', async () => {
    const mk = (status: number) => vi.fn(async () => ({ ok: false, status, text: async () => 'nope', headers: new Headers() }));
    await expect(generateHuggingFaceFlux({ prompt: 'x' }, { env: ENV, fetchImpl: mk(402) })).rejects.toMatchObject({ status: 402 });
    await expect(generateHuggingFaceFlux({ prompt: 'x' }, { env: ENV, fetchImpl: mk(401) })).rejects.toMatchObject({ status: 401 });
  });

  it('config helpers only look at server env names', () => {
    expect(resolveHuggingFaceToken({ HUGGINGFACE_API_KEY: 'k' })).toBe('k');
    expect(isFluxProviderConfigured('huggingface', {})).toBe(false);
    expect(isFluxProviderConfigured('cloudflare', ENV)).toBe(true);
  });
});

describe('client chain with the FLUX engines', () => {
  beforeEach(() => { geminiDirect.mockReset(); resetImageProviderHealth(); });
  afterEach(() => vi.unstubAllGlobals());

  it('Gemini failing falls to Cloudflare FLUX before Hugging Face and Pollinations', async () => {
    geminiDirect.mockRejectedValue(new Error('429 limit: 0'));
    const calls: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (u: string, init: any) => {
      if (!u.includes('flux-generate')) return { ok: false, status: 500, json: async () => ({ error: 'gemini backend down' }) };
      calls.push(JSON.parse(init.body).provider);
      return { ok: true, status: 200, json: async () => ({ url: 'data:image/jpeg;base64,CF' }) };
    }));
    const r = await generateImageWithFallback({ prompt: 'cf chain a', width: 800, height: 600 });
    expect(r.provider).toBe('cloudflare');
    expect(r.url).toBe('data:image/jpeg;base64,CF');
    expect(calls).toEqual(['cloudflare']);
  });

  it('an unconfigured Cloudflare (400) falls to Hugging Face and is then benched', async () => {
    geminiDirect.mockRejectedValue(new Error('429'));
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (u: string, init: any) => {
      if (!u.includes('flux-generate')) return { ok: false, status: 500, json: async () => ({ error: 'gemini backend down' }) };
      const p = JSON.parse(init.body).provider;
      calls.push(p);
      return p === 'cloudflare'
        ? { ok: false, status: 400, json: async () => ({ error: 'not configured' }) }
        : { ok: true, status: 200, json: async () => ({ url: 'data:image/png;base64,HF' }) };
    }));
    const first = await generateImageWithFallback({ prompt: 'cf chain b', width: 800, height: 600 });
    expect(first.provider).toBe('flux');
    await generateImageWithFallback({ prompt: 'cf chain c', width: 800, height: 600 });
    // Cloudflare was tried once, then skipped; HF served both.
    expect(calls).toEqual(['cloudflare', 'huggingface', 'huggingface']);
  });
});
