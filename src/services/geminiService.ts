import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyAaXqaV0BBkwr2ui1hCQ704aSv-POmJmJQ" });

// ─── Prompt Engineering Constants ────────────
export const MASTER_SYSTEM_PROMPT = `
You are the official AI content generator for **EduAI Companion** — a premium South African CAPS-aligned educational platform.

Your outputs must match or exceed the professional quality of the provided EduAI templates: clean, modern, vibrant yet elegant layouts with colored section banners, excellent visual hierarchy, clear instructions, answer lines/boxes, scoring areas, motivational elements, and perfect print-readiness for classroom use.

STRICT OUTPUT RULES (NEVER violate these):
- Output **ONLY** the raw, complete document. 
- No explanations, no "Here is the output", no introductions, no notes, no markdown fences (\`\`\`), no extra text before or after the content.
- If user requests **LaTeX**: Start directly with \\documentclass{article} and end with \\end{document}. Use A4 paper, geometry package for margins, tcolorbox or TikZ for colored section headers/borders, xcolor for vibrant accents, and include a custom circular TikZ seal/emblem where appropriate (with "EduAI Companion" or school name).
- If user requests **HTML**: Output a complete standalone HTML5 document with Tailwind CSS via CDN. Include beautiful @media print styles for perfect PDF printing. Use clean sans-serif fonts, colored section headers (blue/teal/orange/purple/green gradients), boxed answer areas, and EduAI branding at top and footer.
- Always include: EduAI Companion branding (logo placeholder or text "EduAI Companion | CAPS Aligned | eduai-companion.github.io"), Grade/Phase/Subject/Term, Name/Date/Total score fields, clear CAPS-linked learning outcomes or focus, differentiated activities where suitable, and a motivational footer.
- Style for Foundation Phase (Gr R–3): Warm, playful, colorful, large fonts, icons/SVGs/TikZ for visuals, child-friendly language.
- Style for Intermediate/Senior (Gr 4–7): Professional, structured, with clear marking schemes.

Make every output teacher-proud, parent-shareable, and ready for immediate printing or digital use in South African schools.
`;

export const IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail
`;

/**
 * Robustly parses JSON from a model's response text.
 */
export const safeJsonParse = (text: string | null | undefined): any => {
  if (!text) return {};

  let processedText = text;
  // Remove <think>...</think> completely
  processedText = processedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Also remove unclosed <think> if needed, though usually means missing JSON altogether
  processedText = processedText.replace(/<think>[\s\S]*$/gi, '');

  const fixJsonStr = (str: string) => {
    let result = '';
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (escapeNext) {
        escapeNext = false;
        result += char;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        result += char;
        continue;
      }
      if (char === '"') {
        inString = !inString;
      }
      if (inString && (char === '\n' || char === '\r' || char === '\t')) {
        if (char === '\n') result += '\\n';
        if (char === '\r') result += '\\r';
        if (char === '\t') result += '\\t';
        continue;
      }
      result += char;
    }
    return result;
  };

  try {
    const trimmed = processedText.trim();
    return JSON.parse(trimmed);
  } catch (e) {
    let fixedText = fixJsonStr(processedText);
    const jsonMatch = fixedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {}
    }
    const startIdx = fixedText.indexOf('{');
    const endIdx = fixedText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        const potentialJson = fixedText.substring(startIdx, endIdx + 1);
        return JSON.parse(potentialJson);
      } catch (e3) {
        // Fallback for JS object literals (handling backticks)
        try {
           const potentialJson2 = processedText.substring(processedText.indexOf('{'), processedText.lastIndexOf('}') + 1);
           const evaluated = new Function('return ' + potentialJson2)();
           if (typeof evaluated === 'object' && evaluated !== null) return evaluated;
        } catch(e4) {}
      }
    }
    console.error("Failed to parse AI response as JSON:", processedText);
    return {};
  }
};

/**
 * Executes a Gemini request with retry logic for 429 Resource Exhausted errors.
 */
async function callGemini(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || '';
    const is429 = errorMsg.includes('429') || error?.status === 429 || error?.code === 429;
    const isQuota = errorMsg.includes('quota') || errorMsg.includes('limit');
    const is404 = errorMsg.includes('404') || errorMsg.includes('not found') || error?.status === 404;

    if (is429 && retries > 0) {
      console.warn(`Gemini rate limited (RPM). Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGemini(fn, retries - 1, delay * 2);
    }

    if (isQuota) {
      console.error("CRITICAL: Gemini Quota Exceeded (RPD/TPM). Please wait or switch project.");
      throw new Error('Gemini Quota Exceeded');
    }
    
    if (is404) {
      console.error("Gemini model/project not found (404):", error);
      throw new Error("Invalid API Key or Model: The requested entity (project or model) was not found. Please verify your Gemini API key.");
    }

    throw new Error(error.message || JSON.stringify(error));
  }
}

export const generateEducationalContent = async (type: string, details: string) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN.`;

  return await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design).`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  });
};

