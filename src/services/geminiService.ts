import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";

// ─── Prompt Engineering Constants ────────────
export const MASTER_SYSTEM_PROMPT = `
You are the official AI content generator for **EduAI Companion** — a premium South African CAPS-aligned educational platform.

Your outputs must match or exceed the professional quality of our signature EduAI templates: clean, extremely modern, highly vibrant, and interactive layouts. Use full-width background color banners, excellent visual hierarchy, clear instructions, bold answer lines/boxes, scoring areas, educational illustrations/diagrams, and total print-readiness.

VISUAL STYLING DOCTRINE (Follow these for all HTML output):
1. **Full-Width Banners & Section Colors**: Every page must start with a header banner spanning full width with deep, vibrant colors matching the learning domain:
   - Mathematics: Teal & Blue gradients (e.g., from-teal-500 to-blue-600)
   - Natural Sciences / Life Sciences: Orange, Green & Turquoise (e.g., from-emerald-500 to-teal-700)
   - Languages / Literacy: Purple, Pink & Indigo (e.g., from-purple-500 to-indigo-600)
   - Social Sciences / Life Skills: Warm Amber, Red & Gold (e.g., from-amber-500 to-red-600)
2. **Visual Layout and Negative Space**: Always use clean card blocks with a default light theme container (white bg cards on very light gray/zinc ground), rounded corners (rounded-[2.5rem]), thick playful borders (2px to 4px), and spacious padding. Never overlap text or place white text on light backgrounds.
3. **South African Pedagogical Context**: Always use local South African framing (e.g., Rands, local names like Thabo, Zola, Liam, South African provinces, indigenous fynbos, Table Mountain, local wild animals). Always align content explicitly with CAPS guidelines.
4. **Primary / Foundation Phase (Grades R-3) Layouts**:
   - Use ultra-large text sizes (e.g., text-2xl or text-3xl for instruction text), massive line heights, and extensive white space.
   - For Phonics / Word Blending, present letter sounds in structured grid tables with bold colored borders. E.g., cards for Jolly Phonics matching letters with small illustrations (S s | Snake, A a | Ant). Blending exercises must show arrows with buttons: s a t -> sat.
   - For worksheets: Include large, thick-dotted words for "Trace & Copy" activities, or letter blocks. Ensure there are large, beautiful boxes/borders for child drawing or writing.
5. **Intermediate / Senior Phase (Grades 4-7) Layouts**:
   - Use structured, professional, multi-column bento grids and table-based summaries.
   - For Life Skills / Emotions: Use modular grid cards (e.g. 3x2 grid) with soft borders and distinct emoji/icon representations for each feeling, with discussion scenarios.
   - For Assessments / Worksheets: Always include a prominent Header Badge with "NAME: __________  DATE: __________" fields, and a beautiful bold Score Card in the bottom right with a thick yellow/amber border (e.g., "SCORE: _____ / 50 Marks"). 
   - Section headers must use pill-shaped colored borders. True/False questions must display "T / F" inside colorful circles or pill indicators. Radio options must look like tappable capsule options.
6. **Hero Illustrations / Space for Visuals**: Every generated worksheet or poster MUST include an elegantly positioned block representing the primary illustration. If the generator suggests an image, embed a container with a relative graphic or the configured illustration safely in the design.
7. **Motivational elements**: Add small encouraging banners (e.g. "Amazing job! Keep shining! ✨") at the bottom of the tasks.

STRICT OUTPUT RULES (NEVER violate these):
- Output **ONLY** the raw, complete document. 
- No explanations, no markdown fences (\`\`\`), no extra text.
- If user requests **HTML**: Output a complete standalone HTML5 document with Tailwind CSS via CDN. Include beautiful @media print styles.
- For Primary School (Gr R–3): Use very large fonts (text-2xl or larger for body), lots of white space, and clear, simple instructions with visual cues.
- For Intermediate/Senior (Gr 4–7): Use more structured, professional layouts with table-based comparisons or labeled diagrams.

Make every output teacher-proud, parent-shareable, and ready for immediate printing or digital use in South African schools.
`;

