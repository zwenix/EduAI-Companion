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

import { callMultiAi, performOCR, AIProvider } from './multiAiService';
import { EduAIPromptEngine } from '../lib/prompt-engine';
import { buildAdminLabPrompts, buildVisualLabPrompts } from '../lib/prompts/lab-prompts';
import { buildClassicEducationalPrompts } from '../lib/prompts/classic-templates';
import { resolveContentDesignStyle } from '../lib/contentStyle';
import {
  PRIMARY_REASONING_PROVIDER,
  PRIMARY_VISION_PROVIDER,
  reasoningFallbacksFor,
  visionFallbacksFor,
} from '../lib/aiModels';

/**
 * Mirrors the server's routing rules (`/api/ai/:provider`): a provider fault
 * is never terminal, it is a routing decision. The alternative engines walk
 * `reasoningFallbacksFor()` (frozen chain: Nemotron 3 Ultra → DeepSeek V4.1
 * Flash → Gemini → Nemotron 3.5 Lightning) and Gemini steps through its own
 * model chain, so the classroom keeps generating.
 */
const isProviderFailure = (error: any): boolean => {
  const status = error.response?.status || error.status;
  
  // Extract all possible error message locations
  const rawMessage = error.message || '';
  const responseObj = error.response?.data?.error || error.response?.data || '';
  const responseMessage = typeof responseObj === 'string' 
    ? responseObj 
    : responseObj?.message || JSON.stringify(responseObj);
  const combinedMessage = `${rawMessage} ${responseMessage}`.toLowerCase();
  
  // Any provider failure (status, network, quota, credentials, etc.) is routed
  // to the next engine in the chain.
  const isTransient = 
    status === 401 || status === 402 || status === 403 || status === 404 || status === 429 ||
    status === 500 || status === 502 || status === 503 || status === 504 ||
    typeof status === 'number' ||
    combinedMessage.includes('quota') || 
    combinedMessage.includes('timeout') ||
    combinedMessage.includes('network') ||
    combinedMessage.includes('not configured') ||
    combinedMessage.includes('api key') ||
    combinedMessage.includes('unauthorized') ||
    combinedMessage.includes('unavailable') ||
    combinedMessage.includes('transitioning') ||
    combinedMessage.includes('fallback') ||
    combinedMessage.includes('invalid key');

  if (isTransient) {
    console.log(`[AI Routing] Alternative model requested fallback (${status || 'N/A'}). Walking the reasoning chain.`);
  } else {
    console.log(`[AI Routing] Routing request to the next reasoning engine.`);
  }
  
  return true;
};

/**
 * Ordered engines to try for `provider`: the selected engine first, then the
 * rest of the frozen reasoning chain, always ending with Gemini (its own client
 * path in `geminiService`) so the on-device Gemini engine is the guaranteed
 * answer.
 */
const reasoningCandidates = (provider: string): string[] => {
  // Chain order is preserved exactly — Gemini must stay in its TERTIARY slot,
  // ahead of Nemotron 3.5 Lightning. Only de-duplicate.
  const ordered = [provider, ...reasoningFallbacksFor(provider)];
  return ordered.filter((engine, index, all) => all.indexOf(engine) === index);
};

/** Which generator to use for one engine in the chain. */
const runOnProvider = async (
  engine: string,
  alternative: () => Promise<any>,
  geminiPath: () => Promise<any>,
): Promise<any> => {
  if (engine === 'gemini') return await geminiPath();
  return await alternative();
};

/**
 * Walk the reasoning chain from `provider` until one engine answers.
 *
 * `alternative` is called with the current engine id so the caller can pass it
 * to `callMultiAi`; the Gemini path is used for the `gemini` step.
 */
const walkReasoningChain = async (
  provider: string,
  geminiPath: () => Promise<any>,
  alternative: (engine: string) => Promise<any>,
): Promise<any> => {
  let lastError: any = null;
  for (const engine of reasoningCandidates(provider)) {
    try {
      return await runOnProvider(
        engine,
        () => alternative(engine),
        geminiPath,
      );
    } catch (error: any) {
      lastError = error;
      if (!isProviderFailure(error)) throw error;
      console.log(`[AI Routing] ${engine} unavailable — trying the next reasoning engine.`);
    }
  }
  throw lastError ?? new Error('Every reasoning engine failed.');
};

