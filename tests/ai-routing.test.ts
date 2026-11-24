/**
 * Provider routing & fallback behaviour (`src/services/unifiedAiService.ts`).
 *
 * The product promise is that a provider outage is invisible to the classroom.
 * The fallback order is now the FROZEN chain from `src/lib/aiModels.ts`
 * (AGENTS.md §1) — it is the single contract these tests pin:
 *
 *   reasoning: Nemotron 3 Ultra → DeepSeek V4.1 Flash → Gemini → Lightning
 *   vision:    Super VL → Llama 3.2 90B Vision → Gemini → OCR.space
 *
 * Alibaba Qwen 3.8 Max is REMOVED: no request may ever reach it, and every
 * retired Qwen id resolves to DeepSeek V4.1 Flash.
 *
 * All network calls are mocked; nothing here touches a real API.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const geminiMocks = vi.hoisted(() => ({
  generateEducationalContent: vi.fn(),
  generateCAPSContent: vi.fn(),
  generateVisualAid: vi.fn(),
  generateAdminDoc: vi.fn(),
  runOCRAndGrade: vi.fn(),
  runOCRScan: vi.fn(),
  runTextGrade: vi.fn(),
  chatWithTutor: vi.fn(),
  MASTER_SYSTEM_PROMPT: 'MASTER SYSTEM PROMPT',
  LIGHT_MASTER_SYSTEM_PROMPT: 'LIGHT MASTER SYSTEM PROMPT',
  IMAGE_PROMPT_GOLDEN_RULE: 'GOLDEN RULE',
  safeJsonParse: vi.fn((raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }),
}));

const multiAiMocks = vi.hoisted(() => ({
  callMultiAi: vi.fn(),
  callVisionAi: vi.fn(),
  performOCR: vi.fn(),
}));

vi.mock('../src/services/geminiService', () => geminiMocks);
vi.mock('../src/services/multiAiService', () => multiAiMocks);
vi.mock('../src/lib/prompt-engine', () => ({
  EduAIPromptEngine: {
    build: vi.fn(() => 'built-prompt'),
    assemblePrompt: vi.fn(() => ({ system: 'system prompt', user: 'user prompt' })),
  },
}));
vi.mock('../src/lib/prompt-priority', () => ({
  buildInstructorPriority: vi.fn(() => 'priority'),
  EDUCATIONAL_IMAGE_STYLE: 'image-style',
}));

const { generateEducationalContent, chatWithTutor, runOCRScan } = await import(
  '../src/services/unifiedAiService'
);

/** A Gemini answer that mimics the live API when quota is exhausted. */
const quotaError = () =>
  Object.assign(new Error('429 Too Many Requests: quota exceeded for gemini-3.8-flash'), {
    response: { status: 429, data: { error: { message: 'quota exceeded' } } },
  });

const gatewayError = (status = 503) =>
  Object.assign(new Error('upstream unavailable'), {
    response: { status, data: { error: { message: 'service unavailable' } } },
  });

/** A realistic Gemini-style tutor turn (parts-based, not content-based). */
const tutorTurn = (text: string) => [{ role: 'user', parts: [{ text }] }];

/**
 * Minimal `window.localStorage` stub — the suite runs in the `node` environment
 * (see `vitest.config.ts`). `contentStyle` reads the teacher's saved design
 * doctrine from here, so the tests need it present and empty by default.
 */
const designStyleStore = new Map<string, string>();

beforeEach(() => {
  vi.clearAllMocks();
  designStyleStore.clear();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => (designStyleStore.has(key) ? designStyleStore.get(key)! : null),
      setItem: (key: string, value: string) => void designStyleStore.set(key, String(value)),
      removeItem: (key: string) => void designStyleStore.delete(key),
      clear: () => designStyleStore.clear(),
    },
  };
});

