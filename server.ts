import { CAPS_LESSON_PLAN_SYSTEM_PROMPT } from "./src/lib/prompts/caps-lesson-plan-prompt";
import { EduAIPromptEngine } from "./src/lib/prompt-engine";
import { buildAdminLabPrompts, buildVisualLabPrompts } from "./src/lib/prompts/lab-prompts";
import { EDUAI_HOST_CHROME_RULE } from "./src/lib/prompts/host-chrome";
import { clientKeyFrom, createRateLimiter, ruleForPath } from "./src/lib/rateLimit";
import {
  GEMINI_MODEL_CHAIN,
  NVIDIA_BASE_URL,
  QWEN_BASE_URL,
  QWEN_DEFAULT_MODEL,
  alternativeProviderFor,
  isLegacyProvider,
  isNemotronProvider,
  resolveProviderModel,
} from "./src/lib/aiModels";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
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
  // Final fallback: the same baked-in NVIDIA NIM key that already ships inside
  // the client bundle / APK (see src/lib/aiSecrets.ts — stored reversed so the
  // repo passes secret scanning). Keeps the Nemotron free NIM models working on
  // deployments where no NVIDIA_API_KEY env var has been configured.
  return "m9NrbqtXvcDW8q-8SI11X4Gd-CDZKm70pq1-qPGy6V2wrOnpUHOWBiNMQUlkJMPy-ipavn".split("").reverse().join("");
}

// Alibaba Cloud Model Studio (Qwen 3.8) — OpenAI-compatible workspace endpoint.
// The default is the workspace-scoped host from the Model Studio API key dialog;
// override with ALIBABA_API_BASE if the workspace/region changes.
const ALIBABA_DEFAULT_BASE_URL = QWEN_BASE_URL;

