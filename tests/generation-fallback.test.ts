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
 *   backend → on-device Gemini → NVIDIA NIM engines, in the frozen reasoning
 *   order (Nemotron 3 Ultra → DeepSeek V4.1 Flash → Nemotron 3.5 Lightning)
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
  content: '<section>NIM rescue content</section>',
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

  it('rescues the generation on Nemotron 3.5 Lightning (Gemini\'s own fallback) when both Gemini paths fail', async () => {
    (globalThis as any).fetch = async () => backendError(503);
    axiosPost.mockResolvedValue({
      data: { choices: [{ message: { content: RESCUE_ENVELOPE } }] },
    });

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    expect(googleAttempts.length).toBeGreaterThan(0);
    expect(axiosPost).toHaveBeenCalled();
    const [url, body] = axiosPost.mock.calls[0];
    // Every last-resort engine is an NVIDIA NIM model — never Model Studio.
    expect(String(url)).toContain('integrate.api.nvidia.com/v1/chat/completions');
    expect(String(url)).not.toContain('aliyuncs');
    // Gemini is tertiary, so the engine after it in the frozen chain answers first.
    expect(body.model).toBe('nvidia/nemotron-3.5-lightning-30b-a3b');
    expect(result.content).toContain('NIM rescue content');
  });

  it('keeps walking the chain (Ultra, then DeepSeek) when Lightning also fails', async () => {
    (globalThis as any).fetch = async () => backendError(503);
    axiosPost
      .mockRejectedValueOnce(new Error('NIM 503 for lightning'))
      .mockRejectedValueOnce(new Error('NIM 503 for ultra'))
      .mockResolvedValue({
        data: { choices: [{ message: { content: RESCUE_ENVELOPE } }] },
      });

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    // After Gemini: Lightning → Ultra → DeepSeek (the chain wraps around).
    expect(axiosPost.mock.calls.map((c: any[]) => c[1].model)).toEqual([
      'nvidia/nemotron-3.5-lightning-30b-a3b',
      'nvidia/nemotron-ultra-550b-a55b',
      'nvidia/deepseek-v4.1-flash',
    ]);
    expect(result.content).toContain('NIM rescue content');
  });

  it('only rejects once every engine has been tried', async () => {
    (globalThis as any).fetch = async () => backendError(500);
    axiosPost.mockRejectedValue(new Error('NVIDIA NIM unreachable'));

    const { generateCAPSContent } = await loadService();

    await expect(generateCAPSContent(input, () => {})).rejects.toBeInstanceOf(Error);
    expect(googleAttempts.length).toBeGreaterThan(0);
    expect(axiosPost).toHaveBeenCalled();
  });

  it('keeps a healthy streamed backend response working', async () => {
    (globalThis as any).fetch = async () => streamResponse({ final: RESCUE_ENVELOPE });

    const { generateCAPSContent } = await loadService();
    const result = await generateCAPSContent(input, () => {});

    expect(result.content).toContain('NIM rescue content');
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
