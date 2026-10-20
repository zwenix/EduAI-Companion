import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePerchanceImageClient, pickPerchanceResolution, PERCHANCE_API_URL, PERCHANCE_EMBED_HOST, PERCHANCE_GENERATOR_PAGE } from '../src/services/perchanceService';

type Handler = (e: any) => void;

/** Minimal browser stand-in: iframes "load" and the Perchance API page answers. */
const installFakeBrowser = (reply: (src: URL, post: (data: any, origin?: string) => void) => void) => {
  const handlers: Handler[] = [];
  const frames: any[] = [];
  const post = (data: any, origin = 'https://perchance.org') => handlers.slice().forEach((h) => h({ origin, data }));

  const document = {
    body: {
      appendChild: (frame: any) => {
        frames.push(frame);
        const src = String(frame.src);
        if (src.startsWith(PERCHANCE_API_URL)) {
          setTimeout(() => reply(new URL(src), post), 0);
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
    removeEventListener: (_: string, h: Handler) => { const i = handlers.indexOf(h); if (i >= 0) handlers.splice(i, 1); },
  };
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  return { frames, post, handlers };
};

describe('pickPerchanceResolution', () => {
  it('maps any request onto the four sizes Perchance supports', () => {
    expect(pickPerchanceResolution(1024, 1024)).toBe('768x768');
    expect(pickPerchanceResolution(800, 600)).toBe('768x512');
    expect(pickPerchanceResolution(768, 1024)).toBe('512x768');
  });
});

describe('generatePerchanceImageClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests the Perchance Image API in a hidden iframe and returns the hosted URL', async () => {
    let requested: URL | undefined;
    const env = installFakeBrowser((src, post) => {
      requested = src;
      post({ api: 'perchance-image-api', result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/abc.jpeg' } });
    });
    const url = await generatePerchanceImageClient('a lion', 800, 600, 7, 2000);
    expect(url).toBe('https://user.uploads.dev/abc.jpeg');
    expect(requested!.searchParams.get('prompt')).toBe('a lion');
    expect(requested!.searchParams.get('format')).toBe('json');
    expect(requested!.searchParams.get('resolution')).toBe('768x512');
    expect(requested!.searchParams.get('seed')).toBe('7');
    // listener and iframe are cleaned up
    expect(env.handlers.length).toBe(0);
  });

  it('ignores replies for other requests and from other origins', async () => {
    installFakeBrowser((src, post) => {
      post({ api: 'perchance-image-api', result: { id: 'someone-else', ok: true, url: 'https://user.uploads.dev/wrong.jpeg' } });
      post({ api: 'perchance-image-api', result: { id: src.searchParams.get('id'), ok: true, url: 'https://evil.example/x.png' } }, 'https://evil.example');
      post({ api: 'perchance-image-api', result: { id: src.searchParams.get('id'), ok: true, url: 'https://user.uploads.dev/right.jpeg' } });
    });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 2000)).resolves.toBe('https://user.uploads.dev/right.jpeg');
  });

  it('rejects when the API reports a failure', async () => {
    installFakeBrowser((src, post) => {
      post({ api: 'perchance-image-api', result: { id: src.searchParams.get('id'), ok: false, error: 'blocked' } });
    });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 2000)).rejects.toThrow('blocked');
  });

  it('times out so the provider chain can move on', async () => {
    installFakeBrowser(() => { /* never answers */ });
    await expect(generatePerchanceImageClient('a cat', 1024, 1024, 1, 50)).rejects.toThrow(/timed out/);
  });
});

describe('embed host', () => {
  it('frames Perchance only through null.perchance.org (perchance.org itself sends X-Frame-Options: sameorigin)', () => {
    expect(PERCHANCE_EMBED_HOST).toBe('https://null.perchance.org');
    expect(PERCHANCE_API_URL.startsWith('https://null.perchance.org/')).toBe(true);
    expect(PERCHANCE_GENERATOR_PAGE).toBe('https://perchance.org/ai-images-generator');
  });
});
