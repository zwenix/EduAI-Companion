# Custom Workspace Instructions (AGENTS.md)

This file contains strict project-level constraints and instructions that MUST be loaded and respected by any AI Agent or Coding Assistant working on this workspace. Do NOT modify, delete, or override these rules without explicit user instructions.

---

## 🚀 1. STRICT MODEL SELECTION & NO AUTO-MAPPING (CRITICAL)

Under no circumstances is any agent permitted to map the user's selected models to alternative models or fallbacks. The requested models exist, are official, and must be called directly and exactly as specified below:

### Groq Model Mappings & Identifiers
* **`groq-gpt-oss`**: This provider MUST map directly and exclusively to the model identifier:
  `openai/gpt-oss-120b`
  * *DO NOT map this to `llama-3.3-70b-versatile` or any other model.*
* **`groq-qwen`**: This provider MUST map directly and exclusively to the model identifier:
  `qwen/qwen3.6-27b`
  * *DO NOT map this to `qwen-2.5-coder-32b` or any other model.*

### Application Files Governing Models:
* **`server.ts`**: The API proxy handling `/api/ai/:provider` must resolve `groq-gpt-oss` as `openai/gpt-oss-120b` and `groq-qwen` as `qwen/qwen3.6-27b` without intermediate translation or fallback.
* **`src/services/multiAiService.ts`**: The frontend service calling chat completions must use these exact model strings when constructing payload queries.
* **`src/services/unifiedAiService.ts`**: The unified engine must dispatch OCR grading and fallback logic to these exact model strings.

---

## 🎨 2. STYLING & LAYOUT INTEGRITY FOR GENERATED CONTENT

The generated materials (such as CAPS Lesson Plans, Worksheets, and Interactive Materials) must maintain an impeccable level of design, structure, and visual detail.

* **HTML Structure & Output Quality**:
  * Generated content must adhere to the high-contrast, premium, responsive layouts.
  * Every lesson plan must be fully realized with extensive step-by-step teacher instructions, classroom spoken scripts, inclusive learning adaptations, diagnostic worksheets, answer keys, and marked rubrics.
  * Never summarize or truncate sections into generic placeholders or rudimentary notes.
* **Smart Parsing**:
  * Use the robust HTML tag-closing parser (`closeOpenHtmlTags` helper in both `server.ts` and `src/services/geminiService.ts`) to repair any output cutoff due to API token limits without crashing the page layout.

---

## 🔒 3. PROTECTION OF BUILT-IN PROMPTS

* The prompt engineering templates located in the project (e.g., in `src/lib/prompt-engine.ts`, `src/services/unifiedAiService.ts`, etc.) contain meticulous, reverse-engineered CAPS instruction layouts.
* **DO NOT** alter the semantic structure of these prompts or compress them in a way that degrades content richness.
* If optimization is needed (e.g., token limit boundaries), use the `compressWhitespace` strategy to preserve 100% of the prompts' instructions.
