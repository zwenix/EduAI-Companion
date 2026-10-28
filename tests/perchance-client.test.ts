/**
 * Perchance Image API v1 client — contract tests (no network).
 *
 * The client speaks the documented protocol: a hidden iframe loads
 * `perchance.org/perchance-ai-api?...&format=json&id=<random>` and the page
 * replies with `postMessage({ api: 'perchance-image-api', result: {...} })`.
 * These tests pin the request shape, the origin/id filtering, the child-safety
 * negative prompt, the timeout path, caching, the embed-mirror failover and
 * the circuit breaker — see `src/services/perchanceClient.ts`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PERCHANCE_API_MARKER,
  PERCHANCE_API_URL,
  PERCHANCE_EMBED_API_URL,
  PERCHANCE_NEGATIVE_PROMPT,
  PERCHANCE_WARMUP_URL,
  buildPerchanceRequestUrl,
  generatePerchanceImageClient,
  isPerchanceBenching,
  pickPerchanceResolution,
  resetPerchanceClient,
  warmUpPerchance,
} from '../src/services/perchanceClient';

type Handler = (e: any) => void;

/** Minimal browser stand-in: iframes "load" and the Perchance API page answers. */
const installFakeBrowser = (reply: (src: URL, post: (data: any, origin?: string) => void) => void) => {
  const handlers: Handler[] = [];
  const frames: any[] = [];
  const post = (data: any, origin = 'https://perchance.org') =>
    handlers.slice().forEach((h) => h({ origin, data }));

  const document = {
    body: {
      appendChild: (frame: any) => {
        frames.push(frame);
        const src = String(frame.src);
        if (src.includes('perchance-ai-api')) {
          setTimeout(() => reply(new URL(src), post), 0);
        } else if (frame.onload) {
          // Warm-up frame — the page "loads", Cloudflare passes the browser.
          setTimeout(() => frame.onload(), 0);
        }
      },
    },
    createElement: () => ({
      style: {} as any,
      attrs: {} as Record<string, string>,
      setAttribute(k: string, v: string) { this.attrs[k] = v; },
      remove: vi.fn(),
    }),
  };
  const window = {
    addEventListener: (_: string, h: Handler) => handlers.push(h),
    removeEventListener: (_: string, h: Handler) => {
      const i = handlers.indexOf(h);
      if (i >= 0) handlers.splice(i, 1);
    },
  };
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  return { frames, post, handlers };
};

const apiFrames = (frames: any[]) => frames.filter((f) => String(f.src).includes('perchance-ai-api'));

describe('pickPerchanceResolution', () => {
  it('maps any request onto the sizes Perchance renders', () => {
    expect(pickPerchanceResolution(1024, 1024)).toBe('768x768');
    expect(pickPerchanceResolution(800, 600)).toBe('768x512');
    expect(pickPerchanceResolution(768, 1024)).toBe('512x768');
  });
});

describe('buildPerchanceRequestUrl', () => {
  it('builds the documented query string with the safety negatives always on', () => {
    const url = new URL(buildPerchanceRequestUrl(PERCHANCE_API_URL, { prompt: 'a lion', width: 800, height: 600, seed: 7 }, 'req-1'));
    expect(url.origin + url.pathname).toBe(PERCHANCE_API_URL);
    expect(url.searchParams.get('prompt')).toBe('a lion');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('id')).toBe('req-1');
    expect(url.searchParams.get('resolution')).toBe('768x512');
    expect(url.searchParams.get('seed')).toBe('7');
    expect(url.searchParams.get('negativePrompt')).toBe(PERCHANCE_NEGATIVE_PROMPT);
  });

  it('lets callers extend — never replace — the negative prompt', () => {
    const url = new URL(buildPerchanceRequestUrl(PERCHANCE_API_URL, { prompt: 'p', negativePrompt: 'clowns' }, 'id2'));
    expect(url.searchParams.get('negativePrompt')).toBe(`${PERCHANCE_NEGATIVE_PROMPT}, clowns`);
  });

  it('clamps guidanceScale into the documented 1–30 range', () => {
    expect(new URL(buildPerchanceRequestUrl(PERCHANCE_API_URL, { prompt: 'p', guidanceScale: 99 }, 'i')).searchParams.get('guidanceScale')).toBe('30');
    expect(new URL(buildPerchanceRequestUrl(PERCHANCE_API_URL, { prompt: 'p', guidanceScale: 0 }, 'i')).searchParams.get('guidanceScale')).toBe('1');
  });
});

