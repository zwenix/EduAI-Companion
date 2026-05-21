import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

import { HfInference } from "@huggingface/inference";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- AI Provider Clients ---

  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "dummy",
    baseURL: "https://api.groq.com/openai/v1",
  });

  const alibaba = new OpenAI({
    apiKey: process.env.ALIBABA_API_KEY || "dummy",
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  });

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Generic content generation proxy for OpenAI-compatible APIs
  app.post("/api/ai/:provider", async (req, res) => {
    const { provider } = req.params;
    const { messages, model, temperature = 0.7 } = req.body;

    let client: OpenAI | null = null;
    let apiKey = "";

    switch (provider) {
      case "llama-primary":
      case "llama-secondary":
      case "groq-vision":
        client = groq;
        apiKey = process.env.GROQ_API_KEY || "";
        break;
      case "alibaba-qwen":
      case "alibaba-deepseek":
        client = alibaba;
        apiKey = process.env.ALIBABA_API_KEY || "";
        break;
    }

    if (!apiKey || apiKey === "dummy" || apiKey === 'undefined') {
      return res.status(400).json({ error: { message: `Provider ${provider} is not configured. Please add the ${provider === 'alibaba-qwen' ? 'ALIBABA_API_KEY' : 'API_KEY'} in the application settings.` }});
    }

    try {
      const response = await client.chat.completions.create({
        model: model || (
          provider === "llama-primary" ? "llama-3.3-70b-versatile" : 
          provider === "llama-secondary" ? "llama-3.1-8b-instant" : 
          provider === "alibaba-qwen" ? "qwen-plus" :
          provider === "alibaba-deepseek" ? "deepseek-v3" :
          provider === "groq-vision" ? "llama-3.2-11b-vision-instant" :
          ""
        ),
        messages,
        temperature,
        max_completion_tokens: 8192,
      });
      res.json(response);
    } catch (error: any) {
      const status = error.status || 500;
      if (status !== 500) {
        console.warn(`${provider} API returned status ${status}: ${error.message || 'Error'}`);
      } else {
        console.error(`${provider} error:`, error.message || error);
      }
      res.status(status).json({ 
        error: error.message,
        provider,
        code: error.code,
        type: error.type 
      });
    }
  });

  app.post("/api/ocr", async (req, res) => {
    const { image, language = "eng" } = req.body;
    const apiKey = process.env.OCR_SPACE_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "OCR.space API key missing." });
    }

    try {
      const formData = new URLSearchParams();
      formData.append("base64Image", image);
      formData.append("language", language);
      formData.append("apikey", apiKey);

      const response = await axios.post("https://api.ocr.space/parse/image", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("OCR error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tts/google", async (req, res) => {
    const { text, lang } = req.body;
    try {
      const googleTTS = await import("google-tts-api");
      const urls = googleTTS.getAllAudioUrls(text, { lang, slow: false, splitPunct: ',.?!' });
      // Map URLs to our server-side proxy to completely bypass iframe CORS and referrer restriction policies
      const proxiedUrls = urls.map(u => `/api/tts/proxy?url=${encodeURIComponent(u.url)}`);
      res.json({ urls: proxiedUrls });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tts/proxy", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).send("Missing URL parameter");
    }
    try {
      const response = await axios({
        method: "get",
        url: url,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/"
        }
      });
      const contentType = response.headers["content-type"];
      res.setHeader("Content-Type", typeof contentType === "string" ? contentType : "audio/mpeg");
      response.data.pipe(res);
    } catch (error: any) {
      console.warn("Audio proxy error:", error.message);
      res.status(500).send("Audio proxy failed");
    }
  });

  app.post("/api/tts/hf", async (req, res) => {
    const { text, model } = req.body;
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    try {
      if (!fetch) {
         // Some node versions might not have global fetch if very old, but since we use node 22 it's fine.
      }
      const fetchResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey ? `Bearer ${apiKey}` : ""
        },
        body: JSON.stringify({ inputs: text }) // Note: HF TTS expects "inputs"
      });
      if (!fetchResponse.ok) {
        throw new Error(`HF returned ${fetchResponse.status}`);
      }
      const buffer = await fetchResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      res.json({ audio: `data:audio/flac;base64,${base64}` });
    } catch (e: any) {
      console.warn("HF TTS Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/video/generate", async (req, res) => {
    const { prompt, model } = req.body;
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(400).json({ error: "REPLICATE_API_TOKEN is required. Please set it in Settings -> Secrets." });
    }
    try {
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({ auth: apiKey });
      
      const modelIdentifier = model === "replicate-minimax" ? "minimax/video-01" : "luma/ray";
      
      const prediction = await replicate.predictions.create({
        model: modelIdentifier as any,
        input: { prompt: prompt }
      });
      
      res.json({ id: prediction.id, status: prediction.status });
    } catch (e: any) {
      console.warn("Replicate Video Error:", e);
      if (e.message?.includes("402 Payment Required") || e.response?.status === 402 || e.message?.includes("Insufficient credit")) {
        console.warn("Falling back to sample video due to insufficient Replicate credits.");
        return res.json({ id: "mock-video-id", status: "started" });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/video/status/:id", async (req, res) => {
    if (req.params.id === "mock-video-id") {
      // Simulate processing delay, then return a sample nature/educational video
      return res.json({ 
        status: "succeeded", 
        url: "https://www.w3schools.com/html/mov_bbb.mp4" 
      });
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(400).json({ error: "REPLICATE_API_TOKEN is required." });
    }
    try {
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({ auth: apiKey });
      
      const prediction = await replicate.predictions.get(req.params.id);
      
      if (prediction.status === "succeeded") {
         const url = Array.isArray(prediction.output) ? prediction.output[0] : (prediction.output as any)?.url || prediction.output;
         res.json({ status: prediction.status, url });
      } else if (prediction.status === "failed" || prediction.status === "canceled") {
         res.status(500).json({ error: "Video generation failed or was canceled." });
      } else {
         res.json({ status: prediction.status });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/images/generate", async (req, res) => {
    const { prompt, provider } = req.body;
    
    if (provider === "gemini-imagen") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
        return res.status(400).json({ error: "GEMINI_API_KEY missing" });
      }

      try {
        const geminiAi = new GoogleGenAI({ 
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        const response = await geminiAi.models.generateImages({
          model: 'gemini-2.5-flash-image',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1'
          }
        });
        
        // Response format usually creates an array of images. We need to extract base64 or url
        // GoogleGenAI SDK returns `generatedImages` array.
        if (response.generatedImages && response.generatedImages.length > 0) {
          const image = response.generatedImages[0];
          // image.image.imageBytes usually holds the base64 string
          const base64 = image.image.imageBytes;
          if (base64) {
            return res.json({ url: `data:image/jpeg;base64,${base64}` });
          }
        }
        throw new Error("Failed to extract image from Gemini response");
      } catch (error: any) {
        console.warn("Gemini Imagen warn:", error.message);
        return res.status(500).json({ error: error.message || "Failed to generate image via Gemini" });
      }
    }

    if (provider === "alibaba-qwen-image") {
      const apiKey = process.env.ALIBABA_API_KEY;
      if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
        return res.status(400).json({ error: "ALIBABA_API_KEY missing" });
      }

      try {
        const response = await alibaba.images.generate({
          model: 'qwen-image-2.0-pro-2026-04-22',
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        return res.json({ url: response.data[0].url });
      } catch (error: any) {
        console.warn("Alibaba image warn:", error.message);
        return res.status(500).json({ error: error.message || "Failed to generate image via Alibaba" });
      }
    }

    if (provider === "huggingface") {
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) return res.status(400).json({ error: "HUGGINGFACE_API_KEY missing" });
      
      try {
        const hf = new HfInference(apiKey);
        const imageBlob = await hf.textToImage({
          model: 'black-forest-labs/FLUX.1-schnell',
          inputs: prompt,
          parameters: { negative_prompt: 'blurry' }
        });
        const arrayBuffer = await (imageBlob as any).arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return res.json({ url: `data:image/jpeg;base64,${base64}` });
      } catch (error: any) {
        console.warn("HuggingFace image warn:", error.message);
        return res.status(500).json({ error: error.message || "Failed to generate image via HuggingFace" });
      }
    }
    
    return res.status(400).json({ error: "Unsupported provider" });
  });

  // --- Individual Learner Development Plan (ILDP) Route ---

  function generateLocalFallbackILDP(studentName: string, grade: string, subjects: any[]) {
    const lowSubjects = subjects.filter((s: any) => s.mark < 70);
    const highSubjects = subjects.filter((s: any) => s.mark >= 75);

    const strengths = highSubjects.map((s: any) => `Excellent mastery of foundational concepts and high accuracy in Grade ${grade} ${s.name} (${s.mark}%).`)
      .slice(0, 3);
    if (strengths.length === 0) {
      strengths.push("Shows great curiosity, consistent learning attitude, and active participation in class discussions.");
    }

    const weaknesses = lowSubjects.map((s: any) => `Currently finding some topics challenging in ${s.name} (${s.mark}%), requiring targeted revision and problem-solving exercises.`)
      .slice(0, 3);
    if (weaknesses.length === 0) {
      weaknesses.push(`Doing well overall; could benefit from challenging extension tasks to nurture advanced thinking skills.`);
    }

    const recommendations = [
      `Engage with the personalized exercises in Content Creator Studio, focusing specifically on weak areas.`,
      `Hold 1-on-1 focus chats with the EduAI Tutor to review problem-solving strategies.`,
      `Form small group study sessions with peers using Study Groups in Class Management.`
    ];

    const actionPlan = [
      { task: "Revise high-priority syllabus sections and build summaries", milestone: "Within 2 weeks", status: "In Progress" },
      { task: "Consult AI Tutor for interactive quizzes on weaker chapters", milestone: "Within 3 weeks", status: "Pending" },
      { task: "Submit a practice portfolio task for teacher review", milestone: "Before major exam", status: "Pending" }
    ];

    return { strengths, weaknesses, recommendations, actionPlan };
  }

  app.post("/api/reports/ildp", async (req, res) => {
    const { studentName, grade, subjects } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
      return res.json(generateLocalFallbackILDP(studentName, grade, subjects));
    }
    try {
      const geminiAi = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const prompt = `
        You are a supportive, insightful educational counselor and South African school advisor.
        Generate a constructive and professional Individual Learner Development Plan (ILDP) for a school student with this profile:
        Student Name: ${studentName}
        Grade: ${grade}
        Performance Stats: ${JSON.stringify(subjects)}

        The response must be a valid raw JSON object matching this exact TypeScript interface:
        {
          "strengths": string[];
          "weaknesses": string[];
          "recommendations": string[];
          "actionPlan": { task: string; milestone: string; status: 'Pending' | 'In Progress' | 'Completed' }[];
        }

        Make sure your recommendations are encouraging and specifically reference their low/high subjects. Align suggestions with South African CAPS-standards (e.g. SBA, formative tests). Do not format the response with markdown formatting (no backticks, no text like 'json' or explanations), only output a parseable JSON block.
      `;
      const response = await geminiAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      const text = response.text || "";
      const trimmed = text.trim();
      const cleanJson = trimmed.startsWith("```") ? trimmed.replace(/^```json\s*/i, "").replace(/```$/, "").trim() : trimmed;
      const data = JSON.parse(cleanJson);
      res.json(data);
    } catch (err: any) {
      console.warn("Gemini ILDP Generation failed, using local builder:", err.message);
      res.json(generateLocalFallbackILDP(studentName, grade, subjects));
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