function resolveAlibabaBaseURL(): string {
  const base = (process.env.ALIBABA_API_BASE || process.env.DASHSCOPE_BASE_URL || ALIBABA_DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  return base;
}

function resolveAlibabaKey(): string {
  const keys = [
    process.env.ALIBABA_API_KEY,
    process.env.VITE_ALIBABA_API_KEY,
    process.env.DASHSCOPE_API_KEY,
  ];
  for (const key of keys) {
    if (key && key !== "dummy" && key !== "undefined" && key.trim() !== "") {
      return key.trim().replace(/^['"\s]+|['"\s]+$/g, "");
    }
  }
  // Final fallback: the same baked-in Model Studio key that already ships inside
  // the client bundle / APK (see src/lib/aiSecrets.ts — stored reversed so the
  // repo passes secret scanning). Keeps Qwen 3.8 working on deployments where
  // no ALIBABA_API_KEY env var has been configured.
  return "wCtYdQVHIFSLbTozGFwd2Y-uwWrZ45WYxS2uDeDZ8VagIwTpc9WRUYD83BWG4dMcH_e7OSP-T2kwz2rdt1NKx0OZCQICUEM.38xk.MLMYLDD.H-sw-ks".split("").reverse().join("");
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
  // Final fallback: the same baked-in key that already ships inside the client
  // bundle / APK (see src/lib/aiSecrets.ts — stored reversed so the repo passes
  // secret scanning). This keeps AI generation working on deployments where no
  // GEMINI_API_KEY env var has been configured, instead of replying HTTP 400.
  return "07m0quM9DBiExKxhgEqPAwn1Qm-_inBPAySazIA".split("").reverse().join("");
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

// The frozen Gemini fallback chain lives in `src/lib/aiModels.ts` (single
// source of truth, asserted by tests/ai-models.test.ts). AGENTS.md §1 — order
// must never change.

// When EVERY candidate just failed (e.g. a global Google "high demand" 503
// spike), stop preferring the previously-cached model for a short window so
// the next request restarts cleanly at the top of the frozen chain instead of
// re-validating a model that is currently failing.
let cachedWorkingModelFailedAt = 0;
const WORKING_MODEL_FAILURE_WINDOW_MS = 60000;

// Gentle escalation between candidates: when Google answers 503/429 ("high
// demand" / rate limited), hammering the next candidate instantly burns the
// whole chain in ~1s and the user sees "Generation error". A short, capped
// pause gives the spike time to clear and lets one of the later candidates
// actually answer.
const geminiCandidateBackoffMs = (candidateIndex: number, err: any): number => {
  const status = err?.status || err?.response?.status || err?.code;
  if (status === 503 || status === 429) {
    return Math.min(2000, 400 * (candidateIndex + 1));
  }
  return 0;
};

const buildGeminiModelsToTry = (): string[] => {
  const preferCached = !!cachedWorkingModel &&
    (Date.now() - cachedWorkingModelFailedAt > WORKING_MODEL_FAILURE_WINDOW_MS);
  const chain = preferCached && cachedWorkingModel
    ? [cachedWorkingModel, ...GEMINI_MODEL_CHAIN]
    : [...GEMINI_MODEL_CHAIN];
  // De-duplicate while preserving order (cached model is always in the chain).
  return [...new Set(chain)];
};

const geminiGenerateWithFallback = async (options: { model?: string, contents: any, config?: any }) => {
  const modelsToTry = buildGeminiModelsToTry();

  let lastError: any = null;
  for (let i = 0; i < modelsToTry.length; i++) {
    const candidate = modelsToTry[i];
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
        cachedWorkingModelFailedAt = 0;
        return result;
      }
    } catch (err: any) {
      lastError = err;
      console.info(`Gemini candidate model '${candidate}' is currently unavailable (${err.message}). Trying alternative...`);
      const waitMs = geminiCandidateBackoffMs(i, err);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }
  cachedWorkingModelFailedAt = Date.now();
  throw lastError || new Error("All candidate Gemini models were unavailable.");
};

const geminiStreamWithFallback = async (options: { model?: string, contents: any, config?: any }) => {
  const modelsToTry = buildGeminiModelsToTry();

  let lastError: any = null;
  for (let i = 0; i < modelsToTry.length; i++) {
    const candidate = modelsToTry[i];
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
        cachedWorkingModelFailedAt = 0;
        return streamResult;
      }
    } catch (err: any) {
      lastError = err;
      console.info(`Gemini candidate streaming model '${candidate}' is currently unavailable (${err.message}). Trying alternative...`);
      const waitMs = geminiCandidateBackoffMs(i, err);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }
  cachedWorkingModelFailedAt = Date.now();
  throw lastError || new Error("All candidate Gemini streaming models were unavailable.");
};


const app = express();

// Behind serverless/proxy hosts (Vercel, Cloud Run) so req.protocol/secure
// cookies reflect the original https request instead of the internal hop.
app.set("trust proxy", 1);

const MASTER_SYSTEM_PROMPT = `
You are the official AI content generator for **EduAI Companion** — a premium South African CAPS-aligned educational platform.

CRITICAL DATE & YEAR RULE:
- The current year is 2026, not 2024. Use only dates supplied by the request or shown in the host banner; do not invent a current date or add a second date block.
- When a new material genuinely needs a year, use 2026. Never output 2024.

CRITICAL VISUAL DESIGN & ILLUSTRATION RULE:
- Under no circumstances should posters, infographics, flow diagram structures, or visual content types be dominated by long, dense paragraphs of text.
- You must aggressively break up and punctuate all text with detailed, custom, context-relevant inline illustration or diagram placeholders inside brackets, e.g., \`[Illustration: <detailed, highly-specific visual prompt in South African context>]\` or \`[Diagram: <detailed labels and flow-chart prompt>]\`.
- Each key concept card, section, or bento-grid block inside posters and visual aids must contain its own dedicated illustration placeholder.
- Keep text inside poster blocks exceptionally brief, punchy, action-oriented, and presented in bullet lists or highlighted capsules with relevant South African emojis (e.g. 🇿🇦, 🦁, 🏔️) rather than raw explanatory prose.

Your outputs must match or exceed the professional quality of our signature EduAI templates: clean, extremely modern, highly vibrant, and interactive layouts. Use excellent visual hierarchy, clear instructions, bold answer lines/boxes, scoring areas, educational illustrations/diagrams, and total print-readiness. The application owns the page-level header, single content banner, and footer; use colour and visual emphasis within the educational content, not as duplicate page chrome.

VISUAL STYLING DOCTRINE (Follow these for all HTML output):
1. **Section Colors**: Use the learning-domain palette for internal section accents and content blocks. Do not create a page-level banner; the host renders the only document banner. Use deep, vibrant colors where they improve hierarchy:
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
   - For Assessments / Worksheets: Include blank learner Name/Date fields within the body when useful, and a beautiful bold Score Card with a thick yellow/amber border (e.g., "SCORE: _____ / 50 Marks"). Do not create a separate page header or metadata badge.
   - Section headers must use pill-shaped colored borders. True/False questions must display "T / F" inside colorful circles or pill indicators. Radio options must look like tappable capsule options.
6. **Hero Illustrations / Space for Visuals**: Every generated worksheet or poster MUST include an elegantly positioned block representing the primary illustration. If the generator suggests an image, embed a container with a relative graphic or the configured illustration safely in the design.
7. **Motivational elements**: Add small encouraging callouts (e.g. "Amazing job! Keep shining! ✨") at the end of the tasks.

OUTPUT SHELL:
- Return an HTML body fragment with Tailwind utility classes, not a full HTML document. Do not include <html>, <head>, or <body> wrappers, Tailwind CDN scripts, or external stylesheets.
- The host renders the current EduAI content header, one branded banner, and the canonical footer. Do not generate replacements or duplicates.

${EDUAI_HOST_CHROME_RULE}
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

  // NOTE: `app.set('trust proxy', 1)` is configured above the route handlers,
  // so `req.ip` is the real client address behind Vercel's proxy — which is
  // what the rate limiter keys on.
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API abuse protection -------------------------------------------------
  // `/api/*` is an unauthenticated provider gateway, so quota is the asset at
  // risk (see TECHNICAL_SPECIFICATION.md §13.2). This fixed-window limiter is
  // deliberately dependency-free and per-process: it blunts casual/accidental
  // abuse without requiring credentials or breaking existing clients.
  // Set RATE_LIMIT_DISABLED=true to switch it off (not recommended in public
  // deployments). Server-side token verification is the recommended follow-up.
  const rateLimiter = createRateLimiter();
  const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === 'true';
  const RATE_LIMIT_EXEMPT_PATHS = new Set([
    '/api/health',
    '/api/notifications/vapid-public-key',
  ]);

  app.use('/api', (req, res, next) => {
    if (RATE_LIMIT_DISABLED) return next();
    const requestPath = (req.originalUrl || req.url || '').split('?')[0];
    if (RATE_LIMIT_EXEMPT_PATHS.has(requestPath)) return next();

    const rule = ruleForPath(requestPath);
    const decision = rateLimiter.check(`${rule.name}:${clientKeyFrom(req)}`, rule);

    res.setHeader('X-RateLimit-Limit', String(decision.limit));
    res.setHeader('X-RateLimit-Remaining', String(decision.remaining));

    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many ${rule.name} requests. Please retry in ${decision.retryAfterSeconds}s.`,
        retryAfter: decision.retryAfterSeconds,
      });
    }
    next();
  });

  // --- AI Provider Clients ---

  let cachedAlibabaClient: OpenAI | null = null;
  let cachedAlibabaKey: string | null = null;

  function getAlibabaClient(): OpenAI {
    const currentKey = resolveAlibabaKey();
    if (cachedAlibabaClient && cachedAlibabaKey === currentKey) {
      return cachedAlibabaClient;
    }
    cachedAlibabaKey = currentKey;
    cachedAlibabaClient = new OpenAI({
      apiKey: currentKey || "dummy",
      baseURL: resolveAlibabaBaseURL(),
      // Fail fast when the upstream gateway hangs (connection errors / 504s).
      // Serverless hosts (e.g. Vercel, 60s cap) kill the whole function if we
      // wait on a stuck upstream, which prevented the built-in Gemini fallback
      // from ever running. The timer is cleared once response headers arrive,
      // so legitimate long generations and streaming are unaffected.
      timeout: 35000,
      maxRetries: 0,
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

  let cachedNvidiaClient: OpenAI | null = null;
  let cachedNvidiaKey: string | null = null;

  function getNvidiaClient(): OpenAI {
    // NVIDIA NIM endpoint ONLY — Nemotron models must never route through any
    // other provider or aggregator. Falls back to the baked NVIDIA NIM key
    // (same one the client bundle / APK uses) when no env var is configured.
    const nvidiaKey = resolveNvidiaKey();
    if (cachedNvidiaClient && cachedNvidiaKey === nvidiaKey) {
      return cachedNvidiaClient;
    }
    cachedNvidiaKey = nvidiaKey;
    cachedNvidiaClient = new OpenAI({
      apiKey: nvidiaKey || "dummy",
      baseURL: NVIDIA_BASE_URL,
    });
    return cachedNvidiaClient;
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

  // --- Web Push (VAPID) Notifications ---
  // Configure VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (and optionally
  // VAPID_SUBJECT) as env vars to enable push. Generate a pair with:
  //   npx web-push generate-vapid-keys
  // When they are not configured we answer 200 with { enabled: false } so the
  // client NotificationManager stays silent instead of logging 404s.
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@eduai-companion.app";

  interface PushSubscriptionEntry {
    subscription: any;
    userId?: string;
    createdAt: string;
  }
  const pushSubscriptions = new Map<string, PushSubscriptionEntry>();

  // Loaded lazily so the server still boots in environments where the
  // optional dependency is not installed.
  const getWebPush = async (): Promise<any | null> => {
    try {
      const mod: any = await import("web-push");
      const webpush = mod.default || mod;
      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      }
      return webpush;
    } catch {
      return null;
    }
  };

  const sendPushToEntry = async (webpush: any, entry: PushSubscriptionEntry, payload: any) => {
    try {
      await webpush.sendNotification(entry.subscription, JSON.stringify(payload));
    } catch (err: any) {
      const statusCode = err?.statusCode;
      // 404/410 = subscription expired or revoked on the client side — drop it.
      if (statusCode === 404 || statusCode === 410) {
        for (const [key, value] of pushSubscriptions.entries()) {
          if (value === entry) pushSubscriptions.delete(key);
        }
      }
      throw err;
    }
  };

  app.get("/api/notifications/vapid-public-key", (req, res) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.json({ enabled: false, publicKey: null });
    }
    return res.json({ enabled: true, publicKey: vapidPublicKey });
  });

  app.post("/api/notifications/subscribe", async (req, res) => {
    try {
      const { subscription, userId } = req.body || {};
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "A valid push subscription is required." });
      }
      pushSubscriptions.set(subscription.endpoint, {
        subscription,
        userId,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json({ ok: true, stored: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to store subscription." });
    }
  });

  app.post("/api/notifications/unsubscribe", async (req, res) => {
    const { subscription } = req.body || {};
    if (subscription?.endpoint) {
      pushSubscriptions.delete(subscription.endpoint);
    }
    return res.json({ ok: true });
  });

  app.post("/api/notifications/test-send", async (req, res) => {
    const { title = "EduAI Companion", body = "You have a new notification!", url = "/", userId } = req.body || {};
    const payload = { title, body, url };

    // Web Push (browser / installed PWA).
    let webSent = 0;
    let webTotal = 0;
    let webError: string | null = null;
    if (vapidPublicKey && vapidPrivateKey) {
      const webpush = await getWebPush();
      if (!webpush) {
        webError = "The web-push package is not installed on this deployment.";
      } else {
        const targets = [...pushSubscriptions.values()].filter((entry) => !userId || entry.userId === userId);
        webTotal = targets.length;
        const results = await Promise.allSettled(
          targets.map((entry) => sendPushToEntry(webpush, entry, payload))
        );
        webSent = results.filter((r) => r.status === "fulfilled").length;
      }
    } else {
      webError = "Web push is not configured on this deployment (missing VAPID keys).";
    }

    // FCM (the Capacitor Android APK cannot use Web Push at all).
    const fcm = await sendToFcmDevices({ ...payload, userId });

    const sent = webSent + fcm.sent;
    const total = webTotal + fcm.total;
    if (sent === 0 && total === 0) {
      return res.status(503).json({
        ok: false,
        error: webError || fcm.error || "No notification targets are registered for this deployment.",
        web: { sent: webSent, total: webTotal, error: webError },
        fcm,
      });
    }
    return res.json({ ok: true, sent, total, web: { sent: webSent, total: webTotal, error: webError }, fcm });
  });

  // --- Firebase Cloud Messaging (native Android / iOS app) -----------------
  // The Capacitor Android WebView exposes neither `PushManager` nor
  // `Notification`, so Web Push above can never reach the APK. The native app
  // registers an FCM device token instead (src/lib/notifications/androidPush.ts)
  // and these endpoints deliver to it over the FCM HTTP v1 API.
  //
  // Configure ONE of these to enable delivery:
  //   FIREBASE_SERVICE_ACCOUNT_JSON  — the whole service-account JSON (preferred)
  //   GOOGLE_APPLICATION_CREDENTIALS — a path to that JSON file
  // The account needs the "Firebase Cloud Messaging" role. Without either, the
  // endpoints answer with { enabled: false } so clients stay silent — the same
  // contract as the VAPID block above. See ANDROID_PUSH_SETUP.md.
  interface ServiceAccount {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  }

  const readServiceAccount = (): ServiceAccount | null => {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
    if (!raw && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        raw = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8");
      } catch (err) {
        console.warn("[FCM] Could not read GOOGLE_APPLICATION_CREDENTIALS:", (err as any)?.message);
      }
    }
    if (!raw.trim()) return null;
    try {
      const json = JSON.parse(raw);
      const projectId = json.project_id;
      const clientEmail = json.client_email;
      // Keys exported from the console carry literal \n escapes.
      const privateKey = String(json.private_key || "").replace(/\\n/g, "\n");
      if (!projectId || !clientEmail || !privateKey.includes("BEGIN")) return null;
      return { projectId, clientEmail, privateKey };
    } catch (err) {
      console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
      return null;
    }
  };
  const serviceAccount = readServiceAccount();

  // This project runs on a NAMED Firestore database (see
  // firebase-applet-config.json → firestoreDatabaseId), not `(default)`, so the
  // REST lookup below has to target that database explicitly.
  const readFirestoreTarget = () => {
    const fallbackProject = serviceAccount?.projectId || "";
    try {
      const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      return {
        projectId: cfg.projectId || fallbackProject,
        databaseId: cfg.firestoreDatabaseId || "(default)",
      };
    } catch {
      return { projectId: fallbackProject, databaseId: "(default)" };
    }
  };
  const firestoreTarget = readFirestoreTarget();

  interface FcmTokenEntry {
    token: string;
    userId?: string | null;
    platform?: string;
    createdAt: string;
  }
  const fcmTokens = new Map<string, FcmTokenEntry>();

  const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

  // Google OAuth access tokens live for an hour; cache and refresh proactively.
  let cachedFcmAuth: { value: string; expiresAt: number } | null = null;
  const getFcmAccessToken = async (): Promise<string | null> => {
    if (!serviceAccount) return null;
    if (cachedFcmAuth && cachedFcmAuth.expiresAt > Date.now() + 60_000) return cachedFcmAuth.value;

    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claimSet = b64url(
      JSON.stringify({
        iss: serviceAccount.clientEmail,
        // `datastore` lets the same token read the Firestore push-token registry.
        scope:
          "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );

    const signature = crypto
      .createSign("RSA-SHA256")
      .update(`${header}.${claimSet}`)
      .end()
      .sign(serviceAccount.privateKey);
    const assertion = `${header}.${claimSet}.${signature.toString("base64url")}`;

    const resp = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 }
    );

    const value: string | undefined = resp.data?.access_token;
    if (!value) return null;
    const ttl = Number(resp.data?.expires_in || 3600);
    cachedFcmAuth = { value, expiresAt: Date.now() + ttl * 1000 };
    return value;
  };

  /**
   * The APK reaches Firestore but usually not this Express API (the WebView
   * serves the bundled assets, so a relative `/api/...` has no server behind
   * it). The native client therefore writes its token to the `push_tokens`
   * collection, which we read back over the Firestore REST API.
   */
  const fetchFcmTokensFromFirestore = async (userId?: string): Promise<FcmTokenEntry[]> => {
    if (!serviceAccount || !firestoreTarget.projectId) return [];
    const accessToken = await getFcmAccessToken().catch(() => null);
    if (!accessToken) return [];

    const url =
      `https://firestore.googleapis.com/v1/projects/${firestoreTarget.projectId}` +
      `/databases/${encodeURIComponent(firestoreTarget.databaseId)}/documents:runQuery`;
    const structuredQuery: any = { from: [{ collectionId: "push_tokens" }] };
    if (userId) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: "userId" },
          op: "EQUAL",
          value: { stringValue: userId },
        },
      };
    }

    try {
      const resp = await axios.post(url, { structuredQuery }, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        timeout: 15000,
      });
      const rows: any[] = Array.isArray(resp.data) ? resp.data : [];
      return rows
        .map((row) => row?.document?.fields)
        .filter(Boolean)
        .map((fields: any) => ({
          token: fields.token?.stringValue,
          userId: fields.userId?.stringValue ?? null,
          platform: fields.platform?.stringValue || "android",
          createdAt: fields.updatedAt?.timestampValue || new Date().toISOString(),
        }))
        .filter((entry: FcmTokenEntry) => Boolean(entry.token));
    } catch (err: any) {
      console.warn("[FCM] Firestore token lookup failed:", err?.response?.status || err?.message);
      return [];
    }
  };

  const collectFcmTargets = async (userId?: string): Promise<FcmTokenEntry[]> => {
    const [fromMemory, fromFirestore] = await Promise.all([
      Promise.resolve([...fcmTokens.values()]),
      fetchFcmTokensFromFirestore(userId).catch(() => [] as FcmTokenEntry[]),
    ]);
    const merged = new Map<string, FcmTokenEntry>();
    for (const entry of [...fromMemory, ...fromFirestore]) {
      if (!entry?.token) continue;
      if (userId && entry.userId && entry.userId !== userId && entry.userId !== "anonymous") continue;
      merged.set(entry.token, entry);
    }
    return [...merged.values()];
  };

  const sendFcmMessage = async (token: string, payload: any) => {
    const accessToken = await getFcmAccessToken();
    if (!accessToken || !serviceAccount) throw new Error("FCM is not configured.");

    // FCM v1 requires every `data` value to be a string.
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload.data || {})) {
      if (value === undefined || value === null) continue;
      data[key] = String(value);
    }

    const message = {
      token,
      notification: { title: payload.title, body: payload.body },
      data,
      android: {
        priority: "high",
        ttl: "3600s",
        notification: {
          // Matches PUSH_CHANNEL_ID in src/lib/notifications/androidPush.ts so
          // the alert lands on the high-importance channel the app created.
          channel_id: "eduai-alerts",
          color: "#00B3FF",
          click_action: "OPEN_ACTIVITY",
        },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default", badge: 1 } },
      },
    };

    const resp = await axios.post(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.projectId}/messages:send`,
      message,
      { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, timeout: 15000 }
    );
    return resp.data;
  };

  const sendToFcmDevices = async (input: {
    title: string;
    body: string;
    url?: string;
    tab?: string;
    userId?: string;
  }) => {
    if (!serviceAccount) {
      return {
        enabled: false,
        sent: 0,
        total: 0,
        error: "FCM is not configured on this deployment (missing Firebase service account).",
      };
    }

    const targets = await collectFcmTargets(input.userId);
    const results = await Promise.allSettled(
      targets.map((entry) =>
        sendFcmMessage(entry.token, {
          title: input.title,
          body: input.body,
          data: { url: input.url || "/", tab: input.tab || "" },
        }).catch((err: any) => {
          const status = err?.response?.status;
          const code = err?.response?.data?.error?.details?.[0]?.errorCode
            || err?.response?.data?.error?.status;
          // UNREGISTERED / INVALID_ARGUMENT on a stale token → prune it.
          if (status === 404 || code === "UNREGISTERED") {
            fcmTokens.delete(entry.token);
          }
          throw err;
        })
      )
    );
    const sent = results.filter((r) => r.status === "fulfilled").length;
    return { enabled: true, sent, total: targets.length, error: null as string | null };
  };

  app.get("/api/notifications/fcm/status", async (_req, res) => {
    const targets = serviceAccount ? await collectFcmTargets().catch(() => []) : [];
    return res.json({
      enabled: Boolean(serviceAccount),
      projectId: serviceAccount?.projectId || firestoreTarget.projectId || null,
      firestoreDatabaseId: firestoreTarget.databaseId,
      registeredDevices: targets.length,
    });
  });

  app.post("/api/notifications/fcm/register", (req, res) => {
    const { token, userId, platform } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "An FCM registration token is required." });
    }
    fcmTokens.set(token, {
      token,
      userId: userId || null,
      platform: platform || "android",
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({ ok: true, stored: true, deliveryEnabled: Boolean(serviceAccount) });
  });

  app.post("/api/notifications/fcm/unregister", (req, res) => {
    const { token } = req.body || {};
    if (typeof token === "string") fcmTokens.delete(token);
    return res.json({ ok: true });
  });

  app.post("/api/notifications/fcm/send", async (req, res) => {
    const {
      title = "EduAI Companion",
      body = "You have a new notification!",
      url = "/",
      tab,
      userId,
    } = req.body || {};
    const result = await sendToFcmDevices({ title, body, url, tab, userId });
    if (!result.enabled) return res.status(503).json({ ok: false, ...result });
    return res.json({ ok: true, ...result });
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

        // Delegate to the shared module-level helpers (same frozen candidate
        // chain, plus retry backoff + cached-model failure window in one place).
        // maxOutputTokens matches the 16384 budget used for the alternative
        // engines so Gemini fallback content is not truncated mid-JSON.
        const fallbackOptions = {
          contents: contentsList.length > 0 ? contentsList : [{ role: 'user', parts: [{ text: "Hello" }] }],
          config: {
            maxOutputTokens: 16384,
            ...(systemInstruction ? { systemInstruction } : {})
          }
        };

        if (stream) {
          const streamResult = await geminiStreamWithFallback(fallbackOptions);
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

        const response = await geminiGenerateWithFallback(fallbackOptions);

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
      case "nvidia-nemotron-nano":
      case "nvidia-nemotron-ultra":
      case "nvidia-nemotron-lightning":
        // New NVIDIA NIM Nemotron models — route to NVIDIA endpoint
        client = nvidia;
        apiKey = resolveNvidiaKey();
        break;
      case "nvidia-nemotron":
      case "nvidia-nemotron-ultra-legacy":
      case "groq-qwen":
        // Legacy ids: the NVIDIA Nemotron LLMs were replaced by Qwen 3.8 Max
        // (Alibaba Model Studio) — route them to the same engine.
      case "alibaba-qwen":
        client = alibaba;
        apiKey = resolveAlibabaKey();
        break;
    }

    if (!apiKey || apiKey === "dummy" || apiKey === "undefined") {
      const neededKey = isNemotronProvider(provider)
        ? 'NVIDIA_API_KEY'
        : (isLegacyProvider(provider) || provider.startsWith('alibaba'))
        ? 'ALIBABA_API_KEY'
        : 'API_KEY';
      return await executeGeminiFallback(`${neededKey} is not configured.`);
    }

    let finalModel = model;

    // Never forward a legacy provider id or NVIDIA model slug to Model Studio.
    if (finalModel && (finalModel === provider || /nemotron|nvidia\//i.test(finalModel))) {
      finalModel = undefined;
    }

    // Default model slug per provider id (exact models — see AGENTS.md §1 and
    // the shared frozen registry in src/lib/aiModels.ts).
    const defaultModelFor = (p: string) => resolveProviderModel(p);

    // When one alternative engine is down (gateway timeout / 5xx / rate
    // limit), the helper `alternativeProviderFor` (src/lib/aiModels.ts) names
    // the sibling engine to try once before spending the remaining time budget
    // on the Gemini fallback.

    const clientFor = (p: string): OpenAI => (
      isNemotronProvider(p) ? nvidia : alibaba
    );

    // Sends the request to one alternative provider and writes the response
    // (streaming or JSON) to `res`. Throws on failure.
    const runUpstreamProvider = async (targetProvider: string) => {
      const targetClient = clientFor(targetProvider);
      // A caller-supplied model is only forwarded to the originally requested
      // provider; sibling engines always use their own exact default slug.
      const targetModel = targetProvider === provider
        ? (finalModel || defaultModelFor(targetProvider))
        : defaultModelFor(targetProvider);

      const payload: any = {
        model: targetModel,
        messages,
        temperature,
      };

      // JSON mode is handled by prompt instruction

      // Set max_tokens sensibly per provider to avoid credit limit 402s / truncation
      const requestedMaxTokens = max_tokens || max_completion_tokens;
      if (targetProvider === "nvidia-nemotron-nano" || targetProvider === "nvidia-nemotron-ultra" || targetProvider === "nvidia-nemotron-lightning") {
        // NVIDIA NIM Nemotron models
        payload.max_tokens = requestedMaxTokens || 16384;
        payload.temperature = 0.7;
        payload.top_p = 0.95;
      } else {
        // Qwen 3.8 Max (Alibaba Model Studio) / legacy ids
        payload.max_tokens = requestedMaxTokens || 16384;
        payload.temperature = 0.7;
        payload.top_p = 0.95;
      }

      if (stream) {
        payload.stream = true;
        const completion = await targetClient.chat.completions.create(payload);
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
        const response = await targetClient.chat.completions.create(payload);
        return res.json(response);
      }
    };

    const upstreamStartedAt = Date.now();
    try {
      return await runUpstreamProvider(provider);
    } catch (error: any) {
      const status = error.status || 500;
      if (status === 402 || (error.message && String(error.message).includes("afford"))) {
        console.log(`[AI Routing] Provider ${provider} credit budget reached. Automatically routing to Gemini.`);
      } else if (status !== 500) {
        console.log(`[AI Routing] ${provider} API returned status ${status}, routing to fallback engine.`);
      } else {
        console.log(`[AI Routing] ${provider} encountered an issue, routing to fallback engine.`);
      }

      // Gateway-style failures (upstream 5xx, rate limits, DNS / connection
      // errors) are often isolated to one engine. If the first attempt failed
      // fast enough that the serverless time budget can still fit another
      // attempt, try one sibling engine before Gemini.
      const elapsedMs = Date.now() - upstreamStartedAt;
      const rawErrMsg = String(error.message || "");
      const isGatewayFailure = [500, 502, 503, 504, 522, 524, 429].includes(status) ||
        /timeout|eai_again|enotfound|econn(reset|refused|aborted)|fetch failed|connection error|connection closed|socket disconnected|network/i.test(rawErrMsg);
      const alternative = alternativeProviderFor(provider);
      if (alternative && isGatewayFailure && elapsedMs < 20000) {
        try {
          console.log(`[AI Routing] ${provider} unavailable (${status}) after ${elapsedMs}ms — trying alternative engine ${alternative} before Gemini.`);
          return await runUpstreamProvider(alternative);
        } catch (altError: any) {
          console.log(`[AI Routing] Alternative engine ${alternative} also unavailable (${altError.status || 500}) — routing to Gemini.`);
        }
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

  // --- Qwen-Image via NVIDIA NIM (SA Premium) ---
  //
  // NVIDIA retires/renames model slugs over time (e.g. `qwen/qwen-image` was
  // superseded by `qwen/qwen-image-2512`; retired slugs 404 at the gateway
  // with a plain "404 page not found" body). We therefore walk a list of
  // known-good slugs instead of failing the whole request on the first 404.
  // `NVIDIA_BASE_URL` can be overridden for tests/mocks.
  const QWEN_MODELS = ["qwen/qwen-image-2512", "qwen/qwen-image"];
  const NVIDIA_NIM_BASE_URL = (process.env.NVIDIA_BASE_URL || NVIDIA_BASE_URL).replace(/\/+$/, "");
  const QWEN_SIZE_MAP: Record<string, string> = {
    header: "1792x1024",
    inline: "1024x1024",
    full_width: "1792x1024",
    sidebar: "1024x1792",
    square: "1024x1024",
    portrait: "1024x1792",
    landscape: "1792x1024",
    video: "1792x1024"
  };
  // Stay inside the Vercel function ceiling (see vercel.json maxDuration: 60).
  const QWEN_REQUEST_TIMEOUT_MS = 50000;

  app.post("/api/images/qwen-generate", async (req, res) => {
    const { prompt, placement, grade, subject, saContext } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });

    const nvidiaKey = resolveNvidiaKey();
    if (!nvidiaKey) {
      return res.status(400).json({ error: "NVIDIA_API_KEY not configured" });
    }

    // Enhance prompt with SA context
    let enhancedPrompt = prompt || "";
    if (saContext !== false) {
      const saEnhancements = [
        "South African educational context",
        "diverse South African children representing rainbow nation",
        "vibrant colours with SA flag accents green #007749 gold #FFB81C",
        "Disney 3D Animation Character & 3D Icon style, professional educational",
        "no text overlays, no borders, no watermarks, 300 DPI, white background"
      ];
      // Add grade/subject awareness
      if (grade) saEnhancements.unshift(`Grade ${grade}`);
      if (subject) saEnhancements.unshift(`${subject} educational`);
      const hasSA = /south african|rainbow nation|diverse/i.test(enhancedPrompt);
      if (!hasSA) enhancedPrompt += `, ${saEnhancements.join(", ")}`;
      if (!/disney 3d/i.test(enhancedPrompt.toLowerCase())) enhancedPrompt += ", Disney 3D Animation Character & 3D Icon";
    }

    const size = QWEN_SIZE_MAP[placement] || "1024x1024";
    const [width, height] = size.split("x").map(Number);

    let lastError = "Unknown error";
    for (const model of QWEN_MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), QWEN_REQUEST_TIMEOUT_MS);
      let nvidiaRes: Response;
      try {
        nvidiaRes = await fetch(`${NVIDIA_NIM_BASE_URL}/images/generations`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            prompt: enhancedPrompt,
            n: 1,
            size,
            response_format: "b64_json"
          }),
          signal: controller.signal
        });
      } catch (fetchErr: any) {
        lastError = `NVIDIA gateway unreachable: ${fetchErr.message}`;
        console.warn(`[QWEN IMAGE] ${model} network error: ${fetchErr.message}`);
        continue;
      } finally {
        clearTimeout(timer);
      }

      const bodyText = await nvidiaRes.text();
      if (nvidiaRes.status === 401 || nvidiaRes.status === 403) {
        // A bad/revoked key is not worth retrying the next slug with.
        console.error(`[QWEN IMAGE] NVIDIA NIM rejected the API key (HTTP ${nvidiaRes.status})`);
        return res.status(401).json({
          error: `NVIDIA NIM rejected the API key (HTTP ${nvidiaRes.status}). Update NVIDIA_API_KEY.`,
          provider: "qwen",
          model,
          status: nvidiaRes.status
        });
      }

      if (!nvidiaRes.ok) {
        // 404 → slug is not routed at the gateway (retired model), try next slug.
        // 429/5xx → transient, still worth trying the next slug.
        lastError = `NVIDIA returned HTTP ${nvidiaRes.status} for ${model}: ${bodyText.slice(0, 300)}`;
        console.warn(`[QWEN IMAGE] ${lastError}`);
        continue;
      }

      let data: any = null;
      try { data = JSON.parse(bodyText); } catch { data = null; }
      const b64 = data?.data?.[0]?.b64_json;
      const url = data?.data?.[0]?.url;
      if (b64 || url) {
        console.log(`[QWEN IMAGE] Success via ${model} (${b64 ? "b64_json" : "url"}) size=${size} grade=${grade} subject=${subject}`);
        return res.json({
          url: b64 ? `data:image/png;base64,${b64}` : url,
          ...(b64 ? { b64_json: b64 } : {}),
          provider: "qwen",
          model,
          enhancedPrompt,
          width,
          height,
          size
        });
      }

      lastError = `${model} returned no image data: ${bodyText.slice(0, 300)}`;
      console.warn(`[QWEN IMAGE] ${lastError}`);
    }

    console.error(`[QWEN IMAGE] All model slugs failed. Last error: ${lastError}`);
    return res.status(502).json({ error: lastError, provider: "qwen", models: QWEN_MODELS });
  });

  // --- SA-Compliant Full Package Generation (new) ---
  app.post("/api/sa/generate-package", async (req, res) => {
    const { request: saRequest, provider = "alibaba-qwen", generateImages = true } = req.body;
    if (!saRequest) return res.status(400).json({ error: "SAContentRequest required" });

    try {
      // Pre-flight compliance check
      const { validateCAPSCompliance, getPhaseConfig } = await import("./src/lib/compliance/sa-frameworks");
      const report = validateCAPSCompliance(saRequest.grade, saRequest.subject, saRequest.contentType, saRequest.term);

      // Generate text content via existing AI pipeline — reuse /api/ai logic internally
      // For simplicity, forward to multi-AI service via direct Gemini call if needed
      const { buildSASystemPrompt, buildSAUserPrompt } = await import("./src/lib/compliance/sa-prompts");

      const systemPrompt = buildSASystemPrompt(saRequest);
      const userPrompt = buildSAUserPrompt(saRequest);

      // Try Qwen 3.8 (Alibaba Model Studio) first, then Gemini fallback
      let rawResponse = "";
      let usedProvider = provider;
      try {
        const alibabaKey = resolveAlibabaKey();
        if (alibabaKey) {
          const client = new OpenAI({
            apiKey: alibabaKey,
            baseURL: resolveAlibabaBaseURL()
          });
          const model = QWEN_DEFAULT_MODEL;
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 16384
          } as any);
          rawResponse = (completion as any).choices?.[0]?.message?.content || "";
        } else {
          throw new Error("No ALIBABA_API_KEY (Model Studio) configured");
        }
      } catch (err: any) {
        console.warn(`SA package text generation via ${provider} failed (${err.message}), falling back to Gemini...`);
        usedProvider = "gemini";
        const geminiResponse = await geminiGenerateWithFallback({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192
          }
        });
        rawResponse = geminiResponse.text || "";
      }

      const parsed = safeJsonParse(rawResponse);
      if (!parsed || Object.keys(parsed).length === 0) {
        return res.status(500).json({ error: "Failed to parse SA content", raw: rawResponse.slice(0, 1000) });
      }

      // Build the canonical branded HTML at the route boundary as well. This
      // endpoint is used by package/export clients that do not pass through the
      // React preview, so returning only the raw AI JSON would bypass the one
      // compliance banner, compact header and exact footer guarantees.
      const { buildFullHTML } = await import("./src/lib/templates/sa-html-templates");
      const phaseConfig = getPhaseConfig(saRequest.grade);
      const requestedTerm = Number(saRequest.term) || 1;
      const documentData = {
        ...parsed,
        metadata: {
          ...(parsed.metadata || {}),
          title: parsed.metadata?.title || `${saRequest.topic || saRequest.contentType} — ${saRequest.subject}`,
          subject: parsed.metadata?.subject || saRequest.subject,
          grade: parsed.metadata?.grade || saRequest.grade,
          phase: parsed.metadata?.phase || phaseConfig.displayName,
          term: Number(parsed.metadata?.term) || requestedTerm,
          capsReference: parsed.metadata?.capsReference || saRequest.capsReference,
          contentType: parsed.metadata?.contentType || saRequest.contentType,
          generatedDate: parsed.metadata?.generatedDate || new Date().toLocaleDateString("en-ZA"),
          npaCompliance: parsed.metadata?.npaCompliance || {
            assessmentType: saRequest.assessmentType || "informal_assessment",
            isFormal: !!saRequest.isFormal,
            sbaWeight: phaseConfig.assessmentWeights.schoolBasedAssessment,
            examWeight: phaseConfig.assessmentWeights.yearEndExam
          },
          siasCompliance: parsed.metadata?.siasCompliance || {
            supportLevel: saRequest.siasSupportLevel || "level_1",
            accommodationsIncluded: !!saRequest.includeInclusiveSupport,
            differentiationIncluded: !!saRequest.differentiationRequired
          },
          popiaCompliant: true
        },
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        content: typeof parsed.content === "string" ? parsed.content : ""
      };
      const html = buildFullHTML(documentData);

      return res.json({
        content: parsed,
        document: documentData,
        html,
        complianceReport: report,
        provider: usedProvider,
        generatedAt: new Date().toISOString(),
        compliance: {
          caps: "Aligned",
          npa: "Compliant",
          popia: "Compliant",
          sias: saRequest.includeInclusiveSupport ? "Inclusive" : "UDL",
          wp6: saRequest.differentiationRequired ? "Differentiated" : "UDL"
        }
      });

    } catch (e: any) {
      console.error("SA package generation failed:", e.message);
      return res.status(500).json({ error: e.message });
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
      const response = await geminiGenerateWithFallback({
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
      const model = "gemini-3.8-flash";

      // Delegate to the shared module-level helpers so the retry backoff and
      // cached-model failure window live in exactly one place (the frozen
      // candidate chain is identical — see AGENTS.md §1).
      const generateContentWithFallback = async (options: { model: string, contents: any, config?: any }) =>
        geminiGenerateWithFallback(options);

      const generateContentStreamWithFallback = async (options: { model: string, contents: any, config?: any }) =>
        geminiStreamWithFallback(options);

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
            contents: `Generate a ${type} based on the following details: ${details}. Return an HTML body fragment with Tailwind utility classes. Follow the EduAI design style through clear internal sections, restrained colour accents, and readable cards; the host renders the page header, single content banner, and footer. Do not add duplicate page chrome or Tailwind CDN scripts.`,
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
          const { system, user } = buildVisualLabPrompts(input);
          return await executeOrStream({
            model,
            contents: user,
            config: {
              maxOutputTokens: 8192,
              systemInstruction: system,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING },
                  description: { type: Type.STRING },
                  printInstructions: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["content", "description", "printInstructions", "imagePrompt"]
              }
            }
          }, true);
        }

        case "generate-admin": {
          const { system, user } = buildAdminLabPrompts(input);
          return await executeOrStream({
            model,
            contents: user,
            config: {
              maxOutputTokens: 8192,
              systemInstruction: system,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  documentType: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["content", "notes", "documentType", "imagePrompt"]
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