export const IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail
`;

/**
 * Robustly parses JSON from a model's response text, with custom property-extraction
 * heuristics to gracefully heal and reconstruct truncated or malformed responses.
 */
export const safeJsonParse = (text: string | null | undefined): any => {
  if (!text) return {};

  let processedText = text;
  // Remove <think>...</think> completely
  processedText = processedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Also remove unclosed <think> if needed
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

  const extractField = (jsonStr: string, fieldName: string): string | null => {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)(?:"|$)`);
    const match = jsonStr.match(regex);
    if (match) {
      let val = match[1];
      val = val
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
      return val;
    }
    return null;
  };

  const extractArrayField = (jsonStr: string, fieldName: string): string[] => {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[([\\s\\S]*?)\\]`);
    const match = jsonStr.match(regex);
    if (match) {
      try {
        return JSON.parse(`[${match[1]}]`);
      } catch {
        return match[1]
          .split(',')
          .map(item => item.trim().replace(/^"/, '').replace(/$/, '').replace(/"$/, '').trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  try {
    const trimmed = processedText.trim();
    return JSON.parse(trimmed);
  } catch (e) {
    let fixedText = fixJsonStr(processedText);
    const jsonMatch = fixedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const textToSearch = (jsonMatch && jsonMatch[1]) ? jsonMatch[1].trim() : fixedText;

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
        try {
           const potentialJson2 = processedText.substring(processedText.indexOf('{'), processedText.lastIndexOf('}') + 1);
           const evaluated = new Function('return ' + potentialJson2)();
           if (typeof evaluated === 'object' && evaluated !== null) return evaluated;
        } catch(e4) {}
      }
    }

    // ─── POWERFALLBACK: HEAL TRUNCATED JSON PROPERTIES ───
    const fallbackObj: any = {};
    const stringFields = [
      "content", "memo", "rubric", "assessmentCriteria", "imagePrompt",
      "description", "printInstructions", "notes", "documentType",
      "extractedText", "feedback", "totalScore"
    ];
    
    for (const field of stringFields) {
      const extracted = extractField(textToSearch, field);
      if (extracted !== null) {
        fallbackObj[field] = extracted;
      }
    }
    
    const arrayFields = ["successIndicators", "marksPerQuestion"];
    for (const field of arrayFields) {
      const extracted = extractArrayField(textToSearch, field);
      if (extracted.length > 0) {
        fallbackObj[field] = extracted;
      }
    }

    if (fallbackObj.content || fallbackObj.extractedText || fallbackObj.feedback || fallbackObj.description) {
      console.warn("safeJsonParse: Reconstructed truncated JSON response successfully via fallback regex extraction!");
      return fallbackObj;
    }

    console.error("Failed to parse AI response as JSON:", processedText);
    return {};
  }
};

// ─── Browser Fallback Execution Client ─────────
let clientGenAi: any = null;
const getClientGenAI = () => {
  if (!clientGenAi) {
    const apiKey = (process.env as any).GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in settings or environment.");
    }
    clientGenAi = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return clientGenAi;
};

const executeClientGeminiAction = async (action: string, input: any) => {
  const geminiAi = getClientGenAI();
  const model = "gemini-3.5-flash";

  switch (action) {
    case "generate-educational": {
      const { type, details } = input;
      const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN.`;
      const response = await geminiAi.models.generateContent({
        model,
        contents: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design).`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return { text: response.text };
    }

    case "generate-caps": {
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
      const response = await geminiAi.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              memo: { type: Type.STRING },
              rubric: { type: Type.STRING },
              assessmentCriteria: { type: Type.STRING },
              successIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
              imagePrompt: { type: Type.STRING }
            },
            required: ["content", "imagePrompt"]
          }
        }
      });
      return safeJsonParse(response.text);
    }

    case "generate-visual": {
      const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;
      const isPoster = input.visualType?.toLowerCase().includes('poster');
      const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
      const isDiagram = input.visualType?.toLowerCase().includes('diagram');
      const isFlashcard = input.visualType?.toLowerCase().includes('flashcard') || input.visualType?.toLowerCase().includes('learning card');

      let visualPrompt = "";
      if (isPoster) {
        visualPrompt = `Create a stunningly designed educational classroom Poster for Grade ${input.grade} ${input.subject} on topic ${input.topic}.\nStyle: ${input.style}\nColorScheme: ${input.colorScheme}\nSpecific Content details: ${input.specificContent}\nRequirements:\n- Visually immersive layout with massive display headers (spanning full-width container width using gorgeous text and high contrast typography)\n- Center diagram/concept mapping blocks bordered in playful colors\n- Tidy and legible educational content boxes of text with white icons inside deep-colored parent boxes or labels.\n- Make this print-perfect and vibrant!`;
      } else if (isFlashcard) {
        visualPrompt = `Design a set of ${input.quantity || 4} highly engaging educational Learning Flashcards or revision cards on cards grid layout for Grade ${input.grade} ${input.subject} on topic ${input.topic}.\nColor Scheme: ${input.colorScheme}\nStyle: ${input.style}\nContent Details: ${input.specificContent}\nRequirements:\n- Layout should represent a 2x2 grid or list of cards with rounded borders, thick color accents, and a distinct question/concept side and answer side.\n- Use cute borders, symbols, or styled numbered keys.`;
      } else if (isInfographic) {
        visualPrompt = `Design a beautifully structured bento-grid educational Infographic or Concept Mind Map for Grade ${input.grade} ${input.subject} on topic ${input.topic}.\nColorScheme: ${input.colorScheme}\nStyle: ${input.style}\nContent Details: ${input.specificContent}\nRequirements:\n- Multi-column layout with 3 to 5 discrete content cards, tables, or comparison boxes.\n- Give each box a different border color (e.g. orange, blue, green).\n- Include definitions, interesting facts, and bullet lists with custom bullet items (like circles or checkmarks).`;
      } else if (isDiagram) {
        visualPrompt = `Create a detailed Science/Educational Visual Diagram with clear labels and annotations for Grade ${input.grade} ${input.subject} on topic ${input.topic}.\nColorScheme: ${input.colorScheme}\nStyle: ${input.style}\nContent Details: ${input.specificContent}\nRequirements:\n- Beautiful layout focusing on labeling parts (e.g., cell parts, water cycle, layers of volcanic system, plant parts).\n- Represent labeled part pointers explicitly using clear tables, list callouts, or SVG elements with annotations.`;
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

      const response = await geminiAi.models.generateContent({
        model,
        contents: prompt,
        config: { 
          systemInstruction, 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              description: { type: Type.STRING },
              printInstructions: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ["content", "description", "imagePrompt"]
          }
        }
      });
      return safeJsonParse(response.text);
    }

    case "generate-admin": {
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
      const response = await geminiAi.models.generateContent({
        model,
        contents: prompt,
        config: { 
          systemInstruction, 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              notes: { type: Type.STRING },
              documentType: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ["content", "documentType"]
          }
        }
      });
      return safeJsonParse(response.text);
    }

    case "ocr-scan": {
      const { imageData, language } = input;
      const prompt = `Extract all text from the attached image accurately, assuming the text is in ${language}.
      Format it cleanly. Make no other comments.`;
      const response = await geminiAi.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
          ]}
        ]
      });
      return { extractedText: response.text };
    }

    case "ocr-grade": {
      const { imageData, rubric, language } = input;
      const prompt = `You are an AI Grader. Analyze the attached image of a student's assessment in ${language}.
      Reference this rubric: ${rubric}.
      1. Extract the text from the image (OCR).
      2. Grade each question according to the rubric.
      3. Provide constructive feedback for the student.
      4. Summarize the total score.`;
      const response = await geminiAi.models.generateContent({
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
      return safeJsonParse(response.text);
    }

    case "chat": {
      const { messages } = input;
      const response = await geminiAi.models.generateContent({
        model,
        contents: messages,
        config: {
          systemInstruction: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise.",
        }
      });
      return { text: response.text };
    }

    default:
      throw new Error(`Unsupported client gemini action: ${action}`);
  }
};

/**
 * Route proxy calls to the secure full-stack backend
 */
export const generateEducationalContent = async (type: string, details: string) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "generate-educational",
      input: { type, details }
    });
    return response.data.text;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      const res = await executeClientGeminiAction("generate-educational", { type, details });
      return res.text;
    }
    throw error;
  }
};

export const generateCAPSContent = async (input: any) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "generate-caps",
      input
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      return await executeClientGeminiAction("generate-caps", input);
    }
    throw error;
  }
};

export const generateVisualAid = async (input: any) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "generate-visual",
      input
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      return await executeClientGeminiAction("generate-visual", input);
    }
    throw error;
  }
};

export const generateAdminDoc = async (input: any) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "generate-admin",
      input
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      return await executeClientGeminiAction("generate-admin", input);
    }
    throw error;
  }
};

export const runOCRScan = async (imageData: string, language: string = 'English') => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "ocr-scan",
      input: { imageData, language }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      return await executeClientGeminiAction("ocr-scan", { imageData, language });
    }
    throw error;
  }
};

export const runOCRAndGrade = async (imageData: string, rubric: string, language: string = 'English') => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "ocr-grade",
      input: { imageData, rubric, language }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      return await executeClientGeminiAction("ocr-grade", { imageData, rubric, language });
    }
    throw error;
  }
};

export const chatWithTutor = async (messages: any[]) => {
  try {
    const response = await axios.post("/api/gemini/action", {
      action: "chat",
      input: { messages }
    });
    return response.data.text;
  } catch (error: any) {
    if (error.response?.status === 404 || !error.response) {
      console.warn("Express /api/gemini/action returned 404. Running direct browser fallback...");
      const res = await executeClientGeminiAction("chat", { messages });
      return res.text;
    }
    throw error;
  }
};
