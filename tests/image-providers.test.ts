/**
 * Image-provider contract.
 *
 * Regression guard for "I cannot generate any images":
 *
 *  • Perchance is retired. perchance.org answers with
 *    `X-Frame-Options: SAMEORIGIN` + a Cloudflare challenge, so the hidden
 *    iframe / postMessage / DOM-driver engine could never load. No iframe
 *    integration may come back.
 *  • Qwen-Image on NVIDIA NIM is retired. `qwen/qwen-image` and
 *    `qwen/qwen-image-2512` both 404 at the gateway.
 *  • FLUX.1-schnell (Hugging Face Inference Providers) is the free
 *    replacement, with keyless Pollinations as the guaranteed fallback and
 *    Google Imagen as the secondary engine.
 *
 * The tests import the real module (no network) and re-read the two files that
 * own the wiring so a reintroduced iframe/route fails CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_IMAGE_PROVIDER,
  FLUX_CONFIG,
  IMAGE_PROVIDER_ALIASES,
  IMAGE_PROVIDER_FALLBACKS,
  IMAGE_PROVIDER_PRIORITY,
  buildDirectImageUrl,
  buildPollinationsUrl,
  describeFluxBackend,
  enhancePromptForSA,
  generateImageWithFallback,
  getImageProviderOrder,
  normaliseImageProviderId,
  resetFluxAvailability,
} from '../src/lib/imageGeneration';
import { fluxModels, normaliseFluxSize } from '../src/lib/imageProviders';

const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

describe('image provider registry', () => {
  it('runs FLUX → Pollinations → Gemini with FLUX as the default', () => {
    expect(IMAGE_PROVIDER_PRIORITY).toEqual(['flux', 'pollinations', 'gemini']);
    expect(DEFAULT_IMAGE_PROVIDER).toBe('flux');
    expect(Object.keys(IMAGE_PROVIDER_FALLBACKS).sort()).toEqual(['flux', 'gemini', 'pollinations']);
  });

  it('retires Perchance and Qwen-Image instead of silently keeping them', () => {
    const ids = Object.keys(IMAGE_PROVIDER_FALLBACKS);
    expect(ids).not.toContain('perchance');
    expect(ids).not.toContain('qwen');
    expect(ids).not.toContain('qwen-image');

    // Old localStorage values migrate to the free replacement.
    for (const retired of ['perchance', 'qwen', 'qwen-image', 'nvidia-qwen']) {
      expect(normaliseImageProviderId(retired)).toBe('flux');
    }
  });

  it('normalises current settings values', () => {
    expect(normaliseImageProviderId('flux')).toBe('flux');
    expect(normaliseImageProviderId('hf-flux')).toBe('flux');
    expect(normaliseImageProviderId('huggingface')).toBe('flux');
    expect(normaliseImageProviderId('pollinations')).toBe('pollinations');
    expect(normaliseImageProviderId('gemini-imagen')).toBe('gemini');
    expect(normaliseImageProviderId('gemini')).toBe('gemini');
    expect(normaliseImageProviderId(null)).toBe('flux');
    expect(normaliseImageProviderId('')).toBe('flux');
    expect(normaliseImageProviderId('totally-unknown')).toBe('flux');
  });

  it('gives every engine a fallback chain that ends in a keyless provider', () => {
    for (const provider of IMAGE_PROVIDER_PRIORITY) {
      const chain = getImageProviderOrder(provider);
      expect(chain[0]).toBe(provider);
      // Every engine appears exactly once — no loops, no self-fallback.
      expect(new Set(chain).size).toBe(IMAGE_PROVIDER_PRIORITY.length);
      expect(chain.sort()).toEqual([...IMAGE_PROVIDER_PRIORITY].sort());
      // Pollinations needs no API key, so it must be reachable from anywhere.
      expect(chain).toContain('pollinations');
    }
  });

  it('maps every alias onto a live engine', () => {
    for (const [alias, engine] of Object.entries(IMAGE_PROVIDER_ALIASES)) {
      expect(IMAGE_PROVIDER_PRIORITY, `alias ${alias}`).toContain(engine);
    }
  });

  it('points FLUX at the free Hugging Face FLUX.1-schnell model', () => {
    expect(FLUX_CONFIG.model).toBe('black-forest-labs/FLUX.1-schnell');
    expect(FLUX_CONFIG.models).toContain('black-forest-labs/FLUX.1-schnell');
    expect(FLUX_CONFIG.routerBaseUrl).toBe('https://router.huggingface.co/hf-inference/models');
    // Sizes stay inside what FLUX.1-schnell accepts.
    for (const size of Object.values(FLUX_CONFIG.sizeMap)) {
      const [w, h] = size.split('x').map(Number);
      expect(w).toBeLessThanOrEqual(1024);
      expect(h).toBeLessThanOrEqual(1024);
      expect(w % 64).toBe(0);
      expect(h % 64).toBe(0);
    }
  });
});

describe('FLUX request sizing', () => {
  it('clamps onto the 64 px grid with a 1024 px ceiling', () => {
    expect(normaliseFluxSize('1024x1024')).toBe('1024x1024');
    expect(normaliseFluxSize('1792x1024')).toBe('1024x1024');
    expect(normaliseFluxSize('3000x2000')).toBe('1024x1024');
    expect(normaliseFluxSize('128x128')).toBe('256x256');
    expect(normaliseFluxSize('800x600')).toBe('832x576');
    expect(normaliseFluxSize('768x1024')).toBe('768x1024');
  });

  it('falls back to the square default for junk input', () => {
    expect(normaliseFluxSize(undefined)).toBe('1024x1024');
    expect(normaliseFluxSize('')).toBe('1024x1024');
    expect(normaliseFluxSize('large')).toBe('1024x1024');
    expect(normaliseFluxSize('1024')).toBe('1024x1024');
  });

  it('lets HUGGINGFACE_IMAGE_MODEL override the slug without losing the default', () => {
    expect(fluxModels()).toEqual(['black-forest-labs/FLUX.1-schnell']);
    expect(fluxModels('   ')).toEqual(['black-forest-labs/FLUX.1-schnell']);
    expect(fluxModels('black-forest-labs/FLUX.1-dev')).toEqual([
      'black-forest-labs/FLUX.1-dev',
      'black-forest-labs/FLUX.1-schnell'
    ]);
    expect(fluxModels('black-forest-labs/FLUX.1-schnell')).toEqual(['black-forest-labs/FLUX.1-schnell']);
  });
});

describe('image URLs', () => {
  it('builds a Pollinations FLUX URL with every render parameter', () => {
    const url = buildPollinationsUrl('Grade 2 SA water cycle', 800, 600, 1234);
    expect(url.startsWith('https://image.pollinations.ai/prompt/')).toBe(true);
    expect(url).toContain('width=800');
    expect(url).toContain('height=600');
    expect(url).toContain('seed=1234');
    expect(url).toContain('model=flux');
    expect(url).toContain('nologo=true');
  });

  it('keeps prompts inside the Pollinations length ceiling', () => {
    const url = buildPollinationsUrl('x'.repeat(2000));
    const encoded = url.slice('https://image.pollinations.ai/prompt/'.length).split('?')[0];
    expect(decodeURIComponent(encoded).length).toBeLessThanOrEqual(1000);
  });

  it('uses the same-origin image proxy on the web build', () => {
    // The web build (no Capacitor) must never call localhost or the APK base.
    expect(buildDirectImageUrl('Grade 3 maths poster', 800, 600, 7).startsWith('/api/image-proxy?')).toBe(true);
  });

  it('keeps South African context in the enhanced prompt', () => {
    const prompt = enhancePromptForSA('A frog life cycle', 'Grade 4', 'Natural Sciences');
    expect(prompt).toContain('South African');
    expect(prompt).toContain('rainbow nation');
    expect(prompt).toContain('Grade 4');
  });
});

describe('retired integrations stay removed', () => {
  it('no longer ships the Perchance iframe client', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/services/perchanceClient.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'src/services/perchanceService.ts'))).toBe(false);
  });

  it('nothing in the client imports Perchance or an iframe generator', () => {
    const clientFiles = [
      'src/lib/imageGeneration.ts',
      'src/lib/imageReplacer.ts',
      'src/contexts/AiContext.tsx',
      'src/components/AiImage.tsx',
      'src/components/Settings.tsx',
    ];
    for (const file of clientFiles) {
      const source = read(file);
      expect(source).not.toMatch(/perchanceClient|perchanceService/);
      expect(source).not.toMatch(/https?:\/\/perchance\.org/);
    }
  });

  it('the server exposes the FLUX route and no Qwen/Perchance image route', () => {
    const server = read('server.ts');
    expect(server).toContain('app.post("/api/images/flux-generate"');
    expect(server).not.toContain('/api/images/qwen-generate');
    expect(server).not.toContain('integrate.api.nvidia.com/v1",\n          method: "POST"');
    // The API and the client share ONE registry module.
    expect(server).toContain('from "./src/lib/imageProviders"');
    // No Perchance generator embed of any kind (the comment may name the host).
    expect(server).not.toContain('l62y86k8kq');
    expect(server).not.toContain('ai-text-to-image-generator');
  });

  it('ships a second free FLUX backend instead of a Perchance proxy', () => {
    const server = read('server.ts');

    // Cloudflare Workers AI serves the same open-weights model…
    expect(server).toContain('@cf/black-forest-labs/flux-1-schnell');
    expect(server).toContain('https://api.cloudflare.com/client/v4/accounts');
    // …inside the documented request limits (2 KB prompt, ≤8 steps).
    expect(server).toMatch(/CLOUDFLARE_MAX_PROMPT_CHARS = 2 \* 1024/);
    const steps = Number(server.match(/CLOUDFLARE_FLUX_STEPS = (\d+)/)![1]);
    expect(steps).toBeGreaterThan(0);
    expect(steps).toBeLessThanOrEqual(8);
    // The prompt is actually truncated to that ceiling before it is sent.
    expect(server).toContain('options.prompt.slice(0, CLOUDFLARE_MAX_PROMPT_CHARS)');

    // It is a BACKEND of the flux engine, never a separate provider id.
    expect(IMAGE_PROVIDER_PRIORITY).toEqual(['flux', 'pollinations', 'gemini']);
  });

  it('surfaces which backend rendered the image', () => {
    expect(describeFluxBackend('cloudflare')).toBe('FLUX.1-schnell · Cloudflare Workers AI');
    expect(describeFluxBackend('huggingface')).toBe('FLUX.1-schnell · Hugging Face');
    expect(describeFluxBackend(undefined)).toBe('FLUX.1-schnell · Hugging Face');
  });

  it('refuses any Perchance network integration (no API exists)', () => {
    // Perchance AI plugins are same-origin only and 403 plain HTTP requests, so
    // neither a client fetch nor a "browser-like" Worker proxy can work.
    for (const file of ['server.ts', 'src/lib/imageGeneration.ts', 'src/lib/imageProviders.ts']) {
      const source = read(file);
      expect(source, file).not.toMatch(/fetch\([^)]*perchance\.org/);
      expect(source, file).not.toContain('null.perchance.org');
    }
  });

  it('keeps the retired engines as aliases in the shared registry', () => {
    const registry = read('src/lib/imageProviders.ts');
    expect(registry).toContain('perchance: \'flux\'');
    expect(registry).toContain("'qwen-image': 'flux'");
    expect(registry).toContain("'nvidia-qwen': 'flux'");
  });
});

describe('provider chain execution', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    // The "FLUX is not configured" memo is module state — clear it per test.
    resetFluxAvailability();
    vi.restoreAllMocks();
  });

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' }
    });

  it('falls through to keyless Pollinations when FLUX is not configured', async () => {
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (input: any) => {
      calls.push(String(input));
      return jsonResponse(
        { error: 'HUGGINGFACE_API_KEY is not configured', provider: 'flux', configured: false },
        501
      );
    }) as typeof fetch;

    const result = await generateImageWithFallback({ prompt: 'A frog life cycle' });

    // FLUX was tried first, on the documented route…
    expect(calls[0]).toBe('/api/images/flux-generate');
    // …and the keyless engine answered, so the teacher still gets an image.
    expect(result.provider).toBe('pollinations');
    expect(result.url.startsWith('https://image.pollinations.ai/prompt/')).toBe(true);
    expect(result.url).toContain('model=flux');
  });

  it('returns the FLUX image and names the backend that rendered it', async () => {
    const respond = (backend: 'huggingface' | 'cloudflare') =>
      vi.fn(async () =>
        jsonResponse({ url: 'data:image/png;base64,AAAA', provider: 'flux', model: 'FLUX.1-schnell', backend })
      ) as typeof fetch;

    globalThis.fetch = respond('huggingface');
    const viaHf = await generateImageWithFallback({ prompt: 'A frog life cycle' });
    expect(viaHf.provider).toBe('flux');
    expect(viaHf.url).toBe('data:image/png;base64,AAAA');
    expect(viaHf.model).toBe('FLUX.1-schnell · Hugging Face');

    globalThis.fetch = respond('cloudflare');
    const viaCloudflare = await generateImageWithFallback({ prompt: 'A frog life cycle' });
    expect(viaCloudflare.provider).toBe('flux');
    expect(viaCloudflare.model).toBe('FLUX.1-schnell · Cloudflare Workers AI');
  });

  it('stops retrying FLUX for the session once it reports "not configured"', async () => {
    let fluxHits = 0;
    globalThis.fetch = vi.fn(async (input: any) => {
      if (String(input).includes('/api/images/flux-generate')) {
        fluxHits += 1;
        return jsonResponse({ error: 'HUGGINGFACE_API_KEY is not configured', configured: false }, 501);
      }
      return jsonResponse({ url: 'data:image/png;base64,AAAA' });
    }) as typeof fetch;

    await generateImageWithFallback({ prompt: 'First illustration' });
    await generateImageWithFallback({ prompt: 'Second illustration' });

    // One "no key" round-trip for the whole session, not one per image.
    expect(fluxHits).toBe(1);
  });

  it('survives every engine failing by handing back a Pollinations URL', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as typeof fetch;

    const result = await generateImageWithFallback({ prompt: 'A frog life cycle' });

    expect(result.provider).toBe('pollinations');
    expect(result.url).toContain('image.pollinations.ai');
  });
});
