import express from "express";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { HfInference } from "@huggingface/inference";
import { GoogleGenAI, Type } from "@google/genai";
import { CAPS_LESSON_PLAN_SYSTEM_PROMPT } from "./src/lib/prompts/caps-lesson-plan-prompt.ts";
import { EduAIPromptEngine } from "./src/lib/prompt-engine.ts";

dotenv.config();

// Cache the last verified working Gemini model to eliminate fallback latency and unnecessary fallback warnings.
let cachedWorkingModel: string | null = null;

interface FailedRequest {
  id: string;
  timestamp: string;
  provider: string;
  endpoint: string;
  model?: string;
  error: string;
  rawResponse?: any;
  requestPayload?: any;
}

const failedRequestsLog: FailedRequest[] = [];

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  if (req.body) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        return next();
      } catch (e) {
        // Not JSON
      }
    }
  }
  express.json({ limit: '10mb' })(req, res, next);
});

// --- AI Provider Clients ---

// Note: All clients are initialized dynamically inside handlers to prevent initialization and cold start issues.


  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/admin/debug-errors", (req, res) => {
    res.json({ errors: failedRequestsLog });
  });

  app.post("/api/admin/debug-errors/clear", (req, res) => {
    failedRequestsLog.length = 0;
    res.json({ success: true, message: "Logs cleared successfully." });
  });

  // Dynamic lightweight SVG placeholder endpoint to support generated teaching templates
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const width = parseInt(req.params.width) || 300;
    const height = parseInt(req.params.height) || 200;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#94a3b8" dominant-baseline="middle" text-anchor="middle">
        ${width} x ${height}
      </text>
    </svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.status(200).send(svg);
  });

  // Generic content generation proxy for OpenAI-compatible APIs
  app.post("/api/ai/:provider", async (req, res) => {
    let { provider } = req.params;
    const { messages, model, temperature = 0.7 } = req.body || {};

    const callGeminiFallback = async (msgs: any[] = []): Promise<any> => {
      const geminiApiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
      if (!geminiApiKey || geminiApiKey === "" || geminiApiKey === "dummy" || geminiApiKey === "undefined") {
        throw new Error("GEMINI_API_KEY is not configured for fallback.");
      }
      const gAi = new GoogleGenAI({ 
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const safeMsgs = Array.isArray(msgs) ? msgs : [];
      const systemMessageTexts = safeMsgs
        .filter((m: any) => m.role === 'system')
        .map((m: any) => {
          if (typeof m.content === 'string') return m.content;
          if (Array.isArray(m.content)) {
            return m.content.map((sh: any) => typeof sh === 'string' ? sh : (sh.text || '')).join('\n');
          }
          return typeof m.content === 'object' && m.content ? JSON.stringify(m.content) : String(m.content || '');
        })
        .join("\n\n");
        
      const remainingMsgs = safeMsgs.filter((m: any) => m.role !== 'system');
      const mergedContents: any[] = [];
      remainingMsgs.forEach((m: any) => {
        const mappedRole = m.role === 'assistant' ? 'model' : 'user';
        let txt = "";
        if (typeof m.content === 'string') {
          txt = m.content;
        } else if (Array.isArray(m.content)) {
          txt = m.content.map((sh: any) => typeof sh === 'string' ? sh : (sh.text || '')).join('\n');
        } else if (m.content) {
          txt = JSON.stringify(m.content);
        }
        
        if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === mappedRole) {
          mergedContents[mergedContents.length - 1].parts[0].text += "\n" + txt;
        } else {
          mergedContents.push({
            role: mappedRole,
            parts: [{ text: txt }]
          });
        }
      });
      
      // Ensure alternating roles starting with 'user'
      const finalContents: any[] = [];
      let expectedRole = 'user';
      mergedContents.forEach((msg) => {
        if (msg.role === expectedRole) {
          finalContents.push(msg);
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        } else {
          if (finalContents.length > 0) {
            finalContents[finalContents.length - 1].parts[0].text += "\n" + msg.parts[0].text;
          } else if (msg.role === 'model') {
            finalContents.push({
              role: 'user',
              parts: [{ text: `[Context: Assistant previous output]\n${msg.parts[0].text}` }]
            });
            expectedRole = 'model';
          }
        }
      });

      if (finalContents.length === 0) {
        finalContents.push({ role: 'user', parts: [{ text: "Hello" }] });
      }

      const isJsonPreferred = safeMsgs.some((m: any) => {
        if (!m.content) return false;
        if (typeof m.content === 'string') {
          return m.content.toLowerCase().includes('json');
        }
        if (Array.isArray(m.content)) {
          return m.content.some((sub: any) => typeof sub === 'string' ? sub.toLowerCase().includes('json') : (sub.text && sub.text.toLowerCase().includes('json')));
        }
        return JSON.stringify(m.content).toLowerCase().includes('json');
      });

      const options: any = {
        model: "gemini-3.5-flash",
        contents: finalContents,
      };

      options.config = {};
      if (systemMessageTexts) {
        options.config.systemInstruction = systemMessageTexts;
      }
      if (isJsonPreferred) {
        options.config.responseMimeType = "application/json";
      }

      const modelsToTry = cachedWorkingModel 
        ? [cachedWorkingModel, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
        : ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      let geminiResponse;
      let lastErrMessage = "";
      for (const modelToTry of modelsToTry) {
        try {
          console.info(`Trying Gemini fallback model candidate: ${modelToTry} (isJsonPreferred: ${isJsonPreferred})...`);
          geminiResponse = await gAi.models.generateContent({
            ...options,
            model: modelToTry
          });
          if (geminiResponse) {
            cachedWorkingModel = modelToTry; // Cache successfully validated model
            break;
          }
        } catch (mErr: any) {
          lastErrMessage = mErr.message || String(mErr);
          console.info(`Gemini candidate '${modelToTry}' is currently unavailable. Trying alternative...`);
        }
      }
      if (!geminiResponse) {
        throw new Error(`All candidate Gemini models were unavailable. Last detail: ${lastErrMessage}`);
      }

      const textContent = geminiResponse.text || "";
      return {
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: textContent
            },
            finish_reason: "stop"
          }
        ]
      };
    };

    if (provider === "groq-vision" || provider === "llama") {
      console.warn("groq-vision/llama requested. Redirecting request directly to Gemini Flash fallback.");
      try {
        const responseData = await callGeminiFallback(messages);
        return res.json(responseData);
      } catch (geminiErr: any) {
        return res.status(500).json({ error: { message: `Gemini Flash fallback failed: ${geminiErr.message}` }});
      }
    }

    let client: OpenAI | null = null;
    let apiKey = "";

    switch (provider) {
      case "hf-qwen":
        apiKey = (process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_TOKEN || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
        if (apiKey && apiKey !== "dummy" && apiKey !== "undefined") {
          client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api-inference.huggingface.co/v1",
          });
        }
        break;
      case "groq-llama":
        apiKey = (process.env.GROQ_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
        if (apiKey && apiKey !== "dummy" && apiKey !== "undefined") {
          client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1",
          });
        }
        break;
      case "groq-vision":
        apiKey = (process.env.GROQ_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
        if (apiKey && apiKey !== "dummy" && apiKey !== "undefined") {
          client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1",
          });
        }
        break;
    }

    const anyGeminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy" || apiKey === 'undefined') {
      if (anyGeminiKey && anyGeminiKey !== "dummy" && anyGeminiKey !== "undefined") {
        console.warn(`Provider API key not configured. Falling back directly to Gemini Flash...`);
        try {
          const responseData = await callGeminiFallback(messages);
          return res.json(responseData);
        } catch (geminiErr: any) {
          return res.status(400).json({ error: { message: `Provider ${provider} is not configured and final Gemini fallback failed: ${geminiErr.message}` }});
        }
      }
      const requiredKeyLabel = 
        provider === 'hf-qwen' ? 'HUGGINGFACE_API_KEY' : 
        provider === 'groq-llama' ? 'GROQ_API_KEY' : 'API_KEY';
      return res.status(400).json({ error: { message: `Provider ${provider} is not configured. Please add the ${requiredKeyLabel} in the application settings.` }});
    }

    try {
      let selectedModel = model || (
        provider === "hf-qwen" ? "Qwen/Qwen2.5-72B-Instruct" : 
        provider === "groq-llama" ? "llama-3.3-70b-versatile" :
        provider === "groq-vision" ? "llama-3.2-11b-vision-instant" :
        ""
      );

      if (selectedModel === "qwen3.6-plus") selectedModel = "Qwen/Qwen2.5-72B-Instruct";
      if (selectedModel === "qwen3.7-max") selectedModel = "llama-3.3-70b-versatile";

      const enhancedMessages = [...(Array.isArray(messages) ? messages : [])];
      if (provider === "hf-qwen" || provider === "groq-llama") {
        const systemMessageIndex = enhancedMessages.findIndex(m => m.role === 'system');
        const coreInstruction = `
[STRICT CORE VISUAL STYLE, PRESENTATION AND LAYOUT OBJECTIVE - FOR ALL HIGH INTENSITY MODELS]:
- You represent the premium South African CAPS-aligned educational platform (EduAI Companion).
- You MUST generate extremely high-quality, fully detailed educational materials of premium visual layout complexity, matching or exceeding Qwen 3.7 Max and Gemini models!
- ALWAYS render output directly in elegant, multi-layered HTML templates using standard Tailwind CSS utility classes inside style/class fields. DO NOT generate basic plain text or simple lines.
- NEVER INJECT <script src="https://cdn.tailwindcss.com"></script>. The application already ships with Tailwind CSS compiled. DO NOT include it.
- NEVER truncate, minimize, abbreviate, mock, or summarize any part of the text or questions. Give complete, fully-fleshed out sentences and rich paragraphs.

EXACT VISUAL LAYOUT WIREFRAMES TO GENERATE:
1. HEADER BANNER (VIBRANT & COLORFUL):
   - Wrap the main document header in a full-width, rounded-[2rem] or rounded-[2.5rem] gradient container with padding py-8 px-6 or py-10 px-8, shadow-lg, text-white, relative overflow-hidden.
   - Use educational domain gradients:
     * Mathematics: Teal & Blue (from-teal-500 to-blue-600)
     * Natural Sciences / Life Sciences: Orange, Green & Turquoise (from-emerald-500 to-teal-700)
     * Languages / Literacy: Purple, Pink & Indigo (from-purple-500 to-indigo-600)
     * Social Sciences / Life Skills: Warm Amber, Red & Gold (from-amber-500 to-red-600)
   - Add big friendly emojis (e.g., 🦁, 🐘, 🎨, 🧪, 📐) and crisp, clear sub-labels.

2. STUDENT INFO & SCORE BADGE (AWARD-WINNING CARD):
   - Wrap in a soft rounded-3xl borders, white bg container with layout flex or grid: "Student Name: _____________" and "Date: _____________"
   - Place a beautiful Score Board in the bottom-right or as an side-badge wrapped in a thick, cheerful border (solid 3px yellow-400 or border-amber-400), with bold colored text like "TOTAL SCORE: _____ / 30" inside an inline block.

3. MATCHING & SOUND ASSOCIATIONS (ELEGANT GRIDS - NOT INLINE TEXT):
   - DO NOT write "Ll | Draw line to: Lion".
   - Instead, use responsive 2-column grid container "<div class=\"grid grid-cols-2 gap-4 my-6\">"
     * Left Column: Rounded-2xl letters inside small square cards with border-2 border-dashed border-purple-300 text-center font-bold text-3xl py-4 bg-purple-50
     * Right Column: Corresponding cute targets/emoji (e.g. "🦁 Lion") inside matches cards with border-2 border-solid border-slate-200 py-4 px-6 text-xl font-medium bg-white hover:bg-slate-50
   - Make it feel interactive, tactile, and professional!

4. TRACING & HANDWRITING ACTIVITIES (LARGE DOTTED LETTERS):
   - Generate words using large, beautiful dotted-style letters. E.g., wrap letters in class "text-slate-200 border-b-2 border-dashed border-slate-300 text-5xl font-bold tracking-widest" so the student can trace over them easily.
   - Create extensive spacing, empty cards, or wide drawing blocks "<div class=\"border-2 border-dashed border-slate-300 rounded-3xl h-48 flex items-center justify-center text-slate-400 bg-slate-50\">" for activities.

5. BENTO INFOGRAPHICS & DISCUSSION RULES:
   - For guide content or discussion scenarios, build a responsive grid of card elements ("grid grid-cols-1 md:grid-cols-2 gap-6").
   - Use unique accent colors per card, including header icons, motivational stickers, and certain soft color fills.

6. STRICTLY FORBIDDEN:
   - Never output markdown text, plain backticks, or raw horizontal rule tags ("---") for sections.
   - Do not use raw unstyled bullet points or text-based lines.
   - Inject style and class directly with absolute detail, using rich layout grids and colorful containers to match the beautiful, teacher-proud standard of Qwen 3.7 Max perfectly!
`;
        if (systemMessageIndex !== -1) {
          enhancedMessages[systemMessageIndex] = {
            ...enhancedMessages[systemMessageIndex],
            content: `${enhancedMessages[systemMessageIndex].content}\n\n${coreInstruction}`
          };
        } else {
          enhancedMessages.unshift({
            role: "system",
            content: coreInstruction
          });
        }
      }

      // Automatically configure JSON mode if JSON is requested
      const isJsonPreferred = enhancedMessages.some((m: any) => 
        typeof m.content === 'string' && m.content.toLowerCase().includes('json')
      );

      const completionParams: any = {
        model: selectedModel,
        messages: enhancedMessages,
        temperature: 0.7, // Consistently set temperature to 0.7 for creative layout structuring
        max_tokens: 8192, // Universal compatibility parameter for Groq outputs
      };

      if (isJsonPreferred && (provider === "hf-qwen" || provider === "groq-llama")) {
        completionParams.response_format = { type: "json_object" };
      }

      // Query standard OpenAPI compatibility clients (such as Hugging Face and Groq) directly
      try {
        if (provider === "hf-qwen") {
          if (client) {
            try {
              console.info(`[MultiAI] hf-qwen: executing direct completion on Hugging Face model ${selectedModel}...`);
              const response = await client.chat.completions.create(completionParams);
              return res.json(response);
            } catch (hfErr: any) {
              console.warn(`[MultiAI] Hugging Face direct call failed: ${hfErr.message || hfErr}. Falling back directly to Gemini Flash...`);
            }
          }
          console.info("[MultiAI] hf-qwen: fallback or no client, processing with Gemini Flash...");
          const geminiResponse = await callGeminiFallback(enhancedMessages);
          return res.json(geminiResponse);
        }

        if (!client) {
          throw new Error(`Client for ${provider} was not initialized.`);
        }
        console.info(`Executing direct completion for ${provider} with model ${selectedModel}...`);
        const response = await client.chat.completions.create(completionParams);
        return res.json(response);
      } catch (err: any) {
        console.warn(`Attempt with ${provider} (${selectedModel}) issue: ${err.message || err}. Balancing to Gemini fallback...`);
        try {
          const geminiResponse = await callGeminiFallback(enhancedMessages);
          return res.json(geminiResponse);
        } catch (geminiErr: any) {
          console.error(`Both ${provider} and Gemini fallback issues!`, geminiErr);
          throw err || geminiErr;
        }
      }
    } catch (error: any) {
      let status = 500;
      const rawStatus = error.status || error.response?.status;
      if (typeof rawStatus === 'number' && Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus < 600) {
        status = rawStatus;
      }
      let errMsg = error.message || error.response?.data?.error?.message || error.toString();
      
      if (errMsg.toLowerCase().includes('permissions') || errMsg.toLowerCase().includes('api key') || errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('dummy')) {
        status = 401;
      }

      // Capture failure for Admin Debug Console
      failedRequestsLog.unshift({
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        provider: provider || 'unknown',
        endpoint: `/api/ai/${provider}`,
        model: req.body?.model || 'default',
        error: errMsg,
        rawResponse: error.response?.data || error.stack || error.message || String(error),
        requestPayload: {
          messagesCount: req.body?.messages?.length || 0,
          temperature: req.body?.temperature,
          model: req.body?.model
        }
      });
      if (failedRequestsLog.length > 50) {
        failedRequestsLog.pop();
      }

      const isDev = process.env.NODE_ENV !== 'production';
      if (status >= 500) {
        console.error(`${provider} API Error:`, error);
      } else {
        console.warn(`${provider} API returned status ${status}:`, errMsg);
      }
      
      return res.status(status).json({ 
        error: errMsg,
        provider,
        code: error.code || 'API_ERROR',
      });
    }
  });

  app.post("/api/ocr", async (req, res) => {
    const { image, language = "eng" } = req.body || {};
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
    const { text, lang } = req.body || {};
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
    const { text, model } = req.body || {};
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

  const activeGenerations = new Map<string, { status: string; url?: string; error?: string }>();

  app.post("/api/video/enhance-prompt", async (req, res) => {
    const { prompt } = req.body || {};
    try {
      const { Client } = await import("@gradio/client");
      const client = await Client.connect("multimodalart/self-forcing");
      const result = await client.predict("/enhance_prompt", { prompt: prompt || "" });
      const enhanced = Array.isArray(result.data) ? result.data[0] : result.data;
      res.json({ enhanced: enhanced || prompt });
    } catch (err: any) {
      console.warn("Gradio prompt enhancement failed, returning original prompt:", err);
      res.json({ enhanced: prompt });
    }
  });

  app.post("/api/video/generate", async (req, res) => {
    const { prompt, model, seed, fps } = req.body || {};
    
    if (model === "omnihuman-1") {
      const genId = `omni-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      activeGenerations.set(genId, { status: "processing" });
      
      // Execute Gradio connection and prediction in the background
      (async () => {
        try {
          console.log(`Starting Gradio self-forcing prediction for ${genId}...`);
          const { Client } = await import("@gradio/client");
          const client = await Client.connect("multimodalart/self-forcing");
          
          const finalSeed = Number(seed) !== -1 ? Number(seed) : Math.floor(Math.random() * 1000000);
          const finalFps = Number(fps) || 15;
          
          const result = await client.predict("/video_generation_handler_streaming", { 		
             prompt: prompt || "", 		
             seed: finalSeed, 		
             fps: finalFps, 
          });
          
          const outputData = result.data;
          console.log(`Gradio prediction output for ${genId}:`, outputData);
          const videoInfo = Array.isArray(outputData) ? outputData[0] : null;
          
          const finalUrl = videoInfo?.url || videoInfo?.path || videoInfo;
          if (finalUrl) {
            console.log(`Gradio self-forcing prediction succeeded for ${genId}: ${finalUrl}`);
            activeGenerations.set(genId, { status: "succeeded", url: finalUrl });
          } else {
            console.error(`Gradio prediction succeeded but no URL discovered in response data for ${genId}:`, outputData);
            activeGenerations.set(genId, { status: "failed", error: "Could not resolve stable video file link from Gradio client output." });
          }
        } catch (gradioErr: any) {
          console.error(`Gradio self-forcing prediction failed for ${genId}:`, gradioErr);
          activeGenerations.set(genId, { status: "failed", error: gradioErr.message || "Failed during Gradio Space self-forcing prediction." });
        }
      })();
      
      return res.json({ id: genId, status: "processing" });
    }

    // Default Replicate fallback generator
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

  const handleFileProxy = async (req: any, res: any) => {
    const rawPath = req.params[0] || "";
    let cleanPath = rawPath;
    if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Construct the absolute path inside /tmp sandbox
    const absolutePath = path.resolve("/" + cleanPath);
    console.log(`[File Proxy] Intercepted file proxy request for path: ${rawPath}. Absolute resolved path: ${absolutePath}`);

    if (absolutePath.startsWith("/tmp/")) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(absolutePath)) {
          console.info(`[File Proxy] Serving file locally from container disk: ${absolutePath}`);
          return res.sendFile(absolutePath);
        } else {
          console.warn(`[File Proxy] File does not exist locally: ${absolutePath}. Redirecting query to remote Hugging Face space...`);
        }
      } catch (fsErr) {
        console.error(`[File Proxy] Error reading disk:`, fsErr);
      }
    } else {
      console.warn(`[File Proxy] Requested path ${absolutePath} is outside the /tmp/ environment. Redirecting query to HF.`);
    }

    const hfUrl = `https://multimodalart-self-forcing.hf.space/file=/${cleanPath}`;
    console.info(`[File Proxy] Final redirect target: ${hfUrl}`);
    return res.redirect(hfUrl);
  };

  app.get(/^\/file=(.*)/, handleFileProxy);
  app.get("/file=*", handleFileProxy);

  app.get("/api/video/status/:id", async (req, res) => {
    const id = req.params.id;
    if (id === "mock-video-id") {
      // Simulate processing delay, then return a sample nature/educational video
      return res.json({ 
        status: "succeeded", 
        url: "https://www.w3schools.com/html/mov_bbb.mp4" 
      });
    }

    if (id.startsWith("omni-")) {
      const state = activeGenerations.get(id);
      if (!state) {
        return res.status(404).json({ error: "Gradio prediction job not found." });
      }
      if (state.status === "succeeded") {
        return res.json({ status: "succeeded", url: state.url });
      } else if (state.status === "failed") {
        return res.status(500).json({ error: state.error || "Omnihuman video generation operation aborted." });
      } else {
        return res.json({ status: "processing" });
      }
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(400).json({ error: "REPLICATE_API_TOKEN is required." });
    }
    try {
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({ auth: apiKey });
      
      const prediction = await replicate.predictions.get(id);
      
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

  // Helper for server-side JSON healing
  function safeJsonParse(text: string | null | undefined): any {
    if (!text) return {};
    let processedText = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim();
    
    // Attempt 1: Standard JSON parse
    try {
      return JSON.parse(processedText);
    } catch {
      // Clean leading/trailing markdown code fences
      let cleaned = processedText;
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```[a-zA-Z-]*\s*/, '').replace(/\s*```$/, '').trim();
      }
      
      // Attempt 2: Parsed cleaned string
      try {
        return JSON.parse(cleaned);
      } catch {
        // Attempt 3: Substring extraction from { to }
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          const jsonSub = cleaned.substring(startIdx, endIdx + 1);
          try {
            return JSON.parse(jsonSub);
          } catch {
            // Attempt 4: Remove trailing commas and clean carriage returns/newlines inside values
            try {
              const fixedCommas = jsonSub.replace(/,(\s*[}\]])/g, '$1');
              return JSON.parse(fixedCommas);
            } catch {
              // Attempt 5: Fall back to robust regex field extraction
              const fallbackObj: any = {};
              
              const extractField = (source: string, field: string): string | null => {
                const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`"${escapedField}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,|\\s*})`, 'i');
                const match = source.match(regex);
                if (match) return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
                return null;
              };

              const extractArrayField = (source: string, field: string): string[] => {
                const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(`"${escapedField}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i');
                const match = source.match(regex);
                if (match && match[1]) {
                  return match[1]
                    .split(',')
                    .map(item => item.trim().replace(/^["']|["']$/g, '').trim())
                    .filter(item => item.length > 0);
                }
                return [];
              };

              const stringFields = [
                "content", "memo", "rubric", "assessmentCriteria", "imagePrompt",
                "description", "printInstructions", "notes", "documentType",
                "extractedText", "feedback", "totalScore"
              ];
              
              for (const field of stringFields) {
                const extracted = extractField(jsonSub, field);
                if (extracted !== null) {
                  fallbackObj[field] = extracted;
                }
              }
              
              const arrayFields = ["successIndicators", "marksPerQuestion"];
              for (const field of arrayFields) {
                const extracted = extractArrayField(jsonSub, field);
                if (extracted.length > 0) {
                  fallbackObj[field] = extracted;
                }
              }

              if (fallbackObj.content || fallbackObj.extractedText || fallbackObj.feedback || fallbackObj.description) {
                console.warn("[safeJsonParse] Successfully repaired truncated/malformed JSON on server-side via regex fields!");
                return fallbackObj;
              }
            }
          }
        }
        
        // Final fallback: Return raw string wrapped in content key
        return { content: processedText };
      }
    }
  }

  const MASTER_SYSTEM_PROMPT = `
You are the official AI content generator for **EduAI Companion** — a premium South African CAPS-aligned educational platform.

CRITICAL DATE & YEAR RULE: 
- Today's date is 2 June 2026. THE CURRENT YEAR IS 2026, NOT 2024. 
- All generated content, templates, footers, headers, copyright strings, marking grids, lesson plans, notices, worksheets, administrative letters, and documents MUST display the year "2026". 
- Any custom date generated by you must use "2026" (not 2024). Never output "2024" or reference 2024.

CRITICAL VISUAL DESIGN & ILLUSTRATION RULE:
- Under no circumstances should posters, infographics, flow diagram structures, or visual content types be dominated by long, dense paragraphs of text. 
- You must aggressively break up and punctuate all text with detailed, custom, context-relevant inline illustration or diagram placeholders inside brackets, e.g., \`[Illustration: <detailed, highly-specific visual prompt in South African context>]\` or \`[Diagram: <detailed labels and flow-chart prompt>]\`. 
- Each key concept card, section, or bento-grid block inside posters and visual aids must contain its own dedicated illustration placeholder. 
- Keep text inside poster blocks exceptionally brief, punchy, action-oriented, and presented in bullet lists or highlighted capsules with relevant South African emojis (e.g. 🇿🇦, 🦁, 🏔️) rather than raw explanatory prose.

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

  const IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail
`;

  app.post("/api/images/generate", async (req, res) => {
    try {
      const { prompt: rawPrompt, provider } = req.body || {};
      const prompt = rawPrompt || "vibrant educational illustration";

      if (provider === "wan2.1-t2i-plus" || provider === "qwen-image-2.0-pro" || provider === "wanx-v1") {
      let apiKey = process.env.HUGGINGFACE_API_KEY || process.env.ALIBABA_API_KEY || process.env.VITE_ALIBABA_API_KEY;
      if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
        console.warn("ALIBABA_API_KEY missing for image generation, falling back to Pollinations Turbo");
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }
      
      // Sanitizing and trimming any possible quotes and spaces around key
      apiKey = apiKey.trim().replace(/^['"\s]+|['"\s]+$/g, "");

      try {
        const endpoints = [
          "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
          "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
        ];

        let successUrl = null;
        let lastError: any = null;
        
        // wanx-v1 is the tested and fully-functional text-to-image model in Model Studio/DashScope
        const candidateModels: string[] = ["wanx-v1", "wanx2.1-t2i-plus", "wanx2.1-t2i-turbo"];

        for (const endpoint of endpoints) {
          for (const requestModel of candidateModels) {
            try {
              const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`,
                  "X-DashScope-Async": "enable"
                },
                body: JSON.stringify({
                  model: requestModel,
                  input: {
                    prompt: prompt
                  },
                  parameters: {
                    size: "1024*1024",
                    n: 1
                  }
                })
              });

              if (!response.ok) {
                throw new Error(`Standby response code ${response.status}`);
              }

              const data: any = await response.json();
              const taskId = data.output?.task_id;
              if (!taskId) {
                throw new Error("Standby task not initiated");
              }

              const domain = endpoint.includes("-intl") ? "https://dashscope-intl.aliyuncs.com" : "https://dashscope.aliyuncs.com";
              const taskUrl = `${domain}/api/v1/tasks/${taskId}`;

              let taskStatus = "PENDING";
              let attempts = 0;
              const maxAttempts = 25; // wait up to ~37.5 seconds
              let pollData: any = null;

              while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                attempts++;

                try {
                  const pollResponse = await fetch(taskUrl, {
                    method: "GET",
                    headers: {
                      "Authorization": `Bearer ${apiKey}`
                    }
                  });

                  if (!pollResponse.ok) {
                    continue;
                  }

                  pollData = await pollResponse.json();
                  taskStatus = pollData.output?.task_status || "PENDING";

                  if (taskStatus === "SUCCEEDED") {
                    break;
                  } else if (taskStatus === "FAILED" || taskStatus === "SUSPENDED" || taskStatus === "UNKNOWN") {
                    throw new Error("Standby task state modified");
                  }
                } catch (pollErr: any) {
                  // silent
                }
              }

              if (taskStatus === "SUCCEEDED" && pollData?.output) {
                const results = pollData.output.results;
                if (results && results[0]) {
                  if (typeof results[0] === "string") {
                    successUrl = results[0];
                  } else {
                    successUrl = results[0].url || results[0].png || results[0].jpg || results[0].jpeg;
                  }
                } else if (pollData.output.url) {
                  successUrl = pollData.output.url;
                }

                if (successUrl) {
                  break;
                }
              }

              throw new Error("Standby polling standby completed");
            } catch (err: any) {
              lastError = err;
            }
          }
          if (successUrl) {
            break;
          }
        }

        if (successUrl) {
          return res.json({ url: successUrl });
        }

        throw lastError || new Error("Standby fallback route triggered");
      } catch (error: any) {
        console.log("[Image Service] Redirecting to alternative creation channel.");
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }
    }

    if (provider === "nvidia-sana") {
      let apiKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_TOKEN || "";
      if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
        console.warn("NVIDIA_API_KEY missing for image generation, falling back to Pollinations Turbo");
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }

      apiKey = apiKey.trim().replace(/^['"\s]+|['"\s]+$/g, "");

      try {
        const client = new OpenAI({
          apiKey: apiKey,
          baseURL: "https://integrate.api.nvidia.com/v1",
        });

        const candidateModels = [
          "stabilityai/stable-diffusion-xl",
          "playgroundai/playground-v2.5",
          "nvidia/sana"
        ];

        let successUrl = null;
        let lastError: any = null;

        for (const modelToTry of candidateModels) {
          try {
            console.log(`[Image Service] Checking candidate pipeline with '${modelToTry}'...`);
            const response = await client.images.generate({
              model: modelToTry,
              prompt: prompt,
              n: 1,
              size: "1024x1024",
            } as any);

            const imageUrl = response.data?.[0]?.url;
            if (imageUrl) {
              console.log(`[Image Service] Creation completed successfully utilizing '${modelToTry}'!`);
              successUrl = imageUrl;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.log(`[Image Service] Transitioning away from '${modelToTry}' due to status variance.`);
          }
        }

        if (successUrl) {
          return res.json({ url: successUrl });
        }

        throw lastError || new Error("Standby fallback route triggered");
      } catch (err: any) {
        console.log(`[Image Service] Switched to secure media backup channel.`);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }
    }
    
    if (provider === "gemini-imagen") {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
        console.warn("GEMINI_API_KEY missing for image generation, falling back to Pollinations Turbo");
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
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
          model: 'imagen-3.0-generate-002',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          }
        });
        
        const base64 = response.generatedImages?.[0]?.image?.imageBytes;

        if (base64) {
          return res.json({ url: `data:image/jpeg;base64,${base64}` });
        }
        throw new Error("Failed to extract image from Gemini generateImages response");
      } catch (error: any) {
        console.warn("Gemini Imagen 3 generation failed, automatically falling back to Pollinations Turbo...", error.message || error);
        
        // Capture failure for Admin Debug Console
        failedRequestsLog.unshift({
          id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          provider: 'gemini',
          endpoint: `/api/images/generate`,
          model: 'imagen-3.0-generate-002',
          error: error.message || String(error),
          rawResponse: error.response?.data || error.stack || error.message || String(error),
          requestPayload: { prompt }
        });
        if (failedRequestsLog.length > 50) {
          failedRequestsLog.pop();
        }

        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }
    }

    if (provider === "huggingface") {
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
        console.warn("HUGGINGFACE_API_KEY missing, utilizing Pollinations fallback");
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }
      
      try {
        const fetchResponse = await fetch(`https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ inputs: prompt })
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HF returned ${fetchResponse.status}`);
        }
        
        const buffer = await fetchResponse.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return res.json({ url: `data:image/jpeg;base64,${base64}` });
      } catch (error: any) {
        console.warn("HuggingFace image failed, falling back to Pollinations...", error.message);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
        return res.json({ url });
      }
    }
    
    // Any other provider
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
    return res.json({ url });
    } catch (e: any) {
      console.warn("Exception in /api/images/generate:", e.message || e);
      const fallbackPrompt = req.body?.prompt || "vibrant educational illustration";
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=1024&height=1024&nologo=true&model=turbo&seed=${Math.floor(Math.random() * 1000000)}`;
      return res.json({ url });
    }
  });

  // --- Secure Server-Side Gemini Action Agent Router ---
  app.post("/api/gemini/action", async (req, res) => {
    const { action, input } = req.body || {};
    const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
    if (!apiKey || apiKey === "" || apiKey === "dummy" || apiKey === "undefined") {
      return res.status(400).json({ error: "GEMINI_API_KEY is not configured in settings." });
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
      const model = "gemini-3.5-flash";

      const generateContentWithFallback = async (options: { model: string, contents: any, config?: any }) => {
        const modelsToTry = cachedWorkingModel 
          ? [cachedWorkingModel, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
          : ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        
        let lastError: any = null;
        for (const candidate of modelsToTry) {
          try {
            const actualOptions = { ...options, model: candidate };
            const result = await geminiAi.models.generateContent(actualOptions);
            if (result) {
              cachedWorkingModel = candidate; // Cache successfully validated model
              return result;
            }
          } catch (err: any) {
            lastError = err;
            console.info(`Gemini candidate model '${candidate}' is currently unavailable. trying alternative...`);
          }
        }
        throw lastError || new Error("All candidate Gemini models were unavailable.");
      };

      switch (action) {
        case "generate-educational": {
          const { type, details } = input;
          const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN. NEVER INJECT <script src="https://cdn.tailwindcss.com"></script>. The app already has Tailwind.`;
          const response = await generateContentWithFallback({
            model,
            contents: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design). Do NOT add Tailwind CDN scripts.`,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          return res.json({ text: response.text });
        }

        case "generate-caps": {
          const isLessonPlan = input.contentType === 'Lesson Plan';
          const isStudyGuide = input.contentType === 'Study Guide / Learning Notes';
          const isWorksheet = input.contentType === 'Worksheet';

          let contentTypeEng: 'lesson-plan' | 'worksheet' | 'study-guide' = 'worksheet';
          if (isLessonPlan) contentTypeEng = 'lesson-plan';
          else if (isStudyGuide) contentTypeEng = 'study-guide';
          else if (isWorksheet) contentTypeEng = 'worksheet';

          const { system, user } = EduAIPromptEngine.assemblePrompt({
            contentType: contentTypeEng,
            grade: input.grade || "4",
            subject: input.subject || "Mathematics",
            topic: input.topic || "Addition",
            language: input.language || 'English',
            learnerProfile: input.learnerProfile || 'General Class',
            additionalInstructions: input.additionalInstructions || '',
            term: input.term || '1',
            week: input.week ? parseInt(input.week) : undefined,
            duration: input.duration || '2 hours',
            capsReference: input.capsReference || ''
          });

          const response = await generateContentWithFallback({
            model,
            contents: user,
            config: {
              systemInstruction: system,
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
          return res.json(safeJsonParse(response.text));
        }

        case "generate-visual": {
          const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;
          const isPoster = input.visualType?.toLowerCase().includes('poster');
          const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
          const isDiagram = input.visualType?.toLowerCase().includes('diagram');
          const isFlashcard = input.visualType?.toLowerCase().includes('flashcard') || input.visualType?.toLowerCase().includes('learning card');

          let visualPrompt = "";
          if (isPoster) {
            visualPrompt = `
              Create a stunning, print-ready educational poster for South African Grade ${input.grade} ${input.subject} learners on the CAPS topic: "${input.topic}"

              DESIGN REQUIREMENTS (Based on EduAI Companion Templates):
              - HTML/Tailwind ONLY. Do not use markdown.
              - Layout: A massive central Hero Image (illustration) taking up the middle 50% of the poster.
              - Top Banner: Large, playful, multi-colored bubble-letter style title (using text-shadows, varied colors per word) centered at the top.
              - Floating Fact Boxes: 4-6 small floating fact boxes positioned around the central image. Each box should have a thick colored outline (e.g., solid 4px red, green, blue border), white background, small playful SVG icon/emoji, and short, legible text.
              - Title Style: Give each letter or word a different vibrant color.
              - Visual hierarchy: Make it look like an adventure map or a colorful infographic.
              - Footer Layout: Include 3-4 neat little text boxes in a row at the very bottom containing extra info or activities. Include EduAI or CAPS branding.
              - Typography: Use bold, playful sans-serif fonts.
              - Colors: Sky blue background, primary color accents (bright yellow, striking red, vibrant green).
              
              Make it vibrant, instantly engaging, and child-friendly.
            `;
          } else if (isFlashcard) {
            visualPrompt = `
              Design a set of professional, double-sided educational flashcards for Grade ${input.grade} ${input.subject} on "${input.topic}".
              
              DESIGN REQUIREMENTS:
              - Show multiple cards in a grid (2 or 3 per row).
              - Each card should have:
                - Front side: Large title, high-quality icon/emoji, and a very short hint.
                - Back side: Explanation, a South African contextual example, and a small "Did you know?" fact.
              - Card style: rounded-3xl corners, thick colored borders (2px), subtle shadow.
              - Use vibrant colors that change per card.
              - Ensure text is large and legible (text-xl for titles).
            `;
          } else if (isInfographic) {
            visualPrompt = `
              Design a visually spectacular CAPS-aligned infographic/mind map on ${input.topic} for Grade ${input.grade}.

              Requirements:
              - Central concept in the middle with radiating branches
              - Each branch has a beautifully illustrated icon (custom drawn, not generic)
              - South African contextual examples throughout
              - Color-coded sections with perfect visual hierarchy
              - Style: Modern flat design with subtle textures and depth
              - Include real South African case studies or examples where possible
            `;
          } else if (isDiagram) {
            visualPrompt = `
              Create a crystal-clear, beautifully illustrated scientific diagram of ${input.topic} specifically adapted for South African Grade ${input.grade} learners.

              Show the process occurring in a real South African landscape:
              - Water cycle: Include Table Mountain, Drakensberg, or Karoo
              - Food chain: Use indigenous animals (lion, impala, acacia tree, vulture, etc.)
              - Rock cycle: Feature South African geological formations
              - Plant structure: Use protea, aloe, or fynbos species

              Style: Clean, labeled, semi-realistic illustration with arrows, soft shadows, and depth. National Geographic kids magazine quality.
            `;
          } else {
            visualPrompt = `Create a highly visual ${input.visualType} for Grade ${input.grade} ${input.subject} on topic ${input.topic}.`;
          }

          const prompt = `
            ${visualPrompt}
            Language: ${input.language}
            Style: ${input.style}
            Color: ${input.colorScheme}
            Content Details: ${input.specificContent}
            Quantity: ${input.quantity}
            Additional Info: ${IMAGE_PROMPT_GOLDEN_RULE}
          `;

          const response = await generateContentWithFallback({
            model,
            contents: prompt,
            config: { 
              systemInstruction, 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING },
                  description: { type: Type.STRING },
                  printInstructions: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["content", "description", "imagePrompt"]
              }
            }
          });
          return res.json(safeJsonParse(response.text));
        }

        case "generate-admin": {
          const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nGenerate a formal ${input.documentType} for ${input.schoolName}.
          The tone should be ${input.tone}.
          IMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.`;
          const prompt = `
            Type: ${input.documentType}
            Purpose: ${input.purpose}
            Key Points: ${input.keyPoints}
            Include Reply Slip: ${input.includeReplySlip}
            Language: ${input.language}
          `;
          const response = await generateContentWithFallback({
            model,
            contents: prompt,
            config: { 
              systemInstruction, 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  documentType: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["content", "documentType"]
              }
            }
          });
          return res.json(safeJsonParse(response.text));
        }

        case "ocr-scan": {
          const { imageData, language } = input;
          const prompt = `Extract all text from the attached image accurately, assuming the text is in ${language}.
          Format it cleanly. Make no other comments.`;
          const response = await generateContentWithFallback({
            model,
            contents: [
              { role: 'user', parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
              ]}
            ]
          });
          return res.json({ extractedText: response.text });
        }

        case "ocr-grade": {
          const { imageData, rubric, language } = input;
          const prompt = `You are an AI Grader. Analyze the attached image of a student's assessment in ${language}.
          Reference this rubric: ${rubric}.
          1. Extract the text from the image (OCR).
          2. Try to locate the student's or learner's name written on the sheet (usually starts with "Name: ", "Learner: ", "Student: ", or is located at the top of the worksheet page). Extract and return it in "studentName". If no name is clearly visible, return empty string "".
          3. Grade each question according to the rubric.
          4. Provide constructive feedback for the student.
          5. Summarize the total score.`;
          const response = await generateContentWithFallback({
            model,
            contents: [
              { role: 'user', parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
              ]}
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  extractedText: { type: Type.STRING },
                  marksPerQuestion: { type: Type.ARRAY, items: { type: Type.STRING } },
                  feedback: { type: Type.STRING },
                  totalScore: { type: Type.STRING },
                  studentName: { type: Type.STRING }
                },
                required: ["extractedText", "marksPerQuestion", "feedback", "totalScore", "studentName"]
              }
            }
          });
          return res.json(safeJsonParse(response.text));
        }

        case "chat": {
          const { messages } = input;
          const response = await generateContentWithFallback({
            model,
            contents: messages,
            config: {
              systemInstruction: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise.",
            }
          });
          return res.json({ text: response.text });
        }

        default:
          return res.status(400).json({ error: "Unsupported action" });
      }
    } catch (error: any) {
      const errMsg = error.message || error.toString();
      let status = 500;
      const rawStatus = error.status || error.response?.status;
      if (typeof rawStatus === 'number' && Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus < 600) {
        status = rawStatus;
      }
      if (errMsg.toLowerCase().includes('permissions') || errMsg.toLowerCase().includes('api key') || errMsg.toLowerCase().includes('auth') || errMsg.toLowerCase().includes('dummy')) {
         status = 401;
      }

      // Capture failure for Admin Debug Console
      failedRequestsLog.unshift({
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        provider: 'gemini',
        endpoint: `/api/gemini/action`,
        model: 'gemini-3.5-flash',
        error: errMsg,
        rawResponse: error.response?.data || error.stack || error.message || String(error),
        requestPayload: {
          action,
          input: input ? { ...input, imageData: input.imageData ? '[Muted Image Data]' : undefined } : undefined
        }
      });
      if (failedRequestsLog.length > 50) {
        failedRequestsLog.pop();
      }

      console.error(`Gemini server error for action '${action}':`, errMsg);
      return res.status(status).json({ error: errMsg || "Failed to execute server-side action." });
    }
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
    const { studentName, grade, subjects } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
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
      let response;
      const ildpModels = cachedWorkingModel 
        ? [cachedWorkingModel, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
        : ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      
      let lastIldpErr: any = null;
      for (const modelToTry of ildpModels) {
        try {
          response = await geminiAi.models.generateContent({
            model: modelToTry,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7,
            }
          });
          if (response) {
            cachedWorkingModel = modelToTry;
            break;
          }
        } catch (err: any) {
          lastIldpErr = err;
          console.info(`Gemini candidate '${modelToTry}' is currently unavailable for ILDP. Trying alternative...`);
        }
      }
      if (!response) {
        throw lastIldpErr || new Error("All candidate Gemini models were unavailable.");
      }
      const text = response.text || "";
      const trimmed = text.trim();
      const cleanJson = trimmed.startsWith("```") ? trimmed.replace(/^```json\s*/i, "").replace(/```$/, "").trim() : trimmed;
      const data = JSON.parse(cleanJson);
      res.json(data);
    } catch (err: any) {
      console.warn("Gemini ILDP Generation failed, using local builder:", err.message);
      
      // Capture failure for Admin Debug Console
      failedRequestsLog.unshift({
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        provider: 'gemini',
        endpoint: `/api/reports/ildp`,
        model: 'gemini-3.5-flash',
        error: err.message || String(err),
        rawResponse: err.response?.data || err.stack || err.message || String(err),
        requestPayload: { studentName, grade, subjectsCount: subjects?.length || 0 }
      });
      if (failedRequestsLog.length > 50) {
        failedRequestsLog.pop();
      }

      res.json(generateLocalFallbackILDP(studentName, grade, subjects));
    }
  });

// Export the app for serverless platforms like Vercel
export default app;

// --- Standard Node.js / Container Bootstrap ---
const isVercel = !!process.env.VERCEL;

async function bootstrap() {
  if (isVercel) {
    return;
  }

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

bootstrap().catch((err) => {
  console.error("Standalone server bootstrap failed:", err);
});
