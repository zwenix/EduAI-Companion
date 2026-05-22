import axios from "axios";

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

/**
 * Route proxy calls to the secure full-stack backend
 */
export const generateEducationalContent = async (type: string, details: string) => {
  const response = await axios.post("/api/gemini/action", {
    action: "generate-educational",
    input: { type, details }
  });
  return response.data.text;
};

export const generateCAPSContent = async (input: any) => {
  const response = await axios.post("/api/gemini/action", {
    action: "generate-caps",
    input
  });
  return response.data;
};

export const generateVisualAid = async (input: any) => {
  const response = await axios.post("/api/gemini/action", {
    action: "generate-visual",
    input
  });
  return response.data;
};

export const generateAdminDoc = async (input: any) => {
  const response = await axios.post("/api/gemini/action", {
    action: "generate-admin",
    input
  });
  return response.data;
};

export const runOCRScan = async (imageData: string, language: string = 'English') => {
  const response = await axios.post("/api/gemini/action", {
    action: "ocr-scan",
    input: { imageData, language }
  });
  return response.data;
};

export const runOCRAndGrade = async (imageData: string, rubric: string, language: string = 'English') => {
  const response = await axios.post("/api/gemini/action", {
    action: "ocr-grade",
    input: { imageData, rubric, language }
  });
  return response.data;
};

export const chatWithTutor = async (messages: any[]) => {
  const response = await axios.post("/api/gemini/action", {
    action: "chat",
    input: { messages }
  });
  return response.data.text;
};
