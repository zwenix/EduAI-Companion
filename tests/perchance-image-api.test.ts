/**
 * Perchance Image API v1 — browser-side engine contract.
 *
 * Perchance was removed on 22 Oct 2026 on the (correct) finding that the OLD
 * integration could never load: it framed `perchance.org/ai-text-to-image-generator`,
 * a community UI page with no message listener, and posted an invented
 * `{type:"generate"}` payload at it.
 *
 * It is re-added here against the API Perchance actually documents
 * (https://perchance.org/perchance-ai-api): a hidden iframe on the
 * `null.perchance.org` embed host, `format=json` + an `id` correlation param,
 * a reply of `{api:"perchance-image-api", result:{id, ok, url, dataUrl}}`, and
 * a one-off warm-up visit so Cloudflare passes the visitor.
 *
 * These tests pin the parts that make that safe to ship:
 *   • it is BROWSER-ONLY and says so instead of hanging on the server;
 *   • the 768 px ceiling is mapped by orientation, never squaring a portrait;
 *   • the origin check cannot be spoofed by a lookalike hostname;
 *   • a reply is accepted only when BOTH the api tag and our own id match;
 *   • a `data:` URL is preferred, so PDF export cannot taint its canvas;
 *   • repeated failures disable the engine for the session, so a challenged or
 *     slow Perchance can never make every illustration wait out a timeout.
 *
 * The environment is `node` (no jsdom), so the DOM is stubbed the same way the
 * existing provider tests stub `globalThis.Image`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  PERCHANCE_EMBED_ORIGIN,
  PERCHANCE_FAILURE_LIMIT,
  PERCHANCE_MESSAGE_API,
  PERCHANCE_RESOLUTIONS,
  PERCHANCE_WARMUP_URL,
  clearPerchanceCache,
  generatePerchanceImage,
  isPerchanceAvailable,
  isPerchanceOrigin,
  nearestPerchanceResolution,
  resetPerchanceSession,
} from '../src/services/perchanceImageApi';

/* ── Minimal DOM stub ──────────────────────────────────────────────────────── */

interface FakeFrame {
  src: string;
  title: string;
  style: { cssText: string };
  removed: boolean;
  setAttribute: (name: string, value: string) => void;
  addEventListener: (type: string, handler: () => void) => void;
  remove: () => void;
  attributes: Record<string, string>;
}

interface FakeDom {
  frames: FakeFrame[];
  /** Message handlers currently registered on window. */
  handlers: Array<(event: any) => void>;
  /** Deliver a postMessage to the module under test. */
  post: (origin: string, data: unknown) => void;
  lastFrame: () => FakeFrame;
}

function installFakeDom(): FakeDom {
  const frames: FakeFrame[] = [];
  const handlers: Array<(event: any) => void> = [];

  const document = {
    createElement(tag: string) {
      const frame: FakeFrame = {
        src: '',
        title: '',
        style: { cssText: '' },
        removed: false,
        attributes: {},
        setAttribute(name: string, value: string) {
          frame.attributes[name] = value;
        },
        addEventListener(type: string, handler: () => void) {
          // Fire `load` on the next tick so the warm-up resolves quickly and a
          // real browser's "frame loaded" path is what the tests exercise.
          if (type === 'load') setTimeout(handler, 0);
        },
        remove() {
          frame.removed = true;
        },
      };
      if (tag !== 'iframe') throw new Error(`unexpected element: ${tag}`);
      return frame;
    },
    body: {
      appendChild(frame: FakeFrame) {
        frames.push(frame);
      },
    },
  };

  const window = {
    addEventListener(type: string, handler: (event: any) => void) {
      if (type === 'message') handlers.push(handler);
    },
    removeEventListener(type: string, handler: (event: any) => void) {
      if (type !== 'message') return;
      const at = handlers.indexOf(handler);
      if (at >= 0) handlers.splice(at, 1);
    },
  };

  (globalThis as any).window = window;
  (globalThis as any).document = document;

  return {
    frames,
    handlers,
    post(origin: string, data: unknown) {
      // Snapshot: the handler removes itself while we iterate.
      for (const handler of [...handlers]) handler({ origin, data });
    },
    lastFrame() {
      return frames[frames.length - 1];
    },
  };
}

