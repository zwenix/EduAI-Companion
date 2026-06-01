import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

const MASTER_SYSTEM_PROMPT = "You are a deeply helpful AI educational assistant.";
const IMAGE_PROMPT_GOLDEN_RULE = "Ultra-detailed digital illustration.";

async function main() {
  const input = {
    contentType: "Study Guide / Learning Notes",
    grade: "4",
    subject: "Mathematics",
    topic: "Fractions",
    language: "English",
    objective: "Learn half and quarter",
    learnerProfile: "Diverse learners",
    additionalInstructions: "Focus on visuals"
  };

  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate high-quality ${input.contentType} for Grade ${input.grade} ${input.subject}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be fully styled HTML.`;

  const prompt = `
    Type: ${input.contentType}
    Grade: ${input.grade}
    Subject: ${input.subject}
    Topic: ${input.topic}
    Language: ${input.language}
    Objective: ${input.objective}
    Learner Profile: ${input.learnerProfile}
    Additional Info: ${input.additionalInstructions}

    GUIDE: ${IMAGE_PROMPT_GOLDEN_RULE}
  `;

  try {
    console.log("Calling generateContent with schema...");
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    console.log("RESPONSE SUCCESS:", res.text);
  } catch (err) {
    console.error("RESPONSE ERROR STATUS/NAME:", err.name, err.status);
    console.error("RESPONSE ERROR MESSAGE:", err.message);
    console.error("FULL ERROR DETAILS:", JSON.stringify(err, null, 2));
  }
}

main();
