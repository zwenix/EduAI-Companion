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
        console.warn("Gemini limit hit, auto-falling back to hf-qwen...");
        provider = 'hf-qwen';
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
        console.warn("Gemini limit hit, auto-falling back to hf-qwen...");
        provider = 'hf-qwen';
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
        console.warn("Gemini limit hit, auto-falling back to hf-qwen...");
        provider = 'hf-qwen';
      } else {
        throw err;
      }
    }
  }
  
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;
  const isPoster = input.visualType?.toLowerCase().includes('poster');
  const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
  const isLessonDisplay = input.visualType?.toLowerCase().includes('display') || input.visualType?.toLowerCase().includes('chart') || input.visualType?.toLowerCase().includes('wall') || input.visualType?.toLowerCase().includes('lesson display');
  const isDiagram = input.visualType?.toLowerCase().includes('diagram');
  const isFlashcard = input.visualType?.toLowerCase().includes('flashcard') || input.visualType?.toLowerCase().includes('learning card');

  let visualPrompt = "";
  if (isPoster) {
    visualPrompt = `
      Create an exceptionally polished, high-resolution educational poster layout on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.
      
      CRITICAL RULE: DO NOT generate quiz questions, exam exercises, worksheets, homework, fill-in-the-blanks, or assessment tasks. This is exclusively a visual teaching aid.
      
      AESTHETICS & STRUCTURE SPECIFICATION:
      1. Clean Visual Hierarchy: Establish a clear flow from the top down. Use a generous, modern header banner, well-spaced bento-grid sections, and an impressive footer.
      2. Minimalist Vector Style: Keep illustrations, icons, and layout clean, elegant, and modern. Avoid chaotic overlays, noisy gradients, or over-rendered elements.
      3. Color Palette: Use a cohesive, premium palette of 3-4 professional colors (e.g., deep slate blue, warm terracotta accent, clean cream background). Avoid neon rainbow noise.
      4. Central Visual Component: A spectacular, high-resolution hero section featuring a minimalist vector style illustration portraying "${input.topic}" in a clean, professional manner (e.g., [Illustration: ${input.topic} depicted in an elegant, clean South African context]).
      5. Content Blocks: Present key concepts inside elegantly spaced card containers (rounded-2xl, subtle border, shadow) with large beautifully tracking headers, concise bullet points (4-8 words), and relevant emojis.
      
      Ensure every element is crisp, accessible, and ready for immediate high-resolution classroom display printing.
    `;
  } else if (isInfographic) {
    visualPrompt = `
      Design an incredibly structured, premium academic infographic on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.
      
      CRITICAL RULE: DO NOT generate homework, questions, assessment exercises, or study guides with dense text. Focus on graphics, statistics, and high-impact visual layouts.
      
      AESTHETICS & STRUCTURE SPECIFICATION:
      1. High-Resolution Educational Poster Layout: Organize complex theories into a dual-column matrix or an asymmetrical bento grid structure.
      2. Minimalist Vector Style: Icons, graphics, charts, and mascots must be styled as modern flat minimalist vector graphics with clean outlines and balanced negative space.
      3. Clean Visual Hierarchy: Guide the eye with clean numbered points, bold colored accents, distinct callout panels (rounded-xl), and elegant divider ribbons.
      4. Concept breakdown: Each section must feature a descriptive visual mockup placeholder (e.g., [Illustration: Clean vector infographic icon of key concept]) alongside hyper-concise capsule bullet facts.
      5. Visual Anchors: Include a striking comparison matrix or a centered concentric diagram showing relationships cleanly.
      
      The final product must be highly instructive, visually mesmerizing, and optimized for classroom display.
    `;
  } else if (isLessonDisplay) {
    visualPrompt = `
      Design a stunning, high-resolution visual Lesson Display / Anchor Chart on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.
      
      CRITICAL RULE: This is a permanent reference display, not a quiz or activity workbook. Ensure zero assessment activities or worksheet blocks.
      
      AESTHETICS & STRUCTURE SPECIFICATION:
      1. High-Resolution Educational Poster Layout: Style this as a full-screen, landscape or portrait anchor chart. Frame it with a bold, professional border and a large chalkboard-style or modern minimalist header.
      2. Clean Visual Hierarchy: Create high-contrast floating keyword cards, word-wall cards, or step-by-step process paths. Use beautiful, generous negative space so keywords stand out clearly at a distance of 5 meters.
      3. Minimalist Vector Style: All diagram lines, connecting arrows, indicators, and background grids must use a sleek, modern minimalist vector style.
      4. Primary Focal Point: Frame a central diagram representing the core mechanism of "${input.topic}" (using clean labeled lines, e.g., pointing out labels like "ROOT", "PHOTOSYNTHESIS", "REACTIONS" in stark white backgrounds with crisp shadows).
      5. Vocabulary Anchors: Highlight 4-6 key term definition cards, beautifully styled with dashed colored borders, a neat custom emoji, and single-sentence explanations.
      
      Make it visually inspiring, clean, and perfectly suited for prominent display on classroom bulletin boards or digital visual screens.
    `;
  } else if (isFlashcard) {
    visualPrompt = `
      Design a set of professional, double-sided visual educational flashcards for South African Grade ${input.grade} ${input.subject} on "${input.topic}".
      
      DESIGN REQUIREMENTS:
      - Grid Layout: Show multiple cards in a beautifully aligned grid (2 or 3 per row).
      - Each card must have:
        - Front side: Large bold title, a delightful custom icon or emoji, and a quick catchy hint or question.
        - Back side: Clear conceptual explanation, a South African contextual/CAPS example, and a small fun "Did you know?" fact box.
      - Aesthetics: Rounded-3xl corners (at least 24px), thick colored outlines (3px solid border that changes color per card), and micro shadow depth.
      - Use rich, vibrant background gradients or clean high-contrast card themes. Text must be large and instantly legible.
    `;
  } else if (isDiagram) {
    visualPrompt = `
      Create a crystal-clear, beautifully illustrated scientific diagram of "${input.topic}" specifically adapted for South African Grade ${input.grade} ${input.subject} learners.
      
      CRITICAL: This is a teaching demonstration visual aid. DO NOT write worksheet questions, exercises, or tests.
      
      DIAGRAM ARCHITECTURE:
      - Flow & Layout: Set against a highly realistic, vibrant South African biome / context (e.g. water cycles over the Drakensberg mountains, food webs of the Kruger savanna, or plant cell structure featuring indigenous fynbos/Proteas).
      - Connections: Draw bright, stylized, high-contrast flowing directional arrows pointing out movement, cycle flow, or ecosystem energy transfers.
      - Diagram Labels: Place 5-6 crisp, floating educational pointing cards (labels like 'KAROO', 'ALOE ROOT', 'ENERGY FLOW') connected to their targets. Styling: stark white background, rounded border, sharp shadows, and bold scientific monospace/sans-serif fonts.
      - Key/Legend: Include a small, highly tidy legend card at the bottom right with colorful indicator boxes explaining key parts.
      - Ensure the diagram looks detailed, professional, and is highly instructive for display.
    `;
  } else {
    visualPrompt = `Create a highly visual display, not a worksheet, for Grade ${input.grade} ${input.subject} on topic ${input.topic}. Ensure it is styled beautifully.`;
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
        console.warn("Gemini limit hit, auto-falling back to hf-qwen...");
        provider = 'hf-qwen';
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
        console.warn("Gemini limit hit, auto-falling back to hf-qwen for OCR grading...");
        provider = 'hf-qwen';
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
        provider = 'hf-qwen';
      } else {
        throw err;
      }
    }
  }

  try {
    let model = provider === 'hf-qwen' ? 'Qwen/Qwen3.5-397B-A17B' : 'Llama-4-Scout-17B-16E-Instruct';
    
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
         provider = 'hf-qwen';
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
