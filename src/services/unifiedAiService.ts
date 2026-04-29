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

const isProviderFailure = (error: any) => {
  const msg = error?.message?.toLowerCase() || '';
  return (
    msg.includes('insufficient balance') ||
    msg.includes('unauthorized') ||
    msg.includes('402') ||
    msg.includes('401') ||
    msg.includes('400') ||
    msg.includes('credit') ||
    msg.includes('balance is too low') ||
    msg.includes('status code (no body)')
  );
};

export const generateEducationalContent = async (type: string, details: string, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiGenerateContent(type, details);
  
  const messages = [
    { role: 'system', content: MASTER_SYSTEM_PROMPT },
    { role: 'user', content: `Generate educational content of type ${type} with these details: ${details}. Format as Markdown.` }
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
  if (provider === 'gemini') return await geminiGenerateCAPS(input);
  
  const messages = [
    { role: 'system', content: `${MASTER_SYSTEM_PROMPT}\n\nGenerate high-quality ${input.contentType} for Grade ${input.grade} ${input.subject}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be fully styled HTML. Use modern, beautiful Tailwind CSS styling directly in the class attributes for a professional, print-ready "award winning" layout. Include @media print styles if needed. DO NOT use Markdown.` },
    { role: 'user', content: `
    Type: ${input.contentType}
    Grade: ${input.grade}
    Subject: ${input.subject}
    Topic: ${input.topic}
    Objective: ${input.objective}
    Learner Profile: ${input.learnerProfile}
    
    SPECIFIC VISUAL ENHANCEMENT:
    For every worksheet, create ONE stunning hero illustration prompt.
    
    Return as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
    {
      "content": "<HTML STRING GOES HERE>",
      "memo": "<HTML STRING GOES HERE>",
      "rubric": "<HTML STRING GOES HERE>",
      "successIndicators": ["string", "string"],
      "imagePrompt": "Detailed prompt..."
    }
    
    IMAGE GUIDE: ${IMAGE_PROMPT_GOLDEN_RULE}
    ` }
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
  if (provider === 'gemini') return await geminiGenerateVisual(input);
  
  const messages = [
    { role: 'system', content: `${MASTER_SYSTEM_PROMPT}\n\nThe response must be a JSON object, but the 'content' field MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.` },
    { role: 'user', content: `Generate a visual aid design for ${input.visualType} on topic ${input.topic} for Grade ${input.grade}.
    Style: ${input.style}
    Color: ${input.colorScheme}
    Specific Content: ${input.specificContent}
    
    Return as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
    {
      "content": "<HTML STRING WITH TAILWIND DESIGN HERE>",
      "description": "string",
      "printInstructions": "string",
      "imagePrompt": "Detailed prompt..."
    }
    
    IMAGE GUIDE: ${IMAGE_PROMPT_GOLDEN_RULE}` }
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
  if (provider === 'gemini') return await geminiGenerateAdmin(input);
  
  const messages = [
    { role: 'system', content: `${MASTER_SYSTEM_PROMPT}\n\nGenerate highly professional, beautifully formatted text using HTML with modern Tailwind CSS inline styles. DO NOT use generic Markdown.` },
    { role: 'user', content: `Generate a formal ${input.documentType} for ${input.schoolName}. Tone: ${input.tone}. 
Return as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
{
  "content": "<HTML STRING WITH TAILWIND DESIGN HERE>",
  "notes": "string",
  "documentType": "${input.documentType}",
  "imagePrompt": "prompt for custom seal or emblem if applicable"
}` }
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
  if (ocrProvider === 'gemini') return await geminiOCRScan(imageData, language);
  
  try {
    const extractedText = await performOCR(imageData, getOcrSpaceLangCode(language));
    return { extractedText };
  } catch (error: any) {
    return await geminiOCRScan(imageData, language);
  }
};

export const runOCRAndGrade = async (imageData: string, rubric: string, provider: string = 'gemini', ocrProvider: string = 'gemini', language: string = 'English') => {
  if (ocrProvider === 'gemini') {
    // If provider is also gemini, we can just use the unified action
    if (provider === 'gemini') return await geminiOCR(imageData, rubric, language);
    
    // Otherwise extract with gemini first
    const scanRef = await geminiOCRScan(imageData, language);
    const messages = [
      { role: 'system', content: `You are an AI Grader. Use this rubric: ${rubric}` },
      { role: 'user', content: `Grade this text: ${scanRef.extractedText}. Return JSON with 'totalScore', 'marksPerQuestion[]', 'feedback'.` }
    ];
    let model = 'llama-3.3-70b-versatile';
    if (provider === 'llama-secondary') model = 'llama-3.1-8b-instant';
    if (provider === 'groq-qwen') model = 'qwen-2.5-32b';
    const groqResponse = await callMultiAi(provider as any, messages, model);
    try {
      if (typeof groqResponse === 'string') return safeJsonParse(groqResponse);
      const resData = JSON.parse(groqResponse || '{}');
      if (!resData.totalScore || !resData.feedback) throw new Error("Invalid output");
      return resData;
    } catch {
      return await geminiOCR(imageData, rubric, language); // Fallback to full gemini
    }
  }
  
  const extractedText = await performOCR(imageData, getOcrSpaceLangCode(language));
  const messages = [
    { role: 'system', content: `You are an AI Grader. Use this rubric: ${rubric}` },
    { role: 'user', content: `Grade this text: ${extractedText}. Return JSON with 'totalScore', 'marksPerQuestion[]', 'feedback'.` }
  ];

  try {
    const grading = await callMultiAi(provider as AIProvider, messages);
    
    try {
      const parsed = JSON.parse(grading);
      return { ...parsed, extractedText };
    } catch (e) {
      return { extractedText, feedback: grading, totalScore: "N/A" };
    }
  } catch (error: any) {
    if (isProviderFailure(error)) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini OCR...`);
      return await geminiOCR(imageData, rubric, language);
    }
    throw error;
  }
};

export const chatWithTutor = async (messages: any[], provider: string = 'gemini') => {
  const hasImage = messages.some(m => m.parts?.some((p: any) => p.inlineData));
  
  if (provider === 'gemini' || hasImage) {
     // Force gemini if there are images, because groq text models throw 400s
     return await geminiChat(messages);
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
