import {
  generateEducationalContent as geminiGenerateContent,
  generateCAPSContent as geminiGenerateCAPS,
  generateVisualAid as geminiGenerateVisual,
  generateAdminDoc as geminiGenerateAdmin,
  runOCRAndGrade as geminiOCR,
  runOCRScan as geminiOCRScan,
  runTextGrade as geminiTextGrade,
  chatWithTutor as geminiChat,
  LIGHT_MASTER_SYSTEM_PROMPT,
  safeJsonParse
} from './geminiService';

import { callMultiAi, callVisionAi, performOCR } from './multiAiService';
import {
  DEFAULT_AI_PROVIDER,
  DEFAULT_VISION_PROVIDER,
  fallbackChainFor,
  normalizeProviderId,
  visionAttemptOrder,
  type AIProvider,
} from '../lib/aiModels';
import { EduAIPromptEngine } from '../lib/prompt-engine';
import { buildAdminLabPrompts, buildVisualLabPrompts } from '../lib/prompts/lab-prompts';
import { buildClassicEducationalPrompts } from '../lib/prompts/classic-templates';
import { resolveContentDesignStyle } from '../lib/contentStyle';

/**
 * Engine router for text generation, grading and OCR.
 *
 * Fallback priority is NOT decided here — it comes from the frozen registry
 * (`fallbackChainFor()` / `visionAttemptOrder()` in src/lib/aiModels.ts), so the
 * app can never drift from AGENTS.md §1:
 *
 *   reasoning: Nemotron 3 Ultra → DeepSeek V4.1 Flash → Gemini → Lightning
 *   vision:    Super VL → Llama 3.2 90B Vision → Gemini → OCR.space
 */
const isProviderFailure = (error: any): boolean => {
  const status = error?.response?.status || error?.status;

  // Extract all possible error message locations
  const rawMessage = error?.message || '';
  const responseObj = error?.response?.data?.error || error?.response?.data || '';
  const responseMessage = typeof responseObj === 'string'
    ? responseObj
    : responseObj?.message || JSON.stringify(responseObj);
  const combinedMessage = `${rawMessage} ${responseMessage}`.toLowerCase();

  // Any provider failure (status, network, quota, credentials, parse error, …)
  // moves the request to the next engine in the frozen chain.
  const isTransient =
    status === 400 || status === 401 || status === 402 || status === 403 || status === 404 ||
    status === 408 || status === 422 || status === 429 ||
    status === 500 || status === 502 || status === 503 || status === 504 ||
    combinedMessage.includes('quota') ||
    combinedMessage.includes('timeout') ||
    combinedMessage.includes('network') ||
    combinedMessage.includes('not configured') ||
    combinedMessage.includes('api key') ||
    combinedMessage.includes('unauthorized') ||
    combinedMessage.includes('unavailable') ||
    combinedMessage.includes('transitioning') ||
    combinedMessage.includes('fallback') ||
    combinedMessage.includes('invalid key') ||
    combinedMessage.includes('unsupported');

  if (isTransient) {
    console.log(`[AI Routing] Engine requested fallback (${status || 'N/A'}). Advancing down the frozen chain.`);
  } else {
    console.log(`[AI Routing] Advancing down the frozen chain after an engine error.`);
  }

  return true;
};

/**
 * Run `attempt` against every engine in the frozen chain, starting at the
 * selected engine. Guarantees at least one fallback for every model, on ANY
 * error (including unexpected parse errors).
 */
const routeWithFallback = async <T>(
  provider: string,
  handlers: {
    gemini: () => Promise<T>;
    alternative: (provider: AIProvider) => Promise<T>;
  },
): Promise<T> => {
  const start = normalizeProviderId(provider);
  const order: string[] = [start, ...fallbackChainFor(start)];
  let lastError: any;

  for (const engine of order) {
    try {
      return engine === 'gemini'
        ? await handlers.gemini()
        : await handlers.alternative(engine as AIProvider);
    } catch (error: any) {
      lastError = error;
      if (!isProviderFailure(error)) throw error;
    }
  }

  throw lastError ?? new Error('Every reasoning engine failed');
};

