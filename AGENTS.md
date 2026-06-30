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

---

## 📖 4. COMPREHENSIVE CONTENT GENERATION ENGINE CONFIGURATIONS

The following sections define the explicit guidelines, prompt configurations, and layouts for all non-video content types supported by this application.

### 4.1 CAPS Lesson Plans & Unit Plans
* **Target Audience**: Teachers and educators. Must be structured as a detailed instructional guide.
* **Core Layout Structure**:
  1. **Visual Header**: Full-width gradient banner color-coded to the learning area/subject.
  2. **Lesson Metadata**: Subject, Grade, Term, Week, Topic, Date, and Duration explicitly stated.
  3. **Aims & Bloom's Objectives**: 3-5 measurable cognitive learning aims (Know, Apply, Analyze, Evaluate).
  4. **Prior Knowledge**: Concrete strategies to hook attention and bridge concepts.
  5. **Resources**: Bulleted breakdowns of teacher materials and learner resources.
  6. **Core Concepts & CAPS References**: Thorough explanations with local South African context (names, Rand currency, local provinces, indigenous plants/animals).
  7. **Step-by-Step Lesson Procedure**: Detailed phase transitions:
     * *Introduction / Hook* (10-15 min)
     * *Direct Teaching Input* (20-30 min)
     * *Guided Practice / Active Learning* (15-20 min)
     * *Independent Practice / Homework* (10-15 min)
     * *Consolidation & Closure* (5-10 min)
  8. **Assessment & Diagnostic Strategy**: Standard informal checklists and structured formative check-points.
  9. **Differentiated Accommodations**: Explicit instructions for struggling learners (scaffolding), advanced learners (extension tasks), and learners with specialized physical/cognitive barriers.
  10. **Values & Life Skills integration**.
  11. **Appended Learner Worksheet**: Added *only* if requested by the user, appended cleanly at the bottom.

### 4.2 Diagnostic & Print-Ready Worksheets
* **Visual Standards**:
  * **Header Badge**: A prominent box containing `"NAME: ______________ DATE: ______________"` styled with dotted fields.
  * **Score Cards**: A distinct, highlighted capsule block styled with a thick yellow/amber border indicating `"SCORE: ________ / [MARKS] Marks"` placed in the top or bottom right.
  * **Primary Grades (R-3)**: Ultra-large text (`text-2xl` or `text-3xl`), double spacing, and thick-dotted tracer blocks for trace-and-copy handwriting exercises.
  * **Option Containers**: Avoid circular pill bounds (`rounded-full`) for wrapped lines to prevent border clipping. Use robust containers with `rounded-2xl` padding instead.
  * **Visual Elements**: Bold question numbers styled as numbered circles, responsive options styled as tap-friendly boxes, and plenty of visual breathing room.

### 4.3 Study Guides & Learning Notes
* **Target Audience**: Learners revising key curricular concepts.
* **Visual Standards**:
  * Clean, multi-column layouts using bento grids to compartmentalize ideas.
  * **Aesthetic Accents**: Highlighted formula panels, key vocabulary callouts, and margin spaces for learner notes.
  * **Critical Thinking**: "Think Deeper" badges and visual lightbulb callout blocks designed with deep text contrast to spark intellectual curiosity.

### 4.4 Formal Assessments & Rubrics
* **Tests & Quizzes**:
  * Structured exam-style formatting with clear mark allocations per sub-question (e.g., `[5 Marks]` aligned to the right-hand margin).
  * **Diagnostic Answer Key (Memo)**: A complete, fully calculated step-by-step marking guidelines section matching the exam structure exactly.
* **Rubrics**:
  * Perfectly aligned HTML grid tables mapping core Criteria (vertical axes) against Performance Levels 1 to 4 or 1 to 7 (horizontal axes) with exhaustive performance descriptors in each grid cell. No empty placeholders!

### 4.5 Visual Posters & Infographics
* **Strict Restriction**: **NO assessment tasks, fill-in-the-blanks, or test questions allowed.** These are visual-only teaching tools.
* **Visual Standards**:
  * **Hero Illustration**: A dedicated center-stage container depicting the core topic in a clean, semi-realistic children's non-fiction digital book design.
  * **Typography**: Highly scannable display fonts, punchy headers with appropriate leading, short action-oriented bullet lists, and context-specific emojis. No long, dense paragraphs of prose.

### 4.6 Report Comments, Curriculum Maps, & Progress Trackers
* **Report Comments**: Generates supportive, constructive individual learner evaluations detailing strengths, identified areas for remedial support, and action-oriented improvement strategies in standard CAPS terminology.
* **Curriculum Maps**: Grid-based sequencing planners detailing topic timelines, ATP alignments, and progression pacing across terms 1 to 4.
* **Progress Trackers**: Clean progress dashboard components that visualize performance metrics, completion rates, and formative milestone tracking.

---

## 📹 5. VIDEO GENERATION ENGINE (OMNIHUMAN-1 PRESERVATION MANDATE)

> [!CAUTION]
> **Video Content Generation is currently highly sensitive.** Do NOT alter, refactor, or attempt to replace the current Video Generation pipelines. The current OmniHuman-1 engine is the ONLY verified working solution that bypasses failing API systems.

### 5.1 Gradio Streaming Integration
* **OmniHuman-1 core mechanism**: Connects client-side directly to the free Hugging Face space `multimodalart/self-forcing` using the `@gradio/client` Node module.
* **Backend Endpoint (`/api/video/generate`)**:
  * Accepts `prompt`, `model`, `seed`, and `fps`.
  * If `model` is `omnihuman-1`, initiates a background `runGradioGeneration` job and returns a unique `"omni-" + Date.now()` tracking ID with state `processing`.
  * Integrates a robust 120-second timeout race promise to handle high-latency public Gradio queuing gracefully.
* **Background Process (`runGradioGeneration`)**:
  * Calls `client.predict("/video_generation_handler_streaming", { prompt, seed: -1, fps: 15 })` and monitors the response structure.
  * Correctly resolves nested response payloads, checking `result.data[0].video.url`, `result.data[0].url`, or string-match protocols before resolving.
  * **Resilient Fallback Policy**: If Gradio returns a timeout, connection error, or queue rejection, it MUST NOT throw a visible error. Instead, it falls back seamlessly to `matchEducationalVideo(promptText)` which scans local keywords against preset high-quality educational MP4 files and returns them as a successfully resolved video payload. This prevents user frustration and guarantees a perfect user experience under any network condition.

### 5.2 Status Inquiries (`/api/video/status/:id`)
* Continues polling the `omniJobs` map to deliver responsive video generation progress updates to the frontend without blocking server execution loops.
* Retains compatibility with the optional `replicate` video client should the user provide valid Replicate API credentials.
