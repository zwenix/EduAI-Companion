/**
 * EduAI-Companion — Two-Model NVIDIA NIM Routing Architecture
 *
 * A server-side-only service that splits the workload across two specialized
 * free NIM endpoints to survive classroom bursts (5+ concurrent users) without
 * hitting the ~40 RPM single-model free-tier cap:
 *
 *   TIER 1 — NVIDIA NIM (primary):
 *     • Text / Reasoning / JSON   → nvidia/nemotron-3.5-lightning-30b-a3b
 *       (or nemotron-3-ultra for heavier reasoning)
 *     • Vision / multimodal input → nvidia/nemotron-3.5-super-vl-120b-a12b
 *
 *   TIER 2 — OpenRouter fallback (free-tier models) on NIM failure/429.
 *   TIER 3 — Gemini safety net.
 *
 * Structured JSON is enforced via a strict `json_schema` `response_format` on
 * NIM/OpenRouter and a `responseSchema` on Gemini, then re-validated locally
 * with Zod — so malformed quiz/flashcard arrays never reach the frontend.
 *
 * ⚠ SERVER-SIDE ONLY. This module reads `process.env` API keys directly and
 *   must NEVER be imported by a client component (it would leak keys into the
 *   browser bundle and hit CORS on NVIDIA NIM). Wire it through an Express
 *   route in `server.ts`.
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const StudySetSchema = z.object({
  topic: z.string(),
  gradeLevel: z.string(),
  stepByStepExplanation: z
    .string()
    .describe("Clear K-12 explanation using $LaTeX$ for math."),
  flashcards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3),
      hint: z.string(),
    })
  ),
});

export type StudySet = z.infer<typeof StudySetSchema>;

const STUDY_SET_JSON_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    gradeLevel: { type: "string" },
    stepByStepExplanation: { type: "string" },
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          hint: { type: "string" },
        },
        required: ["question", "options", "correctIndex", "hint"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "topic",
    "gradeLevel",
    "stepByStepExplanation",
    "flashcards",
    "quiz",
  ],
  additionalProperties: false,
};

/**
 * NVIDIA NIM OpenAI-compatible endpoint. The script's `https://nvidia.com` is
 * the marketing site — the real chat-completions gateway is
 * `integrate.api.nvidia.com/v1`.
 */
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
/** OpenRouter's OpenAI-compatible path (the SDK appends /chat/completions). */
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/** Text/reasoning engine — Lightning is fast and JSON-trained; Ultra for depth. */
const NIM_TEXT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
/** Vision/multimodal engine for uploaded homework images and worksheets. */
const NIM_VISION_MODEL = "nvidia/nemotron-3.5-super-vl-120b-a12b";

const nvidiaClient = new OpenAI({
  baseURL: NVIDIA_BASE_URL,
  apiKey: process.env.NVIDIA_API_KEY,
});

const openRouterClient = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://eduai-companion.app",
    "X-Title": "EduAI-Companion",
  },
});

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GenerateStudyInput {
  prompt: string;
  gradeLevel?: string;
  imageBase64?: string;
  enableReasoning?: boolean;
}

export async function generateEduContent(
  input: GenerateStudyInput
): Promise<StudySet> {
  const hasImage = Boolean(input.imageBase64);
  const systemPrompt = `You are EduAI-Companion, a supportive K-12 tutor (${
    input.gradeLevel ?? "General K-12"
  }). Break concepts down clearly, wrap math expressions in $...$ or $$...$$ LaTeX, and strictly return valid JSON matching the schema.`;

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: input.prompt },
  ];

  if (input.imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: input.imageBase64 },
    });
  }

  // TIER 1: NVIDIA NIM (Vision -> Super VL, Text -> Lightning)
  const nimModel = hasImage ? NIM_VISION_MODEL : NIM_TEXT_MODEL;

  try {
    const response = await nvidiaClient.chat.completions.create({
      model: nimModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "k12_study_set",
          strict: true,
          schema: STUDY_SET_JSON_SCHEMA,
        },
      },
      ...(input.enableReasoning !== undefined && {
        extra_body: {
          chat_template_kwargs: { enable_thinking: input.enableReasoning },
        },
      }),
    } as any);

    const raw = response.choices[0]?.message?.content ?? "{}";
    return StudySetSchema.parse(JSON.parse(raw));
  } catch (nimError: any) {
    console.warn(
      `[EduAI] NIM (${nimModel}) failed (${
        nimError?.status ?? nimError.message
      }), falling back to OpenRouter...`
    );
  }

  // TIER 2: OpenRouter Fallback
  try {
    const orResponse = await openRouterClient.chat.completions.create({
      model: hasImage
        ? "qwen/qwen3-vl-32b-instruct:free"
        : "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "k12_study_set",
          strict: true,
          schema: STUDY_SET_JSON_SCHEMA,
        },
      },
    });

    const raw = orResponse.choices[0]?.message?.content ?? "{}";
    return StudySetSchema.parse(JSON.parse(raw));
  } catch (orError: any) {
    console.warn(
      `[EduAI] OpenRouter failed (${
        orError?.status ?? orError.message
      }), falling back to Gemini...`
    );
  }

  // TIER 3: Gemini 2.5 Flash Safety Net
  const geminiParts: any[] = [
    { text: `${systemPrompt}\n\nStudent Request: ${input.prompt}` },
  ];
  if (input.imageBase64) {
    const [meta, data] = input.imageBase64.split(",");
    const mimeType = meta?.match(/:(.*?);/)?.[1] || "image/jpeg";
    geminiParts.push({ inlineData: { mimeType, data } });
  }

  const geminiRes = await geminiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: geminiParts,
    config: {
      responseMimeType: "application/json",
      responseSchema: STUDY_SET_JSON_SCHEMA as any,
      temperature: 0.3,
    },
  });

  return StudySetSchema.parse(JSON.parse(geminiRes.text ?? "{}"));
}
