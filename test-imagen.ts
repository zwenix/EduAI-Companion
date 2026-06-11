import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("Using API key:", apiKey ? "Present" : "Missing");

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function run() {
  try {
    console.log("Attempting to generate image with 'gemini-2.5-flash-image' via generateContent...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A beautiful educational illustration of children reading books.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });
    console.log("Success with 'gemini-2.5-flash-image'!");
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log("Found image part in response!");
      } else if (part.text) {
        console.log("Found text part:", part.text);
      }
    }
  } catch (err: any) {
    console.error("Error with 'gemini-2.5-flash-image':", err.message);
  }
}

run();
