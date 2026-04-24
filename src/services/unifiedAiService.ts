import { 
  generateEducationalContent as geminiGenerateContent,
  generateCAPSContent as geminiGenerateCAPS,
  generateVisualAid as geminiGenerateVisual,
  generateAdminDoc as geminiGenerateAdmin,
  runOCRAndGrade as geminiOCR,
  runOCRScan as geminiOCRScan,
  chatWithTutor as geminiChat
} from './geminiService';

import { callMultiAi, performOCR, AIProvider } from './multiAiService';

export const generateEducationalContent = async (type: string, details: string, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiGenerateContent(type, details);
  
  const messages = [{ role: 'user', content: `Generate educational content of type ${type} with these details: ${details}. Format as Markdown.` }];
  try {
    return await callMultiAi(provider as AIProvider, messages);
  } catch (error: any) {
    if (error.message.includes('Insufficient Balance') || error.message.includes('Unauthorized') || error.message.includes('credit') || error.message.includes('status code (no body)') || error.message.includes('400')) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateContent(type, details);
    }
    throw error;
  }
};

export const generateCAPSContent = async (input: any, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiGenerateCAPS(input);
  
  // For other providers, we might need to prompt specifically for JSON or handle the response
  const messages = [{ role: 'user', content: `Generate CAPS aligned ${input.contentType} for Grade ${input.grade}. Return as a JSON object with 'content', 'memo', 'rubric', 'successIndicators', and 'imagePrompt'.` }];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    try {
       return JSON.parse(response);
    } catch (e) {
       return { content: response, imagePrompt: "Educational classroom scene" };
    }
  } catch (error: any) {
    if (error.message.includes('Insufficient Balance') || error.message.includes('Unauthorized') || error.message.includes('credit') || error.message.includes('status code (no body)') || error.message.includes('400')) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateCAPS(input);
    }
    throw error;
  }
};

export const generateVisualAid = async (input: any, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiGenerateVisual(input);
  
  const messages = [{ role: 'user', content: `Generate a visual aid design description for ${input.visualType} on topic ${input.topic}. Return JSON with 'content', 'description', 'printInstructions', 'imagePrompt'.` }];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    try {
       return JSON.parse(response);
    } catch (e) {
       return { content: response, description: "Visual aid generated", imagePrompt: "Abstract educational graphic" };
    }
  } catch (error: any) {
    if (error.message.includes('Insufficient Balance') || error.message.includes('Unauthorized') || error.message.includes('credit') || error.message.includes('status code (no body)') || error.message.includes('400')) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateVisual(input);
    }
    throw error;
  }
};

export const generateAdminDoc = async (input: any, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiGenerateAdmin(input);
  
  const messages = [{ role: 'user', content: `Generate a formal ${input.documentType} for ${input.schoolName}. Tone: ${input.tone}. Return JSON with 'content', 'notes', 'documentType'.` }];
  try {
    const response = await callMultiAi(provider as AIProvider, messages);
    try {
       return JSON.parse(response);
    } catch (e) {
       return { content: response, notes: "Please review before sending.", documentType: input.documentType };
    }
  } catch (error: any) {
    if (error.message.includes('Insufficient Balance') || error.message.includes('Unauthorized') || error.message.includes('credit') || error.message.includes('status code (no body)') || error.message.includes('400')) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiGenerateAdmin(input);
    }
    throw error;
  }
};

export const runOCRScan = async (imageData: string, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiOCRScan(imageData);
  
  if (provider === 'mistral') {
    return await geminiOCRScan(imageData);
  }
  
  try {
    const extractedText = await performOCR(imageData);
    return { extractedText };
  } catch (error: any) {
    return await geminiOCRScan(imageData);
  }
};

export const runOCRAndGrade = async (imageData: string, rubric: string, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiOCR(imageData, rubric);
  
  // Mistral or OCR.space
  if (provider === 'mistral') {
    // Mistral vision if implemented, otherwise fallback
    return await geminiOCR(imageData, rubric);
  }
  
  const extractedText = await performOCR(imageData);
  const messages = [
    { role: 'system', content: `You are an AI Grader. Use this rubric: ${rubric}` },
    { role: 'user', content: `Grade this text: ${extractedText}. Return JSON with 'totalScore', 'marksPerQuestion[]', 'feedback'.` }
  ];
  try {
    const grading = await callMultiAi('groq', messages); // Use Groq for fast grading
    
    try {
      const parsed = JSON.parse(grading);
      return { ...parsed, extractedText };
    } catch (e) {
      return { extractedText, feedback: grading, totalScore: "N/A" };
    }
  } catch (error: any) {
    if (error.message.includes('Insufficient Balance') || error.message.includes('Unauthorized') || error.message.includes('credit') || error.message.includes('status code (no body)') || error.message.includes('400')) {
      console.warn(`Provider groq/mistral failed (${error.message}). Falling back to Gemini OCR...`);
      return await geminiOCR(imageData, rubric);
    }
    throw error;
  }
};

export const chatWithTutor = async (messages: any[], provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiChat(messages);
  
  // Format messages for OpenAI/Anthropic
  let formattedMessages: any[] = [];
  let lastRole: string | null = null;

  for (const m of messages) {
    const role = m.role === 'model' ? 'assistant' : 'user';
    const text = m.parts[0]?.text || '';
    
    if (!text.trim()) continue;

    if (role === lastRole) {
      // Merge consecutive messages with the same role
      formattedMessages[formattedMessages.length - 1].content += "\n\n" + text;
    } else {
      formattedMessages.push({ role, content: text });
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
    if (error.message.includes('Insufficient Balance') || error.message.includes('Unauthorized') || error.message.includes('credit') || error.message.includes('status code (no body)') || error.message.includes('400')) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiChat(messages);
    }
    throw error;
  }
};
