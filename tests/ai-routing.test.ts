/**
 * Provider routing & fallback behaviour (`src/services/unifiedAiService.ts`).
 *
 * The product promise is that a provider outage is invisible to the classroom:
 * a failing engine is rolled through the ordered reasoning fallback chain
 * (Nemotron 3 Ultra → DeepSeek v4.1 Flash → Gemini → Lightning → Nano) without
 * surfacing raw provider errors.
 *
 * These tests encode the ACTUAL trigger conditions, including the deliberate
 * ones: quota/429 exhaustion cascades down the chain, while every hop is
 * attempted before the request is given up on.
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
  safeJsonParse: vi.fn(),
}));

const multiAiMocks = vi.hoisted(() => ({
  callMultiAi: vi.fn(),
  performOCR: vi.fn(),
}));

vi.mock('../src/services/geminiService', () => geminiMocks);
vi.mock('../src/services/multiAiService', () => multiAiMocks);
vi.mock('../src/lib/prompt-engine', () => ({
  EduAIPromptEngine: { build: vi.fn(() => 'built-prompt') },
}));
vi.mock('../src/lib/prompt-priority', () => ({
  buildInstructorPriority: vi.fn(() => 'priority'),
  EDUCATIONAL_IMAGE_STYLE: 'image-style',
}));

const { generateEducationalContent, chatWithTutor, runOCRScan } = await import(
  '../src/services/unifiedAiService'
);

/** Gemini answers exactly like the live API does when quota is exhausted. */
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

describe('generateEducationalContent', () => {
  it('uses the selected alternative engine when it succeeds', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('<section>Nemotron content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-deepseek');

    expect(result).toBe('<section>Nemotron content</section>');
    expect(multiAiMocks.callMultiAi).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-deepseek');
    expect(geminiMocks.generateEducationalContent).not.toHaveBeenCalled();
  });

  it('re-routes to Gemini when the alternative engine fails', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.generateEducationalContent.mockResolvedValue('<section>Gemini content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-deepseek');

    expect(geminiMocks.generateEducationalContent).toHaveBeenCalledTimes(1);
    expect(result).toBe('<section>Gemini content</section>');
  });

  it('drops from Gemini to the next reasoning engine when Gemini reports quota exhaustion', async () => {
    geminiMocks.generateEducationalContent.mockRejectedValue(quotaError());
    multiAiMocks.callMultiAi.mockResolvedValue('<section>DeepSeek rescue</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'gemini');

    expect(multiAiMocks.callMultiAi).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-nemotron-lightning');
    expect(result).toBe('<section>DeepSeek rescue</section>');
  });

  it('sends a well-formed system + user message pair to the alternative engine', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');

    await generateEducationalContent('Lesson Plan', 'Grade 5 fractions', 'nvidia-nemotron-nano');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.map((m: any) => m.role)).toEqual(['system', 'user']);
    // `classic` is the default doctrine, so the alternative engine must be given
    // the restored master prompt — not the LIGHT v5 one.
    expect(messages[0].content).toContain(
      'You are the official AI content generator for **EduAI Companion**',
    );
    expect(messages[0].content).toContain('VISUAL STYLING DOCTRINE');
    expect(messages[0].content).not.toBe('LIGHT MASTER SYSTEM PROMPT');
    expect(messages[1].content).toContain('Grade 5 fractions');
  });

  it('gives the alternative engine the LIGHT v5 doctrine when that style is selected', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');
    window.localStorage.setItem('eduai.contentDesignStyle', 'light-v5');

    await generateEducationalContent('Lesson Plan', 'Grade 5 fractions', 'nvidia-deepseek');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(messages[0].content).toContain('LIGHT MASTER SYSTEM PROMPT');
    expect(messages[0].content).not.toContain('VISUAL STYLING DOCTRINE');
  });

  it('still rejects when the whole reasoning fallback chain fails', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.generateEducationalContent.mockRejectedValue(gatewayError());

    await expect(
      generateEducationalContent('Worksheet', 'Grade 2 maths', 'nvidia-deepseek'),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rolls a non-quota Gemini error to the next engine in the chain', async () => {
    geminiMocks.generateEducationalContent.mockRejectedValue(
      new Error('Unexpected token in JSON at position 0'),
    );
    multiAiMocks.callMultiAi.mockResolvedValue('<section>rolled content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'gemini');

    expect(multiAiMocks.callMultiAi).toHaveBeenCalled();
    expect(result).toBe('<section>rolled content</section>');
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

  it('drops from Gemini to the next reasoning engine when the tutor hits quota', async () => {
    geminiMocks.chatWithTutor.mockRejectedValue(quotaError());
    multiAiMocks.callMultiAi.mockResolvedValue('Nemotron tutor reply');

    const result = await chatWithTutor(tutorTurn('Hi'), 'gemini');

    expect(multiAiMocks.callMultiAi).toHaveBeenCalled();
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('nvidia-nemotron-lightning');
    expect(result).toBe('Nemotron tutor reply');
  });

  it('refuses to fall back when the turn carries an image (text models cannot read it)', async () => {
    geminiMocks.chatWithTutor.mockRejectedValue(quotaError());
    const imageTurn = [
      { role: 'user', parts: [{ text: 'What is wrong here?' }, { inlineData: { mimeType: 'image/png', data: 'AAA' } }] },
    ];

    await expect(chatWithTutor(imageTurn, 'gemini')).rejects.toThrow(/quota is exceeded/i);
    expect(multiAiMocks.callMultiAi).not.toHaveBeenCalled();
  });

  it('always starts the OpenAI-style conversation with a system + user turn', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');

    await chatWithTutor(tutorTurn('Explain photosynthesis'), 'nvidia-deepseek');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toMatch(/South African/i);
    expect(messages.some((m: any) => m.role === 'user')).toBe(true);
  });
});

describe('runOCRScan', () => {
  it('uses the NVIDIA Vision/OCR engine and forwards visionEngine=nvidia', async () => {
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'handwritten answer' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'nvidia-nemotron-ultra', 'nvidia-vision');

    expect(result).toEqual({ extractedText: 'handwritten answer' });
    expect(geminiMocks.runOCRScan).toHaveBeenCalledWith('data:image/png;base64,AAA', 'English', true, 'nvidia');
    expect(multiAiMocks.performOCR).not.toHaveBeenCalled();
  });

  it('uses Google OCR/Imaging and forwards visionEngine=google', async () => {
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'google vision text' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'nvidia-nemotron-ultra', 'gemini');

    expect(result).toEqual({ extractedText: 'google vision text' });
    expect(geminiMocks.runOCRScan).toHaveBeenCalledWith('data:image/png;base64,AAA', 'English', true, 'google');
    expect(multiAiMocks.performOCR).not.toHaveBeenCalled();
  });

  it('falls back to OCR.space when the Vision/OCR engine hits quota', async () => {
    geminiMocks.runOCRScan.mockRejectedValue(quotaError());
    multiAiMocks.performOCR.mockResolvedValue('ocr space text');

    const result = await runOCRScan('data:image/png;base64,AAA', 'nvidia-nemotron-ultra', 'nvidia-vision');

    expect(multiAiMocks.performOCR).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ extractedText: 'ocr space text' });
  });

  it('falls back to the Vision/OCR engine when OCR.space fails', async () => {
    multiAiMocks.performOCR.mockRejectedValue(new Error('ocr.space down'));
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'vision rescue text' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'nvidia-nemotron-ultra', 'ocrspace');

    expect(result).toEqual({ extractedText: 'vision rescue text' });
  });
});
