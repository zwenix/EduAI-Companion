import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// ─── Prompt Engineering Constants ──────────────────────────────────────────

const MASTER_SYSTEM_PROMPT = `
You are an expert South African CAPS-aligned educational content designer and senior graphic designer specializing in primary and high school learning materials for South African classrooms.

Your task is to generate BEAUTIFUL, PROFESSIONAL, PRINT-READY classroom materials (worksheets, posters, study guides, infographics, flashcards, diagrams, mind maps, etc.) that are:
• 100% aligned to the South African CAPS curriculum
• Age-appropriate and highly engaging for South African learners
• Culturally relevant (include South African contexts, diversity, local animals, landmarks, people, languages where appropriate)
• Visually sophisticated — NEVER use cheap clipart, emojis, or low-quality icons
• Designed with modern educational graphic design principles (clear hierarchy, generous white space, consistent color palette, professional typography)

STYLE REQUIREMENTS (MANDATORY):
- Illustration style: Clean, vibrant, semi-realistic digital illustrations (think award-winning children’s educational books published by Oxford University Press or Maskew Miller Longman — NOT cartoonish or childish beyond the grade level)
- Color palette: Rich but controlled South African-inspired colors (earth tones, bright accents, ocean blues, savanna oranges/greens, rainbow nation diversity)
- Typography: Clean sans-serif fonts (e.g., Poppins, Open Sans, Roboto) for body; bold display fonts only for titles when appropriate
- Layout: Professional grid-based design with perfect alignment, balanced margins, breathing room
- NO emojis, NO smiley faces, NO generic stick figures, NO low-resolution icons

You are never satisfied with mediocre visuals — aim for materials that South African teachers would proudly display in their classrooms or submit to the DBE as exemplars.
`;

const IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail
`;

/**
 * Robustly parses JSON from a model's response text.
 */
const safeJsonParse = (text: string | null | undefined): any => {
  if (!text) return {};
  try {
    const trimmed = text.trim();
    return JSON.parse(trimmed);
  } catch (e) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {}
    }
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        const potentialJson = text.substring(startIdx, endIdx + 1);
        return JSON.parse(potentialJson);
      } catch (e3) {}
    }
    console.error("Failed to parse AI response as JSON:", text);
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

    if (is429 && retries > 0) {
      console.warn(`Gemini rate limited (RPM). Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGemini(fn, retries - 1, delay * 2);
    }

    if (isQuota) {
      console.error("CRITICAL: Gemini Quota Exceeded (RPD/TPM). Please wait or switch project.");
      throw new Error("Gemini Quota Exceeded: Your daily limit for this API key has been reached. Please try again later today.");
    }

    throw error;
  }
}

export const generateEducationalContent = async (type: string, details: string) => {
  const model = "gemini-1.5-flash";
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in Markdown, and ready for classroom use.`;

  return await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a ${type} based on the following details: ${details}. Format as valid markdown.`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  });
};

export const generateCAPSContent = async (input: any) => {
  const model = "gemini-1.5-flash";
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate high-quality ${input.contentType} for Grade ${input.grade} ${input.subject}.\nThe content must be strictly CAPS aligned and professionally formatted in HTML.\nInclude an Answer Memo and a Marking Rubric if requested.`;

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
    For every worksheet/study guide, define ONE stunning hero illustration design prompt that occupies 25–30% of the page. 
    The illustration must be:
    - Directly related to the specific CAPS topic
    - Set in a recognizable South African context
    - Semi-realistic digital painting style
    - Emotionally engaging and curiosity-sparking
    - High detail, rich colors, perfect composition
    
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
            content: { type: Type.STRING, description: "The main education material in HTML format" },
            memo: { type: Type.STRING, description: "The answer key in HTML format" },
            rubric: { type: Type.STRING, description: "The marking rubric in HTML format" },
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
  const model = "gemini-1.5-flash";
  const systemInstruction = MASTER_SYSTEM_PROMPT;

  let visualPrompt = "";
  const isPoster = input.visualType?.toLowerCase().includes('poster');
  const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
  const isDiagram = input.visualType?.toLowerCase().includes('diagram');

  if (isPoster) {
    visualPrompt = `
      Create a stunning, museum-quality educational poster for South African Grade ${input.grade} ${input.subject} learners on the CAPS topic: "${input.topic}"
      Design specifications:
      - Style: Modern semi-realistic digital illustration blended with clean educational graphic design
      - Color palette: Vibrant South African-inspired colors with high contrast for readability
      - Background: Subtle textured gradient or beautiful contextual South African scene relevant to the topic
      - Main illustration: One large, breathtaking central illustration that captures the core concept (photorealistic quality but still illustrated)
      - Typography: Professional hierarchy with clear headings
      - Include 4–6 key fact boxes or callouts with bullet points
      - Diversity: Show South African children from different backgrounds where people are depicted
    `;
  } else if (isInfographic) {
    visualPrompt = `
      Design a visually spectacular CAPS-aligned infographic/mind map on ${input.topic} for Grade ${input.grade}.
      Requirements:
      - Central concept in the middle with radiating branches
      - Each branch has a beautifully illustrated icon (custom drawn, not generic)
      - South African contextual examples throughout
      - Style: Modern flat design with subtle textures and depth
      - Include real South African case studies or examples where possible
    `;
  } else if (isDiagram) {
    visualPrompt = `
      Create a crystal-clear, beautifully illustrated scientific diagram of ${input.topic} specifically adapted for South African Grade ${input.grade} learners.
      Show the process occurring in a real South African landscape (e.g. Table Mountain, Drakensberg, Karoo, Savanna).
      Style: Clean, labeled, semi-realistic illustration with arrows, soft shadows, and depth. National Geographic kids magazine quality.
    `;
  } else {
    visualPrompt = `Create a highly visual ${input.visualType} for Grade ${input.grade} ${input.subject} on topic ${input.topic}.`;
  }

  const prompt = `
    ${visualPrompt}
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
            content: { type: Type.STRING, description: "HTML/CSS content for visual aid" },
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
  const model = "gemini-1.5-flash";
  const systemInstruction = `You are a professional school administrator.
  Generate a formal ${input.documentType} for ${input.schoolName}.
  The tone should be ${input.tone}.`;

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
            content: { type: Type.STRING, description: "Formal HTML document" },
            notes: { type: Type.STRING, description: "Usage advice" },
            documentType: { type: Type.STRING, description: "The type of document generated" }
          },
          required: ["content", "documentType"]
        }
      }
    });
    return response.text;
  });

  return safeJsonParse(responseText);
};

export const runOCRAndGrade = async (imageData: string, rubric: string) => {
  const model = "gemini-1.5-flash";
  
  const prompt = `You are an AI Grader. Analyze the attached image of a student's assessment.
  Reference this rubric: ${rubric}.
  1. Extract the text from the image (OCR).
  2. Grade each question according to the rubric.
  3. Provide constructive feedback for the student.
  4. Summarize the total score.`;

  const responseText = await callGemini(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
        ]
      },
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

export const chatWithTutor = async (messages: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const model = "gemini-1.5-flash";
  
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
