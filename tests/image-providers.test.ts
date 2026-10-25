/**
 * Image-provider contract.
 *
 * Regression guard for "I cannot generate any images":
 *
 *  • Qwen-Image on NVIDIA NIM is retired. `qwen/qwen-image` and
 *    `qwen/qwen-image-2512` both 404 at the gateway. No Qwen route may return.
 *  • FLUX.1-schnell (Hugging Face Inference Providers) is the free DEFAULT,
 *    with keyless Pollinations as the guaranteed last resort and Google Imagen
 *    as the paid secondary engine.
 *  • Perchance was retired on 22 Oct 2026 and RE-ADDED on 25 Oct against the
 *    API Perchance actually documents (`perchance-ai-api`, framed through the
 *    `null.perchance.org` embed host). The original integration was dead
 *    because it framed a community UI page and posted an invented payload at
 *    it — NOT because Perchance has no API. It stays BROWSER-ONLY: see
 *    `tests/perchance-image-api.test.ts` for its protocol contract.
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
  PollinationsRateLimitError,
  buildPlaceholderImageUrl,
  buildPollinationsUrl,
  describeFluxBackend,
  enhancePromptForSA,
  generateImageWithFallback,
  getImageProviderOrder,
  normaliseImageProviderId,
  pollinationsCooldownActive,
  resetFluxAvailability,
  resetPollinationsCooldown,
} from '../src/lib/imageGeneration';
import {
  BROWSER_ONLY_IMAGE_PROVIDERS,
  fluxModels,
  isBrowserOnlyImageProvider,
  normaliseFluxSize,
  serverSideImageProvider,
} from '../src/lib/imageProviders';

const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

describe('image provider registry', () => {
  it('runs FLUX → Perchance → Gemini → Pollinations with FLUX as the default', () => {
    expect(IMAGE_PROVIDER_PRIORITY).toEqual(['flux', 'perchance', 'gemini', 'pollinations']);
    // FLUX stays the default: Perchance is free and unmetered but depends on a
    // third-party iframe that Cloudflare can challenge without notice.
    expect(DEFAULT_IMAGE_PROVIDER).toBe('flux');
    expect(Object.keys(IMAGE_PROVIDER_FALLBACKS).sort()).toEqual(
      ['flux', 'gemini', 'perchance', 'pollinations']
    );
  });

  it('ranks the two free engines ahead of the paid and throttled ones', () => {
    const order = IMAGE_PROVIDER_PRIORITY as readonly string[];
    // Perchance is free and unmetered; Gemini image models have no free API
    // tier, so Perchance must come first.
    expect(order.indexOf('perchance')).toBeLessThan(order.indexOf('gemini'));
    // Pollinations throttles to ~1 image / 45 s per IP, so it stays last.
    expect(order[order.length - 1]).toBe('pollinations');
  });

  it('marks Perchance browser-only and maps it onto FLUX server-side', () => {
    expect(BROWSER_ONLY_IMAGE_PROVIDERS).toContain('perchance');
    expect(isBrowserOnlyImageProvider('perchance')).toBe(true);
    expect(isBrowserOnlyImageProvider('flux')).toBe(false);
    // Perchance generates inside the caller's own frame, so no Express route
    // can serve it — the API must substitute the default engine rather than
    // answer 400 for a provider the client legitimately offers.
    expect(serverSideImageProvider('perchance')).toBe(DEFAULT_IMAGE_PROVIDER);
    expect(serverSideImageProvider('flux')).toBe('flux');
    expect(serverSideImageProvider('gemini')).toBe('gemini');
    expect(serverSideImageProvider('pollinations')).toBe('pollinations');
  });

  it('retires Qwen-Image instead of silently keeping it', () => {
    const ids = Object.keys(IMAGE_PROVIDER_FALLBACKS);
    expect(ids).not.toContain('qwen');
    expect(ids).not.toContain('qwen-image');
    expect(ids).not.toContain('nvidia-qwen');

    // Old localStorage values migrate to the free replacement.
    for (const retired of ['qwen', 'qwen-image', 'nvidia-qwen', 'nvidia']) {
      expect(normaliseImageProviderId(retired)).toBe('flux');
    }
  });

  it('re-admits Perchance as a live engine, not a retired alias', () => {
    // A teacher who had Perchance selected before it was retired must get it
    // back rather than being silently migrated to FLUX.
    expect(Object.keys(IMAGE_PROVIDER_FALLBACKS)).toContain('perchance');
    expect(normaliseImageProviderId('perchance')).toBe('perchance');
    expect(normaliseImageProviderId('perchance-ai')).toBe('perchance');
    expect(normaliseImageProviderId('perchance-image-api')).toBe('perchance');
  });

  it('normalises current settings values', () => {
    expect(normaliseImageProviderId('flux')).toBe('flux');
    expect(normaliseImageProviderId('hf-flux')).toBe('flux');
    expect(normaliseImageProviderId('huggingface')).toBe('flux');
    expect(normaliseImageProviderId('perchance')).toBe('perchance');
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

describe('placeholder contract', () => {
  it('is a self-contained SVG data URL that needs no network', () => {
    const url = buildPlaceholderImageUrl('Grade 4 water cycle poster', 1024, 768, 'Image services are busy');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);

    const svg = decodeURIComponent(url.split(',')[1]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Grade 4 water cycle');
    expect(svg).toContain('Image services are busy');
    // No external RESOURCE references — it must render offline and inside
    // printed packs. (`xmlns` is a namespace identifier, not a fetch.)
    const withoutNamespace = svg.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, '');
    expect(withoutNamespace).not.toMatch(/https?:\/\//);
    // `url(#bg)` is an internal gradient reference — only external loads are
    // forbidden here.
    expect(svg).not.toMatch(/<image|xlink:href/);
    expect(svg).not.toMatch(/url\((?!['"]?#)/);
  });

  it('escapes prompt text so a quoted prompt cannot break the SVG', () => {
    const svg = decodeURIComponent(
      buildPlaceholderImageUrl('A <frog> & "pond" poster', 512, 512).split(',')[1]
    );
    expect(svg).toContain('&lt;frog&gt;');
    expect(svg).toContain('&amp;');
    expect(svg).not.toContain('<frog>');
  });

  it('stays deterministic for the same prompt', () => {
    expect(buildPlaceholderImageUrl('same prompt', 640, 480)).toBe(
      buildPlaceholderImageUrl('same prompt', 640, 480)
    );
  });
});

describe('pollinations free-tier contract', () => {
  const server = read('server.ts');

  it('understands the 402 FREE_LIMIT answer instead of retrying blindly', () => {
    expect(server).toContain('PollinationsRateLimitError');
    expect(server).toContain('code: "FREE_LIMIT"');
    expect(server).toContain('retryAfter');
  });

  it('supports a Pollinations key so the 45-second throttle can be removed', () => {
    expect(server).toContain('POLLINATIONS_API_KEY');
    expect(server).toMatch(/POLLINATIONS_API_KEY[\s\S]{0,200}POLLINATIONS_TOKEN/);
  });

  it('exposes a same-origin render route that forwards the quota status', () => {
    expect(server).toContain('app.post("/api/images/pollinations-generate"');
    expect(server).toContain('app.get("/api/images/status"');
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

    // Cloudflare is a BACKEND of the flux engine, never a separate provider id.
    expect(IMAGE_PROVIDER_PRIORITY).not.toContain('cloudflare' as any);
    expect(IMAGE_PROVIDER_PRIORITY[0]).toBe('flux');
  });

  it('surfaces which backend rendered the image', () => {
    expect(describeFluxBackend('cloudflare')).toBe('FLUX.1-schnell · Cloudflare Workers AI');
    expect(describeFluxBackend('huggingface')).toBe('FLUX.1-schnell · Hugging Face');
    expect(describeFluxBackend(undefined)).toBe('FLUX.1-schnell · Hugging Face');
  });

  it('keeps Perchance out of the server and off the apex host', () => {
    // Perchance runs the generation in the CALLER'S browser, so there is no
    // server-side form of it. The Express API must not fetch or frame it.
    const server = read('server.ts');
    expect(server).not.toMatch(/fetch\([^)]*perchance\.org/);
    expect(server).not.toContain('null.perchance.org');
    expect(server).not.toContain('perchance-ai-api');
    // A browser-only engine must be substituted, not served.
    expect(server).toContain('serverSideImageProvider');

    // The apex host sends X-Frame-Options: SAMEORIGIN, which is what killed the
    // original integration — framing must go through the embed host instead.
    const client = read('src/services/perchanceImageApi.ts');
    expect(client).toContain("'https://null.perchance.org'");
    expect(client).not.toMatch(/src\s*=\s*["'`]https:\/\/perchance\.org\/perchance-ai-api/);
    // …and the dead community UI page must never come back.
    for (const file of ['server.ts', 'src/lib/imageGeneration.ts', 'src/services/perchanceImageApi.ts']) {
      expect(read(file), file).not.toContain('ai-text-to-image-generator');
    }
  });

  it('keeps the retired Qwen engines as aliases in the shared registry', () => {
    const registry = read('src/lib/imageProviders.ts');
    expect(registry).toContain("'qwen-image': 'flux'");
    expect(registry).toContain("'nvidia-qwen': 'flux'");
    // Perchance is live again, so it must map to itself.
    expect(registry).toContain("perchance: 'perchance'");
  });
});

describe('provider chain execution', () => {
  const originalFetch = globalThis.fetch;
  const originalImage = (globalThis as any).Image;

  /**
   * Node has no `Image`, so the Pollinations probe used to "succeed" by
   * returning the URL unchecked. This stub makes it behave like a browser
   * whose image request failed, which is what the tests need to exercise.
   */
  const installFailingImageProbe = () => {
    class FailingImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      set src(_value: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    (globalThis as any).Image = FailingImage;
  };

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).Image = originalImage;
    // The "FLUX is not configured" / Pollinations cooldown memos are module
    // state — clear them per test.
    resetFluxAvailability();
    resetPollinationsCooldown();
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

  it('falls back to a printable placeholder when every engine fails', async () => {
    installFailingImageProbe();
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as typeof fetch;

    const result = await generateImageWithFallback({ prompt: 'A frog life cycle' });

    // A dead Pollinations URL used to be returned here, which rendered as a
    // broken-image icon. The placeholder is a real, self-contained image.
    expect(result.provider).toBe('placeholder');
    expect(result.url.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(result.url)).toContain('A frog life cycle');
  });

  it('stops retrying Pollinations the moment it reports the free limit', async () => {
    installFailingImageProbe();
    resetPollinationsCooldown();
    let pollinationsCalls = 0;
    globalThis.fetch = vi.fn(async (input: any) => {
      const url = String(input);
      if (url.includes('/api/images/pollinations-generate')) {
        pollinationsCalls += 1;
        return jsonResponse(
          { error: 'Free limit reached: 1 image every 45 seconds per IP', code: 'FREE_LIMIT', retryAfter: 45 },
          402
        );
      }
      if (url.includes('image.pollinations.ai')) {
        pollinationsCalls += 1;
        return jsonResponse({ error: { code: 'FREE_LIMIT', message: 'Free limit reached' } }, 402);
      }
      // FLUX and Gemini are unavailable in this scenario.
      return jsonResponse({ error: 'nope', configured: false }, 501);
    }) as typeof fetch;

    const result = await generateImageWithFallback({ prompt: 'A frog life cycle' });

    expect(result.provider).toBe('placeholder');
    // Two paths (server proxy + direct) — then it gives up. The old code
    // retried four times and re-probed seeds for ~90 seconds.
    expect(pollinationsCalls).toBeLessThanOrEqual(2);
    expect(pollinationsCooldownActive()).toBe(true);
    resetPollinationsCooldown();
  });

  it('skips Pollinations entirely while its cooldown is active', async () => {
    installFailingImageProbe();
    resetPollinationsCooldown();
    // First call exhausts the quota…
    globalThis.fetch = vi.fn(async () => jsonResponse({ code: 'FREE_LIMIT' }, 402)) as typeof fetch;
    await generateImageWithFallback({ prompt: 'first' });
    expect(pollinationsCooldownActive()).toBe(true);

    // …so the second call must not touch it at all.
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (input: any) => {
      calls.push(String(input));
      return jsonResponse({ error: 'nope', configured: false }, 501);
    }) as typeof fetch;
    await generateImageWithFallback({ prompt: 'second' });
    expect(calls.some(function call(u) { return u.includes('pollinations'); })).toBe(false);
    resetPollinationsCooldown();
  });

  it('keeps the chain going when the server cannot reach Hugging Face', async () => {
    installFailingImageProbe();
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (input: any) => {
      calls.push(String(input));
      if (String(input).includes('/api/images/flux-generate')) {
        return jsonResponse(
          { error: 'All FLUX backends failed — huggingface: FLUX gateway unreachable: ENOTFOUND', configured: true },
          502
        );
      }
      return jsonResponse({ error: 'nope' }, 502);
    }) as typeof fetch;

    const result = await generateImageWithFallback({ prompt: 'A frog life cycle' });

    // FLUX was tried, Gemini was tried, Pollinations was tried — then the
    // placeholder. A dead engine must never end the chain early.
    expect(calls.some(u => u.includes('/api/images/flux-generate'))).toBe(true);
    expect(calls.some(u => u.includes('/api/gemini/action'))).toBe(true);
    expect(result.provider).toBe('placeholder');
  });

  it('reports a typed rate-limit error with the retry window', () => {
    const error = new PollinationsRateLimitError('Free limit reached', 45);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('PollinationsRateLimitError');
    expect(error.retryAfterSeconds).toBe(45);
  });
});