export const generateEducationalContent = async (type: string, details: string, provider: string = PRIMARY_REASONING_PROVIDER) => {
  // `classic` (the default) restores the original commit 6d3f1d2 brief so the
  // alternative engines ask for the same design as the Gemini path.
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

  return await walkReasoningChain(
    provider,
    () => geminiGenerateContent(type, details),
    (engine) => callMultiAi(engine as AIProvider, messages),
  );
};

export const generateCAPSContent = async (input: any, provider: string = PRIMARY_REASONING_PROVIDER, onProgress?: (partial: any) => void) => {
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
    // SA Compliance extensions — NEW
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

  return await walkReasoningChain(
    provider,
    () => geminiGenerateCAPS(input, onProgress),
    async (engine) => {
      const response = await callMultiAi(engine as AIProvider, messages);
      const parsed = safeJsonParse(response);
      if (Object.keys(parsed).length === 0) {
        console.warn("safeJsonParse returned empty object for response:", response);
        return { content: response, imagePrompt: "Educational classroom scene" };
      }
      return parsed;
    },
  );
};

export const generateVisualAid = async (input: any, provider: string = PRIMARY_REASONING_PROVIDER, onProgress?: (partial: any) => void) => {
  const { system, user } = buildVisualLabPrompts(input);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  return await walkReasoningChain(
    provider,
    () => geminiGenerateVisual(input, onProgress),
    async (engine) => {
      const response = await callMultiAi(engine as AIProvider, messages);
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
  );
};

export const generateAdminDoc = async (input: any, provider: string = PRIMARY_REASONING_PROVIDER, onProgress?: (partial: any) => void) => {
  const { system, user } = buildAdminLabPrompts(input);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  return await walkReasoningChain(
    provider,
    () => geminiGenerateAdmin(input, onProgress),
    async (engine) => {
      const response = await callMultiAi(engine as AIProvider, messages);
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
  );
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

/**
 * Vision/OCR scan through the frozen vision chain:
 * Nemotron 3.5 Super VL 120B → Gemini multimodal → Llama 3.2 90B Vision →
 * OCR.space. A failure at any hop is a routing decision, never an error.
 */
export const runOCRScan = async (imageData: string | string[], provider: string = PRIMARY_REASONING_PROVIDER, ocrProvider: string = PRIMARY_VISION_PROVIDER, language: string = 'English', isHandwritten: boolean = true) => {
  let lastError: any = null;

  for (const engine of [ocrProvider, ...visionFallbacksFor(ocrProvider)]) {
    try {
      if (engine === 'gemini') {
        return await geminiOCRScan(imageData, language, isHandwritten);
      }
      if (engine === 'ocrspace') {
        const firstImage = Array.isArray(imageData) ? imageData[0] || '' : imageData;
        const extractedText = await performOCR(firstImage, getOcrSpaceLangCode(language));
        return { extractedText };
      }
      // NVIDIA NIM vision model — same provider path as the text engines. The
      // OpenAI-compatible client returns text, so wrap it in the scan shape.
      const text = await callMultiAi(engine as AIProvider, buildVisionScanMessages(imageData, language, isHandwritten));
      return { extractedText: text || '' };
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI Routing] Vision engine ${engine} unavailable — trying the next vision engine.`);
    }
  }

  // Nothing answered: still return the Gemini error so the UI can explain it.
  throw lastError ?? new Error('Every vision engine failed.');
};

/** OpenAI-compatible vision payload for a scan (text + inline images). */
const buildVisionScanMessages = (imageData: string | string[], language: string, isHandwritten: boolean) => {
  const items = Array.isArray(imageData) ? imageData : [imageData];
  const parts: any[] = [
    {
      type: 'text',
      text: `Extract all text from the attached ${items.length} page/s or document accurately, assuming the text is in ${language}.\n${
        isHandwritten
          ? 'The image/document contains handwritten notes, assessments, or drawings. Use professional Multimodal Handwriting Recognition to transcribe printed text, cursive handwriting, math symbols, annotations, and notes precisely.'
          : ''
      }\nFormat it cleanly. Make no other comments.`,
    },
  ];
  for (const item of items) {
    parts.push({ type: 'image_url', image_url: { url: item } });
  }
  return [{ role: 'user', content: parts }];
};

export const runTextGrade = async (studentAnswers: string, memo: string, rubric: string, language: string = 'English') => {
  return await geminiTextGrade(studentAnswers, memo, rubric, language);
};

export const runOCRAndGrade = async (imageData: string | string[], rubric: string, provider: string = PRIMARY_REASONING_PROVIDER, ocrProvider: string = PRIMARY_VISION_PROVIDER, language: string = 'English', isHandwritten: boolean = true, behavioralAspects?: string[], adjustLateSubmission?: boolean) => {
  const scanRef = await runOCRScan(imageData, provider, ocrProvider, language, isHandwritten);
  const extractedText = scanRef.extractedText;

  let behaviorNote = "";
  if (behavioralAspects && behavioralAspects.length > 0) {
    behaviorNote = `\nEvaluate also behavioral skills: ${behavioralAspects.join(", ")}.`;
  }
  if (adjustLateSubmission) {
    behaviorNote += `\nThis is late or a redo, add supportive, encouraging catch-up remarks.`;
  }

  const messages = [
    { role: 'system', content: `You are an AI Grader. Use this rubric: ${rubric}${behaviorNote}` },
    { role: 'user', content: `Grade this text: ${extractedText}. Return JSON with 'totalScore', 'marksPerQuestion[]', 'feedback'.` }
  ];
  
  try {
    const grading = await walkReasoningChain(
      provider,
      () => geminiOCR(imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission),
      (engine) => callMultiAi(engine as AIProvider, messages),
    );
    
    try {
      if (typeof grading === 'string') {
        const parsed = safeJsonParse(grading);
        return { ...parsed, extractedText };
      }
      // The Gemini path returns the full grading object (and re-reads images).
      return { ...(grading || {}), extractedText: grading?.extractedText ?? extractedText };
    } catch (e) {
      return { extractedText, feedback: grading, totalScore: "N/A" };
    }
  } catch (error: any) {
    // Text grading on every engine failed. As a final resort, hand the images
    // back to Gemini multimodal, which grades and reads in one call.
    console.log(`[AI Routing] Text grading failed on every reasoning engine — retrying vision grading on Gemini.`);
    return await geminiOCR(imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission);
  }
};

export const chatWithTutor = async (messages: any[], provider: string = PRIMARY_REASONING_PROVIDER) => {
  const hasImage = messages.some(m => m.parts?.some((p: any) => p.inlineData));
  
  // Format messages for the OpenAI-compatible engines
  let formattedMessages: any[] = [
    { role: 'system', content: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise." }
  ];
  let lastRole: string | null = null;

  for (const m of messages) {
    const role = m.role === 'model' ? 'assistant' : 'user';
    let contentParts: any[] = [];
    
    for (const part of m.parts) {
      if (part.text) {
        contentParts.push({ type: "text", text: part.text });
      } else if (part.inlineData) {
        contentParts.push({ 
          type: "image_url", 
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
        });
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
  
  // OpenAI-compatible APIs often require starting with a user message
  if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
    formattedMessages.shift();
  }

  // A turn that carries an image can only be answered by a multimodal engine:
  // route it to the vision chain instead of the text-only reasoning chain.
  if (hasImage) {
    try {
      return await geminiChat(messages);
    } catch (err: any) {
      if (!isProviderFailure(err)) throw err;
      try {
        return await callMultiAi('nvidia-nemotron-vl' as AIProvider, formattedMessages);
      } catch (secondErr: any) {
        throw new Error("Cannot fallback, image context requires a multimodal engine, and both Gemini vision and Nemotron 3.5 Super VL failed.");
      }
    }
  }

  return await walkReasoningChain(
    provider,
    () => geminiChat(messages),
    (engine) => callMultiAi(engine as AIProvider, formattedMessages),
  );
};
