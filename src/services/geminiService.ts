import axios from "axios";

// ─── Prompt Engineering Constants ────────────
export const MASTER_SYSTEM_PROMPT = `
You are the world's most advanced, deeply helpful, and empathetic AI educational assistant, specifically designed to support the South African national school system. You serve teachers, learners, parents, and administrative staff from Grade R through Grade 12 (and Grade 13/matric transition phase).

Your outputs must match or exceed the professional quality of our signature EduAI templates: clean, extremely modern, highly vibrant, and interactive layouts. Use full-width background color banners, excellent visual hierarchy, clear instructions, bold answer lines/boxes, scoring areas, educational illustrations/diagrams, and total print-readiness.

YOUR STRICT SAFETY & PEDAGOGICAL BOUNDARIES:
- Age-Appropriateness: Keep language, complexity, and theme strictly matched to the requested South African School Phase (Foundation Phase: Grade R-3, Intermediate Phase: Grade 4-6, Senior Phase: Grade 7-9, FET Phase: Grade 10-12).
- CAPS Alignment: Map all curriculum items cleanly to South African Curriculum and Assessment Policy Statement (CAPS) guidelines.
- Content Moderation: Refuse immediately any request involving self-harm, hate speech, explicit violence, adult themes, or unsafe content. Pivot with warm encouragement: "I'm here to support your schoolwork. Let's explore a positive theme related to your subjects instead!"
- National Pride & Diversity: Reflect South African context (names, cultures, rich geography, Rand currency, local animals/plants) naturally.

OUTPUT FORMATTING GOLDEN RULE:
- If user requests **HTML**: Output a complete standalone HTML5 document with Tailwind CSS via CDN. Include beautiful @media print styles.
- If user requests **JSON**: Follow the specified schemas precisely.
- Never output raw Markdown (like # or ** in HTML values). Use correct bold/heading tags or tailwind classes instead.
- Include a formal, printable Header and Footer stating: "EduAI CAPS Aligned Worksheet".
Make every output teacher-proud, parent-shareable, and ready for immediate printing or digital use in South African schools.
`;

export const IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail
`;

/**
 * Robust regex-based recovery parser for when JSON responses are slightly truncated
 * or malformed (power-fallback mechanism).
 */
export const safeJsonParse = (text: string | null | undefined): any => {
  if (!text) return {};
  const processedText = text.trim();
  
  try {
    // First try normal JSON parse
    return JSON.parse(processedText);
  } catch (err) {
    console.warn("safeJsonParse: Standard JSON parse failed, trying regex fallback...", err);

    // Helper regex extractors
    const extractField = (source: string, field: string): string | null => {
      const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`"${escapedField}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,|\\s*})`, 'i');
      const match = source.match(regex);
      if (match) return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      return null;
    };

    const extractArrayField = (source: string, field: string): string[] => {
      const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`"${escapedField}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i');
      const match = source.match(regex);
      if (match && match[1]) {
        return match[1]
          .split(',')
          .map(item => item.trim().replace(/^["']|["']$/g, '').trim())
          .filter(item => item.length > 0);
      }
      return [];
    };

    const textToSearch = processedText;

    // Direct Javascript execution recovery if brackets are matched at all
    if (processedText.includes('{') && processedText.includes('}')) {
      try {
        const potentialJson = processedText.substring(processedText.indexOf('{'), processedText.lastIndexOf('}') + 1);
        const parsedObj = JSON.parse(potentialJson);
        if (parsedObj) return parsedObj;
      } catch (e2) {
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

// ─── Secure Server Action Routing ─────────

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
    console.error("Express /api/gemini/action failed:", error.message || error);
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
    console.error("Express /api/gemini/action failed:", error.message || error);
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
    console.error("Express /api/gemini/action failed:", error.message || error);
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
    console.error("Express /api/gemini/action failed:", error.message || error);
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
    console.error("Express /api/gemini/action failed:", error.message || error);
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
    console.error("Express /api/gemini/action failed:", error.message || error);
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
    console.error("Express /api/gemini/action failed:", error.message || error);
    throw error;
  }
};
