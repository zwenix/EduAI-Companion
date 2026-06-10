import { 
  generateEducationalContent as geminiGenerateContent,
  generateCAPSContent as geminiGenerateCAPS,
  generateVisualAid as geminiGenerateVisual,
  generateAdminDoc as geminiGenerateAdmin,
  runOCRAndGrade as geminiOCR,
  runOCRScan as geminiOCRScan,
  chatWithTutor as geminiChat,
  MASTER_SYSTEM_PROMPT,
  IMAGE_PROMPT_GOLDEN_RULE,
  safeJsonParse
} from './geminiService';

import { callMultiAi, performOCR, AIProvider } from './multiAiService';
import EduAIPromptEngine from '../lib/prompt-engine';

const mapContentType = (typeStr: string): 'worksheet' | 'poster' | 'study-guide' | 'infographic' | 'lesson-plan' | 'report-comment' | 'curriculum-map' | 'rubric' | 'test' | 'progress-tracker' => {
  const s = (typeStr || '').toLowerCase();
  if (s.includes('worksheet') || s.includes('exercise')) return 'worksheet';
  if (s.includes('poster')) return 'poster';
  if (s.includes('study-guide') || s.includes('learning notes') || s.includes('notes')) return 'study-guide';
  if (s.includes('lesson-plan') || s.includes('lesson plan')) return 'lesson-plan';
  if (s.includes('report-comment') || s.includes('report comment')) return 'report-comment';
  if (s.includes('curriculum-map') || s.includes('curriculum map')) return 'curriculum-map';
  if (s.includes('rubric') || s.includes('matrix')) return 'rubric';
  if (s.includes('test') || s.includes('exam') || s.includes('quiz')) return 'test';
  if (s.includes('progress-tracker') || s.includes('progress tracker')) return 'progress-tracker';
  if (s.includes('infographic') || s.includes('mind map')) return 'infographic';
  return 'worksheet';
};

const isProviderFailure = (error: any) => {
  return true; // Always fallback if the primary provider fails!
};

export const generateEducationalContent = async (type: string, details: string, provider: string = 'gemini') => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateContent(type, details);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to qwen-primary...");
        provider = 'qwen-primary';
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
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateContent(type, details);
    }
    throw error;
  }
};

export const generateCAPSContent = async (input: any, provider: string = 'gemini') => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateCAPS(input);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to qwen-primary...");
        provider = 'qwen-primary';
      } else {
        throw err;
      }
    }
  }
  
  const promptContext = {
    contentType: mapContentType(input.contentType),
    grade: input.grade || '1',
    subject: input.subject || 'Mathematics',
    topic: input.topic || 'General Topic',
    language: input.language || 'English',
    learnerProfile: input.learnerProfile || '',
    additionalInstructions: input.additionalInstructions || input.objective || '',
    visualStyle: input.visualStyle || 'modern',
    colorScheme: input.colorScheme || '',
    capsReference: input.capsReference || ''
  };

  const assembled = EduAIPromptEngine.assemblePrompt(promptContext);
  const systemInstruction = assembled.system;
  let prompt = assembled.user;

  prompt += `\n\nReturn the result as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
  {
    "content": "<HTML CODE FOR THE MAIN DOCUMENT HERE>",
    "memo": "<HTML CODE FOR THE ANSWER MEMO HERE>",
    "rubric": "<HTML CODE FOR THE GRADING RUBRIC HERE>",
    "successIndicators": ["string", "string"],
    "imagePrompt": "Detailed prompt matching IMAGE GUIDE..."
  }`;

  const messages = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: prompt }
  ];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    const parsed = safeJsonParse(response);
    if (Object.keys(parsed).length === 0) {
      return { content: response, imagePrompt: "Educational classroom scene" };
    }
    return parsed;
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateCAPS(input);
    }
    throw error;
  }
};

export const generateVisualAid = async (input: any, provider: string = 'gemini') => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateVisual(input);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to qwen-primary...");
        provider = 'qwen-primary';
      } else {
        throw err;
      }
    }
  }
  
  const promptContext = {
    contentType: mapContentType(input.visualType || 'poster'),
    grade: input.grade || '1',
    subject: input.subject || 'Mathematics',
    topic: input.topic || 'General Topic',
    language: input.language || 'English',
    learnerProfile: input.learnerProfile || '',
    additionalInstructions: input.specificContent || input.additionalInstructions || '',
    visualStyle: input.style || 'modern',
    colorScheme: input.colorScheme || ''
  };

  const assembled = EduAIPromptEngine.assemblePrompt(promptContext);
  const systemInstruction = assembled.system;
  let prompt = assembled.user;

  prompt += `\n\nReturn as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
  {
    "content": "<HTML STRING WITH TAILWIND DESIGN HERE>",
    "description": "string",
    "printInstructions": "string",
    "imagePrompt": "Detailed prompt..."
  }`;

  const messages = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: prompt }
  ];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    const parsed = safeJsonParse(response);
    if (Object.keys(parsed).length === 0) {
      return { content: response, description: "Visual aid generated", imagePrompt: "Abstract educational graphic" };
    }
    return parsed;
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateVisual(input);
    }
    throw error;
  }
};

