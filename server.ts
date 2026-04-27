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
        client = groq;
        apiKey = process.env.GROQ_API_KEY || "";
        break;
      case "alibaba":
        client = new OpenAI({
          apiKey: (process.env.ALIBABA_API_KEY || "").trim(),
          baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        });
        apiKey = (process.env.ALIBABA_API_KEY || "").trim();
        break;
    }

    if (!client || !apiKey) {
      return res.status(400).json({ error: `Provider ${provider} not configured or API key missing.` });
    }

    try {
      const response = await client.chat.completions.create({
        model: model || (
          provider === "llama-primary" ? "llama-3.3-70b-versatile" : 
          provider === "llama-secondary" ? "llama-3.1-8b-instant" : 
          provider === "alibaba" ? "qwen-vl-plus" :
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
