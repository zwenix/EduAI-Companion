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
      res.json({ urls: urls.map(u => u.url) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/video/status/:id", async (req, res) => {
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