/* ── Vision / OCR helpers ──────────────────────────────────────────────────── */

const DATA_URL = /^data:([^;,]+)?(;base64)?,/;

const isDocxItem = (item: string): boolean => {
  const mime = String(item).match(DATA_URL)?.[1] ?? '';
  return /wordprocessingml|msword|officedocument|docx/i.test(mime);
};

/** `data:` URLs pass through; a bare base64 blob becomes a JPEG data URL. */
const toImageUrl = (item: string): string => {
  if (item.startsWith('data:')) return item;
  return `data:image/jpeg;base64,${item}`;
};

/**
 * Build an OpenAI-compatible vision message. NIM vision models accept
 * `image_url` parts exactly like this, on the proxy and in the APK alike.
 * DOCX uploads cannot be read by a vision model and are handled by the Gemini
 * path instead, so they are filtered out here.
 */
const buildVisionMessages = (imageData: string | string[], prompt: string): any[] | null => {
  const items = (Array.isArray(imageData) ? imageData : [imageData]).filter(Boolean) as string[];
  const images = items.filter((item) => !isDocxItem(item) && !/^data:application\//.test(item));
  if (images.length === 0) return null;
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        ...images.map((url) => ({ type: 'image_url', image_url: { url: toImageUrl(url) } })),
      ],
    },
  ];
};

const ocrScanPrompt = (language: string, isHandwritten: boolean): string =>
  `Extract all text from the attached page/s or document accurately, assuming the text is in ${language}.\n` +
  (isHandwritten
    ? 'The image/document contains handwritten notes, assessments, or drawings. Use professional Multimodal Handwriting Recognition to transcribe printed text, cursive handwriting, math symbols, annotations, and notes precisely.\n'
    : '') +
  'Format it cleanly. Make no other comments.';

const ocrGradePrompt = (rubric: string, isHandwritten: boolean, behavioralAspects?: string[], adjustLateSubmission?: boolean): string => {
  let behaviorPrompt = '';
  if (behavioralAspects && Array.isArray(behavioralAspects) && behavioralAspects.length > 0) {
    behaviorPrompt = `\n- Evaluate the student's submission on these behavioral/work habit dimensions: ${behavioralAspects.join(', ')}. Analyze their work layout, structure, and handwriting quality to provide a dedicated, supportive "Learning Behavior & Focus Feedback" section in the overall feedback.`;
  }
  if (adjustLateSubmission) {
    behaviorPrompt += `\n- Special Context: This was submitted late, or as a redo attempt. Maintain rigorous academic scoring standards, but add a supportive, encouraging remark acknowledging their initiative to catch up or refine their work.`;
  }

  return `You are an AI Grader and South African CAPS Curriculum Specialist. Analyze these student assessment page/s.

TASK 1: MEMORANDUM & RUBRIC QUALITY CHECK & AUTO-GENERATION
- You are supplied with this Teacher's Memorandum/Rubric: "${rubric || ''}".
- IF the supplied Memorandum/Rubric is missing, blank, or extremely brief: generate a comprehensive, detailed Memorandum and grading rubric mapped to CAPS criteria, describe this in 'memoCorrectionReport', set 'originalMemoCorrected' to true and return it in 'correctedMemo'.
- IF a Memorandum/Rubric IS supplied: review it for correctness, spelling, factual errors, marks allotment and CAPS alignment; correct issues, describe them in 'memoCorrectionReport', set 'originalMemoCorrected' accordingly and return it in 'correctedMemo'.

TASK 2: EVALUATION AND GRADING
- Extract all text answers from the student's submission pages and return them in 'extractedText'.
- Evaluate each answer against the verified/generated memorandum/rubric.${behaviorPrompt}
- ${isHandwritten ? "The student's inputs may be handwritten. Apply deep Handwriting Recognition (HWR) and optical reading; be forgiving on cursive forms, crossed-out errors and mathematical symbols." : ''}
- Sum the total obtained score as a string in 'totalScore' (e.g. "18/25" or "72%").
- List marks and reasoning per question in 'marksPerQuestion'.
- Provide constructive, encouraging feedback for the learner in 'feedback'.

Return a valid JSON object with keys: extractedText (string), marksPerQuestion (array of strings), feedback (string), totalScore (string), originalMemoCorrected (boolean), memoCorrectionReport (string), correctedMemo (string).`;
};

