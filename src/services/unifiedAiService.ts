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
    { role: 'system', content: `${MASTER_SYSTEM_PROMPT}\n\nGenerate high-quality ${input.contentType} for Grade ${input.grade} ${input.subject}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be rich, professionally formatted Markdown text. DO NOT use HTML tags or Tailwind classes. ONLY use standard Markdown formatting (e.g., # Headings, **bold**, *italics*, bullet points). The UI will handle the styling.` },
    { role: 'user', content: `
    Type: ${input.contentType}
    Grade: ${input.grade}
    Subject: ${input.subject}
    Topic: ${input.topic}
    Objective: ${input.objective}
    Learner Profile: ${input.learnerProfile}
    
    SPECIFIC VISUAL ENHANCEMENT:
    For every worksheet, create ONE stunning hero illustration prompt.
    
    Return as a pure JSON object containing ONLY the following keys:
    {
      "content": "<MARKDOWN STRING GOES HERE>",
      "memo": "<MARKDOWN STRING GOES HERE>",
      "rubric": "<MARKDOWN STRING GOES HERE>",
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
    { role: 'system', content: `${MASTER_SYSTEM_PROMPT}\n\nThe response must be a JSON object, but the 'content' field MUST be rich, professionally formatted Markdown text. DO NOT use HTML tags or Tailwind classes.` },
    { role: 'user', content: `Generate a visual aid design for ${input.visualType} on topic ${input.topic} for Grade ${input.grade}.
    Style: ${input.style}
    Color: ${input.colorScheme}
    Specific Content: ${input.specificContent}
    
    Return as a pure JSON object containing ONLY the following keys:
    {
      "content": "<MARKDOWN STRING GOES HERE>",
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
    { role: 'system', content: `${MASTER_SYSTEM_PROMPT}\n\nGenerate highly professional, beautifully formatted text using Rich Markdown.` },
    { role: 'user', content: `Generate a formal ${input.documentType} for ${input.schoolName}. Tone: ${input.tone}. 
Return as a pure JSON object containing ONLY the following keys:
{
  "content": "<MARKDOWN STRING GOES HERE>",
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

export const runOCRScan = async (imageData: string, provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiOCRScan(imageData);
  
  if (provider === 'groq-qwen') {
     // Multi-ai isn't fully set up for base64 images yet via Groq. We fallback to OCR space.
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
  
  const extractedText = await performOCR(imageData);
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
      return await geminiOCR(imageData, rubric);
    }
    throw error;
  }
};

export const chatWithTutor = async (messages: any[], provider: string = 'gemini') => {
  if (provider === 'gemini') return await geminiChat(messages);
  
  // Format messages for OpenAI/Anthropic
  let formattedMessages: any[] = [
    { role: 'system', content: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise." }
  ];
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
    if (isProviderFailure(error)) {
      console.warn(`Provider ${provider} failed (${error.message}). Falling back to Gemini...`);
      return await geminiChat(messages);
    }
    throw error;
  }
};
