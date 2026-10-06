import { 
  generateEducationalContent as geminiGenerateContent,
  generateCAPSContent as geminiGenerateCAPS,
  generateVisualAid as geminiGenerateVisual,
  generateAdminDoc as geminiGenerateAdmin,
  runOCRAndGrade as geminiOCR,
  runOCRScan as geminiOCRScan,
  runTextGrade as geminiTextGrade,
  chatWithTutor as geminiChat,
  MASTER_SYSTEM_PROMPT,
  safeJsonParse
} from './geminiService';

import { callMultiAi, performOCR, AIProvider } from './multiAiService';
import { EduAIPromptEngine } from '../lib/prompt-engine';
import { buildAdminLabPrompts, buildVisualLabPrompts } from '../lib/prompts/lab-prompts';

const isProviderFailure = (error: any): boolean => {
  const status = error.response?.status || error.status;
  
  // Extract all possible error message locations
  const rawMessage = error.message || '';
  const responseObj = error.response?.data?.error || error.response?.data || '';
  const responseMessage = typeof responseObj === 'string' 
    ? responseObj 
    : responseObj?.message || JSON.stringify(responseObj);
  const combinedMessage = `${rawMessage} ${responseMessage}`.toLowerCase();
  
  // Any provider failure (status, network, quota, credentials, etc.) should fall back to Gemini
  const isTransient = 
    status === 401 || status === 402 || status === 403 || status === 404 || status === 429 ||
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
    combinedMessage.includes('invalid key');

  if (isTransient) {
    console.log(`[AI Routing] Alternative model requested fallback (${status || 'N/A'}). Seamlessly routing to Gemini.`);
  } else {
    console.log(`[AI Routing] Routing request to primary Gemini fallback.`);
  }
  
  return true;
};

