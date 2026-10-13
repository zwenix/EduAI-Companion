/**
 * Content-generation fallback contract (`src/services/geminiService.ts`).
 *
 * Regression guard for "Cannot generate any content from app":
 *
 * The Content Studio always streams its generation (`stream: true`), and the
 * streaming reader used to abort with a bare `Error('HTTP error! status: 500')`.
 * That error carried no `status`, so `isBackendUnavailable()` classified it as a
 * terminal failure: the on-device Gemini engine was never tried, the alternative
 * engines were never tried, and the classroom ended up with a spinner, no
 * content and no explanation.
 *
 * These tests pin the intended chain:
 *   backend → on-device Gemini → alternative engines (Qwen 3.8 Max → Nemotron)
 * and assert that a healthy backend stream still parses as before.
 *
 * All network access is mocked; nothing here touches a real API.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const googleAttempts: string[] = [];
let googleBehaviour: 'fail' | 'succeed' = 'fail';

const GEMINI_ENVELOPE = JSON.stringify({
  content: '<section>on-device Gemini content</section>',
  memo: 'memo',
  rubric: 'rubric',
  assessmentCriteria: 'criteria',
  successIndicators: ['indicator'],
  imagePrompt: 'illustration prompt',
});

const RESCUE_ENVELOPE = JSON.stringify({
  content: '<section>Qwen rescue content</section>',
  memo: 'memo',
  rubric: 'rubric',
  assessmentCriteria: 'criteria',
  successIndicators: ['indicator'],
  imagePrompt: 'illustration prompt',
});

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: async (options: any) => {
        googleAttempts.push(String(options?.model));
        if (googleBehaviour === 'fail') {
          throw Object.assign(new Error('429 Too Many Requests: quota exceeded'), { status: 429 });
        }
        return { text: GEMINI_ENVELOPE };
      },
    };
  },
}));

const axiosPost = vi.fn();
vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => axiosPost(...args),
    get: vi.fn(),
  },
}));

const input = {
  grade: '4',
  subject: 'Mathematics',
  topic: 'Fractions',
  contentType: 'Worksheet',
  language: 'English',
  term: '1',
};

const backendError = (status: number) =>
  new Response(JSON.stringify({ error: 'Gemini server error: fetch failed' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const streamResponse = (payload: any) =>
  new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
        controller.close();
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  );

beforeEach(() => {
  googleAttempts.length = 0;
  googleBehaviour = 'fail';
  axiosPost.mockReset();

  // `checkAndReportApiError` dispatches a CustomEvent on window.
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const loadService = async () => await import('../src/services/geminiService');

describe('streaming generation fallback chain', () => {
  it('tries the on-device Gemini engine when the backend answers 5xx (the regression)', async () => {
    (globalThis as any).fetch = async () => backendError(500);
    googleBehaviour = 'succeed';

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    expect(googleAttempts.length).toBeGreaterThan(0);
    expect(result.content).toContain('on-device Gemini content');
    // A working on-device engine means no alternative provider is needed.
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it.each([401, 402, 403, 404, 429, 500, 502, 503, 504])(
    'treats HTTP %i from the backend as recoverable, not terminal',
    async (status) => {
      (globalThis as any).fetch = async () => backendError(status);
      googleBehaviour = 'succeed';

      const { generateCAPSContent } = await loadService();
      const result = await generateCAPSContent(input, () => {});

      expect(result.content).toContain('on-device Gemini content');
    },
  );

  it('rescues the generation on Qwen 3.8 Max when both Gemini paths fail', async () => {
    (globalThis as any).fetch = async () => backendError(503);
    axiosPost.mockResolvedValue({
      data: { choices: [{ message: { content: RESCUE_ENVELOPE } }] },
    });

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    expect(googleAttempts.length).toBeGreaterThan(0);
    expect(axiosPost).toHaveBeenCalled();
    const [url] = axiosPost.mock.calls[0];
    expect(String(url)).toContain('compatible-mode/v1/chat/completions');
    expect(result.content).toContain('Qwen rescue content');
  });

  it('only rejects once every engine has been tried', async () => {
    (globalThis as any).fetch = async () => backendError(500);
    axiosPost.mockRejectedValue(new Error('Model Studio unreachable'));

    const { generateCAPSContent } = await loadService();

    await expect(generateCAPSContent(input, () => {})).rejects.toBeInstanceOf(Error);
    expect(googleAttempts.length).toBeGreaterThan(0);
    expect(axiosPost).toHaveBeenCalled();
  });

  it('keeps a healthy streamed backend response working', async () => {
    (globalThis as any).fetch = async () => streamResponse({ final: RESCUE_ENVELOPE });

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    expect(result.content).toContain('Qwen rescue content');
    expect(googleAttempts).toEqual([]);
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it('recovers when the backend dies mid-stream', async () => {
    (globalThis as any).fetch = async () =>
      streamResponse({ error: 'Gemini server error: fetch failed' });
    googleBehaviour = 'succeed';

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    expect(googleAttempts.length).toBeGreaterThan(0);
    expect(result.content).toContain('on-device Gemini content');
  });
});