/** Pull the correlation id the module put on the generation frame's URL. */
function idFromFrame(frame: FakeFrame): string {
  return new URL(frame.src).searchParams.get('id') ?? '';
}

/**
 * Polls until the generation frame exists. The warm-up visit resolves on a
 * 500 ms settle timer, so a fixed sleep is racy; waiting for the actual frame
 * is not.
 */
async function waitForGenerationFrame(dom: FakeDom, limitMs = 4000): Promise<FakeFrame> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < limitMs) {
    const frame = dom.frames[dom.frames.length - 1];
    if (frame && frame.src.includes('/perchance-ai-api?')) return frame;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('the generation frame never appeared');
}

function removeFakeDom(): void {
  delete (globalThis as any).window;
  delete (globalThis as any).document;
}

beforeEach(() => {
  resetPerchanceSession();
  clearPerchanceCache();
});

afterEach(() => {
  removeFakeDom();
  resetPerchanceSession();
  clearPerchanceCache();
});

/* ── Resolution mapping ────────────────────────────────────────────────────── */

describe('Perchance resolution mapping (768 px ceiling)', () => {
  it('only ever returns a resolution the API accepts', () => {
    for (const [w, h] of [[800, 600], [1024, 1024], [768, 1024], [1792, 1024], [300, 300], [640, 480]]) {
      expect(PERCHANCE_RESOLUTIONS, `${w}x${h}`).toContain(nearestPerchanceResolution(w, h));
    }
  });

  it('preserves orientation — a portrait slot never comes back square', () => {
    expect(nearestPerchanceResolution(800, 600)).toBe('768x512');   // landscape
    expect(nearestPerchanceResolution(1024, 576)).toBe('768x512');  // wide header
    expect(nearestPerchanceResolution(1792, 1024)).toBe('768x512'); // clamped wide
    expect(nearestPerchanceResolution(768, 1024)).toBe('512x768');  // portrait sidebar
    expect(nearestPerchanceResolution(1024, 1024)).toBe('768x768'); // square, largest
    expect(nearestPerchanceResolution(512, 512)).toBe('512x512');   // square, exact
  });

  it('falls back to the largest square for missing or junk dimensions', () => {
    expect(nearestPerchanceResolution()).toBe('768x768');
    expect(nearestPerchanceResolution(undefined, undefined)).toBe('768x768');
    expect(nearestPerchanceResolution(Number.NaN, Number.NaN)).toBe('768x768');
  });
});

/* ── Origin allowlist ──────────────────────────────────────────────────────── */

describe('Perchance origin check', () => {
  it('accepts the embed host, the apex and real subdomains', () => {
    expect(isPerchanceOrigin(PERCHANCE_EMBED_ORIGIN)).toBe(true);
    expect(isPerchanceOrigin('https://perchance.org')).toBe(true);
    expect(isPerchanceOrigin('https://image-generation.perchance.org')).toBe(true);
  });

  it('rejects lookalikes that a naive substring check would accept', () => {
    // The removed implementation used event.origin.includes('perchance.org'),
    // which every one of these would have satisfied.
    expect(isPerchanceOrigin('https://perchance.org.evil.example')).toBe(false);
    expect(isPerchanceOrigin('https://evilperchance.org')).toBe(false);
    expect(isPerchanceOrigin('https://notperchance.org')).toBe(false);
    expect(isPerchanceOrigin('')).toBe(false);
    expect(isPerchanceOrigin('not a url')).toBe(false);
  });
});

/* ── Browser-only guard ────────────────────────────────────────────────────── */

describe('Perchance is browser-only', () => {
  it('rejects immediately on the server instead of hanging', async () => {
    // No window/document installed — this is the Express / SSR case.
    await expect(generatePerchanceImage({ prompt: 'A frog life cycle' })).rejects.toThrow(
      /browser-only/i
    );
    expect(isPerchanceAvailable()).toBe(true); // a server call must not poison a browser session
  });

  it('rejects an empty prompt without opening a frame', async () => {
    const dom = installFakeDom();
    await expect(generatePerchanceImage({ prompt: '   ' })).rejects.toThrow(/prompt/i);
    expect(dom.frames.length).toBe(0);
  });
});

