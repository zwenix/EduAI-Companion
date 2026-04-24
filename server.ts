import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- AI Provider Clients ---

  const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "dummy",
    baseURL: "https://api.deepseek.com/v1",
  });

  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "dummy",
    baseURL: "https://api.groq.com/openai/v1",
  });

  const mistral = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY || "dummy",
    baseURL: "https://api.mistral.ai/v1",
  });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "dummy",
  });

  const fireworks = new OpenAI({
    apiKey: process.env.FIREWORKS_API_KEY || "dummy",
    baseURL: "https://api.fireworks.ai/inference/v1",
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
      case "deepseek":
        client = deepseek;
        apiKey = process.env.DEEPSEEK_API_KEY || "";
        break;
      case "groq":
        client = groq;
        apiKey = process.env.GROQ_API_KEY || "";
        break;
      case "mistral":
        client = mistral;
        apiKey = process.env.MISTRAL_API_KEY || "";
        break;
      case "fireworks":
        client = fireworks;
        apiKey = process.env.FIREWORKS_API_KEY || "";
        break;
    }

    if (!client || !apiKey) {
      return res.status(400).json({ error: `Provider ${provider} not configured or API key missing.` });
    }

    try {
      const response = await client.chat.completions.create({
        model: model || (provider === "groq" ? "meta-llama/llama-4-scout-17b-16e-instruct" : provider === "deepseek" ? "deepseek-chat" : ""),
        messages,
        temperature,
      });
      res.json(response);
    } catch (error: any) {
      console.error(`${provider} error:`, error);
      const status = error.status || 500;
      res.status(status).json({ 
        error: error.message,
        provider,
        code: error.code,
        type: error.type 
      });
    }
  });

  app.post("/api/anthropic", async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: "Anthropic API key missing." });
    }
    let { messages, model = "claude-3-haiku-20240307", max_tokens = 1000, system } = req.body;
    
    // Anthropic requires system messages to be a separate parameter
    if (!system) {
      const systemMessageIndex = messages.findIndex((m: any) => m.role === 'system');
      if (systemMessageIndex !== -1) {
        system = messages[systemMessageIndex].content;
        messages = messages.filter((_: any, i: number) => i !== systemMessageIndex);
      }
    }

    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens,
        system,
        messages,
      });
      res.json(response);
    } catch (error: any) {
      console.error("Anthropic error:", error);
      const status = error.status || 500;
      res.status(status).json({ 
        error: error.message,
        provider: "anthropic",
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

  app.post("/api/tts", async (req, res) => {
    const { text, voiceId = "21m00Tcm4lcv85ieW5F3" } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "ElevenLabs API key missing." });
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        },
        {
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );
      res.set("Content-Type", "audio/mpeg");
      res.send(Buffer.from(response.data));
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message });
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