const getOcrSpaceLangCode = (lang: string) => {
  const map: Record<string, string> = {
    'English': 'eng',
    'Spanish': 'spa',
    'French': 'fre',
    'German': 'ger',
    'Afrikaans': 'afr',
  };
  return map[lang] || 'eng';
};

/* ── Text / reasoning generation ───────────────────────────────────────────── */

export const generateEducationalContent = async (type: string, details: string, provider: string = DEFAULT_AI_PROVIDER) => {
  // `classic` (the default) restores the original commit 6d3f1d2 brief so all
  // engines ask for the same design.
  const classicPair = buildClassicEducationalPrompts({ type, details });
  const isClassic = resolveContentDesignStyle({}) === 'classic';
  const messages = [
    {
      role: 'system',
      content: isClassic
        ? classicPair.system
        : `${LIGHT_MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN.`
    },
    {
      role: 'user',
      content: isClassic
        ? classicPair.user
        : `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design).`
    }
  ];

  return await routeWithFallback<string>(provider, {
    gemini: () => geminiGenerateContent(type, details),
    alternative: (engine) => callMultiAi(engine, messages),
  });
};

export const generateCAPSContent = async (input: any, provider: string = DEFAULT_AI_PROVIDER, onProgress?: (partial: any) => void) => {
  const isLessonPlan = ['Lesson Plan', 'Weekly Lesson Plan', 'Unit Plan', 'lesson-plan'].includes(input.contentType);
  const isStudyGuide = ['Study Guide / Learning Notes', 'Revision Pack', 'Daily Lesson Notes', 'Learning Activity'].includes(input.contentType);

  let contentTypeEng: 'lesson-plan' | 'worksheet' | 'study-guide' = 'worksheet';
  if (isLessonPlan) contentTypeEng = 'lesson-plan';
  else if (isStudyGuide) contentTypeEng = 'study-guide';

  const { system, user } = EduAIPromptEngine.assemblePrompt({
    contentType: contentTypeEng,
    grade: input.grade || "4",
    subject: input.subject || "Mathematics",
    topic: input.topic || "Addition",
    language: input.language || 'English',
    learnerProfile: input.learnerProfile || 'General Class',
    additionalInstructions: input.additionalInstructions || '',
    term: input.term || '1',
    week: input.week ? parseInt(input.week) : undefined,
    duration: input.duration || '2 hours',
    capsReference: input.capsReference || '',
    includeWorksheet: !!input.includeWorksheet,
    isGroq: false,
    // SA Compliance extensions
    assessmentType: input.assessmentType || input.type || 'worksheet',
    isFormal: !!input.isFormal,
    includeInclusiveSupport: !!input.inclusiveEd || !!input.includeInclusiveSupport,
    siasSupportLevel: input.siasSupportLevel || 'level_1',
    differentiationRequired: !!input.differentiation || !!input.differentiationRequired,
    barrierCategories: input.barrierCategories || [],
    homeLanguage: input.homeLanguage,
    lolt: input.lolt || input.language || 'English',
    questionCount: input.questionCount,
    containsLearnerData: !!input.containsLearnerData,
    totalMarks: input.totalMarks,
    studentName: input.studentName,
    teacherName: input.teacherName
  } as any);

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  return await routeWithFallback<any>(provider, {
    gemini: () => geminiGenerateCAPS(input, onProgress),
    alternative: async (engine) => {
      const response = await callMultiAi(engine, messages);
      const parsed = safeJsonParse(response);
      if (Object.keys(parsed).length === 0) {
        console.warn("safeJsonParse returned empty object for response:", response);
        return { content: response, imagePrompt: "Educational classroom scene" };
      }
      return parsed;
    },
  });
};

