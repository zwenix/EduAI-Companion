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
  FRAME_LOAD_DEADLINE_MS,
  buildPerchanceRequestUrl,
  generatePerchanceImageClient,
  isPerchanceBenching,
  perchanceFailureInfo,
  pickPerchanceResolution,
  resetPerchanceBench,
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
        const url = new URL(src);
        // A GENERATION frame carries an `id` (the postMessage correlation id);
        // the warm-up frame is the same API page with no id and only needs to
        // fire `onload`, which is what "Cloudflare passed the browser" looks
        // like from the app's side.
        if (src.includes('perchance-ai-api') && url.searchParams.get('id')) {
          // A real frame fires `load` as the page loads; do the same so the
          // X-Frame-Options refusal guard clears for a *frameable* host.
          setTimeout(() => frame.onload?.(), 0);
          setTimeout(() => reply(url, post), 0);
        } else if (frame.onload) {
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
    // The EMBED host is framed — the apex sends X-Frame-Options: SAMEORIGIN.
    expect(requested!.origin + requested!.pathname).toBe(PERCHANCE_EMBED_API_URL);
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
    installFakeBrowser((src, _post) => {
      // The frame LOADS (so it was not refused) but the plugin never answers.
      void src;
    });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 60)).rejects.toThrow(/timed out/);
  });

  it('fails fast when the frame is REFUSED, instead of stalling for the full timeout', async () => {
    // Production evidence 24 Nov 2026: perchance.org answers the API page with
    // `X-Frame-Options: SAMEORIGIN`, so the browser refuses the frame, no
    // script runs and no postMessage ever arrives. Without a refusal guard each
    // illustration waited the full 60s before falling through.
    //
    // The fake browser fires `load` for every API frame, so build one here that
    // behaves like a refused frame: it is appended and then stays silent.
    const handlers: Handler[] = [];
    const silentFrames: any[] = [];
    const silentDocument = {
      body: {
        appendChild: (frame: any) => silentFrames.push(frame), // never loads
      },
      createElement: () => ({
        style: {} as any,
        attrs: {} as Record<string, string>,
        setAttribute(k: string, v: string) { this.attrs[k] = v; },
        remove: vi.fn(),
      }),
    };
    const silentWindow = {
      addEventListener: (_: string, h: Handler) => handlers.push(h),
      removeEventListener: (_: string, h: Handler) => {
        const i = handlers.indexOf(h);
        if (i >= 0) handlers.splice(i, 1);
      },
    };
    vi.stubGlobal('document', silentDocument);
    vi.stubGlobal('window', silentWindow);

    // The refusal guard is `min(FRAME_LOAD_DEADLINE_MS, timeoutMs)`, so a short
    // generation timeout exercises exactly the same path a 60s one would.
    const startedAt = Date.now();
    await expect(
      generatePerchanceImageClient('a refused giraffe', 512, 512, 1, 900),
    ).rejects.toThrow(/X-Frame-Options|refused/i);
    // Warm-up cap (2.5s) + the 900ms frame deadline, nowhere near 60s.
    expect(Date.now() - startedAt).toBeLessThan(5_000);
    expect(silentFrames.length).toBeGreaterThan(0);
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

  it('only ever frames the embed host — never the apex that forbids framing', async () => {
    // `perchance.org` sends X-Frame-Options: SAMEORIGIN on its own API page.
    // Framing it produces NS_ERROR_XFO_VIOLATION and an engine that can never
    // answer. Every frame, warm-up included, must use the embed host.
    const seen: string[] = [];
    installFakeBrowser((src, post) => {
      seen.push(String(src));
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/ok.jpeg' } });
    });

    await generatePerchanceImageClient('one', 512, 512, 1, 5000);
    await generatePerchanceImageClient('two', 512, 512, 2, 5000);

    expect(seen.length).toBeGreaterThan(0);
    for (const framed of seen) {
      expect(framed.startsWith(PERCHANCE_EMBED_API_URL.split('?')[0])).toBe(true);
      // The apex host itself must never appear as a framed URL.
      expect(framed.startsWith('https://perchance.org/')).toBe(false);
    }
    expect(PERCHANCE_WARMUP_URL).toBe(PERCHANCE_EMBED_API_URL);
  });

  it('stays healthy through a single bad document instead of benching the primary engine', async () => {
    // The breaker was raised from 2 to 4 failures (24 Nov 2026): a document
    // renders its illustrations in batches, and benching the PRIMARY engine
    // after one unlucky batch is what silently pushed every later lesson onto
    // Pollinations.
    installFakeBrowser(() => { /* never answers */ });
    await expect(generatePerchanceImageClient('one', 512, 512, 1, 40)).rejects.toThrow();
    await expect(generatePerchanceImageClient('two', 512, 512, 2, 40)).rejects.toThrow();
    expect(isPerchanceBenching()).toBe(false);
    // The breaker reports its state honestly while it is still retrying.
    expect(perchanceFailureInfo().state).toBe('retrying');
    expect(perchanceFailureInfo().consecutiveFailures).toBe(2);
    resetPerchanceClient();
  });

  it('benches after four consecutive failures and clears it on the teacher retry', async () => {
    installFakeBrowser(() => { /* never answers */ });
    for (let i = 1; i <= 4; i++) {
      await expect(generatePerchanceImageClient(`p${i}`, 512, 512, i, 40)).rejects.toThrow();
    }
    expect(isPerchanceBenching()).toBe(true);
    expect(perchanceFailureInfo().lastError).toBeTruthy();
    // Benched calls refuse immediately — no iframe, no timeout stall.
    await expect(generatePerchanceImageClient('five', 512, 512, 5, 40)).rejects.toThrow(/benched/i);

    // "Try Again" always hands the PRIMARY engine a fresh turn.
    resetPerchanceBench();
    expect(isPerchanceBenching()).toBe(false);
    expect(perchanceFailureInfo().state).toBe('idle');
    resetPerchanceClient();
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

  it('never frames a page that refuses framing (X-Frame-Options)', () => {
    // Production regression (24 Nov 2026): the warm-up framed
    // `https://perchance.org/`, which answers `X-Frame-Options: sameorigin`.
    // The browser logged "The loading of https://perchance.org/welcome in a
    // frame is denied by X-Frame-Options directive set to sameorigin" and the
    // warm-up was pure noise. Only the API page may ever be framed.
    // Only null.perchance.org permits being framed; the apex refuses.
    expect(PERCHANCE_WARMUP_URL).toBe(PERCHANCE_EMBED_API_URL);
    expect(PERCHANCE_WARMUP_URL).toContain('null.perchance.org');
    expect(PERCHANCE_WARMUP_URL).toContain('perchance-ai-api');
    expect(PERCHANCE_WARMUP_URL).not.toBe('https://perchance.org/');
  });

  it('treats a warm-up as an optimisation: generation proceeds even when it never loads', async () => {
    // A blocked/slow warm-up frame must never be able to stall a document.
    const env = installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/x.jpeg' } });
    });
    // Keep warm-up frames permanently "loading" (no onload).
    env.frames.forEach((f) => { f.onload = undefined; });
    const url = await generatePerchanceImageClient('a warm frog', 512, 512, undefined, 5000);
    expect(url).toBe('https://user.uploads.dev/x.jpeg');
  });

  it('refuses to run outside a browser', async () => {
    vi.unstubAllGlobals();
    // Node has no window/document — the engine must fail fast (the chain
    // treats it as "skip to the next provider").
    await expect(generatePerchanceImageClient('a cat')).rejects.toThrow(/browser/i);
  });
});
