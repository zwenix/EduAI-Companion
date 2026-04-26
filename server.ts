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

  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "dummy",
    baseURL: "https://api.groq.com/openai/v1",
  });

  const alibaba = new OpenAI({
    apiKey: process.env.ALIBABA_API_KEY || "dummy",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  const mistral = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY || "dummy",
    baseURL: "https://api.mistral.ai/v1",
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
        client = groq; // Now mapped to Groq
        apiKey = process.env.GROQ_API_KEY || "";
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
        client = alibaba; // Now mapped to Alibaba
        apiKey = process.env.ALIBABA_API_KEY || "";
        break;
    }

    if (!client || !apiKey) {
      return res.status(400).json({ error: `Provider ${provider} not configured or API key missing.` });
    }

    try {
      const response = await client.chat.completions.create({
        model: model || (
          provider === "deepseek" ? "llama-3.3-70b-versatile" : 
          provider === "groq" ? "llama-4-scout-17b-16e-instruct" : 
          provider === "mistral" ? "open-mistral-nemo" : 
          provider === "fireworks" ? "qwen3-vl-plus-2025-12-19" : 
          ""
        ),
        messages,
        temperature,
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

  app.post("/api/anthropic", async (req, res) => {
    // We remap this to Groq qwen3-32b
    if (!process.env.GROQ_API_KEY) {
      return res.status(400).json({ error: "Groq API key missing." });
    }
    let { messages, model = "qwen3-32b", max_tokens = 1000, system } = req.body;
    
    // Anthropic had system split from messages, put it back for open-ai if needed
    if (system && !messages.some((m: any) => m.role === 'system')) {
      messages = [{ role: 'system', content: system }, ...messages];
    }

    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        max_tokens,
      });
      res.json(response);
    } catch (error: any) {
      const status = error.status || 500;
      if (status !== 500) {
        console.warn(`Anthropic mapped API returned status ${status}: ${error.message || 'Error'}`);
      } else {
        console.error("Anthropic mapped error:", error.message || error);
      }
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