describe('generateEducationalContent — reasoning chain', () => {
  it('uses the selected NIM engine when it succeeds', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('<section>DeepSeek content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-deepseek-flash');

    expect(result).toBe('<section>DeepSeek content</section>');
    expect(multiAiMocks.callMultiAi).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-deepseek-flash');
    expect(geminiMocks.generateEducationalContent).not.toHaveBeenCalled();
  });

  it('defaults to Nemotron 3 Ultra as the PRIMARY engine', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('<section>Ultra content</section>');

    await generateEducationalContent('Worksheet', 'Grade 2 maths');

    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-nemotron-ultra');
  });

  it('falls from Nemotron 3 Ultra to DeepSeek V4.1 Flash, not straight to Gemini', async () => {
    multiAiMocks.callMultiAi
      .mockRejectedValueOnce(gatewayError())
      .mockResolvedValueOnce('<section>DeepSeek rescue</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-nemotron-ultra');

    expect(result).toBe('<section>DeepSeek rescue</section>');
    expect(multiAiMocks.callMultiAi.mock.calls.map((c: any[]) => c[0])).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek-flash',
    ]);
    expect(geminiMocks.generateEducationalContent).not.toHaveBeenCalled();
  });

  it('reaches Gemini only after both NIM engines fail', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.generateEducationalContent.mockResolvedValue('<section>Gemini content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-nemotron-ultra');

    expect(result).toBe('<section>Gemini content</section>');
    expect(geminiMocks.generateEducationalContent).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls.map((c: any[]) => c[0])).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek-flash',
    ]);
  });

  it('still lands on Nemotron 3.5 Lightning after Gemini, as the chain specifies', async () => {
    multiAiMocks.callMultiAi
      .mockRejectedValueOnce(gatewayError())
      .mockRejectedValueOnce(gatewayError())
      .mockResolvedValueOnce('<section>Lightning rescue</section>');
    geminiMocks.generateEducationalContent.mockRejectedValue(gatewayError());

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-nemotron-ultra');

    expect(result).toBe('<section>Lightning rescue</section>');
    expect(multiAiMocks.callMultiAi.mock.calls.map((c: any[]) => c[0])).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek-flash',
      'nvidia-nemotron-lightning',
    ]);
  });

  it('drops from Gemini to Nemotron 3.5 Lightning when Gemini reports quota exhaustion', async () => {
    geminiMocks.generateEducationalContent.mockRejectedValue(quotaError());
    multiAiMocks.callMultiAi.mockResolvedValue('<section>Lightning rescue</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'gemini');

    expect(result).toBe('<section>Lightning rescue</section>');
    expect(multiAiMocks.callMultiAi).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-nemotron-lightning');
  });

  it('never routes to the removed Qwen engine', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');

    await generateEducationalContent('Worksheet', 'Grade 2 maths', 'alibaba-qwen');

    for (const call of multiAiMocks.callMultiAi.mock.calls) {
      expect(call[0]).not.toMatch(/qwen/i);
    }
  });

  it('sends a well-formed system + user message pair to the alternative engine', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');

    await generateEducationalContent('Lesson Plan', 'Grade 5 fractions', 'nvidia-nemotron-nano');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.map((m: any) => m.role)).toEqual(['system', 'user']);
    // `classic` is the default doctrine, so the alternative engine must be given
    // the restored master prompt — not the LIGHT v5 one.
    expect(messages[0].content).toContain('You are the official AI content generator for **EduAI Companion**');
    expect(messages[0].content).toContain('VISUAL STYLING DOCTRINE');
    expect(messages[0].content).not.toBe('LIGHT MASTER SYSTEM PROMPT');
    expect(messages[1].content).toContain('Grade 5 fractions');
  });

  it('gives the alternative engine the LIGHT v5 doctrine when that style is selected', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');
    window.localStorage.setItem('eduai.contentDesignStyle', 'light-v5');

    await generateEducationalContent('Lesson Plan', 'Grade 5 fractions', 'nvidia-deepseek-flash');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(messages[0].content).toContain('LIGHT MASTER SYSTEM PROMPT');
    expect(messages[0].content).not.toContain('VISUAL STYLING DOCTRINE');
  });

  it('rejects only when every engine in the chain fails', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.generateEducationalContent.mockRejectedValue(gatewayError());

    await expect(
      generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-deepseek-flash'),
    ).rejects.toBeInstanceOf(Error);
  });

  it('falls back even on an unexpected (non-quota) Gemini error — every model has a fallback', async () => {
    geminiMocks.generateEducationalContent.mockRejectedValue(
      new Error('Unexpected token in JSON at position 0'),
    );
    multiAiMocks.callMultiAi.mockResolvedValue('<section>Lightning content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'gemini');

    expect(result).toBe('<section>Lightning content</section>');
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-nemotron-lightning');
  });
});

