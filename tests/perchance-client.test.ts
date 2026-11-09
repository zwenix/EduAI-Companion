/**
 * Perchance Image API v1 client — contract tests (no network).
 *
 * The client speaks the documented protocol: a hidden iframe loads
 * `perchance.org/perchance-ai-api?...&format=json&id=<random>` and the page
 * replies with `postMessage({ api: 'perchance-image-api', result: {...} })`.
 * These tests pin the request shape, the origin/id filtering, the child-safety
 * negative prompt, the timeout path, caching, the embed-mirror failover and
 * the circuit breaker — see `src/services/perchanceClient.ts`.
 *
 * One more thing is pinned here: the bare `perchance.org` homepage is NEVER
 * framed. It answers `X-Frame-Options: SAMEORIGIN` (the browser logs
 * "Refused to display 'https://perchance.org/' in a frame …"), and the API
 * iframe is the Cloudflare visit anyway — so the session preflight must stay
 * frame-free.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PERCHANCE_API_MARKER,
  PERCHANCE_API_URL,
  PERCHANCE_EMBED_API_URL,
  PERCHANCE_NEGATIVE_PROMPT,
  buildPerchanceRequestUrl,
  generatePerchanceImageClient,
  isPerchanceBenching,
  PERCHANCE_TIMEOUT_MS,
  getPerchanceDiagnostics,
  pickPerchanceResolution,
  probePerchance,
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
        // Only the documented API page may be framed. Anything else (the bare
        // homepage in particular) would 403 in a real browser and is never
        // loaded here — it simply stays in `frames` for the assertion below.
        if (src.includes('perchance-ai-api')) {
          // A real frame fires `load` once the document is served; the client
          // uses that to tell "blocked before it ran" from "still rendering".
          setTimeout(() => frame.onload?.(), 0);
          setTimeout(() => reply(new URL(src), post), 0);
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

  it('requests the Image API in one hidden iframe and returns the hosted URL', async () => {
    let requested: URL | undefined;
    const env = installFakeBrowser((src, post) => {
      requested = src;
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/abc.jpeg' } });
    });

    const url = await generatePerchanceImageClient('a lion', 800, 600, 7, 5000);

    expect(url).toBe('https://user.uploads.dev/abc.jpeg');
    // Exactly one frame, and it is the API call — no homepage warm-up frame.
    expect(env.frames.length).toBe(1);
    expect(String(env.frames[0].src).startsWith(PERCHANCE_API_URL)).toBe(true);
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

  it('says whether the framed page loaded — a silent timeout is otherwise undiagnosable', async () => {
    // The page loads but never replies: this device is too slow, not blocked.
    installFakeBrowser(() => { /* loads, never answers */ });
    await expect(generatePerchanceImageClient('slow cat', 512, 512, 1, 60)).rejects.toThrow(
      /framed page loaded and is still rendering/
    );
    resetPerchanceClient();

    // The page never loads at all: something is blocking the iframe.
    const blocked = installFakeBrowser(() => { /* never answers */ });
    blocked.frames.length = 0;
    // Suppress onload so the frame never reports as loaded.
    const originalAppend = document.body.appendChild as any;
    (document.body as any).appendChild = (frame: any) => {
      frame.onload = null;
      blocked.frames.push(frame);
    };
    await expect(generatePerchanceImageClient('blocked cat', 512, 512, 1, 60)).rejects.toThrow(
      /never loaded the framed API page/
    );
    (document.body as any).appendChild = originalAppend;
  });

  it('reports a frame that errors instead of waiting for the full budget', async () => {
    installFakeBrowser(() => { /* never answers */ });
    const append = (document.body as any).appendChild;
    (document.body as any).appendChild = (frame: any) => {
      frame.onerror?.();
    };
    await expect(generatePerchanceImageClient('offline cat', 512, 512, 1, 5000)).rejects.toThrow(
      /could not load the framed API page/
    );
    (document.body as any).appendChild = append;
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

  it('switches to the embed mirror only once the current host fails twice', async () => {
    const seen: string[] = [];
    installFakeBrowser((src, post) => {
      seen.push(String(src));
      // A REAL failure (the API answers "blocked"), not a timeout.
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: false, error: 'blocked' } });
    });

    await expect(generatePerchanceImageClient('one', 512, 512, 1, 4000)).rejects.toThrow(/blocked/);
    let apiCalls = seen.filter((s) => s.includes('perchance-ai-api'));
    // One failure must NOT move the host — that was flipping on every hiccup.
    expect(apiCalls[0].startsWith(PERCHANCE_API_URL)).toBe(true);

    await expect(generatePerchanceImageClient('two', 512, 512, 2, 4000)).rejects.toThrow(/blocked/);
    apiCalls = seen.filter((s) => s.includes('perchance-ai-api'));
    // The second failure flips the preference, so the NEXT request uses it.
    expect(apiCalls[1].startsWith(PERCHANCE_API_URL)).toBe(true);

    await expect(generatePerchanceImageClient('three', 512, 512, 3, 4000)).rejects.toThrow(/blocked/);
    apiCalls = seen.filter((s) => s.includes('perchance-ai-api'));
    expect(apiCalls[2].startsWith(PERCHANCE_EMBED_API_URL)).toBe(true);
  });

  it('benches the engine only after three consecutive real failures', async () => {
    installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: false, error: 'blocked' } });
    });

    // Two failures are tolerated — a cold render can fail twice on a slow device.
    await expect(generatePerchanceImageClient('one', 512, 512, 1, 4000)).rejects.toThrow(/blocked/);
    await expect(generatePerchanceImageClient('two', 512, 512, 2, 4000)).rejects.toThrow(/blocked/);
    expect(isPerchanceBenching()).toBe(false);

    await expect(generatePerchanceImageClient('three', 512, 512, 3, 4000)).rejects.toThrow(/blocked/);
    expect(isPerchanceBenching()).toBe(true);

    // Now it refuses immediately — no iframe, no pricey stall.
    await expect(generatePerchanceImageClient('four', 512, 512, 4, 4000)).rejects.toThrow(/benched/i);
    resetPerchanceClient();
    expect(isPerchanceBenching()).toBe(false);
  });

  it('never counts a timeout towards the circuit breaker', async () => {
    // A timeout means "still rendering on this device", not "the engine broke".
    // Counting them benched Perchance for 10 minutes on exactly the slow school
    // laptops this product ships to.
    let generated = 0;
    installFakeBrowser((src, post) => {
      generated += 1;
      if (generated > 4) {
        post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/late.jpeg' } });
      }
      /* the first four never answer */
    });

    for (const prompt of ['a', 'b', 'c', 'd']) {
      await expect(generatePerchanceImageClient(prompt, 512, 512, 1, 30)).rejects.toThrow(/timed out/);
    }
    // Four timeouts — well past the three-failure threshold — still usable.
    expect(isPerchanceBenching()).toBe(false);
  });

  it('preflights once per session without framing the homepage', async () => {
    const env = installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/x.jpeg' } });
    });
    await expect(warmUpPerchance()).resolves.toBe(true);
    await expect(warmUpPerchance()).resolves.toBe(true);
    await generatePerchanceImageClient('a zebra', 512, 512, undefined, 5000);
    // The preflight is memoised and loads nothing at all.
    expect(env.frames.length).toBe(1);
    expect(String(env.frames[0].src)).toContain('perchance-ai-api');
  });

  it('never frames the bare perchance.org homepage (X-Frame-Options: SAMEORIGIN)', () => {
    // Read the source, not the module: a reintroduced constant next to an
    // `iframe.src = …` assignment must fail even though no test runs it.
    const source = readFileSync(path.resolve(__dirname, '../src/services/perchanceClient.ts'), 'utf8')
      // Comments may quote the blocked homepage to explain why it is blocked.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(source).not.toContain("'https://perchance.org/'");
    expect(source).not.toContain('PERCHANCE_WARMUP_URL');
    expect(source).not.toMatch(/src\s*=\s*['"`]https:\/\/perchance\.org\/['"`]/);
  });

  it('refuses to run outside a browser', async () => {
    vi.unstubAllGlobals();
    // Node has no window/document — the engine must fail fast (the chain
    // treats it as "skip to the next provider").
    await expect(generatePerchanceImageClient('a cat')).rejects.toThrow(/browser/i);
  });
});