export const generateAdminDoc = async (input: any, provider: string = 'gemini') => {
  if (provider === 'gemini') {
    try {
      return await geminiGenerateAdmin(input);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to qwen-primary...");
        provider = 'qwen-primary';
      } else {
        throw err;
      }
    }
  }
  
  const promptContext = {
    contentType: mapContentType(input.documentType || 'lesson-plan'),
    grade: input.grade || '1',
    subject: input.subject || 'Mathematics',
    topic: input.purpose || 'General Plan',
    language: input.language || 'English',
    learnerProfile: '',
    additionalInstructions: `SchoolName: ${input.schoolName}. Tone: ${input.tone}. ReplySlip: ${input.includeReplySlip ? 'Yes' : 'No'}. KeyPoints: ${input.keyPoints || ''}`,
    visualStyle: 'professional' as const
  };

  const assembled = EduAIPromptEngine.assemblePrompt(promptContext);
  const systemInstruction = assembled.system;
  let prompt = assembled.user;

  prompt += `\n\nReturn as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
  {
    "content": "<HTML STRING WITH TAILWIND DESIGN HERE>",
    "notes": "string",
    "documentType": "${input.documentType}",
    "imagePrompt": "prompt for custom seal or emblem if applicable"
  }`;

  const messages = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: prompt }
  ];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    const parsed = safeJsonParse(response);
    if (Object.keys(parsed).length === 0) {
      return { content: response, notes: "Please review before sending.", documentType: input.documentType };
    }
    return parsed;
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateAdmin(input);
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

export const runOCRScan = async (imageData: string, provider: string = 'gemini', ocrProvider: string = 'gemini', language: string = 'English') => {
  if (ocrProvider === 'gemini') {
    try {
      return await geminiOCRScan(imageData, language);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to groq-vision...");
        ocrProvider = 'groq-vision';
      } else {
        throw err;
      }
    }
  }
  
  if (ocrProvider === 'groq-vision') {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: `Please extract all the text from this image exactly as it appears. Keep formatting where possible. The language is ${language}.` },
          { type: "image_url", image_url: { url: imageData.startsWith('data:image') ? imageData : `data:image/jpeg;base64,${imageData}` } }
        ]
      }
    ];
    try {
      const text = await callMultiAi('groq-vision', messages);
      return { extractedText: text };
    } catch(err) {
      console.warn("groq vision failed, fallback to gemini", err);
      return await geminiOCRScan(imageData, language);
    }
  }
  
  try {
    const extractedText = await performOCR(imageData, getOcrSpaceLangCode(language));
    return { extractedText };
  } catch (error: any) {
    return await geminiOCRScan(imageData, language);
  }
};

export const runOCRAndGrade = async (imageData: string, rubric: string, provider: string = 'gemini', ocrProvider: string = 'gemini', language: string = 'English') => {
  if (provider === 'gemini' && ocrProvider === 'gemini') {
    try {
      return await geminiOCR(imageData, rubric, language);
    } catch (err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        console.warn("Gemini limit hit, auto-falling back to qwen-primary for OCR grading...");
        provider = 'qwen-primary';
        ocrProvider = 'groq-vision';
      } else {
        throw err;
      }
    }
  }
  
  const scanRef = await runOCRScan(imageData, provider, ocrProvider, language);
  const extractedText = scanRef.extractedText;

  const messages = [
    { role: 'system', content: `You are an AI Grader. Use this rubric: ${rubric}` },
    { role: 'user', content: `Grade this text: ${extractedText}. Return JSON with 'totalScore', 'marksPerQuestion[]', 'feedback'.` }
  ];
  
  if (provider === 'gemini') {
    // Gemini can process text grading
    try {
      return await geminiOCR(imageData, rubric, language);
    } catch(err: any) {
      if (err.message?.includes('Quota') || err.message?.includes('429')) {
        provider = 'qwen-primary';
      } else {
        throw err;
      }
    }
  }

  try {
    let model = provider === 'qwen-primary' ? 'Qwen/Qwen3.5-397B-A17B' : (provider === 'qwen-secondary' ? 'Llama-4-Scout-17B-16E-Instruct' : 'qwen-max');
    
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
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiOCR(imageData, rubric, language);
    }
    throw error;
  }
};

export const chatWithTutor = async (messages: any[], provider: string = 'gemini') => {
  const hasImage = messages.some(m => m.parts?.some((p: any) => p.inlineData));
  
  if (provider === 'gemini' || hasImage) {
     // Force gemini if there are images, because groq text models throw 400s
     try {
       return await geminiChat(messages);
     } catch(err: any) {
       if (err.message && (err.message.includes('Quota') || err.message.includes('429'))) {
         if (hasImage) {
           throw new Error("Cannot fallback, Image context requires Gemini API, but quota is exceeded.");
         }
         provider = 'qwen-primary';
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
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiChat(messages);
    }
    throw error;
  }
};
