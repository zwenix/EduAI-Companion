/**
 * Provider routing & fallback behaviour (`src/services/unifiedAiService.ts`).
 *
 * The product promise is that a provider outage is invisible to the classroom:
 * an alternative engine that fails is re-routed to Gemini, and Gemini that runs
 * out of quota drops through to Qwen — without surfacing raw provider errors.
 *
 * These tests encode the ACTUAL trigger conditions, including the deliberate
 * ones: quota/429 exhaustion cascades, while an unexpected (non-quota) Gemini
 * error is surfaced rather than masked by a second provider attempt.
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateEducationalContent', () => {
  it('uses the selected alternative engine when it succeeds', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('<section>Qwen content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'alibaba-qwen');

    expect(result).toBe('<section>Qwen content</section>');
    expect(multiAiMocks.callMultiAi).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('alibaba-qwen');
    expect(geminiMocks.generateEducationalContent).not.toHaveBeenCalled();
  });

  it('re-routes to Gemini when the alternative engine fails', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.generateEducationalContent.mockResolvedValue('<section>Gemini content</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'alibaba-qwen');

    expect(geminiMocks.generateEducationalContent).toHaveBeenCalledTimes(1);
    expect(result).toBe('<section>Gemini content</section>');
  });

  it('drops from Gemini to Qwen when Gemini reports quota exhaustion', async () => {
    geminiMocks.generateEducationalContent.mockRejectedValue(quotaError());
    multiAiMocks.callMultiAi.mockResolvedValue('<section>Qwen rescue</section>');

    const result = await generateEducationalContent('Worksheet', 'Grade 2 maths', 'gemini');

    expect(multiAiMocks.callMultiAi).toHaveBeenCalledTimes(1);
    expect(multiAiMocks.callMultiAi.mock.calls[0][0]).toBe('alibaba-qwen');
    expect(result).toBe('<section>Qwen rescue</section>');
  });

  it('sends a well-formed system + user message pair to the alternative engine', async () => {
    multiAiMocks.callMultiAi.mockResolvedValue('ok');

    await generateEducationalContent('Lesson Plan', 'Grade 5 fractions', 'nvidia-nemotron-nano');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.map((m: any) => m.role)).toEqual(['system', 'user']);
    expect(messages[0].content).toContain('MASTER SYSTEM PROMPT');
    expect(messages[1].content).toContain('Grade 5 fractions');
  });

  it('still rejects when both the alternative engine and Gemini fail', async () => {
    multiAiMocks.callMultiAi.mockRejectedValue(gatewayError());
    geminiMocks.generateEducationalContent.mockRejectedValue(gatewayError());

    await expect(
      generateEducationalContent('Worksheet', 'Grade 2 maths', 'alibaba-qwen'),
    ).rejects.toBeInstanceOf(Error);
  });

  it('surfaces an unexpected Gemini error instead of masking it with a second provider', async () => {
    geminiMocks.generateEducationalContent.mockRejectedValue(
      new Error('Unexpected token in JSON at position 0'),
    );

    await expect(
      generateEducationalContent('Worksheet', 'Grade 2 maths', 'gemini'),
    ).rejects.toThrow(/Unexpected token/);
    expect(multiAiMocks.callMultiAi).not.toHaveBeenCalled();
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

  it('drops from Gemini to Qwen when the tutor hits quota', async () => {
    geminiMocks.chatWithTutor.mockRejectedValue(quotaError());
    multiAiMocks.callMultiAi.mockResolvedValue('Qwen tutor reply');

    const result = await chatWithTutor(tutorTurn('Hi'), 'gemini');

    expect(result).toBe('Qwen tutor reply');
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

    await chatWithTutor(tutorTurn('Explain photosynthesis'), 'alibaba-qwen');

    const [, messages] = multiAiMocks.callMultiAi.mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toMatch(/South African/i);
    expect(messages.some((m: any) => m.role === 'user')).toBe(true);
  });
});

describe('runOCRScan', () => {
  it('uses Gemini vision when it is the selected OCR engine', async () => {
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'handwritten answer' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'gemini', 'gemini');

    expect(result).toEqual({ extractedText: 'handwritten answer' });
    expect(multiAiMocks.performOCR).not.toHaveBeenCalled();
  });

  it('falls back to OCR.space when Gemini vision hits quota', async () => {
    geminiMocks.runOCRScan.mockRejectedValue(quotaError());
    multiAiMocks.performOCR.mockResolvedValue('ocr space text');

    const result = await runOCRScan('data:image/png;base64,AAA', 'gemini', 'gemini');

    expect(multiAiMocks.performOCR).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ extractedText: 'ocr space text' });
  });

  it('falls back to Gemini vision when OCR.space fails', async () => {
    multiAiMocks.performOCR.mockRejectedValue(new Error('ocr.space down'));
    geminiMocks.runOCRScan.mockResolvedValue({ extractedText: 'gemini rescue text' });

    const result = await runOCRScan('data:image/png;base64,AAA', 'gemini', 'ocrspace');

    expect(result).toEqual({ extractedText: 'gemini rescue text' });
  });
});