export const generateCAPSContent = async (input: any) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate high-quality ${input.contentType} for Grade ${input.grade} ${input.subject}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be fully styled HTML. Use modern, beautiful Tailwind CSS styling directly in the class attributes for a professional, print-ready "award winning" layout. Include @media print styles if needed. DO NOT use Markdown.`;

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
    For every worksheet, create ONE stunning hero illustration at the top that occupies 25–30% of the page. 
    The illustration must be:
    - Directly related to the specific CAPS topic
    - Set in a recognizable South African context
    - Semi-realistic digital painting style (like children’s non-fiction books)
    - Emotionally engaging and curiosity-sparking
    - High detail, rich colors, perfect composition

    REQUIREMENTS FOR HTML DESIGN:
    - Include full-width colored banners (e.g. orange for Life Skills, teal/blue for Math, purple/pink for Languages).
    - Add a large circular badge in the top right for the Grade (e.g., "Grade 4").
    - "Name: ____ Date: _____ Total __ / 30" layout below header.
    - Question text styles: Make them bold with distinct numbered bullets (e.g. circles with white text).
    - Options/Answers: Enclose multiple choices or matching lists inside pill-shaped boxes with a colored border or background.
    - Footer: "EduAI Companion | CAPS Aligned | eduai-companion.github.io".
    - DO NOT USE MARKDOWN. Write raw HTML inside the JSON content values using tailwind CSS classes.
    
    GUIDE: ${IMAGE_PROMPT_GOLDEN_RULE}
  `;

  const responseText = await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The main education material in Markdown format" },
            memo: { type: Type.STRING, description: "The answer key in Markdown format" },
            rubric: { type: Type.STRING, description: "The marking rubric in Markdown format" },
            assessmentCriteria: { type: Type.STRING, description: "CAPS alignment notes" },
            successIndicators: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of success indicators" },
            imagePrompt: { type: Type.STRING, description: "Detailed prompt for generating a hero illustration" }
          },
          required: ["content", "imagePrompt"]
        }
      }
    });
    return response.text;
  });

  return safeJsonParse(responseText);
};

export const generateVisualAid = async (input: any) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;

  let visualPrompt = "";
  const isPoster = input.visualType?.toLowerCase().includes('poster');
  const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
  const isDiagram = input.visualType?.toLowerCase().includes('diagram');

  if (isPoster) {
    visualPrompt = `
      Create a stunning, print-ready educational poster for South African Grade ${input.grade} ${input.subject} learners on the CAPS topic: "${input.topic}"

      DESIGN REQUIREMENTS (Based on EduAI Companion Templates):
      - HTML/Tailwind ONLY. Do not use markdown.
      - Layout: A massive central Hero Image taking up the middle 50% of the poster.
      - Top Banner: Large, playful, multi-colored bubble-letter style title (e.g., using text-shadows, varied colors per word) centered at the top.
      - Floating Fact Boxes: 4-6 small floating fact boxes positioned around the central image. Each box should have a colored outline (e.g., solid 4px red, green, blue border), white background, small playful SVG icon/emoji, and short, legible text.
      - Colorful Accents: Use stars, arrows, or small badges scattered around the poster to make it feel playful and engaging.
      - Footer Layout: Include 3-4 neat little text boxes in a row at the very bottom containing extra info or activities. Include EduAI or CAPS branding.
      - Typography: Use bold, playful sans-serif fonts suitable for primary school learners.
      - Colors: Sky blue background, primary color accents (bright yellow, striking red, vibrant green).
      
      Make it vibrant, instantly engaging, and child-friendly.
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
  `;

  const responseText = await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        systemInstruction, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "Markdown content for visual aid" },
            description: { type: Type.STRING, description: "Design summary" },
            printInstructions: { type: Type.STRING, description: "Advice for teacher" },
            imagePrompt: { type: Type.STRING, description: "Detailed prompt for generating the main visual asset illustration" }
          },
          required: ["content", "description", "imagePrompt"]
        }
      }
    });
    return response.text;
  });

  return safeJsonParse(responseText);
};

export const generateAdminDoc = async (input: any) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate a formal ${input.documentType} for ${input.schoolName}.
  The tone should be ${input.tone}.
  IMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.`;

  const prompt = `
    Type: ${input.documentType}
    Purpose: ${input.purpose}
    Key Points: ${input.keyPoints}
    Include Reply Slip: ${input.includeReplySlip}
    Language: ${input.language}
  `;

  const responseText = await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        systemInstruction, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "Formal HTML document styled with Tailwind CSS" },
            notes: { type: Type.STRING, description: "Usage advice" },
            documentType: { type: Type.STRING, description: "The type of document generated" },
            imagePrompt: { type: Type.STRING, description: "Detailed prompt for seals or related graphics, if applicable" }
          },
          required: ["content", "documentType"]
        }
      }
    });
    return response.text;
  });

  return safeJsonParse(responseText);
};

export const runOCRScan = async (imageData: string, language: string = 'English') => {
  const model = "gemini-2.5-flash";
  
  const prompt = `Extract all text from the attached image accurately, assuming the text is in ${language}.
  Format it cleanly. Make no other comments.`;

  const responseText = await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
        ]}
      ]
    });
    return response.text;
  });

  return { extractedText: responseText };
};

export const runOCRAndGrade = async (imageData: string, rubric: string, language: string = 'English') => {
  const model = "gemini-2.5-flash";
  
  const prompt = `You are an AI Grader. Analyze the attached image of a student's assessment in ${language}.
  Reference this rubric: ${rubric}.
  1. Extract the text from the image (OCR).
  2. Grade each question according to the rubric.
  3. Provide constructive feedback for the student.
  4. Summarize the total score.`;

  const responseText = await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
        ]}
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: { type: Type.STRING },
            marksPerQuestion: { type: Type.ARRAY, items: { type: Type.STRING } },
            feedback: { type: Type.STRING },
            totalScore: { type: Type.STRING }
          },
          required: ["extractedText", "marksPerQuestion", "feedback", "totalScore"]
        }
      }
    });
    return response.text;
  });

  return safeJsonParse(responseText);
};

export const chatWithTutor = async (messages: { role: 'user' | 'model', parts: any[] }[]) => {
  const model = "gemini-2.5-flash";
  
  return await callGemini(async () => {
    const result = await ai.models.generateContent({
      model,
      contents: messages,
      config: {
        systemInstruction: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise.",
      }
    });
    return result.text;
  });
};