export const generateVisualAid = async (input: any, provider: string = DEFAULT_AI_PROVIDER, onProgress?: (partial: any) => void) => {
  const { system, user } = buildVisualLabPrompts(input);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  return await routeWithFallback<any>(provider, {
    gemini: () => geminiGenerateVisual(input, onProgress),
    alternative: async (engine) => {
      const response = await callMultiAi(engine, messages);
      const parsed = safeJsonParse(response);
      if (Object.keys(parsed).length === 0) {
        return {
          content: response,
          description: 'Visual aid generated',
          printInstructions: input.dimensions || 'A4 Portrait',
          imagePrompt: ''
        };
      }
      return parsed;
    },
  });
};

export const generateAdminDoc = async (input: any, provider: string = DEFAULT_AI_PROVIDER, onProgress?: (partial: any) => void) => {
  const { system, user } = buildAdminLabPrompts(input);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  return await routeWithFallback<any>(provider, {
    gemini: () => geminiGenerateAdmin(input, onProgress),
    alternative: async (engine) => {
      const response = await callMultiAi(engine, messages);
      const parsed = safeJsonParse(response);
      if (Object.keys(parsed).length === 0) {
        return {
          content: response,
          notes: 'Please review before sending.',
          documentType: input.documentType || 'School Document',
          imagePrompt: ''
        };
      }
      return parsed;
    },
  });
};

/* ── Vision / OCR ──────────────────────────────────────────────────────────── */

/**
 * OCR / handwriting transcription.
 *
 * Vision chain: Nemotron 3.5 Super VL → Llama 3.2 90B Vision → Gemini 3.8
 * Flash → OCR.space. The first two run on NVIDIA NIM, so a Gemini outage no
 * longer stops scanning.
 */
export const runOCRScan = async (
  imageData: string | string[],
  provider: string = DEFAULT_AI_PROVIDER,
  ocrProvider: string = DEFAULT_VISION_PROVIDER,
  language: string = 'English',
  isHandwritten: boolean = true,
) => {
  const order = visionAttemptOrder(ocrProvider);
  const messages = buildVisionMessages(imageData, ocrScanPrompt(language, isHandwritten));
  let lastError: any;

  for (const engine of order) {
    try {
      if (engine === 'gemini') {
        return await geminiOCRScan(imageData, language, isHandwritten);
      }
      if (engine === 'ocrspace') {
        const firstImage = Array.isArray(imageData) ? imageData[0] || '' : imageData;
        const extractedText = await performOCR(firstImage, getOcrSpaceLangCode(language));
        return { extractedText };
      }
      if (!messages) {
        // DOCX-only upload: a vision model cannot read it — skip to Gemini.
        throw new Error(`No image parts for ${engine}; DOCX uploads need the Gemini path.`);
      }
      const text = await callVisionAi(engine, messages);
      return { extractedText: text };
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI Routing] Vision engine ${engine} failed (${error?.message || error}) — trying the next one.`);
    }
  }

  console.error('[AI Routing] Every OCR engine failed:', lastError?.message || lastError);
  throw lastError ?? new Error('OCR failed on every engine');
};

export const runTextGrade = async (studentAnswers: string, memo: string, rubric: string, language: string = 'English', provider: string = DEFAULT_AI_PROVIDER) => {
  const messages = [
    {
      role: 'system',
      content: `You are an AI Grader. Grade this student's written response in ${language}. Return JSON with keys: marksPerQuestion (array of strings), feedback (string), totalScore (string).`
    },
    { role: 'user', content: `Student answers: ${studentAnswers}\nMemorandum / Memo notes: ${memo}\nRubric guidelines: ${rubric}` }
  ];

  return await routeWithFallback<any>(provider, {
    gemini: () => geminiTextGrade(studentAnswers, memo, rubric, language),
    alternative: async (engine) => safeJsonParse(await callMultiAi(engine, messages)),
  });
};

/**
 * OCR + grading.
 *
 * Vision chain first (Super VL → Llama 90B Vision → Gemini). If every vision
 * model is down, the text is pulled with OCR.space and graded by the reasoning
 * chain instead of failing the teacher's marking run.
 */