/* ── Protocol ──────────────────────────────────────────────────────────────── */

describe('Perchance Image API v1 protocol', () => {
  it('frames the embed host with format=json, an id and a mapped resolution', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'A protea flower', width: 800, height: 600, seed: 7 });

    // Wait for the warm-up frame, then the generation frame.
    const frame = await waitForGenerationFrame(dom);
    const url = new URL(frame.src);

    expect(frame.src.startsWith(`${PERCHANCE_EMBED_ORIGIN}/perchance-ai-api?`)).toBe(true);
    // The embed host, NOT the apex — perchance.org sends X-Frame-Options.
    expect(frame.src).not.toContain('https://perchance.org/perchance-ai-api');
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('prompt')).toBe('A protea flower');
    expect(url.searchParams.get('resolution')).toBe('768x512');
    expect(url.searchParams.get('seed')).toBe('7');
    expect(url.searchParams.get('id')).toMatch(/^eduai-/);
    // Hidden, and scripted without same-origin access to our document.
    expect(frame.attributes.sandbox).toBe('allow-scripts');
    expect(frame.style.cssText).toContain('opacity:0');

    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: { id: idFromFrame(frame), ok: true, url: 'https://user.uploads.dev/x.png' },
    });
    const result = await pending;
    expect(result.url).toBe('https://user.uploads.dev/x.png');
    expect(result.isDataUrl).toBe(false);
    expect(result.resolution).toBe('768x512');
    expect(frame.removed, 'the frame must be cleaned up').toBe(true);
  });

  it('warms up against the apex host once per session', async () => {
    const dom = installFakeDom();
    const first = generatePerchanceImage({ prompt: 'one', timeoutMs: 100 });
    // Attach the handler at once: the rejection lands while the test is still
    // waiting on the warm-up, and an unattached rejection fails the run.
    const firstRejected = expect(first).rejects.toThrow(/timed out/i);
    await waitForGenerationFrame(dom);
    expect(dom.frames[0].src).toBe(PERCHANCE_WARMUP_URL);
    await firstRejected;

    const before = dom.frames.length;
    const second = generatePerchanceImage({ prompt: 'two', timeoutMs: 50 });
    await expect(second).rejects.toThrow(/timed out/i);
    // Warm-up + generation only — the warm-up was not repeated.
    expect(dom.frames.length - before).toBe(1);
  });

  it('prefers a data URL so PDF export cannot taint its canvas', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'data url preference', timeoutMs: 5000 });
    const frame = await waitForGenerationFrame(dom);

    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: {
        id: idFromFrame(frame),
        ok: true,
        url: 'https://user.uploads.dev/y.png',
        dataUrl: 'data:image/png;base64,AAAA',
      },
    });

    const result = await pending;
    expect(result.url).toBe('data:image/png;base64,AAAA');
    expect(result.isDataUrl).toBe(true);
  });

  it('ignores a reply from a lookalike origin', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'spoofed origin', timeoutMs: 2000 });
    const rejected = expect(pending).rejects.toThrow(/timed out/i);
    const frame = await waitForGenerationFrame(dom);

    dom.post('https://perchance.org.evil.example', {
      api: PERCHANCE_MESSAGE_API,
      result: { id: idFromFrame(frame), ok: true, url: 'https://evil.example/x.png' },
    });

    await rejected;
  });

  it('ignores a reply whose id belongs to a different request', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'wrong correlation id', timeoutMs: 2000 });
    const rejected = expect(pending).rejects.toThrow(/timed out/i);
    await waitForGenerationFrame(dom);

    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: { id: 'eduai-someone-elses-request', ok: true, url: 'https://user.uploads.dev/z.png' },
    });

    await rejected;
  });

  it('ignores a message that is not from the image API', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'unrelated message', timeoutMs: 2000 });
    const rejected = expect(pending).rejects.toThrow(/timed out/i);
    const frame = await waitForGenerationFrame(dom);

    dom.post(PERCHANCE_EMBED_ORIGIN, { id: idFromFrame(frame), ok: true, url: 'https://x/y.png' });
    dom.post(PERCHANCE_EMBED_ORIGIN, { api: 'some-other-api', result: { id: idFromFrame(frame), ok: true, url: 'https://x/y.png' } });

    await rejected;
  });

  it('surfaces an upstream failure message', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'reported failure', timeoutMs: 5000 });
    const frame = await waitForGenerationFrame(dom);

    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: { id: idFromFrame(frame), ok: false, error: 'generation queue full' },
    });

    await expect(pending).rejects.toThrow(/generation queue full/);
  });

  it('rejects a reply that carries no image at all', async () => {
    const dom = installFakeDom();
    const pending = generatePerchanceImage({ prompt: 'empty reply', timeoutMs: 5000 });
    const frame = await waitForGenerationFrame(dom);

    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: { id: idFromFrame(frame), ok: true },
    });

    await expect(pending).rejects.toThrow(/no image URL/i);
  });

  it('caches a permanent URL so a repeated prompt costs nothing', async () => {
    const dom = installFakeDom();
    const first = generatePerchanceImage({ prompt: 'cached prompt', seed: 3, timeoutMs: 5000 });
    await waitForGenerationFrame(dom);
    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: { id: idFromFrame(dom.lastFrame()), ok: true, url: 'https://user.uploads.dev/c.png' },
    });
    expect((await first).cached).toBe(false);

    const framesBefore = dom.frames.length;
    const second = await generatePerchanceImage({ prompt: 'cached prompt', seed: 3, timeoutMs: 5000 });
    expect(second.cached).toBe(true);
    expect(second.url).toBe('https://user.uploads.dev/c.png');
    expect(dom.frames.length, 'a cache hit must not open a frame').toBe(framesBefore);
  });
});

