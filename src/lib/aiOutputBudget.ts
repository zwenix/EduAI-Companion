/**
 * EduAI Companion — shared AI output-token budgets.
 *
 * The content engines (Gemini / Nemotron / Qwen) all answer with one JSON
 * envelope that carries the whole document (`content`, `memo`, `rubric`,
 * `assessmentCriteria`, …). When the budget is too small the JSON is cut off
 * mid-string, the client has to reconstruct it with a regex fallback and the
 * app logs "Reconstructed truncated JSON response successfully via fallback
 * regex extraction!".
 *
 * 16384 is the budget the alternative engines already use in `/api/ai`
 * (`server.ts`), so the Gemini engines now use exactly the same number — one
 * request produces the same amount of material no matter which engine
 * answered, and the continuation pass in
 * `src/services/geminiService.ts` is only needed for genuinely long
 * documents.
 */

/** Default budget for short answers (chat, grading, reports). */
export const GEMINI_DEFAULT_OUTPUT_TOKENS = 8192;

/** Budget for the long-form content actions (lesson plans, worksheets, …). */
export const GEMINI_CONTENT_OUTPUT_TOKENS = 16384;
