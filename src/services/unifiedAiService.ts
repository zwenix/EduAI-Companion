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
    { role: 'user', content: `Create a beautifully designed HTML document for a CAPS-aligned Grade ${input.grade} ${input.subject} ${input.contentType} on the topic "${input.topic}".

Requirements (match the professional EduAI template style exactly):
- Vibrant colored section headers (use blue/teal for main title, orange/green/purple for subsections).
- Include fields for Name, Date, Total Score (e.g., ___ / 50).
- Clear numbered questions with answer lines or boxes.
- Include marking scheme in brackets [marks] next to each question or section.
- Add motivational elements, success criteria, or encouraging footer text.
- For worksheets/assessments: Mix question types (multiple choice with circles/boxes, true/false, short answer, drawing/coloring activities).
- For visuals: Include space for drawings, tables, or describe/embed simple SVG elements (number lines, shapes, icons).
- Branding: Top header with "EduAI Companion | CAPS Aligned", footer with "South Africa" and motivational phrase.
- Foundation Phase: Use larger fonts, playful language, and colorful accents suitable for young learners.
- Make it fully ready-to-print: balanced whitespace, professional alignment, and elegant design.

Objective: ${input.objective}
Learner Profile: ${input.learnerProfile}

SPECIFIC VISUAL ENHANCEMENT:
For every worksheet/document, create ONE stunning hero illustration prompt.

Return the result as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
{
  "content": "<HTML CODE FOR THE MAIN DOCUMENT HERE>",
  "memo": "<HTML CODE FOR THE ANSWER MEMO HERE>",
  "rubric": "<HTML CODE FOR THE GRADING RUBRIC HERE>",
  "successIndicators": ["string", "string"],
  "imagePrompt": "Detailed prompt matching IMAGE GUIDE..."
}

IMAGE GUIDE: ${IMAGE_PROMPT_GOLDEN_RULE}`
    }
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
    return await geminiOCR(imageData, rubric, language);
  }
  
  const scanRef = await runOCRScan(imageData, provider, ocrProvider, language);
  const extractedText = scanRef.extractedText;

  const messages = [
    { role: 'system', content: `You are an AI Grader. Use this rubric: ${rubric}` },
    { role: 'user', content: `Grade this text: ${extractedText}. Return JSON with 'totalScore', 'marksPerQuestion[]', 'feedback'.` }
  ];
  
  if (provider === 'gemini') {
    // Gemini can process text grading
    return await geminiOCR(imageData, rubric, language);
  }

  try {
    let model = 'llama-3.3-70b-versatile';
    if (provider === 'llama-secondary') model = 'llama-3.1-8b-instant';
    if (provider === 'groq-qwen') model = 'qwen-2.5-32b';
    
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
