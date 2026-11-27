/**
 * Document illustration engine — "Perchance is the PRIMARY generator".
 *
 * REGRESSION GUARD for the report: *"the app bypasses Perchance and goes
 * straight to Pollinations."*
 *
 * Cause: generated documents emitted `<img src="/api/image-proxy?…">`, and
 * `/api/image-proxy` renders with **Pollinations**. The browser-only Perchance
 * engine (`perchance.org/perchance-ai-api` via hidden iframe + postMessage) was
 * never part of that path at all, so the primary engine could not win no matter
 * how it was configured in Settings.
 *
 * These tests pin the corrected contract:
 *   1. the document path resolves through the browser engine chain, PRIMARY
 *      FIRST (Perchance by default);
 *   2. it never emits a Pollinations-only URL as the resolved artwork;
 *   3. a failing primary still ends with a renderable picture (graceful
 *      fallback, the engine graph intact);
 *   4. the breaker reports itself instead of failing silently.
 *
 * No network is touched: the Perchance transport is a fake DOM, and the other
 * engines are stubbed through the module under test.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const engines = vi.hoisted(() => ({
  perchance: vi.fn(),
  flux: vi.fn(),
  gemini: vi.fn(),
  pollinations: vi.fn(),
}));

const perchanceState = vi.hoisted(() => ({
  benching: false,
  runtime: true,
  info: {
    state: 'idle' as 'idle' | 'retrying' | 'benched',
    consecutiveFailures: 0,
    benchUntil: 0,
    lastError: null as string | null,
    lastFailureAt: null as number | null,
  },
}));

vi.mock('../src/lib/imageGeneration', () => ({
  generateImagePerchance: (...args: any[]) => engines.perchance(...args),
  generateImageFlux: (...args: any[]) => engines.flux(...args),
  generateImageGemini: (...args: any[]) => engines.gemini(...args),
  generateImagePollinations: (...args: any[]) => engines.pollinations(...args),
  buildPollinationsUrl: (prompt: string, width = 800, height = 600, seed = 1) =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`,
  PollinationsRateLimitError: class PollinationsRateLimitError extends Error {},
}));

vi.mock('../src/services/perchanceClient', () => ({
  isPerchanceBenching: () => perchanceState.benching,
  isPerchanceRuntimeAvailable: () => perchanceState.runtime,
  perchanceFailureInfo: () => perchanceState.info,
  resetPerchanceBench: () => {
    perchanceState.benching = false;
  },
}));

const {
  resolveDocumentIllustration,
  buildSeedIllustrationUrl,
  documentImageTelemetry,
  resetDocumentImageTelemetry,
  retryPerchanceNow,
  selectedImageEngine,
} = await import('../src/lib/documentImageEngine');
const { IMAGE_PROVIDER_PRIORITY, getImageProviderOrder } = await import('../src/lib/imageProviders');

const setSelectedEngine = (id: string) => {
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => (key === 'eduai_image_provider' ? id : null),
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  resetDocumentImageTelemetry();
  perchanceState.benching = false;
  perchanceState.runtime = true;
  perchanceState.info = {
    state: 'idle',
    consecutiveFailures: 0,
    benchUntil: 0,
    lastError: null,
    lastFailureAt: null,
  };
  setSelectedEngine('perchance');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('document illustrations use Perchance FIRST', () => {
  it('resolves through Perchance and never reaches Pollinations', async () => {
    engines.perchance.mockResolvedValue('https://user.uploads.dev/lesson-art.jpeg');

    const result = await resolveDocumentIllustration('Life cycle of a frog', { width: 800, height: 600, seed: 42 });

    expect(result.provider).toBe('perchance');
    expect(result.url).toBe('https://user.uploads.dev/lesson-art.jpeg');
    expect(engines.perchance).toHaveBeenCalledTimes(1);
    // The old bug: Pollinations rendered the document. It must not be touched.
    expect(engines.pollinations).not.toHaveBeenCalled();
    expect(engines.flux).not.toHaveBeenCalled();
    expect(engines.gemini).not.toHaveBeenCalled();
  });

  it('passes the document size, seed and SA context to Perchance', async () => {
    engines.perchance.mockResolvedValue('https://user.uploads.dev/x.jpeg');

    await resolveDocumentIllustration('Water cycle poster', { width: 800, height: 600, seed: 7, grade: 'Grade 4', subject: 'Natural Sciences' });

    const [, width, height, options] = engines.perchance.mock.calls[0];
    expect(width).toBe(800);
    expect(height).toBe(600);
    expect(options).toMatchObject({ seed: 7, grade: 'Grade 4', subject: 'Natural Sciences', saContext: true });
  });

  it('honours an explicit selection instead of hardcoding Perchance', async () => {
    setSelectedEngine('flux');
    engines.flux.mockResolvedValue({ url: 'https://flux.example/art.webp' });

    const result = await resolveDocumentIllustration('A protea', {});

    expect(result.provider).toBe('flux');
    expect(engines.flux).toHaveBeenCalledTimes(1);
    expect(engines.perchance).not.toHaveBeenCalled();
  });

  it('defaults to Perchance when nothing is stored', async () => {
    (globalThis as any).window = {
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
    };
    expect(selectedImageEngine()).toBe('perchance');
    expect(IMAGE_PROVIDER_PRIORITY[0]).toBe('perchance');
  });
});

describe('graceful fallback when the primary engine cannot answer', () => {
  it('walks Perchance → FLUX → Gemini → Pollinations, in that order', async () => {
    engines.perchance.mockRejectedValue(new Error('iframe blocked'));
    engines.flux.mockRejectedValue(new Error('no HUGGINGFACE_API_KEY'));
    engines.gemini.mockRejectedValue(new Error('no key'));
    engines.pollinations.mockResolvedValue('https://image.pollinations.ai/prompt/x');

    const result = await resolveDocumentIllustration('A lion', { seed: 3 });

    expect(result.provider).toBe('pollinations');
    expect(engines.perchance).toHaveBeenCalledTimes(1);
    expect(engines.flux).toHaveBeenCalledTimes(1);
    expect(engines.gemini).toHaveBeenCalledTimes(1);
    expect(engines.pollinations).toHaveBeenCalledTimes(1);
    expect(getImageProviderOrder('perchance')).toEqual(['perchance', 'flux', 'gemini', 'pollinations']);
  });

  it('still returns a renderable picture (never a dead URL) when every engine fails', async () => {
    for (const engine of Object.values(engines)) engine.mockRejectedValue(new Error('down'));

    const result = await resolveDocumentIllustration('A zebra crossing', { seed: 11 });

    expect(result.provider).toBe('placeholder');
    expect(result.url.startsWith('https://image.pollinations.ai/prompt/')).toBe(true);
    expect(result.url).toContain('seed=11');
  });

  it('skips a benched Perchance engine but keeps the rest of the graph', async () => {
    perchanceState.benching = true;
    engines.flux.mockResolvedValue({ url: 'https://flux.example/art.webp' });

    const result = await resolveDocumentIllustration('A springbok', {});

    expect(result.provider).toBe('flux');
    expect(engines.perchance).not.toHaveBeenCalled();
  });

  it('skips Perchance outside a browser instead of throwing', async () => {
    perchanceState.runtime = false;
    engines.flux.mockResolvedValue({ url: 'https://flux.example/art.webp' });

    const result = await resolveDocumentIllustration('A meerkat', {});

    expect(result.provider).toBe('flux');
    expect(engines.perchance).not.toHaveBeenCalled();
  });
});

describe('engine telemetry is honest', () => {
  it('records who answered so the UI can name the real engine', async () => {
    engines.perchance.mockResolvedValue('https://user.uploads.dev/a.jpeg');

    await resolveDocumentIllustration('A baobab', {});

    const telemetry = documentImageTelemetry();
    expect(telemetry.attempts.perchance).toBe(1);
    expect(telemetry.successes.perchance).toBe(1);
    expect(telemetry.lastEngine).toBe('perchance');
    expect(telemetry.lastError).toBeNull();
  });

  it('records the failure that forced a fallback', async () => {
    engines.perchance.mockRejectedValue(new Error('Perchance is temporarily benched'));
    engines.flux.mockResolvedValue({ url: 'https://flux.example/art.webp' });

    await resolveDocumentIllustration('A quagga', {});

    expect(documentImageTelemetry().lastEngine).toBe('flux');
    expect(documentImageTelemetry().lastError).toContain('benched');
  });

  it('exposes a retry that clears the bench', () => {
    perchanceState.benching = true;
    retryPerchanceNow();
    expect(perchanceState.benching).toBe(false);
  });
});

describe('seed URL contract', () => {
  it('is engine-agnostic and always renderable', () => {
    const url = buildSeedIllustrationUrl('A poster', 800, 600, 5);
    expect(url).toContain('width=800');
    expect(url).toContain('height=600');
    expect(url).toContain('seed=5');
  });
});

describe('the UI explains a Perchance problem in plain language', () => {
  it('names an X-Frame-Options refusal as a Perchance-side restriction', async () => {
    const { describePerchanceProblem } = await import('../src/lib/documentImageEngine');
    const text = describePerchanceProblem({
      state: 'retrying',
      consecutiveFailures: 1,
      benchUntil: 0,
      lastError: 'Perchance frame was refused (X-Frame-Options) — the embed host could not be loaded',
      lastFailureAt: Date.now(),
    });
    expect(text).toMatch(/refused to load inside the app/i);
    expect(text).toMatch(/not a settings problem/i);
  });

  it('offers the retry for a benched engine and stays quiet when healthy', async () => {
    const { describePerchanceProblem } = await import('../src/lib/documentImageEngine');
    expect(
      describePerchanceProblem({
        state: 'benched',
        consecutiveFailures: 4,
        benchUntil: Date.now() + 60_000,
        lastError: 'Perchance is temporarily benched',
        lastFailureAt: Date.now(),
      }),
    ).toMatch(/Try again/i);
    expect(
      describePerchanceProblem({
        state: 'idle',
        consecutiveFailures: 0,
        benchUntil: 0,
        lastError: null,
        lastFailureAt: null,
      }),
    ).toBeNull();
  });
});
