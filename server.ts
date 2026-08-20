import { CAPS_LESSON_PLAN_SYSTEM_PROMPT } from "./src/lib/prompts/caps-lesson-plan-prompt";
import { EduAIPromptEngine } from "./src/lib/prompt-engine";
import { buildInstructorPriority, EDUCATIONAL_IMAGE_STYLE } from "./src/lib/prompt-priority";
import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";

async function tryExtractDocxText(base64Data: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, "base64");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err: any) {
    console.error("Failed to parse docx with mammoth:", err);
    return "";
  }
}


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
dotenv.config();

function resolveOpenRouterKey(): string {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.VITE_OPENROUTER_API_KEY,
    process.env.OPEN_ROUTER_API_KEY,
    process.env.OPENROUTER_TOKEN,
    process.env.MULEROUTER_API_KEY,
  ];
  for (const key of keys) {
    if (key && key !== "dummy" && key !== "undefined" && key.trim() !== "") {
      return key.trim().replace(/^['"\s]+|['"\s]+$/g, "");
    }
  }
  return "";
}

function resolveNvidiaKey(): string {
  const keys = [
    process.env.NVIDIA_API_KEY,
    process.env.VITE_NVIDIA_API_KEY,
  ];
  for (const key of keys) {
    if (key && key !== "dummy" && key !== "undefined" && key.trim() !== "") {
      return key.trim().replace(/^['"\s]+|['"\s]+$/g, "");
    }
  }
  return "";
}

function resolveGeminiKey(): string {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GOOGLE_AI_API_KEY,
  ];
  for (const key of keys) {
    if (key && key !== "dummy" && key !== "undefined" && key.trim() !== "") {
      return key.trim().replace(/^['"\s]+|['"\s]+$/g, "");
    }
  }
  return "";
}

let cachedGeminiClient: GoogleGenAI | null = null;
let cachedApiKeyUsed: string | null = null;

function getGeminiClient(): GoogleGenAI {
  const currentKey = resolveGeminiKey();
  if (cachedGeminiClient && cachedApiKeyUsed === currentKey) {
    return cachedGeminiClient;
  }
  cachedApiKeyUsed = currentKey;
  cachedGeminiClient = new GoogleGenAI({
    apiKey: currentKey || "dummy",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  return cachedGeminiClient;
}

const geminiAi = new Proxy({} as GoogleGenAI, {
  get(target, prop) {
    const client = getGeminiClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

const generateContentWithFallback = async (options: { model?: string, contents: any, config?: any }) => {
  const modelsToTry = cachedWorkingModel 
    ? [cachedWorkingModel, "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
    : ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  
  let lastError: any = null;
  for (const candidate of modelsToTry) {
    try {
      const actualOptions = {
        ...options,
        model: candidate,
        config: {
          maxOutputTokens: 8192,
          ...(options.config || {})
        }
      };
      const result = await geminiAi.models.generateContent(actualOptions);
      if (result) {
        cachedWorkingModel = candidate; // Cache successfully validated model
        return result;
      }
    } catch (err: any) {
      lastError = err;
      console.info(`Gemini candidate model '${candidate}' is currently unavailable (${err.message}). Trying alternative...`);
    }
  }
  throw lastError || new Error("All candidate Gemini models were unavailable.");
};

const generateContentStreamWithFallback = async (options: { model?: string, contents: any, config?: any }) => {
  const modelsToTry = cachedWorkingModel 
    ? [cachedWorkingModel, "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
    : ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  
  let lastError: any = null;
  for (const candidate of modelsToTry) {
    try {
      const actualOptions = {
        ...options,
        model: candidate,
        config: {
          maxOutputTokens: 8192,
          ...(options.config || {})
        }
      };
      const streamResult = await geminiAi.models.generateContentStream(actualOptions);
      if (streamResult) {
        cachedWorkingModel = candidate;
        return streamResult;
      }
    } catch (err: any) {
      lastError = err;
      console.info(`Gemini candidate streaming model '${candidate}' is currently unavailable (${err.message}). Trying alternative...`);
    }
  }
  throw lastError || new Error("All candidate Gemini streaming models were unavailable.");
};


const app = express();

const MASTER_SYSTEM_PROMPT = `
You are an expert South African CAPS-aligned educational content designer and senior graphic designer specializing in primary and high school learning materials for South African classrooms.

Your task is to generate BEAUTIFUL, PROFESSIONAL, PRINT-READY classroom materials (worksheets, posters, study guides, infographics, flashcards, diagrams, mind maps, etc.) that are:
• 100% aligned to the South African CAPS curriculum (specify exact grade, subject, term, topic)
• Age-appropriate and highly engaging for South African learners
• Culturally relevant (include South African contexts, diversity, local animals, landmarks, people, languages where appropriate)
• Visually sophisticated — NEVER use cheap clipart, emojis, or low-quality icons
• Designed with modern educational graphic design principles (clear hierarchy, generous white space, consistent color palette, professional typography)

STYLE REQUIREMENTS (MANDATORY):
- Illustration style: Clean, vibrant, semi-realistic Disney 3D Animation Character & 3D Icon digital illustrations (think award-winning children’s educational books published by Oxford University Press or Maskew Miller Longman — NOT cartoonish or childish beyond the grade level)
- Color palette: Rich but controlled South African-inspired colors (earth tones, bright accents, ocean blues, savanna oranges/greens, rainbow nation diversity)
- Typography: Clean sans-serif & hand writing fonts (e.g., Patrick Hand/Teacher's Pet, Poppins, Open Sans, Roboto) for body; bold display fonts only for titles when appropriate
- Layout: Professional grid-based design with perfect alignment, balanced margins, breathing room
- NO emojis, NO smiley faces, NO generic stick figures, NO low-resolution icons

When generating any visual material, you MUST output:
1. A complete markdown-ready textual description (for worksheets/study guides)
2. A separate, extremely detailed image generation prompt (for AI model used) that will produce a stunning, high-resolution, print-ready illustration or poster

You are never satisfied with mediocre visuals — aim for materials that South African teachers would proudly display in their classrooms or submit to the DBE as exemplars.

CRITICAL DATE & YEAR RULE: 
- Today's date is 2 June 2026. THE CURRENT YEAR IS 2026, NOT 2024. 
- All generated content, templates, footers, headers, copyright strings, marking grids, lesson plans, notices, worksheets, administrative letters, and documents MUST display the year "2026". 
- Any custom date generated by you must use "2026" (not 2024). Never output "2024" or reference 2024.

CRITICAL VISUAL DESIGN & ILLUSTRATION RULE:
- Under no circumstances should posters, infographics, flow diagram structures, or visual content types be dominated by long, dense paragraphs of text. 
- You must aggressively break up and punctuate all text with detailed, custom, context-relevant inline illustration or diagram placeholders inside brackets, e.g., [Illustration: <detailed, highly-specific visual prompt in South African context>] or [Diagram: <detailed labels and flow-chart prompt>]. 
- Each key concept card, section, or bento-grid block inside posters and visual aids must contain its own dedicated illustration placeholder. 
- Keep text inside poster blocks exceptionally brief, punchy, action-oriented, and presented in bullet lists or highlighted capsules.

YOUR STRICT SAFETY & PEDAGOGICAL BOUNDARIES:
- Age-Appropriateness: Keep language, complexity, and theme strictly matched to the requested South African School Phase (Foundation Phase: Grade R-3, Intermediate Phase: Grade 4-6, Senior Phase: Grade 7-9, FET Phase: Grade 10-12).
- CAPS Alignment: Map all curriculum items cleanly to South African Curriculum and Assessment Policy Statement (CAPS) guidelines.
- Content Moderation: Refuse immediately any request involving self-harm, hate speech, explicit violence, adult themes, or unsafe content. Pivot with warm encouragement: "I'm here to support your schoolwork. Let's explore a positive theme related to your subjects instead!"
- National Pride & Diversity: Reflect South African context (names, cultures, rich geography, Rand currency, local animals/plants) naturally.

OUTPUT FORMATTING GOLDEN RULE:
- If user requests **HTML**: Output a complete standalone HTML5 document with Tailwind CSS via CDN. Include beautiful @media print styles.
- If user requests **JSON**: Follow the specified schemas precisely.
- Never output raw Markdown (like # or ** in HTML values). Use correct bold/heading tags or tailwind classes instead.
- STRICT BANNER & TEXT COLOR CONTRAST RULE: To guarantee perfect accessibility and readability, all generated text over any background or banner MUST have high visual contrast (ratio ≥ 4.5:1). If a banner uses light or highly vibrant colors (such as orange, amber, yellow, cyan, mint, lime, or any light pastel/accent color), you MUST use dark text (e.g. text-slate-900 or text-black). Do NOT use white text (text-white) over yellow, orange, cyan, mint, or light blue backgrounds. White text is strictly restricted to deep, dark background colors (such as dark royal blue, deep purple, forest green, or dark slate).
- Include a formal, printable Header and Footer stating: "EduAI CAPS Aligned Worksheet".
Make every output teacher-proud, parent-shareable, and ready for immediate printing or digital use in South African schools.

`;

  const IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail

`;

  const repairTruncatedJson = (jsonStr: string): string => {
     let inString = false;
     let escape = false;
     const stack: string[] = [];
     
     for (let i = 0; i < jsonStr.length; i++) {
       const char = jsonStr[i];
       if (escape) {
         escape = false;
         continue;
       }
       if (char === '\\') {
         escape = true;
         continue;
       }
       if (char === '"') {
         inString = !inString;
         continue;
       }
       if (!inString) {
         if (char === '{' || char === '[') {
           stack.push(char);
         } else if (char === '}') {
           if (stack.length > 0 && stack[stack.length - 1] === '{') {
             stack.pop();
           }
         } else if (char === ']') {
           if (stack.length > 0 && stack[stack.length - 1] === '[') {
             stack.pop();
           }
         }
       }
     }

     let repaired = jsonStr;
     if (inString) {
       repaired += '"';
     }
     
     while (stack.length > 0) {
       const last = stack.pop();
       if (last === '{') {
         repaired += '}';
       } else if (last === '[') {
         repaired += ']';
       }
     }
     
     repaired = repaired.replace(/,\s*([}\]])/g, '$1');
     return repaired;
   };

    const safeJsonParse = (text: any) => {
      if (!text || typeof text !== 'string') return typeof text === 'object' ? text : {};
      let processedText = text.trim();
      
      // 1. Strip reasoning thoughts if present (<think>...</think> or unclosed <think>)
      processedText = processedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
      processedText = processedText.replace(/<think>[\s\S]*$/gi, '');
      processedText = processedText.trim();

      if (!processedText) return {};

      // 2. Strip markdown code block wrappers
      processedText = processedText.replace(/^```(?:json|html|xml|markdown)?\s*/i, '');
      processedText = processedText.replace(/\s*```$/i, '');
      processedText = processedText.trim();

      if (processedText.startsWith('<div') || processedText.startsWith('<section') || processedText.startsWith('<article') || processedText.startsWith('<!DOCTYPE') || processedText.startsWith('<html')) {
        return { content: processedText, imagePrompt: "Educational classroom scene" };
      }

      // 3. Extract JSON object from first '{'
      let extractedJson = processedText;
      const firstCurly = processedText.indexOf('{');
      if (firstCurly !== -1) {
        const lastCurly = processedText.lastIndexOf('}');
        if (lastCurly > firstCurly) {
          extractedJson = processedText.substring(firstCurly, lastCurly + 1).trim();
        } else {
          extractedJson = processedText.substring(firstCurly).trim();
        }
      }

      try {
        return JSON.parse(extractedJson);
      } catch (err) {
        try {
          return JSON.parse(processedText);
        } catch (errOrig) {
          try {
            const repaired = repairTruncatedJson(extractedJson);
            return JSON.parse(repaired);
          } catch (errRep) {
            try {
              const repaired = repairTruncatedJson(processedText);
              return JSON.parse(repaired);
            } catch (errRep2) {
              if (extractedJson.includes('{')) {
                try {
                  const repaired = repairTruncatedJson(extractedJson);
                  const evaluated = new Function('return ' + repaired)();
                  if (typeof evaluated === 'object' && evaluated !== null) return evaluated;
                } catch(e4) {}
              }
            }
          }
        }

        const closeOpenHtmlTags = (html: string): string => {
          const tagRegex = /<\/?([a-z1-6]+)(?:\s+[^>]*?)?>/gi;
          let match;
          const openTags: string[] = [];
          
          while ((match = tagRegex.exec(html)) !== null) {
            const fullTag = match[0];
            const tagName = match[1].toLowerCase();
            
            if (fullTag.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)) {
              continue;
            }
            
            if (fullTag.startsWith('</')) {
              if (openTags.length > 0 && openTags[openTags.length - 1] === tagName) {
                openTags.pop();
              }
            } else {
              openTags.push(tagName);
            }
          }
          
          let closedHtml = html;
          while (openTags.length > 0) {
            const tag = openTags.pop();
            closedHtml += `</${tag}>`;
          }
          return closedHtml;
        };

        const extractField = (source: string, field: string): string | null => {
          const escapedField = field.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const closedRegex = new RegExp(`"${escapedField}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,|\\s*})`, 'i');
          const match = source.match(closedRegex);
          if (match && match[1]) {
            let val = match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
            if (val.trim().startsWith('<')) {
              val = closeOpenHtmlTags(val);
            }
            return val;
          }

          const truncRegex = new RegExp(`"${escapedField}"\\s*:\\s*"([\\s\\S]*?)(?:"\\s*,\\s*"[a-zA-Z0-9_]+"|$)`, 'i');
          const truncMatch = source.match(truncRegex);
          if (truncMatch && truncMatch[1]) {
            let val = truncMatch[1].trim();
            if (val.endsWith('\\')) val = val.slice(0, -1);
            if (val.endsWith('"') && !val.endsWith('\\"')) val = val.slice(0, -1);
            val = val.replace(/\\"/g, '"').replace(/\\n/g, '\n');
            if (val.trim().startsWith('<')) {
              val = closeOpenHtmlTags(val);
            }
            return val;
          }
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

        const textToSearch = processedText;

        const fallbackObj: any = {};
        const stringFields = [
          "content", "memo", "rubric", "assessmentCriteria", "imagePrompt",
          "description", "printInstructions", "notes", "documentType",
          "extractedText", "feedback", "totalScore"
        ];
        
        for (const field of stringFields) {
          const extracted = extractField(textToSearch, field);
          if (extracted !== null) {
            fallbackObj[field] = extracted;
          }
        }
        
        const arrayFields = ["successIndicators", "marksPerQuestion"];
        for (const field of arrayFields) {
          const extracted = extractArrayField(textToSearch, field);
          if (extracted.length > 0) {
            fallbackObj[field] = extracted;
          }
        }

        if (fallbackObj.content || fallbackObj.extractedText || fallbackObj.feedback || fallbackObj.description || fallbackObj.memo) {
          console.warn("safeJsonParse: Reconstructed truncated JSON response successfully via fallback regex extraction!");
          return fallbackObj;
        }

        console.warn("Failed to parse AI response as JSON:", processedText);
        return {};
      }
    };

  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- AI Provider Clients ---

  let cachedGroqClient: OpenAI | null = null;
  let cachedGroqKey: string | null = null;

  function getGroqClient(): OpenAI {
    const currentKey = (process.env.GROQ_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
    if (cachedGroqClient && cachedGroqKey === currentKey) {
      return cachedGroqClient;
    }
    cachedGroqKey = currentKey;
    cachedGroqClient = new OpenAI({
      apiKey: currentKey || "dummy",
      baseURL: "https://api.groq.com/openai/v1",
    });
    return cachedGroqClient;
  }

  const groq = new Proxy({} as OpenAI, {
    get(target, prop) {
      const client = getGroqClient();
      const value = Reflect.get(client, prop);
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    }
  });

  let cachedAlibabaClient: OpenAI | null = null;
  let cachedAlibabaKey: string | null = null;

  function getAlibabaClient(): OpenAI {
    const currentKey = (process.env.ALIBABA_API_KEY || "").trim().replace(/^['"\s]+|['"\s]+$/g, "");
    if (cachedAlibabaClient && cachedAlibabaKey === currentKey) {
      return cachedAlibabaClient;
    }
    cachedAlibabaKey = currentKey;
    cachedAlibabaClient = new OpenAI({
      apiKey: currentKey || "dummy",
      baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    });
    return cachedAlibabaClient;
  }

  const alibaba = new Proxy({} as OpenAI, {
    get(target, prop) {
      const client = getAlibabaClient();
      const value = Reflect.get(client, prop);
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    }
  });

  let cachedOpenRouterClient: OpenAI | null = null;
  let cachedOpenRouterKey: string | null = null;

  function getOpenRouterClient(): OpenAI {
    const currentKey = resolveOpenRouterKey();
    if (cachedOpenRouterClient && cachedOpenRouterKey === currentKey) {
      return cachedOpenRouterClient;
    }
    cachedOpenRouterKey = currentKey;
    cachedOpenRouterClient = new OpenAI({
      apiKey: currentKey || "dummy",
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "EduAI Companion",
      }
    });
    return cachedOpenRouterClient;
  }

  const openrouter = new Proxy({} as OpenAI, {
    get(target, prop) {
      const client = getOpenRouterClient();
      const value = Reflect.get(client, prop);
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    }
  });

  let cachedNvidiaClient: OpenAI | null = null;
  let cachedNvidiaKey: string | null = null;

  function getNvidiaClient(): OpenAI {
    const nvidiaKey = resolveNvidiaKey();
    if (nvidiaKey) {
      if (cachedNvidiaClient && cachedNvidiaKey === nvidiaKey) {
        return cachedNvidiaClient;
      }
      cachedNvidiaKey = nvidiaKey;
      cachedNvidiaClient = new OpenAI({
        apiKey: nvidiaKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      return cachedNvidiaClient;
    }
    const openRouterKey = resolveOpenRouterKey();
    if (openRouterKey) {
      if (cachedNvidiaClient && cachedNvidiaKey === openRouterKey) {
        return cachedNvidiaClient;
      }
      cachedNvidiaKey = openRouterKey;
      cachedNvidiaClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return cachedNvidiaClient;
    }
    return getOpenRouterClient();
  }

  const nvidia = new Proxy({} as OpenAI, {
    get(target, prop) {
      const client = getNvidiaClient();
      const value = Reflect.get(client, prop);
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    }
  });

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Generic content generation proxy for OpenAI-compatible APIs
  app.post("/api/ai/:provider", async (req, res) => {
    const { provider } = req.params;
    const { messages, model, temperature = 0.7, max_tokens, max_completion_tokens, stream } = req.body;

    const executeGeminiFallback = async (reason: string) => {
      console.log(`[AI Routing] Seamlessly routing request from ${provider} to primary Gemini engine.`);
      try {
        const contentsList: any[] = [];
        
        for (const msg of messages || []) {
          const role = msg.role === 'assistant' ? 'model' : msg.role === 'system' ? 'system' : 'user';
          if (role !== 'system') {
            const parts: any[] = [];
            if (Array.isArray(msg.content)) {
              for (const part of msg.content) {
                if (part.type === 'text') {
                  parts.push({ text: part.text || "" });
                } else if (part.type === 'image_url') {
                  const url = part.image_url?.url || "";
                  if (url.startsWith('data:')) {
                    const match = url.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                      parts.push({
                        inlineData: {
                          mimeType: match[1],
                          data: match[2]
                        }
                      });
                    }
                  }
                }
              }
            } else {
              parts.push({ text: String(msg.content || "") });
            }
            if (parts.length > 0) {
              contentsList.push({
                role: role,
                parts: parts
              });
            }
          }
        }

        const systemMessages = messages?.filter((m: any) => m.role === 'system');
        const systemInstruction = systemMessages?.map((m: any) => m.content).join("\n\n");

        const modelsToTry = cachedWorkingModel 
          ? [cachedWorkingModel, "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
          : ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
        let lastError: any = null;
        let response: any = null;

        if (stream) {
          for (const candidate of modelsToTry) {
            try {
              const streamResult = await geminiAi.models.generateContentStream({
                model: candidate,
                contents: contentsList.length > 0 ? contentsList : [{ role: 'user', parts: [{ text: "Hello" }] }],
                config: {
                  maxOutputTokens: 8192,
                  ...(systemInstruction ? { systemInstruction } : {})
                }
              });
              if (streamResult) {
                cachedWorkingModel = candidate;
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");
                if (res.flushHeaders) res.flushHeaders();
                let fullText = "";
                for await (const chunk of streamResult) {
                  const chunkText = chunk.text || "";
                  if (chunkText) {
                    fullText += chunkText;
                    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunkText } }] })}\n\n`);
                  }
                }
                res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], done: true, final: fullText })}\n\n`);
                return res.end();
              }
            } catch (err: any) {
              lastError = err;
              console.warn(`Gemini fallback streaming model '${candidate}' is unavailable, trying next candidate...`);
            }
          }
          throw lastError || new Error("All Gemini models failed for streaming.");
        }

        for (const candidate of modelsToTry) {
          try {
            response = await geminiAi.models.generateContent({
              model: candidate,
              contents: contentsList.length > 0 ? contentsList : [{ role: 'user', parts: [{ text: "Hello" }] }],
              config: {
                maxOutputTokens: 8192,
                ...(systemInstruction ? { systemInstruction } : {})
              }
            });
            if (response) {
              cachedWorkingModel = candidate;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Gemini fallback model '${candidate}' is unavailable, trying next candidate...`);
          }
        }

        if (!response) {
          throw lastError || new Error("All Gemini models failed.");
        }

        const text = response.text || "";
        return res.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: text
              }
            }
          ]
        });
      } catch (err: any) {
        console.error("Gemini fallback also failed:", err);
        return res.status(500).json({ error: { message: `Both ${provider} and Gemini fallback failed: ${err.message}` } });
      }
    };

    if (provider === "gemini") {
      return await executeGeminiFallback("Direct Gemini Request");
    }

    let client: OpenAI | null = null;
    let apiKey = "";

    switch (provider) {
      case "llama-primary":
      case "llama-secondary":
      case "groq-vision":
        client = groq;
        apiKey = process.env.GROQ_API_KEY || "";
        break;
      case "nvidia-nemotron":
      case "nvidia-nemotron-ultra":
      case "groq-qwen":
        client = getNvidiaClient();
        apiKey = resolveNvidiaKey() || resolveOpenRouterKey();
        break;
      case "alibaba-qwen":
      case "alibaba-deepseek":
        client = alibaba;
        apiKey = process.env.ALIBABA_API_KEY || "";
        break;
    }

    if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
      const neededKey = (provider === 'nvidia-nemotron' || provider === 'nvidia-nemotron-ultra' || provider === 'groq-qwen')
        ? 'NVIDIA_API_KEY'
        : (provider.startsWith('groq') || provider.startsWith('llama'))
        ? 'GROQ_API_KEY'
        : provider.startsWith('alibaba')
        ? 'ALIBABA_API_KEY'
        : 'API_KEY';
      return await executeGeminiFallback(`${neededKey} is not configured.`);
    }

    let finalModel = model;

    if (!finalModel) {
      finalModel = (
        provider === "llama-primary" ? "llama-3.3-70b-versatile" : 
        provider === "llama-secondary" ? "llama-3.1-8b-instant" : 
        provider === "alibaba-qwen" ? "qwen-plus" :
        provider === "alibaba-deepseek" ? "deepseek-v3" :
        provider === "groq-vision" ? "llama-3.2-11b-vision-instant" :
        provider === "nvidia-nemotron" ? "nvidia/llama-3.3-nemotron-super-49b-v1" : 
        (provider === "nvidia-nemotron-ultra" || provider === "groq-qwen") ? "nvidia/nemotron-3-ultra-550b-a55b" :
        ""
      );
    }

    try {
      const payload: any = {
        model: finalModel,
        messages,
        temperature,
      };
      
      // JSON mode is handled by prompt instruction
      
      // Set max_tokens to 100 for openrouter models to avoid credit limit 402s, 4000 for others
      const requestedMaxTokens = max_tokens || max_completion_tokens;
      if (provider === "nvidia-nemotron") {
        payload.max_tokens = requestedMaxTokens || 4096;
        payload.temperature = 0.6;
        payload.top_p = 0.95;
        payload.frequency_penalty = 0;
        payload.presence_penalty = 0;
      } else if (provider === "nvidia-nemotron-ultra" || provider === "groq-qwen") {
        payload.max_tokens = requestedMaxTokens || 16384;
        payload.temperature = 0.7;
        payload.top_p = 0.95;
      } else if (requestedMaxTokens) {
        payload.max_tokens = requestedMaxTokens;
      } else {
        if (!provider.startsWith('groq') && !provider.startsWith('llama')) {
          payload.max_tokens = 4000;
        }
      }

      if (stream) {
        payload.stream = true;
        const completion = await client.chat.completions.create(payload);
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        if (res.flushHeaders) res.flushHeaders();
        let fullText = "";
        for await (const chunk of completion as any) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], done: true, final: fullText })}\n\n`);
        return res.end();
      } else {
        const response = await client.chat.completions.create(payload);
        res.json(response);
      }
    } catch (error: any) {
      const status = error.status || 500;
      if (status === 402 || (error.message && String(error.message).includes("afford"))) {
        console.log(`[AI Routing] Provider ${provider} credit budget reached. Automatically routing to Gemini.`);
      } else if (status !== 500) {
        console.log(`[AI Routing] ${provider} API returned status ${status}, routing to fallback engine.`);
      } else {
        console.log(`[AI Routing] ${provider} encountered an issue, routing to fallback engine.`);
      }
      return await executeGeminiFallback(`${provider} API status ${status}`);
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
      // Use bulletproof client=tw-ob parameter without the tk signature token to avoid 400 Bad Request errors.
      const proxiedUrls = urls.map(u => {
        const cleanUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang || 'en')}&q=${encodeURIComponent(u.shortText)}&client=tw-ob`;
        return `/api/tts/proxy?url=${encodeURIComponent(cleanUrl)}`;
      });
      res.json({ urls: proxiedUrls });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tts/proxy", async (req, res) => {
    let url = req.query.url as string;
    if (!url) {
      return res.status(400).send("Missing URL parameter");
    }

    // Secondary deep extraction in case of double-encoding in some environments
    const urlIndex = req.originalUrl.indexOf("url=");
    if (urlIndex !== -1) {
      const extracted = decodeURIComponent(req.originalUrl.substring(urlIndex + 4));
      if (extracted.startsWith('http')) {
        url = extracted;
      }
    }

    try {
      // Use a cleaner request without Referer to avoid Google's "400 Bad Request" security blocks
      const response = await axios({
        method: "get",
        url: url,
        responseType: "stream",
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "*/*"
        }
      });
      
      const contentType = response.headers["content-type"];
      res.setHeader("Content-Type", typeof contentType === "string" ? contentType : "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache audio for 1 year
      response.data.pipe(res);
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      const errorMsg = error.response?.data?.message || error.message;
      console.warn(`[TTS PROXY ERROR] Failed to fetch ${url.slice(0, 50)}... | Status: ${statusCode} | Error: ${errorMsg}`);
      res.status(statusCode).send(`Audio proxy failed: ${errorMsg}`);
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

  const EDUCATIONAL_VIDEOS = [
    {
      keywords: ["class", "school", "teach", "learn", "student", "classroom", "math", "history", "english"],
      url: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4"
    },
    {
      keywords: ["jellyfish", "sea", "ocean", "water", "aquarium", "marine", "fish"],
      url: "https://vjs.zencdn.net/v/oceans.mp4"
    },
    {
      keywords: ["space", "nasa", "star", "planet", "galaxy", "orbit", "moon", "solar", "astronomy"],
      url: "https://images-assets.nasa.gov/video/KSC-20221116-MH-ART01-0001-Artemis_I_Launch_Highlights-3286049/KSC-20221116-MH-ART01-0001-Artemis_I_Launch_Highlights-3286049~orig.mp4"
    },
    {
      keywords: ["animal", "lion", "nature", "wild", "forest", "lion", "tiger", "bear", "savanna", "safari"],
      url: "https://www.w3schools.com/html/movie.mp4"
    }
  ];
  const DEFAULT_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

  const omniJobs = new Map<string, { status: string; url?: string; error?: string }>();

  function matchEducationalVideo(promptText: string): string {
    const promptLower = (promptText || "").toLowerCase();
    for (const entry of EDUCATIONAL_VIDEOS) {
      if (entry.keywords.some(kw => promptLower.includes(kw))) {
        return entry.url;
      }
    }
    return DEFAULT_VIDEO;
  }

  async function runGradioGeneration(jobId: string, promptText: string) {
    // Save current tokens
    const origHfToken = process.env.HF_TOKEN;
    const origHfApiKey = process.env.HUGGINGFACE_API_KEY;

    try {
      const { Client } = await import("@gradio/client");
      console.log(`[OmniHuman] Connecting to Hugging Face space multimodalart/self-forcing for prompt: "${promptText}"`);
      
      const generationTask = (async () => {
        // Temporarily remove tokens from process.env so @gradio/client doesn't auto-read them
        delete process.env.HF_TOKEN;
        delete process.env.HUGGINGFACE_API_KEY;

        let client;
        try {
          client = await Client.connect("multimodalart/self-forcing", { hf_token: "" } as any);
        } finally {
          // Restore them immediately after connecting
          if (origHfToken !== undefined) process.env.HF_TOKEN = origHfToken;
          if (origHfApiKey !== undefined) process.env.HUGGINGFACE_API_KEY = origHfApiKey;
        }
        
        return await client.predict("/video_generation_handler_streaming", {
          prompt: promptText,
          seed: -1,
          fps: 15
        });
      })();

      // Video generation can take time on HF public zero spaces under load, so allow a 45s timeout before falling back
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout after 45 seconds")), 45000)
      );

      const result: any = await Promise.race([generationTask, timeoutPromise]);
      
      console.log(`[OmniHuman] Gradio result received for ${jobId}:`, JSON.stringify(result));
      
      if (result && result.data && Array.isArray(result.data)) {
        // The first output returned is a Video object (or FileData) which contains {video: {url: "..."}}
        const firstOutput = result.data[0];
        let videoUrl = "";

        if (firstOutput && firstOutput.video && firstOutput.video.url) {
          videoUrl = firstOutput.video.url;
        } else if (firstOutput && typeof firstOutput === "object" && firstOutput.url) {
          videoUrl = firstOutput.url;
        } else if (typeof firstOutput === "string" && firstOutput.startsWith("http")) {
          videoUrl = firstOutput;
        }

        if (videoUrl && videoUrl.startsWith("http")) {
          console.log(`[OmniHuman] Generated video via Gradio space successfully: ${videoUrl}`);
          omniJobs.set(jobId, { status: "succeeded", url: videoUrl });
          return;
        }
      }
      throw new Error("Could not find video URL in Gradio response structure");
    } catch (err: any) {
      console.warn(`[OmniHuman] Gradio generation failed or timed out (${err.message}). Using high-quality matched fallback...`);
      const fallbackUrl = matchEducationalVideo(promptText);
      omniJobs.set(jobId, { status: "succeeded", url: fallbackUrl });
    }
  }

  app.post("/api/video/generate", async (req, res) => {
    const { prompt, model } = req.body;

    // omnihuman-1 is the free primary generator that does not require replicate or any API keys
    if (model === "omnihuman-1") {
      const jobId = "omni-" + Date.now();
      omniJobs.set(jobId, { status: "processing" });
      
      // Start background generation without blocking response
      runGradioGeneration(jobId, prompt || "");
      
      return res.json({ id: jobId, status: "processing" });
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(400).json({ error: "REPLICATE_API_TOKEN is required for Replicate generators. Please set it in Settings -> Secrets." });
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
        console.log("[AI Routing] Video provider credit budget reached. Automatically utilizing sample educational video.");
        return res.json({ id: "mock-video-id", status: "started" });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/video/status/:id", async (req, res) => {
    const jobId = req.params.id;
    if (jobId === "mock-video-id") {
      return res.json({ 
        status: "succeeded", 
        url: "https://www.w3schools.com/html/mov_bbb.mp4" 
      });
    }

    // Check if it is an OmniHuman job
    if (omniJobs.has(jobId)) {
      const job = omniJobs.get(jobId);
      return res.json(job);
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return res.status(400).json({ error: "REPLICATE_API_TOKEN is required." });
    }
    try {
      const Replicate = (await import("replicate")).default;
      const replicate = new Replicate({ auth: apiKey });
      
      const prediction = await replicate.predictions.get(jobId);
      
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

  // --- Image Proxy Route for src tags ---
  app.get("/api/image-proxy", async (req, res) => {
    try {
      const prompt = req.query.prompt as string;
      const seed = req.query.seed || Math.floor(Math.random() * 100000);
      const width = req.query.width || 800;
      const height = req.query.height || 600;
      
      if (!prompt) {
        return res.status(400).send("Prompt is required");
      }
      
      const cleanPrompt = prompt.length > 1000 
        ? prompt.substring(0, 997) + "..."
        : prompt;
      
      console.log(`[IMAGE GEN LOG] Proxying image request -> Model: Pollinations Turbo | Width: ${width} | Height: ${height} | Seed: ${seed} | Prompt: "${cleanPrompt.slice(0, 80)}"`);

      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&model=turbo&enhance=true&seed=${seed}`;
      
      const response = await fetch(pollinationsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/png, image/jpeg',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (!response.ok) {
        console.warn(`[IMAGE GEN LOG] Image proxy upstream status ${response.status}`);
        return res.status(response.status).send(`Failed to fetch image`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return res.send(buffer);
    } catch (error) {
      console.error("[IMAGE GEN LOG] Image proxy error:", error);
      return res.status(500).send("Image proxy failed");
    }
  });

  app.post("/api/images/generate", async (req, res) => {
    const { prompt, provider } = req.body;
    
    // Augment every generated image with the Content Factory educational style.
    let styledPrompt = prompt || "";
    const styleSuffix = ", Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours";
    const lowerPrompt = styledPrompt.toLowerCase();
    if (styledPrompt && (!lowerPrompt.includes("disney 3d animation character") || !lowerPrompt.includes("3d cute icon"))) {
      styledPrompt += styleSuffix;
    }

    console.log(`[IMAGE GEN LOG] Requested image generation -> Provider: ${provider} | Prompt: "${styledPrompt.slice(0, 80)}"`);

    if (provider === "gemini-imagen" || provider === "gemini") {
      const apiKey = resolveGeminiKey();
      if (apiKey && apiKey !== "dummy" && apiKey !== "undefined") {
        const modelsToTry = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'imagen-3.0-generate-002'];
        for (const m of modelsToTry) {
          try {
            console.log(`[IMAGE GEN LOG] Attempting primary image generation with Gemini (${m})...`);
            const response = await geminiAi.models.generateContent({
              model: m,
              contents: { parts: [{ text: styledPrompt }] },
              config: { imageConfig: { aspectRatio: "1:1" } }
            });
            let foundBase64 = null;
            if (response.candidates && response.candidates[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                  foundBase64 = part.inlineData.data;
                  break;
                }
              }
            }
            if (foundBase64) {
              console.log(`[IMAGE GEN LOG] Image successfully generated with model: Gemini (${m})`);
              return res.json({ url: `data:image/jpeg;base64,${foundBase64}`, imageUrl: `data:image/jpeg;base64,${foundBase64}`, provider: 'gemini', model: m });
            }
          } catch (err1: any) {
            console.warn(`[IMAGE GEN LOG] Gemini generation failed with ${m}, trying next...`, err1.message);
          }
        }
        console.warn("[IMAGE GEN LOG] All Gemini models failed, falling back to Pollinations Turbo.");
      }

      const seed = Math.floor(Math.random() * 100000);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?width=1024&height=1024&nologo=true&model=turbo&enhance=true&seed=${seed}`;
      console.log("[IMAGE GEN LOG] Returning direct fallback URL -> Model: Pollinations Turbo");
      return res.json({ url: fallbackUrl, imageUrl: fallbackUrl, isFallback: true, provider: 'pollinations', model: 'Pollinations-Turbo' });
    }

    if (provider === "perchance" || provider === "pollinations") {
      const seed = Math.floor(Math.random() * 100000);
      const model = provider === "perchance" ? "Perchance-Professional-🌟" : "flux";
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?width=1024&height=1024&nologo=true&model=${provider === "perchance" ? "turbo" : "flux"}&enhance=true&seed=${seed}`;
      if (provider === "perchance") {
        console.log(`[IMAGE GEN LOG] Perchance AI Generator: "🌌 Image Generator Professional 🌟" (https://perchance.org/image-generator-professional) | Prompt: "${styledPrompt.slice(0, 60)}"`);
      } else {
        console.log(`[IMAGE GEN LOG] Returning direct URL -> Provider: ${provider} | Model: ${model}`);
      }
      return res.json({ url: fallbackUrl, provider, model });
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
    const apiKey = resolveGeminiKey();
    if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
      return res.json(generateLocalFallbackILDP(studentName, grade, subjects));
    }
    try {
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
      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      const text = response.text || "";
      const data = safeJsonParse(text);
      res.json(data);
    } catch (err: any) {
      console.warn("Gemini ILDP Generation failed on all candidate models, using local builder:", err.message);
      res.json(generateLocalFallbackILDP(studentName, grade, subjects));
    }
  });

  
  app.post("/api/gemini/action", async (req, res) => {
    const { action, input, stream } = req.body || {};
    const apiKey = resolveGeminiKey();
    if (!apiKey || apiKey === "" || apiKey === "dummy" || apiKey === "undefined") {
      return res.status(400).json({ error: "GEMINI_API_KEY is not configured in settings." });
    }

    try {
      const model = "gemini-3.7-flash";

      const generateContentWithFallback = async (options: { model: string, contents: any, config?: any }) => {
        const modelsToTry = cachedWorkingModel 
          ? [cachedWorkingModel, "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
          : ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
        
        let lastError: any = null;
        for (const candidate of modelsToTry) {
          try {
            const actualOptions = {
              ...options,
              model: candidate,
              config: {
                maxOutputTokens: 8192,
                ...(options.config || {})
              }
            };
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

      const generateContentStreamWithFallback = async (options: { model: string, contents: any, config?: any }) => {
        const modelsToTry = cachedWorkingModel 
          ? [cachedWorkingModel, "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"]
          : ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
        
        let lastError: any = null;
        for (const candidate of modelsToTry) {
          try {
            const actualOptions = {
              ...options,
              model: candidate,
              config: {
                maxOutputTokens: 8192,
                ...(options.config || {})
              }
            };
            const streamResult = await geminiAi.models.generateContentStream(actualOptions);
            if (streamResult) {
              cachedWorkingModel = candidate;
              return streamResult;
            }
          } catch (err: any) {
            lastError = err;
            console.info(`Gemini candidate model '${candidate}' is currently unavailable for streaming. trying alternative...`);
          }
        }
        throw lastError || new Error("All candidate Gemini models were unavailable for streaming.");
      };

      const handleStreamResponse = async (streamResult: any) => {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        if (res.flushHeaders) res.flushHeaders();

        let fullText = "";
        try {
          for await (const chunk of streamResult) {
            const chunkText = chunk.text || "";
            if (chunkText) {
              fullText += chunkText;
              res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
            }
          }
          res.write(`data: ${JSON.stringify({ done: true, final: fullText })}\n\n`);
          res.end();
        } catch (err: any) {
          console.error("Error during SSE streaming:", err);
          res.write(`data: ${JSON.stringify({ error: err.message || "Streaming error occurred" })}\n\n`);
          res.end();
        }
      };

      const executeOrStream = async (options: { model: string, contents: any, config?: any }, isJson: boolean = false) => {
        if (stream) {
          const streamResult = await generateContentStreamWithFallback(options);
          await handleStreamResponse(streamResult);
        } else {
          const response = await generateContentWithFallback(options);
          if (isJson) {
            return res.json(safeJsonParse(response.text));
          } else {
            return res.json({ text: response.text });
          }
        }
      };

      switch (action) {
        case "quality-check": {
          const { prompt: qualityPrompt } = input || {};
          const response = await generateContentWithFallback({
            model,
            contents: qualityPrompt || "Evaluate CAPS compliance and provide educational feedback",
          });
          return res.json({ text: response.text });
        }

        case "generate-image": {
          const { prompt: imagePrompt, width, height } = input || {};
          let styledPrompt = imagePrompt || "";
          const styleSuffix = ", Disney 3D Animation Character and 3D Cute Icon, educational, high quality, vibrant colours";
          const lowerPrompt = styledPrompt.toLowerCase();
          if (styledPrompt && (!lowerPrompt.includes("disney 3d animation character") || !lowerPrompt.includes("3d cute icon"))) {
            styledPrompt += styleSuffix;
          }

          try {
            const apiKey = resolveGeminiKey();
            if (!apiKey || apiKey === "" || apiKey === "dummy" || apiKey === "undefined") {
              throw new Error("GEMINI_API_KEY is not configured.");
            }
            console.log("Generating image with Gemini action:", styledPrompt);
            const modelsToTry = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'imagen-3.0-generate-002'];
            let foundBase64 = null;
            for (const m of modelsToTry) {
              try {
                console.log(`[IMAGE GEN LOG] Trying model: ${m}`);
                const response = await geminiAi.models.generateContent({
                  model: m,
                  contents: {
                    parts: [{ text: styledPrompt }]
                  },
                  config: {
                    imageConfig: {
                      aspectRatio: (width || 1024) > (height || 1024) ? "16:9" : (width || 1024) < (height || 1024) ? "9:16" : "1:1"
                    }
                  }
                });
                if (response.candidates && response.candidates[0]?.content?.parts) {
                  for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                      foundBase64 = part.inlineData.data;
                      break;
                    }
                  }
                }
                if (foundBase64) {
                  console.log(`[IMAGE GEN LOG] Success with model: ${m}`);
                  return res.json({ imageUrl: `data:image/jpeg;base64,${foundBase64}`, provider: 'gemini', model: m });
                }
              } catch (modelErr: any) {
                console.warn(`[IMAGE GEN LOG] Model ${m} failed:`, modelErr.message);
              }
            }
            throw new Error("No image data returned from Gemini models");
          } catch (err: any) {
            console.warn("Gemini action image generation failed, returning direct Pollinations URL fallback...");
            const seed = Math.floor(Math.random() * 100000);
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?width=${width || 1024}&height=${height || 1024}&nologo=true&model=turbo&enhance=true&seed=${seed}`;
            return res.json({ imageUrl: fallbackUrl, isFallback: true, provider: 'pollinations', model: 'Pollinations-Turbo' });
          }
        }

        case "generate-educational": {
          const { type, details } = input;
          const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN. NEVER INJECT <script src="https://cdn.tailwindcss.com"></script>. The app already has Tailwind.`;
          return await executeOrStream({
            model,
            contents: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design). Do NOT add Tailwind CDN scripts.`,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          }, false);
        }

        case "generate-caps": {
          const isLessonPlan = ['Lesson Plan', 'Weekly Lesson Plan', 'Unit Plan', 'lesson-plan'].includes(input.contentType);
          const isStudyGuide = ['Study Guide / Learning Notes', 'Revision Pack', 'Daily Lesson Notes', 'Learning Activity'].includes(input.contentType);

          let contentTypeEng: 'lesson-plan' | 'worksheet' | 'study-guide' = 'worksheet';
          if (isLessonPlan) contentTypeEng = 'lesson-plan';
          else if (isStudyGuide) contentTypeEng = 'study-guide';

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
            capsReference: input.capsReference || '',
            includeWorksheet: !!input.includeWorksheet
          });

          let finalUserPrompt = user;
          
          if (input.existingContent) {
            finalUserPrompt = `The previous content generation was truncated due to character limits. Here is the content generated so far:\n\n${input.existingContent}\n\nCRITICAL INSTRUCTION: Continue generating the rest of the document seamlessly from exactly where it left off. Do not repeat anything already generated. Complete all remaining sections, summaries, worksheets, or rubrics until the document is 100% complete.`;
          } else {
            finalUserPrompt += `\n\n📌 MANDATORY QUALITY ENHANCEMENTS:
1. TEACHER NOTES & TIME ALLOCATIONS: Include a dedicated Teacher Notes section with formal/informal assessment recommendations (e.g. observation checklists, CAPS ATP mark weighting) and explicit minute-by-minute time allocations per phase.
2. DIFFERENTIATION STRATEGIES: Include explicit built-in differentiation strategies (support for English Additional Language / EAL learners, extra time/scaffolding accommodations, and extension tasks for advanced learners).
3. PRINTABLE ILLUSTRATION DESCRIPTIONS: Ensure every [Illustration: ...] placeholder has a vivid, self-contained description suitable as both an image generation prompt and a printable text description for print-only materials.`;

            if (input.generateImage) {
              finalUserPrompt += `\n\n⚠️ CRITICAL ILLUSTRATION REQUIREMENT: You MUST include at least 2-3 inline illustration placeholders using the exact format: [Illustration: <vivid, detailed description of an educational graphic depicting the topic in South African context>]. Place them strategically inside the HTML to visually break up the text. The system will replace them with actual AI generated images.`;
            } else {
              finalUserPrompt += `\n\n⚠️ CRITICAL: DO NOT include any illustration or image placeholders in the content. Keep it purely text and standard structural HTML.`;
            }
          }

          return await executeOrStream({
            model,
            contents: finalUserPrompt,
            config: {
              maxOutputTokens: 8192,
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
          }, true);
        }

        case "generate-visual": {
          const effectiveLang = input.language || (input.subject?.includes('Afrikaans') ? 'Afrikaans' : input.subject?.includes('Xhosa') ? 'isiXhosa' : 'English');
          const langMandate = EduAIPromptEngine.buildLanguageMandate(effectiveLang, input.subject);
          let systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;
          if (langMandate) {
            systemInstruction = `${langMandate}\n\n${systemInstruction}`;
          }

          const isPoster = input.visualType?.toLowerCase().includes('poster');
          const isInfographic = input.visualType?.toLowerCase().includes('infographic') || input.visualType?.toLowerCase().includes('mind map');
          const isLessonDisplay = input.visualType?.toLowerCase().includes('display') || input.visualType?.toLowerCase().includes('chart') || input.visualType?.toLowerCase().includes('wall') || input.visualType?.toLowerCase().includes('lesson display');
          const isDiagram = input.visualType?.toLowerCase().includes('diagram');
          const isFlashcard = input.visualType?.toLowerCase().includes('flashcard') || input.visualType?.toLowerCase().includes('learning card');

          let visualPrompt = "";
          if (isPoster) {
            visualPrompt = `
              Create an exceptionally polished, high-resolution educational poster layout on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.
              
              CRITICAL RULE: DO NOT generate quiz questions, exam exercises, worksheets, homework, fill-in-the-blanks, or assessment tasks. This is exclusively a visual teaching aid.
              
              AESTHETICS & STRUCTURE SPECIFICATION:
              1. Clean Visual Hierarchy: Establish a clear flow from the top down. Use a generous, modern header banner, well-spaced bento-grid sections, and an impressive footer.
              2. Minimalist Vector Style: Keep illustrations, icons, and layout clean, elegant, and modern. Avoid chaotic overlays, noisy gradients, or over-rendered elements.
              3. Color Palette: Use a cohesive, premium palette of 3-4 professional colors (e.g., deep slate blue, warm terracotta accent, clean cream background). Avoid neon rainbow noise.
              4. Central Visual Component: A spectacular, high-resolution hero section featuring a minimalist vector style illustration portraying "${input.topic}" in a clean, professional manner (e.g., [Illustration: ${input.topic} depicted in an elegant, clean South African context]).
              5. Content Blocks: Present key concepts inside elegantly spaced card containers (rounded-2xl, subtle border, shadow) with large beautifully tracking headers, concise bullet points (4-8 words), and relevant emojis.
              
              Ensure every element is crisp, accessible, and ready for immediate high-resolution classroom display printing.
            `;
          } else if (isInfographic) {
            visualPrompt = `
              Design an incredibly structured, premium academic infographic on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.
              
              CRITICAL RULE: DO NOT generate homework, questions, assessment exercises, or study guides with dense text. Focus on graphics, statistics, and high-impact visual layouts.
              
              AESTHETICS & STRUCTURE SPECIFICATION:
              1. High-Resolution Educational Poster Layout: Organize complex theories into a dual-column matrix or an asymmetrical bento grid structure.
              2. Minimalist Vector Style: Icons, graphics, charts, and mascots must be styled as modern flat minimalist vector graphics with clean outlines and balanced negative space.
              3. Clean Visual Hierarchy: Guide the eye with clean numbered points, bold colored accents, distinct callout panels (rounded-xl), and elegant divider ribbons.
              4. Concept breakdown: Each section must feature a descriptive visual mockup placeholder (e.g., [Illustration: Clean vector infographic icon of key concept]) alongside hyper-concise capsule bullet facts.
              5. Visual Anchors: Include a striking comparison matrix or a centered concentric diagram showing relationships cleanly.
              
              The final product must be highly instructive, visually mesmerizing, and optimized for classroom display.
            `;
          } else if (isLessonDisplay) {
            visualPrompt = `
              Design a stunning, high-resolution visual Lesson Display / Anchor Chart on on the CAPS topic: "${input.topic}" for South African Grade ${input.grade} ${input.subject} classrooms.
              
              CRITICAL RULE: This is a permanent reference display, not a quiz or activity workbook. Ensure zero assessment activities or worksheet blocks.
              
              AESTHETICS & STRUCTURE SPECIFICATION:
              1. High-Resolution Educational Poster Layout: Style this as a full-screen, landscape or portrait anchor chart. Frame it with a bold, professional border and a large chalkboard-style or modern minimalist header.
              2. Clean Visual Hierarchy: Create high-contrast floating keyword cards, word-wall cards, or step-by-step process paths. Use beautiful, generous negative space so keywords stand out clearly at a distance of 5 meters.
              3. Minimalist Vector Style: All diagram lines, connecting arrows, indicators, and background grids must use a sleek, modern minimalist vector style.
              4. Primary Focal Point: Frame a central diagram representing the core mechanism of "${input.topic}" (using clean labeled lines, e.g., pointing out labels like "ROOT", "PHOTOSYNTHESIS", "REACTIONS" in stark white backgrounds with crisp shadows).
              5. Vocabulary Anchors: Highlight 4-6 key term definition cards, beautifully styled with dashed colored borders, a neat custom emoji, and single-sentence explanations.
              
              Make it visually inspiring, clean, and perfectly suited for prominent display on classroom bulletin boards or digital visual screens.
            `;
          } else if (isFlashcard) {
            visualPrompt = `
              Design a set of professional, double-sided visual educational flashcards for South African Grade ${input.grade} ${input.subject} on "${input.topic}".
              
              DESIGN REQUIREMENTS:
              - Grid Layout: Show multiple cards in a beautifully aligned grid (2 or 3 per row).
              - Each card must have:
                - Front side: Large bold title, a delightful custom icon or emoji, and a quick catchy hint or question.
                - Back side: Clear conceptual explanation, a South African contextual/CAPS example, and a small fun "Did you know?" fact box.
              - Aesthetics: Rounded-3xl corners (at least 24px), thick colored outlines (3px solid border that changes color per card), and micro shadow depth.
              - Use rich, vibrant background gradients or clean high-contrast card themes. Text must be large and instantly legible.
            `;
          } else if (isDiagram) {
            visualPrompt = `
              Create a crystal-clear, beautifully illustrated scientific diagram of "${input.topic}" specifically adapted for South African Grade ${input.grade} ${input.subject} learners.
              
              CRITICAL: This is a teaching demonstration visual aid. DO NOT write worksheet questions, exercises, or tests.
              
              DIAGRAM ARCHITECTURE:
              - Flow & Layout: Set against a highly realistic, vibrant South African biome / context (e.g. water cycles over the Drakensberg mountains, food webs of the Kruger savanna, or plant cell structure featuring indigenous fynbos/Proteas).
              - Connections: Draw bright, stylized, high-contrast flowing directional arrows pointing out movement, cycle flow, or ecosystem energy transfers.
              - Diagram Labels: Place 5-6 crisp, floating educational pointing cards (labels like 'KAROO', 'ALOE ROOT', 'ENERGY FLOW') connected to their targets. Styling: stark white background, rounded border, sharp shadows, and bold scientific monospace/sans-serif fonts.
              - Key/Legend: Include a small, highly tidy legend card at the bottom right with colorful indicator boxes explaining key parts.
              - Ensure the diagram looks detailed, professional, and is highly instructive for display.
            `;
          } else {
            visualPrompt = `Create a highly visual display, not a worksheet, for Grade ${input.grade} ${input.subject} on topic ${input.topic}. Ensure it is styled beautifully.`;
          }

          const instructorPriority = buildInstructorPriority(input.additionalInstructions);
          const selectedVisualStyle = input.style || EDUCATIONAL_IMAGE_STYLE;
          let prompt = "";
          if (input.existingContent) {
            prompt = `The previous visual aid content generation was truncated due to character limits. Here is the content generated so far:\n\n${input.existingContent}\n\nCRITICAL INSTRUCTION: Continue generating the rest of the visual aid seamlessly from exactly where it left off. Do not repeat anything already generated. Complete all remaining sections until the document is 100% complete.`;
          } else {
            prompt = `
              ${instructorPriority}
              ${visualPrompt}
              Language: ${effectiveLang}
              Selected visual style (use only when the instructor brief does not specify another): ${selectedVisualStyle}
              Colour scheme (supporting default only): ${input.colorScheme || 'Bright Primary Colors'}
              Content Details (supporting default only): ${input.specificContent || 'Use the instructor brief and topic.'}
              Quantity (supporting default only): ${input.quantity || 'A complete classroom-ready visual aid'}
              Image style requirement: ${IMAGE_PROMPT_GOLDEN_RULE}
            `;
            if (input.generateImage) {
              prompt += `\n\n⚠️ CRITICAL ILLUSTRATION REQUIREMENT: Include at least 2-3 inline illustration placeholders using the exact format: [Illustration: <vivid, detailed description of an educational graphic depicting the topic in South African context>]. The illustration must use ${EDUCATIONAL_IMAGE_STYLE}. Place them strategically inside the HTML; the system will replace them with generated images.`;
            } else {
              prompt += `\n\n⚠️ CRITICAL: DO NOT include illustration or image placeholders in the content. Keep it purely text and standard structural HTML.`;
            }
            prompt += `\n\n${instructorPriority}`;
          }

          if (langMandate) {
            prompt = `${langMandate}\n\n${prompt}\n\n${langMandate}`;
          }

          return await executeOrStream({
            model,
            contents: prompt,
            config: { 
              maxOutputTokens: 8192,
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
          }, true);
        }

        case "generate-admin": {
          const effectiveLang = input.language || (input.purpose?.includes('Afrikaans') ? 'Afrikaans' : input.purpose?.includes('Xhosa') ? 'isiXhosa' : 'English');
          const langMandate = EduAIPromptEngine.buildLanguageMandate(effectiveLang);
          let systemInstruction = `${MASTER_SYSTEM_PROMPT}

You are an expert school administrative document and certificate architect.
Generate a formal ${input.documentType} for ${input.schoolName || 'the school'}.
The tone should be ${input.tone || 'Formal'}.
IMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.

STRICT COMPLIANCE & ZERO-HALLUCINATION MANDATES:
1. ABSOLUTE METADATA ADHERENCE: You MUST explicitly carry through and display the provided metadata fields: School Name ("${input.schoolName || 'Not specified'}"), Date & Time ("${input.timeDate || 'Not specified'}"), Recipient ("${input.recipient || 'Not specified'}"), Venue ("${input.venue || 'Not specified'}"), Class Teacher ("${input.classTeacher || 'Not specified'}"), and School Principal ("${input.schoolPrincipal || 'Not specified'}"). You are STRICTLY FORBIDDEN from dreaming up, inventing, or hallucinating different dates, times, school names, venues, or people's names.
2. ZERO QUERIES OR PLACEHOLDERS: Do NOT generate query tags (e.g., "[Query: ...]", "[Insert Date]", "[Date Here]", "[Name Here]") or dummy variables. Every parameter value MUST be permanently rendered into the visible text or signature blocks of the HTML document.
3. CERTIFICATE MANDATE: When generating certificates (e.g. Academic Achievement, Participation), the Date & Time field ("${input.timeDate || 'Not specified'}") MUST be visibly printed on the certificate body as the date of award or issuance. Do not omit or alter it!`;

          if (langMandate) {
            systemInstruction = `${langMandate}\n\n${systemInstruction}`;
          }

          let prompt = "";
          if (input.existingContent) {
            prompt = `The previous administrative document generation was truncated due to character limits. Here is the content generated so far:\n\n${input.existingContent}\n\nCRITICAL INSTRUCTION: Continue generating the rest of the document seamlessly from exactly where it left off. Do not repeat anything already generated. Complete all remaining sections until the document is 100% complete.`;
          } else {
            const actionPrompt = (input.additionalInstructions || input.keyPoints || "").trim();
            let promptParts = [];

            if (actionPrompt.length > 0) {
              promptParts.push(`### 🚀 ACTION PROMPT SCRIPT (ABSOLUTE HIGHEST PRIORITY DIRECTIVE)\n${actionPrompt}\n\n--------------------------------------------------------------------------------\nThe above Action Prompt Script takes priority over everything else. You must execute this action prompt script first as your primary architectural blueprint and core instruction set.`);
              
              promptParts.push(`### 📋 SECONDARY PARAMETERS (TO BE ADDED BELOW AND INTEGRATED FULLY)\nIn terms of importance, the following parameters come after the Action Prompt Script above. However, every single specified parameter below MUST be adhered to and permanently woven into the document/certificate without exception:\nType: ${input.documentType}\nPurpose / Subject: ${input.purpose || 'Not specified'}\nSchool Name: ${input.schoolName || 'Not specified'}\nDate & Time: ${input.timeDate || 'Not specified'}\nRecipient: ${input.recipient || 'Not specified'}\nVenue: ${input.venue || 'Not specified'}\nClass Teacher: ${input.classTeacher || 'Not specified'}\nSchool Principal: ${input.schoolPrincipal || 'Not specified'}\nInclude Reply Slip: ${input.includeReplySlip ? 'Yes' : 'No'}\nLanguage: ${input.language || 'English'}`);
            } else {
              promptParts.push(`### 📋 DOCUMENT PARAMETERS & REQUIREMENTS (ALL TOGETHER)\nSince no Action Prompt Script was provided, use all of the following parameters together as the primary instruction set to generate the complete document:\nType: ${input.documentType}\nPurpose / Subject: ${input.purpose || 'Not specified'}\nSchool Name: ${input.schoolName || 'Not specified'}\nDate & Time: ${input.timeDate || 'Not specified'}\nRecipient: ${input.recipient || 'Not specified'}\nVenue: ${input.venue || 'Not specified'}\nClass Teacher: ${input.classTeacher || 'Not specified'}\nSchool Principal: ${input.schoolPrincipal || 'Not specified'}\nInclude Reply Slip: ${input.includeReplySlip ? 'Yes' : 'No'}\nLanguage: ${input.language || 'English'}`);
            }

            promptParts.push(`### 🛑 STRICT RENDERING COMPLIANCE:\n- Carry through the exact Date & Time ("${input.timeDate || 'Not specified'}") and all parameters into the document body or certificate.\n- Never output query prompts or bracketed placeholders.\n- Adhere strictly to all parameter values.`);

            prompt = promptParts.join("\n\n");

            if (input.generateImage) {
              prompt += `\n\n⚠️ CRITICAL ILLUSTRATION REQUIREMENT: You MUST include at least 1-2 inline illustration placeholders using the exact format: [Illustration: <vivid, detailed description of a professional school stamp, document seal, or graphic depicting the topic in South African context>]. Place them strategically inside the HTML. The system will replace them with actual AI generated images.`;
            } else {
              prompt += `\n\n⚠️ CRITICAL: DO NOT include any illustration or image placeholders in the content. Keep it purely text and standard structural HTML.`;
            }
          }

          return await executeOrStream({
            model,
            contents: prompt,
            config: { 
              maxOutputTokens: 8192,
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
          }, true);
        }

        case "ocr-scan": {
          const { imageData, language, isHandwritten } = input;
          const items = Array.isArray(imageData) ? imageData : [imageData];
          const textContents: string[] = [];
          const partsToProcess: any[] = [];
          
          for (const item of items) {
            let mimeType = "image/jpeg";
            let base64Data = item;
            
            if (item.startsWith("data:")) {
              const p = item.split(";base64,");
              if (p.length === 2) {
                mimeType = p[0].replace("data:", "").split(";")[0];
                base64Data = p[1];
              } else {
                base64Data = item.split(",")[1] || item;
              }
            }
            
            if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || mimeType.includes("officedocument") || mimeType === "application/docx" || mimeType === "docx") {
              const docxText = await tryExtractDocxText(base64Data);
              if (docxText) {
                textContents.push(docxText);
              }
            } else {
              partsToProcess.push({
                inlineData: { mimeType, data: base64Data }
              });
            }
          }
          
          let resultText = "";
          if (partsToProcess.length > 0) {
            const prompt = `Extract all text from the attached ${partsToProcess.length} page/s or document accurately, assuming the text is in ${language}.
            ${isHandwritten ? "The image/document contains handwritten notes, assessments, or drawings. Use professional Multimodal Handwriting Recognition to transcribe printed text, cursive handwriting, math symbols, annotations, and notes precisely." : ""}
            Format it cleanly. Make no other comments.`;
            
            const response = await generateContentWithFallback({
              model,
              contents: [
                { role: 'user', parts: [
                  { text: prompt },
                  ...partsToProcess
                ]}
              ]
            });
            resultText = response.text || "";
          }
          
          if (textContents.length > 0) {
            if (resultText) {
              resultText += "\n\n=== Extracted Word Document Text ===\n\n" + textContents.join("\n\n");
            } else {
              resultText = textContents.join("\n\n");
            }
          }
          
          return res.json({ extractedText: resultText });
        }

        case "ocr-grade": {
          const { imageData, rubric, language, isHandwritten, behavioralAspects, adjustLateSubmission } = input;
          const items = Array.isArray(imageData) ? imageData : [imageData];
          const textContents: string[] = [];
          const partsToProcess: any[] = [];
          
          for (const item of items) {
            let mimeType = "image/jpeg";
            let base64Data = item;
            
            if (item.startsWith("data:")) {
              const p = item.split(";base64,");
              if (p.length === 2) {
                mimeType = p[0].replace("data:", "").split(";")[0];
                base64Data = p[1];
              } else {
                base64Data = item.split(",")[1] || item;
              }
            }
            
            if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || mimeType.includes("officedocument") || mimeType === "application/docx" || mimeType === "docx") {
              const docxText = await tryExtractDocxText(base64Data);
              if (docxText) {
                textContents.push(docxText);
              }
            } else {
              partsToProcess.push({
                inlineData: { mimeType, data: base64Data }
              });
            }
          }
          
          const textDocContext = textContents.length > 0 
             ? `\n\nWord Document content uploaded by student:\n${textContents.join("\n\n")}`
             : "";

          let behaviorPrompt = "";
          if (behavioralAspects && Array.isArray(behavioralAspects) && behavioralAspects.length > 0) {
            behaviorPrompt = `\n- Evaluate the student's submission on these behavioral/work habit dimensions: ${behavioralAspects.join(", ")}. Analyze their work layout, structure, and handwriting quality to provide a dedicated, supportive "Learning Behavior & Focus Feedback" section in the overall feedback.`;
          }
          if (adjustLateSubmission) {
            behaviorPrompt += `\n- Special Context: This was submitted late, or as a redo attempt. Maintain rigorous academic scoring standards, but add a supportive, encouraging remark acknowledging their initiative to catch up or refine their work.`;
          }
          
          const prompt = `You are an AI Grader and South African CAPS Curriculum Specialist.
          Analyze these student assessment page/s.
          ${textDocContext}
          
          TASK 1: MEMORANDUM & RUBRIC QUALITY CHECK & AUTO-GENERATION
          - You are supplied with this Teacher's Memorandum/Rubric: "${rubric || ''}".
          - IF the supplied Memorandum/Rubric is missing, blank, or extremely brief:
            * You MUST automatically generate a highly comprehensive, detailed Memorandum and grading rubric mapped to CAPS criteria based on the student's work and the questions/answers found in their submission.
            * Describe this generation in 'memoCorrectionReport' (mention that a comprehensive Memorandum/Rubric has been dynamically generated to complete grading).
            * Set 'originalMemoCorrected' to true.
            * Produce the newly generated Memorandum/Rubric in 'correctedMemo'.
          - IF a Memorandum/Rubric IS supplied by the teacher:
            * Review it for correctness, spelling mistakes, factual errors, marks allotment problems, CAPS curriculum misalignments, or lack of clarity.
            * If any issues are found, correct them. Describe exactly what issues were corrected in 'memoCorrectionReport'.
            * Set 'originalMemoCorrected' to true if you modified it, or false if it was fully correct.
            * Return the (modified/corrected) Memorandum/Rubric in 'correctedMemo'.
          
          TASK 2: EVALUATION AND GRADING
          - Extract all text answers from the student's submission pages and return it in 'extractedText'.
          - Evaluate each question's answer accurately according to the verified or generated memorandum/rubric.${behaviorPrompt}
          - ${isHandwritten ? "The student's inputs may be handwritten. Apply deep Handwriting Recognition (HWR) and optical reading on the student answers. Be forgiving on cursive forms, crossed-out errors, printed text, mathematical symbols, and structural layout answers." : ""}
          - Sum and return the total obtained score as a string in 'totalScore' (e.g., "18/25" or "72%").
          - List marks and reasoning for each question individually in the array 'marksPerQuestion'.
          - Provide highly constructive, encouraging feedback for the learner in 'feedback' (use encouraging South African educational tone).`;
          
          const contentsToUse: any[] = [
            { text: prompt }
          ];
          for (const part of partsToProcess) {
            contentsToUse.push(part);
          }
          
          const response = await generateContentWithFallback({
            model,
            contents: [
              { role: 'user', parts: contentsToUse }
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
                  originalMemoCorrected: { type: Type.BOOLEAN },
                  memoCorrectionReport: { type: Type.STRING },
                  correctedMemo: { type: Type.STRING }
                },
                required: ["extractedText", "marksPerQuestion", "feedback", "totalScore", "originalMemoCorrected", "memoCorrectionReport", "correctedMemo"]
              }
            }
          });
          return res.json(safeJsonParse(response.text));
        }

        case "text-grade": {
          const { studentAnswers, memo, rubric, language } = input;
          const prompt = `You are an AI Grader. Grade this student's written response in ${language || 'English'}.
          Student answers: ${studentAnswers}
          Memorandum / Memo notes: ${memo}
          Rubric guidelines: ${rubric}
          
          Perform the following steps:
          1. Evaluate each answer.
          2. Calculate marks obtained per question according to the memo and rubric.
          3. Provide encouraging and highly constructive feedback for the student.
          4. Suggest actionable next steps to improve.
          5. Sum the final score and return a neat JSON report.`;

          const response = await generateContentWithFallback({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  marksPerQuestion: { type: Type.ARRAY, items: { type: Type.STRING } },
                  feedback: { type: Type.STRING },
                  totalScore: { type: Type.STRING }
                },
                required: ["marksPerQuestion", "feedback", "totalScore"]
              }
            }
          });
          return res.json(safeJsonParse(response.text));
        }

        case "chat": {
          const { messages } = input;
          return await executeOrStream({
            model,
            contents: messages,
            config: {
              systemInstruction: "You are a friendly and encouraging South African school tutor for EduAI Companion. You help students understand complex CAPS curriculum concepts in simple terms. Use local South African examples (e.g. using Rands, referring to provinces) and be patient. Keep explanations concise.",
            }
          }, false);
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
        model: 'gemini-3.7-flash',
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

  // Explicit route for splash video from root directory so it never returns 404
  app.get("/splash.mp4", (req, res) => {
    const rootSplash = path.join(process.cwd(), "splash.mp4");
    const publicSplash = path.join(process.cwd(), "public", "splash.mp4");
    if (fs.existsSync(rootSplash)) {
      return res.sendFile(rootSplash);
    } else if (fs.existsSync(publicSplash)) {
      return res.sendFile(publicSplash);
    } else {
      return res.status(404).send("Splash video not found");
    }
  });

  // --- Vite Middleware ---

  async function initializeAndListen() {
    if (process.env.VERCEL) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          // Arena previews arrive through a generated HTTPS host. Permit that
          // host instead of rejecting the embedded preview with Vite's host check.
          allowedHosts: true,
        },
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

    if (!process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  }

  initializeAndListen();

  export default app;