describe('generatePerchanceImageClient', () => {
  beforeEach(() => resetPerchanceClient());
  afterEach(() => vi.unstubAllGlobals());

  it('warms up, then requests the Image API in a hidden iframe and returns the hosted URL', async () => {
    let requested: URL | undefined;
    const env = installFakeBrowser((src, post) => {
      requested = src;
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/abc.jpeg' } });
    });

    const url = await generatePerchanceImageClient('a lion', 800, 600, 7, 5000);

    expect(url).toBe('https://user.uploads.dev/abc.jpeg');
    // First frame is the documented warm-up; the second is the API call.
    expect(String(env.frames[0].src)).toBe(PERCHANCE_WARMUP_URL);
    expect(requested!.origin + requested!.pathname).toBe(PERCHANCE_API_URL);
    expect(requested!.searchParams.get('prompt')).toBe('a lion');
    expect(requested!.searchParams.get('format')).toBe('json');
    expect(requested!.searchParams.get('resolution')).toBe('768x512');
    expect(requested!.searchParams.get('seed')).toBe('7');
    // listener and iframes are cleaned up
    expect(env.handlers.length).toBe(0);
  });

  it('ignores replies for other requests, other origins and other API markers', async () => {
    installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: 'someone-else', ok: true, url: 'https://user.uploads.dev/wrong.jpeg' } });
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://evil.example/x.png' } }, 'https://evil.example');
      post({ api: 'some-other-api', result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/marker.png' } });
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/right.jpeg' } });
    });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 5000)).resolves.toBe('https://user.uploads.dev/right.jpeg');
  });

  it('falls back to the inline dataUrl when no hosted URL is returned', async () => {
    installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, dataUrl: 'data:image/png;base64,AAAA' } });
    });
    await expect(generatePerchanceImageClient('a frog', 512, 512, undefined, 5000)).resolves.toBe('data:image/png;base64,AAAA');
  });

  it('rejects when the API reports a failure', async () => {
    installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: false, error: 'blocked' } });
    });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 5000)).rejects.toThrow('blocked');
  });

  it('times out so the provider chain can move on', async () => {
    installFakeBrowser(() => { /* never answers */ });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 60)).rejects.toThrow(/timed out/);
  });

  it('caches permanent URLs — the same prompt never generates twice', async () => {
    let generated = 0;
    installFakeBrowser((src, post) => {
      generated += 1;
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: `https://user.uploads.dev/img${generated}.jpeg` } });
    });
    const first = await generatePerchanceImageClient('the same frog', 512, 512, undefined, 5000);
    const second = await generatePerchanceImageClient('the same frog', 512, 512, undefined, 5000);
    expect(first).toBe(second);
    expect(generated).toBe(1);
  });

  it('switches to the embed mirror after the primary endpoint fails', async () => {
    const seen: string[] = [];
    installFakeBrowser((src) => {
      seen.push(String(src));
      // Never answers — the timeout drives the failover.
    });
    await expect(generatePerchanceImageClient('one', 512, 512, 1, 40)).rejects.toThrow(/timed out/);
    await expect(generatePerchanceImageClient('two', 512, 512, 2, 40)).rejects.toThrow(/timed out/);

    const apiCalls = seen.filter((s) => s.includes('perchance-ai-api'));
    expect(apiCalls[0].startsWith(PERCHANCE_API_URL)).toBe(true);
    expect(apiCalls[1].startsWith(PERCHANCE_EMBED_API_URL)).toBe(true);
  });

  it('benches the engine after two consecutive failures instead of stalling every image', async () => {
    installFakeBrowser(() => { /* never answers */ });
    await expect(generatePerchanceImageClient('one', 512, 512, 1, 40)).rejects.toThrow();
    await expect(generatePerchanceImageClient('two', 512, 512, 2, 40)).rejects.toThrow();
    expect(isPerchanceBenching()).toBe(true);
    // Third call refuses immediately — no iframe, no timeout stall.
    await expect(generatePerchanceImageClient('three', 512, 512, 3, 40)).rejects.toThrow(/benched/i);
    resetPerchanceClient();
    expect(isPerchanceBenching()).toBe(false);
  });

  it('reuses one warm-up per session', async () => {
    const env = installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/x.jpeg' } });
    });
    await warmUpPerchance();
    await generatePerchanceImageClient('a zebra', 512, 512, undefined, 5000);
    const warmups = env.frames.filter((f) => String(f.src) === PERCHANCE_WARMUP_URL);
    expect(warmups.length).toBe(1);
  });

  it('refuses to run outside a browser', async () => {
    vi.unstubAllGlobals();
    // Node has no window/document — the engine must fail fast (the chain
    // treats it as "skip to the next provider").
    await expect(generatePerchanceImageClient('a cat')).rejects.toThrow(/browser/i);
  });
});