export const runOCRAndGrade = async (
  imageData: string | string[],
  rubric: string,
  provider: string = DEFAULT_AI_PROVIDER,
  ocrProvider: string = DEFAULT_VISION_PROVIDER,
  language: string = 'English',
  isHandwritten: boolean = true,
  behavioralAspects?: string[],
  adjustLateSubmission?: boolean,
) => {
  const order = visionAttemptOrder(ocrProvider);
  const messages = buildVisionMessages(
    imageData,
    ocrGradePrompt(rubric, isHandwritten, behavioralAspects, adjustLateSubmission),
  );
  let lastError: any;

  for (const engine of order) {
    try {
      if (engine === 'gemini') {
        return await geminiOCR(imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission);
      }
      if (engine === 'ocrspace') {
        const firstImage = Array.isArray(imageData) ? imageData[0] || '' : imageData;
        const extractedText = await performOCR(firstImage, getOcrSpaceLangCode(language));
        const graded = await runTextGrade(extractedText, rubric, rubric, language, provider);
        return { ...graded, extractedText };
      }
      if (!messages) {
        throw new Error(`No image parts for ${engine}; DOCX uploads need the Gemini path.`);
      }
      const raw = await callVisionAi(engine, messages);
      const parsed = safeJsonParse(raw);
      if (Object.keys(parsed).length === 0) {
        return { extractedText: raw, feedback: raw, totalScore: "N/A" };
      }
      return parsed;
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI Routing] Vision grading engine ${engine} failed (${error?.message || error}) — trying the next one.`);
    }
  }

  console.error('[AI Routing] Every vision grading engine failed:', lastError?.message || lastError);
  throw lastError ?? new Error('OCR grading failed on every engine');
};

/* ── Tutor chat ────────────────────────────────────────────────────────────── */

export const chatWithTutor = async (messages: any[], provider: string = DEFAULT_AI_PROVIDER) => {
  const hasImage = messages.some(m =>
    m.parts?.some((p: any) => p.inlineData) ||
    (Array.isArray(m.content) && m.content.some((p: any) => p.type === 'image_url')),
  );

  // Text-only models 400 on image parts: images always take the Gemini path.
  if (hasImage) {
    return await geminiChat(messages);
  }

  // Format messages for the OpenAI-compatible NIM engines.
  let formattedMessages: any[] = [
    { role: 'system', content: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise." }
  ];
  let lastRole: string | null = null;

  for (const m of messages) {
    const role = m.role === 'model' ? 'assistant' : 'user';
    let contentParts: any[] = [];

    // Gemini-style `parts` turns, OpenAI-style `content` arrays, and plain
    // `content` strings (used by the auto-optimise speed probe) are all valid.
    const parts = Array.isArray(m.parts)
      ? m.parts
      : Array.isArray(m.content)
        ? m.content
        : [{ text: m.content }];

    for (const part of parts) {
      if (part?.text) {
        contentParts.push({ type: "text", text: part.text });
      } else if (part?.inlineData) {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
        });
      } else if (part?.type === 'image_url') {
        contentParts.push(part);
      } else if (typeof part === 'string') {
        contentParts.push({ type: 'text', text: part });
      }
    }

    if (contentParts.length === 0) continue;

    if (role === lastRole) {
      // Merge consecutive messages with the same role
      const lastMsg = formattedMessages[formattedMessages.length - 1];
      if (Array.isArray(lastMsg.content)) {
        lastMsg.content.push(...contentParts);
      } else {
        lastMsg.content = [{ type: "text", text: lastMsg.content }, ...contentParts];
      }
    } else {
      formattedMessages.push({ role, content: contentParts });
      lastRole = role;
    }
  }

  // Chat APIs require the conversation to start with a user message.
  if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
    formattedMessages.shift();
  }

  return await routeWithFallback<string>(provider, {
    gemini: () => geminiChat(messages),
    alternative: (engine) => callMultiAi(engine, formattedMessages),
  });
};