describe('chatWithTutor', () => {
  it('falls back to the Gemini tutor when the selected engine fails', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.chatWithTutor.mockResolvedValue('Hello, learner!');

    const result = await chatWithTutor(tutorTurn('Explain fractions'), 'nvidia-nemotron-ultra');

    expect(result).toBe('Hello, learner!');
    expect(geminiMocks.chatWithTutor).toHaveBeenCalledTimes(1);
  });

  it('drops from Gemini to Nemotron 3.5 Lightning when the tutor hits quota', async () => {
    geminiMocks.chatWithTutor.mockRejectedValue(quotaError());
    multiAiMocks.callMultiAi.mockResolvedValue('Lightning tutor reply');

    const result = await chatWithTutor(tutorTurn('Hi'), 'gemini');

    expect(result).toBe('Lightning tutor reply');
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-nemotron-lightning');
  });

  it('sends image turns to Gemini vision (text models cannot read images)', async () => {
    geminiMocks.chatWithTutor.mockRejectedValue(quotaError());
    const imageTurn = [
      { role: 'user', parts: [{ text: 'What is wrong here?' }, { inlineData: { mimeType: 'image/png', data: 'AAA' } }] },
    ];

    await expect(chatWithTutor(imageTurn, 'nvidia-nemotron-ultra')).rejects.toThrow(/quota/i);
    expect(multiAiMocks.callMultiAi).not.toHaveBeenCalled();
  });

  it('always starts the OpenAI-style conversation with a system + user turn', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');

    await chatWithTutor(tutorTurn('Explain photosynthesis'), 'nvidia-deepseek-flash');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toMatch(/South African/i);
    expect(messages.some((m: any) => m.role === 'user')).toBe(true);
  });
});

describe('runOCRScan — vision chain', () => {
  it('uses Nemotron 3.5 Super VL by default, with the image sent to NIM', async () => {
    multiAiMocks.callVisionAi.mockResolvedValue('handwritten answer');

    const result = await runOCRScan('data:image/png;base64,AAA');

    expect(result).toEqual({ extractedText: 'handwritten answer' });
    const [provider, messages] = multiAiMocks.callVisionAi.mock.calls[0];
    expect(provider).toBe('nvidia-nemotron-super-vl');
    const parts = messages[0].content;
    expect(parts[0].type).toBe('text');
    expect(parts[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,AAA' },
    });
    expect(multiAiMocks.performOCR).not.toHaveBeenCalled();
  });

  it('wraps bare base64 blobs in a JPEG data URL', async () => {
    multiAiMocks.callVisionAi.mockResolvedValue('text');

    await runOCRScan('AAA', 'data');
    const [, messages] = multiAiMocks.callVisionAi.mock.calls[0];
    expect(messages[0].content[1].image_url.url).toBe('data:image/jpeg;base64,AAA');
  });

  it('falls from Super VL to Llama 3.2 90B Vision on a NIM failure', async () => {
    multiAiMocks.callVisionAi
      .mockRejectedValueOnce(gatewayError())
      .mockResolvedValueOnce('llama text');

    const result = await runOCRScan('data:image/png;base64,AAA');

    expect(result).toEqual({ extractedText: 'llama text' });
    expect(multiAiMocks.callVisionAi.mock.calls.map((c: any[]) => c[0])).toEqual([
      'nvidia-nemotron-super-vl',
      'nvidia-llama-vision',
    ]);
  });

  it('reaches Gemini vision only after both NIM vision models fail', async () => {
    multiAiMocks.callVisionAi.mockRejectedValue(gatewayError());
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'gemini vision text' });

    const result = await runOCRScan('data:image/png;base64,AAA');

    expect(result).toEqual({ extractedText: 'gemini vision text' });
    expect(multiAiMocks.callVisionAi).toHaveBeenCalledTimes(2);
  });

  it('ends at OCR.space when every vision model is down', async () => {
    multiAiMocks.callVisionAi.mockRejectedValue(gatewayError());
    geminiMocks.runOCRScan.mockRejectedValue(quotaError());
    multiAiMocks.performOCR.mockResolvedValue('ocr space text');

    const result = await runOCRScan('data:image/png;base64,AAA');

    expect(result).toEqual({ extractedText: 'ocr space text' });
    expect(multiAiMocks.performOCR).toHaveBeenCalledTimes(1);
  });

  it('uses Gemini vision when it is the selected OCR engine', async () => {
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'handwritten answer' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'data', 'gemini');

    expect(result).toEqual({ extractedText: 'handwritten answer' });
    expect(multiAiMocks.callVisionAi).not.toHaveBeenCalled();
  });

  it('gives OCR.space a fallback instead of dead-ending', async () => {
    multiAiMocks.performOCR.mockRejectedValue(new Error('ocr.space down'));
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'gemini rescue text' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'data', 'ocrspace');

    expect(result).toEqual({ extractedText: 'gemini rescue text' });
  });
});