export const generateEducationalContent = async (type: string, details: string, provider: string = 'gemini') => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateContent(type, details);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to alibaba-qwen (Qwen 3.8)...");
        provider = 'alibaba-qwen';
      } else {
        throw err;
      }
    }
  }
  
  const messages = [
    { 
      role: 'system', 
      content: `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN.` 
    },
    { 
      role: 'user', 
      content: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design).` 
    }
  ];
  try {
    return await callMultiAi(provider as AIProvider, messages);
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.log(`[AI Routing] Seamlessly transitioning from ${provider} to primary Gemini engine.`);
      return await geminiGenerateContent(type, details);
    }
    throw error;
  }
};

export const generateCAPSContent = async (input: any, provider: string = 'gemini', onProgress?: (partial: any) => void) => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateCAPS(input, onProgress);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to alibaba-qwen (Qwen 3.8)...");
        provider = 'alibaba-qwen';
      } else {
        throw err;
      }
    }
  }
  
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
    isGroq: provider.startsWith('groq'),
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
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    const parsed = safeJsonParse(response);
    if (Object.keys(parsed).length === 0) {
      console.warn("safeJsonParse returned empty object for response:", response);
      return { content: response, imagePrompt: "Educational classroom scene" };
    }
    return parsed;
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.log(`[AI Routing] Seamlessly transitioning from ${provider} to primary Gemini engine.`);
      return await geminiGenerateCAPS(input, onProgress);
    }
    throw error;
  }
};

export const generateVisualAid = async (input: any, provider: string = 'gemini', onProgress?: (partial: any) => void) => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateVisual(input, onProgress);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to alibaba-qwen (Qwen 3.8)...");
        provider = 'alibaba-qwen';
      } else {
        throw err;
      }
    }
  }

  const { system, user } = buildVisualLabPrompts(input);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
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
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.log(`[AI Routing] Seamlessly transitioning from ${provider} to primary Gemini engine.`);
      return await geminiGenerateVisual(input, onProgress);
    }
    throw error;
  }
};

export const generateAdminDoc = async (input: any, provider: string = 'gemini', onProgress?: (partial: any) => void) => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateAdmin(input, onProgress);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to alibaba-qwen (Qwen 3.8)...");
        provider = 'alibaba-qwen';
      } else {
        throw err;
      }
    }
  }

  const { system, user } = buildAdminLabPrompts(input);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
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
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.log(`[AI Routing] Seamlessly transitioning from ${provider} to primary Gemini engine.`);
      return await geminiGenerateAdmin(input, onProgress);
    }
    throw error;
  }
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

export const runOCRScan = async (imageData: string | string[], provider: string = 'gemini', ocrProvider: string = 'gemini', language: string = 'English', isHandwritten: boolean = true) => {
  if (ocrProvider === 'gemini') {
    try {
      return await geminiOCRScan(imageData, language, isHandwritten);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to ocrspace...");
        ocrProvider = 'ocrspace';
      } else {
        throw err;
      }
    }
  }
  
  const firstImage = Array.isArray(imageData) ? imageData[0] || '' : imageData;
  
  try {
    const extractedText = await performOCR(firstImage, getOcrSpaceLangCode(language));
    return { extractedText };
  } catch (error: any) {
    return await geminiOCRScan(imageData, language, isHandwritten);
  }
};

export const runTextGrade = async (studentAnswers: string, memo: string, rubric: string, language: string = 'English') => {
  return await geminiTextGrade(studentAnswers, memo, rubric, language);
};

export const runOCRAndGrade = async (imageData: string | string[], rubric: string, provider: string = 'gemini', ocrProvider: string = 'gemini', language: string = 'English', isHandwritten: boolean = true, behavioralAspects?: string[], adjustLateSubmission?: boolean) => {
  if (provider === 'gemini' && ocrProvider === 'gemini') {
    try {
      return await geminiOCR(imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to alibaba-qwen (Qwen 3.8) for grading and ocrspace for scanning...");
        provider = 'alibaba-qwen';
        ocrProvider = 'ocrspace';
      } else {
        throw err;
      }
    }
  }
  
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
  
  if (provider === 'gemini') {
    // Gemini can process text grading
    try {
      return await geminiOCR(imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission);
    } catch(err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        provider = 'alibaba-qwen';
      } else {
        throw err;
      }
    }
  }

  try {
    let model = 'qwen3.8-max';
    
    const grading = await callMultiAi(provider as AIProvider, messages, model);
    
    try {
      if (typeof grading === 'string') {
        const parsed = safeJsonParse(grading);
        return { ...parsed, extractedText };
      }
      return { extractedText, feedback: grading, totalScore: "N/A" };
    } catch (e) {
      return { extractedText, feedback: grading, totalScore: "N/A" };
    }
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.log(`[AI Routing] Seamlessly transitioning from ${provider} to primary Gemini engine.`);
      return await geminiOCR(imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission);
    }
    throw error;
  }
};

export const chatWithTutor = async (messages: any[], provider: string = 'gemini') => {
  const hasImage = messages.some(m => m.parts?.some((p: any) => p.inlineData));
  
  if (provider === 'gemini' || hasImage) {
     // Force gemini if there are images, because text-only models throw 400s
     try {
       return await geminiChat(messages);
     } catch(err: any) {
       if (err.message && (err.message.includes('Quota') || err.message.includes('429'))) {
         if (hasImage) {
           throw new Error("Cannot fallback, Image context requires Gemini API, but quota is exceeded.");
         }
         provider = 'alibaba-qwen';
       } else {
         throw err;
       }
     }
  }
  
  // Format messages for OpenAI/Anthropic
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
  
  // Anthropic/OpenAI often requires starting with a user message
  if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
    formattedMessages.shift();
  }

  try {
    return await callMultiAi(provider as AIProvider, formattedMessages);
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.log(`[AI Routing] Seamlessly transitioning from ${provider} to primary Gemini engine.`);
      return await geminiChat(messages);
    }
    throw error;
  }
};