/* ── Failure containment ───────────────────────────────────────────────────── */

describe('Perchance failure containment', () => {
  it(`stops offering the engine after ${PERCHANCE_FAILURE_LIMIT} consecutive failures`, async () => {
    const dom = installFakeDom();
    expect(isPerchanceAvailable()).toBe(true);

    for (let attempt = 1; attempt <= PERCHANCE_FAILURE_LIMIT; attempt += 1) {
      const pending = generatePerchanceImage({ prompt: `challenge attempt ${attempt}`, timeoutMs: 100 });
      const rejected = expect(pending).rejects.toThrow();
      await waitForGenerationFrame(dom).catch(() => undefined);
      await rejected;
      expect(isPerchanceAvailable(), `still available after attempt ${attempt}`).toBe(
        attempt < PERCHANCE_FAILURE_LIMIT
      );
    }

    // Once disabled it must fail FAST — no frame, no timeout to wait out. This
    // is what stops a challenged Perchance from adding 45 s to every image.
    const framesBefore = dom.frames.length;
    await expect(generatePerchanceImage({ prompt: 'after disable' })).rejects.toThrow(
      /unavailable for this session/i
    );
    expect(dom.frames.length).toBe(framesBefore);
  });

  it('clears a failure streak on success', async () => {
    const dom = installFakeDom();
    await expect(generatePerchanceImage({ prompt: 'a failure', timeoutMs: 100 })).rejects.toThrow();
    expect(isPerchanceAvailable()).toBe(true);

    const pending = generatePerchanceImage({ prompt: 'a success', timeoutMs: 5000 });
    await waitForGenerationFrame(dom);
    dom.post(PERCHANCE_EMBED_ORIGIN, {
      api: PERCHANCE_MESSAGE_API,
      result: { id: idFromFrame(dom.lastFrame()), ok: true, url: 'https://user.uploads.dev/ok.png' },
    });
    await pending;

    // The streak reset, so it takes a full limit again to disable the engine.
    await expect(generatePerchanceImage({ prompt: 'another failure', timeoutMs: 100 })).rejects.toThrow();
    expect(isPerchanceAvailable()).toBe(true);
  });

  it('resetPerchanceSession brings the engine back', async () => {
    installFakeDom();
    for (let attempt = 0; attempt < PERCHANCE_FAILURE_LIMIT; attempt += 1) {
      await expect(generatePerchanceImage({ prompt: `fail ${attempt}`, timeoutMs: 50 })).rejects.toThrow();
    }
    expect(isPerchanceAvailable()).toBe(false);

    resetPerchanceSession();
    expect(isPerchanceAvailable()).toBe(true);
  });
});
