import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiAi = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  try {
    const response = await geminiAi.models.generateImages({
      model: 'gemini-2.5-flash-image',
      prompt: "A beautiful sunset",
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1'
      }
    });
    console.log("Success! Got images:", response.generatedImages?.length);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
run();