/**
 * The framed page runs the diffusion model in the browser, so the iframe must
 * keep a live rendering pipeline. A 1×1 / fully transparent / offscreen frame is
 * throttled by Chrome and the generation then never completes — with no error,
 * only a timeout. That was the "Perchance does not work" report.
 */
describe('generation iframe rendering pipeline', () => {
  beforeEach(() => resetPerchanceClient());
  afterEach(() => vi.unstubAllGlobals());

  it('never sizes the frame to 1×1 or hides it in a way that throttles it', async () => {
    const env = installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/x.jpeg' } });
    });
    await generatePerchanceImageClient('a frog', 512, 512, undefined, 5000);

    const style = String(env.frames[0].style.cssText || '');
    // Must have a real layout box.
    expect(style).not.toMatch(/width:\s*1px/);
    expect(style).not.toMatch(/height:\s*1px/);
    // The three classic render-throttling triggers.
    expect(style).not.toMatch(/opacity:\s*0(?![.\d])/);
    expect(style).not.toMatch(/visibility:\s*hidden/);
    expect(style).not.toMatch(/display:\s*none/);
    // And it must stay inside the viewport (offscreen frames are throttled).
    expect(style).not.toMatch(/top:\s*-9999px/);
    expect(style).not.toMatch(/left:\s*-9999px/);
  });

  it('keeps the frame out of the way without hiding it from the renderer', async () => {
    const env = installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/x.jpeg' } });
    });
    await generatePerchanceImageClient('a frog', 512, 512, undefined, 5000);
    const style = String(env.frames[0].style.cssText || '');
    // Clipped and non-interactive: invisible to the teacher, live for Chrome.
    expect(style).toContain('clip-path');
    expect(style).toContain('pointer-events:none');
  });
});

describe('getPerchanceDiagnostics / probePerchance', () => {
  beforeEach(() => resetPerchanceClient());
  afterEach(() => vi.unstubAllGlobals());

  it('reports runtime, host and frame style without touching the network', () => {
    installFakeBrowser(() => { /* no frames expected */ });
    const diag = getPerchanceDiagnostics();
    expect(diag.runtimeAvailable).toBe(true);
    expect(diag.benched).toBe(false);
    expect(diag.host).toBe('perchance.org');
    expect(diag.timeoutMs).toBe(PERCHANCE_TIMEOUT_MS);
    expect(diag.frameStyle).toContain('clip-path');
  });

  it('reports false outside a browser instead of throwing', () => {
    vi.unstubAllGlobals();
    expect(getPerchanceDiagnostics().runtimeAvailable).toBe(false);
  });

  it('probes the engine end to end and reports elapsed time', async () => {
    installFakeBrowser((src, post) => {
      post({ api: PERCHANCE_API_MARKER, result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/probe.jpeg' } });
    });
    const result = await probePerchance(5000);
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://user.uploads.dev/probe.jpeg');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('reports the failure reason instead of throwing', async () => {
    vi.unstubAllGlobals(); // no browser → the engine cannot run
    const result = await probePerchance(200);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/browser/i);
  });
});
