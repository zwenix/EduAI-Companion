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
  
  const isStudyGuide = input.contentType === 'Study Guide / Learning Notes';
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate high-quality ${input.contentType} for Grade ${input.grade} ${input.subject}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be fully styled HTML. Use modern, beautiful Tailwind CSS styling directly in the class attributes for a professional, print-ready "award winning" layout. Include @media print styles if needed. DO NOT use Markdown.`;
  
  let studyGuideRequirements = "";
  if (isStudyGuide) {
    studyGuideRequirements = `
    CRITICAL STUDY GUIDE REQUIREMENTS:
    - This is a Study Guide/Learning Notes document. The primary content MUST be comprehensive, article-like, or textbook chapter-like notes.
    - Break down the concepts logically into paragraphs, using rich explanations that a learner can actually study from.
    - Include illustrations or visual aids (describe or embed them using CSS/HTML shapes, or leave marked spaces for the hero illustration).
    - You can include a few exercises, examples, or a worksheet section at the end, but the MAJORITY of the document must be the detailed educational reading material and notes.
    `;
  }

  const prompt = `
    Type: ${input.contentType}
    Grade: ${input.grade}
    Subject: ${input.subject}
    Topic: ${input.topic}
    Language: ${input.language}
    Objective: ${input.objective}
    Learner Profile: ${input.learnerProfile}
    Additional Info: ${input.additionalInstructions}

    SPECIFIC VISUAL ENHANCEMENT:
    For every worksheet/document, create ONE stunning hero illustration at the top that occupies 25–30% of the page. 
    The illustration must be:
    - Directly related to the specific CAPS topic
    - Set in a recognizable South African context
    - Semi-realistic digital painting style (like children’s non-fiction books)
    - Emotionally engaging and curiosity-sparking
    - High detail, rich colors, perfect composition

    REQUIREMENTS FOR HTML DESIGN:
    - Include full-width colored banners (e.g. orange for Life Skills, teal/blue for Math, purple/pink for Languages).
    - Add a large circular badge in the top right for the Grade (e.g., "Grade 4").
    - "Name: ____ Date: _____ Total __ / 30" layout below header (if applicable).
    - Question text styles: Make them bold with distinct numbered bullets (e.g. circles with white text).
    - Options/Answers: Enclose multiple choices or matching lists inside pill-shaped boxes with a colored border or background.
    - Footer: "EduAI Companion | CAPS Aligned | eduai-companion.github.io".
    - DO NOT USE MARKDOWN. Write raw HTML inside the JSON content values using tailwind CSS classes.
    ${studyGuideRequirements}

    Return the result as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
    {
      "content": "<HTML CODE FOR THE MAIN DOCUMENT HERE>",
      "memo": "<HTML CODE FOR THE ANSWER MEMO HERE>",
      "rubric": "<HTML CODE FOR THE GRADING RUBRIC HERE>",
      "successIndicators": ["string", "string"],
      "imagePrompt": "Detailed prompt matching IMAGE GUIDE..."
    }
    
    GUIDE: ${IMAGE_PROMPT_GOLDEN_RULE}
  `;

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
  
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;
  const isPoster = input.visualType?.toLowerCase().includes('poster');
  const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
  const isDiagram = input.visualType?.toLowerCase().includes('diagram');
  const isFlashcard = input.visualType?.toLowerCase().includes('flashcard') || input.visualType?.toLowerCase().includes('learning card');

  let visualPrompt = "";
  if (isPoster) {
    visualPrompt = `
      Create a stunning, print-ready educational poster for South African Grade ${input.grade} ${input.subject} learners on the CAPS topic: "${input.topic}"

      DESIGN REQUIREMENTS (Based on EduAI Companion Templates):
      - HTML/Tailwind ONLY. Do not use markdown.
      - Layout: A massive central Hero Image (illustration) taking up the middle 50% of the poster.
      - Top Banner: Large, playful, multi-colored bubble-letter style title (using text-shadows, varied colors per word) centered at the top.
      - Floating Fact Boxes: 4-6 small floating fact boxes positioned around the central image. Each box should have a thick colored outline (e.g., solid 4px red, green, blue border), white background, small playful SVG icon/emoji, and short, legible text.
      - Title Style: Give each letter or word a different vibrant color.
      - Visual hierarchy: Make it look like an adventure map or a colorful infographic.
      - Footer Layout: Include 3-4 neat little text boxes in a row at the very bottom containing extra info or activities. Include EduAI or CAPS branding.
      - Typography: Use bold, playful sans-serif fonts.
      - Colors: Sky blue background, primary color accents (bright yellow, striking red, vibrant green).
      
      Make it vibrant, instantly engaging, and child-friendly.
    `;
  } else if (isFlashcard) {
    visualPrompt = `
      Design a set of professional, double-sided educational flashcards for Grade ${input.grade} ${input.subject} on "${input.topic}".
      
      DESIGN REQUIREMENTS:
      - Show multiple cards in a grid (2 or 3 per row).
      - Each card should have:
        - Front side: Large title, high-quality icon/emoji, and a very short hint.
        - Back side: Explanation, a South African contextual example, and a small "Did you know?" fact.
      - Card style: rounded-3xl corners, thick colored borders (2px), subtle shadow.
      - Use vibrant colors that change per card.
      - Ensure text is large and legible (text-xl for titles).
    `;
  } else if (isInfographic) {
    visualPrompt = `
      Design a visually spectacular CAPS-aligned infographic/mind map on ${input.topic} for Grade ${input.grade}.

      Requirements:
      - Central concept in the middle with radiating branches
      - Each branch has a beautifully illustrated icon (custom drawn, not generic)
      - South African contextual examples throughout
      - Color-coded sections with perfect visual hierarchy
      - Style: Modern flat design with subtle textures and depth
      - Include real South African case studies or examples where possible
    `;
  } else if (isDiagram) {
    visualPrompt = `
      Create a crystal-clear, beautifully illustrated scientific diagram of ${input.topic} specifically adapted for South African Grade ${input.grade} learners.

      Show the process occurring in a real South African landscape:
      - Water cycle: Include Table Mountain, Drakensberg, or Karoo
      - Food chain: Use indigenous animals (lion, impala, acacia tree, vulture, etc.)
      - Rock cycle: Feature South African geological formations
      - Plant structure: Use protea, aloe, or fynbos species

      Style: Clean, labeled, semi-realistic illustration with arrows, soft shadows, and depth. National Geographic kids magazine quality.
    `;
  } else {
    visualPrompt = `Create a highly visual ${input.visualType} for Grade ${input.grade} ${input.subject} on topic ${input.topic}.`;
  }

  const prompt = `
    ${visualPrompt}
    Language: ${input.language}
    Style: ${input.style}
    Color: ${input.colorScheme}
    Content Details: ${input.specificContent}
    Quantity: ${input.quantity}
    Additional Info: ${IMAGE_PROMPT_GOLDEN_RULE}

    Return as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
    {
      "content": "<HTML STRING WITH TAILWIND DESIGN HERE>",
      "description": "string",
      "printInstructions": "string",
      "imagePrompt": "Detailed prompt..."
    }
  `;

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
  
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate a formal ${input.documentType} for ${input.schoolName}.
  The tone should be ${input.tone}.
  IMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.`;
  const prompt = `
    Type: ${input.documentType}
    Purpose: ${input.purpose}
    Key Points: ${input.keyPoints}
    Include Reply Slip: ${input.includeReplySlip}
    Language: ${input.language}

    Return as a pure JSON object containing ONLY the following keys. DO NOT use backticks (\`) for string values. Always use standard double quotes (") for string values and properly escape any internal double quotes. Do not add any text before or after the JSON.
    {
      "content": "<HTML STRING WITH TAILWIND DESIGN HERE>",
      "notes": "string",
      "documentType": "${input.documentType}",
      "imagePrompt": "prompt for custom seal or emblem if applicable"
    }
  `;

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
    let model = provider === 'qwen-primary' ? 'Qwen/Qwen3.5-397B-A17B' : 'Llama-4-Scout-17B-16E-Instruct';
    
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
