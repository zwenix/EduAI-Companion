# Custom Workspace Instructions (AGENTS.md)

This file contains strict project-level constraints and instructions that MUST be loaded and respected by any AI Agent or Coding Assistant working on this workspace. Do NOT modify, delete, or override these rules without explicit user instructions.

---

## 🚀 1. STRICT MODEL SELECTION & NO AUTO-MAPPING (CRITICAL)

The five models below are the ONLY models permitted in the app for AI text
content generation, reasoning, OCR-grading and tutor chat. They are FROZEN:
no agent, assistant, service or future change may swap, alias, upgrade,
downgrade, or re-route them to other versions, providers or fallback engines.
Every one of the allowed models must be called directly and exactly as
specified below.

### The ONLY allowed models (FROZEN — do not change)

| App provider id | Model to call (exactly) | Provider / endpoint |
| --- | --- | --- |
| `gemini` | `gemini-3.8-flash` (latest GA; reasoning chain `gemini-3.7-flash` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemini-2.5-flash` only when 3.8 is unavailable) | Google Gemini API |
| `alibaba-qwen` | `qwen3.8-max` | Alibaba Cloud Model Studio (OpenAI-compatible endpoint `https://ws-8ldb9u90tetxcada.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`, key `ALIBABA_API_KEY`) |
| `nvidia-nemotron-nano` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |
| `nvidia-nemotron-ultra` | `nvidia/nemotron-ultra-550b-a55b` (Nemotron 3 Ultra 550B-A55B) | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |
| `nvidia-nemotron-lightning` | `nvidia/nemotron-3.5-lightning-30b-a3b` | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |

### NVIDIA NIM is MANDATORY for every Nemotron model
* ALL Nemotron models MUST use the FREE NVIDIA NIM endpoint
  (`https://integrate.api.nvidia.com/v1`). NEVER route Nemotron through Groq,
  OpenRouter, Alibaba Model Studio, or any other provider or aggregator.
* Never fall back to the same request through Groq or OpenRouter when the
  NVIDIA key is missing — the baked `NVIDIA_API_KEY` (same key the client/APK
  ships, see `src/lib/aiSecrets.ts`) is the intended server fallback.
* The provider switch in `server.ts` (`/api/ai/:provider`) routes the three
  `nvidia-nemotron-*` ids to the NVIDIA NIM client and maps each id to its
  exact model slug above. Do not remove, rename or re-map those cases.

### Gemini rules
* `gemini` is the primary engine and maps to `gemini-3.8-flash` (the current
  latest GA). DO NOT map it to outdated models like `gemini-2.0-flash`,
  `gemini-1.5`, `gemini-2.1`, or older 3.x Flash releases as primary defaults.
  EVER.

### Legacy ids (internal aliases only — not models)
* `nvidia-nemotron` (old Llama-based Nemotron 49B) and `groq-qwen` /
  `nvidia-nemotron-ultra-legacy` are retired ids kept ONLY so stale saved
  settings keep working. They must resolve to the Qwen 3.8 Max engine
  (`alibaba-qwen`) — never resurrected as their own models.

### Strictly Banned / Removed
* Llama-family models are REMOVED from the app: no Llama model of any version
  or size, and no Groq-hosted model, may appear anywhere in the app code or UI.
* Groq and OpenRouter are banned as model providers for text generation — no
  Groq client, no OpenRouter client, no Groq/OpenRouter key fallback.
* Any other model not listed above (DeepSeek, etc.) is banned from text
  content generation.
* Outdated Gemini defaults (`gemini-2.0-flash`, `gemini-1.5-flash`,
  `gemini-2.1`) MUST NOT be used as primary defaults.
* Image generation (Perchance / Qwen-Image NIM / Google Imagen 3 /
  Pollinations), OCR engines and TTS/voice engines are separate pipelines —
  leave them exactly as configured.

### Application Files Governing Models:
* **`server.ts`**: The API proxy handling `/api/ai/:provider` must resolve
  `gemini` to the Gemini chain above, `alibaba-qwen` to `qwen3.8-max` via Model
  Studio, and the three `nvidia-nemotron-*` ids to their exact NIM model slugs
  via the NVIDIA NIM endpoint. It contains NO Groq or OpenRouter clients.
* **`src/contexts/AiContext.tsx`**: `AIProvider` type and `VALID_PROVIDERS`
  must list exactly `gemini`, `alibaba-qwen`, `nvidia-nemotron-nano`,
  `nvidia-nemotron-ultra`, `nvidia-nemotron-lightning`.
* **`src/App.tsx`**: The AI-engine picker and auto-optimize candidates must
  expose exactly these five providers (Gemini 3.8 Flash, Qwen 3.8 Max, Nemotron
  3 Nano, Nemotron 3 Ultra 550B, Nemotron 3.5 Lightning).
* **`src/services/multiAiService.ts`**: NVIDIA NIM client must call the exact
  Nemotron slugs above on `https://integrate.api.nvidia.com/v1`; Model Studio
  calls must use `qwen3.8-max`.
* **`src/services/geminiClient.ts` / `geminiService.ts` /
  `unifiedAiService.ts`**: Must dispatch OCR grading and fallback logic to
  these exact model strings only.

---

## 🖼️ 2. ASSET PROTECTION — NEVER REPLACE OR OVERWRITE ASSETS (CRITICAL)

The binary assets in their folders are original, carefully-uploaded files that MUST NEVER be replaced, regenerated, overwritten, downscaled, re-encoded, or deleted. Treat them as immutable source-of-truth files.

### Protected Asset Locations
* **`assets/`** — Brand logo (`assets/logo.png`) and any video files (e.g. `assets/splash-screen.mp4`).
* **`public/`** — All public assets, including:
  * `public/icons/**` — the hand-crafted sidebar/tool icons (`screen.png` + `code.html` per icon folder).
  * `public/overlays/**` — page overlay/background images.
  * `public/splash.mp4` and any other media referenced directly by URL.
* **`src/assets/`** — Bundled assets, including:
  * `src/assets/images/**` — dashboard/overlay/screenshot backgrounds.
  * `src/assets/overlays/**` — mirrored overlay images.
  * `src/assets/splash.mp4`, `src/assets/logo.png`.
* **`signing/android-debug.keystore`** — the Android signing keystore used by
  the CI APK builds. Regenerating or replacing it changes the SHA-1 fingerprint
  (`73:BB:00:87:CF:0B:C5:43:B7:60:37:01:03:CE:D3:47:9E:5E:D5:FD`) that Google Sign-In
  depends on and **breaks Android Google Sign-In** for every installed user.
  If a new keystore is ever required, the new SHA-1/SHA-256 MUST be registered
  in Google Cloud Console (see `GOOGLE_SIGNIN_ANDROID_SETUP.md`) and updated in
  `src/config/googleAuth.ts`.

### Strict Rules
* **DO NOT** modify, resize, compress, re-encode, or "optimize" any of the above files.
* **DO NOT** swap them for AI-generated or placeholder alternatives, even if a hosted URL appears broken at runtime — verify the actual repository file first.
* **DO NOT** delete or rename these files or their parent folders.
* If a file appears corrupted, **recover it from git history** (e.g. a previous valid commit) rather than replacing it with a new file. Only if no valid copy exists anywhere in history may the user be asked to re-provide the original.
* When adding a *new* asset, place it in the correct existing folder and never overwrite an existing file of the same name without explicit user approval.

---

## 🎨 3. STYLING & LAYOUT INTEGRITY FOR GENERATED CONTENT

The generated materials (such as CAPS Lesson Plans, Worksheets, and Interactive Materials) must maintain an impeccable level of design, structure, and visual detail.

* **HTML Structure & Output Quality**:
  * Generated content must adhere to the high-contrast, premium, responsive layouts.
  * Every lesson plan must be fully realized with extensive step-by-step teacher instructions, classroom spoken scripts, inclusive learning adaptations, diagnostic worksheets, answer keys, and marked rubrics.
  * Never summarize or truncate sections into generic placeholders or rudimentary notes.
* **Smart Parsing**:
  * Use the robust HTML tag-closing parser (`closeOpenHtmlTags` helper in both `server.ts` and `src/services/geminiService.ts`) to repair any output cutoff due to API token limits without crashing the page layout.

---

## 🚫 3b. UI DESIGN FREEZE — CONTENT BOXES / MENU CARDS (CRITICAL)

The interactive content boxes and menu cards on the sidebar landing pages and
dashboards are **frozen designs**. Do NOT change their styling, layout,
animation behaviour, hover/selection glow, borders, or slideshow mechanics
under any circumstances. This design language was hard-won — regressions here
have burned users repeatedly (flashing borders, dead slideshows, lost hover
glows).

**Protected components & patterns:**

* `src/components/CategoryOverview.tsx`
  * `InteractiveShowcaseCard` — border/shadow/hover glow classes, background
    slideshow crossfade (`AnimatePresence`), slide timings, dark veils.
  * `ContentSlideshow` (in `src/components/ContentSlideshow.tsx`) — hero
    slideshow behaviour, controls, indicator dots.
  * All custom landing branches (Teacher's Toolbox, Intelligent AI, Classes &
    Learners, Analytics & Reports, Message & Collaborate, Alerts & Diary
    Planner, Curriculum & Planning, Help/Support Desk).
* `src/components/TeacherDashboard.tsx` — `ShowcaseCard`,
  `TeachingOuterSlideshow`, the Teaching Command Center box
  (`animate-border-flash-cyan`).
* `src/components/ClassManagement.tsx` — `ClassroomShowcaseCard` (active/hover
  glow states).
* Glow/steady-state CSS in `src/index.css`:
  `.glass-neon-card`, `.hover-neon-*`, `.animate-neon-pulse-*`,
  `.animate-border-flash-*` — these are intentionally **steady** (never
  flashing); they must keep `animation: none !important` and only brighten on
  hover/selection.
* `src/components/PageOverlay.tsx` + `src/lib/overlays.ts` — the page overlay
  must stay a **dark, ambient backdrop** (dimmed artwork, opacity floor 0.25
  for normal blend, `brightness(0.55)` filter). Never restore the old 0.55+
  bright veil.

**What IS allowed on these boxes:**

* Swapping the slide images (background artwork) via the slide-array constants,
  as long as arrays stay module-scope constants and images are pre-warmed
  (`new Image()`) for flash-free crossfades.
* Copy changes (titles/descriptions) that do not alter the visual structure.

**What is NOT allowed:**

* Adding/removing/changing border classes, shadow/glow classes, hover classes,
  `AnimatePresence` configuration, slide intervals, or dark veils.
* Adding flash/pulse/blink animations to any content box or menu card.
* Making the page overlay or landing backgrounds brighter than their current
  dimmed state.

---

## 🔒 4. PROTECTION OF BUILT-IN PROMPTS

* The prompt engineering templates located in the project (e.g., in `src/lib/prompt-engine.ts`, `src/services/unifiedAiService.ts`, etc.) contain meticulous, reverse-engineered CAPS instruction layouts.
* **DO NOT** alter the semantic structure of these prompts or compress them in a way that degrades content richness.
* If optimization is needed (e.g., token limit boundaries), use the `compressWhitespace` strategy to preserve 100% of the prompts' instructions.

---

## 📖 5. COMPREHENSIVE CONTENT GENERATION ENGINE CONFIGURATIONS

The following sections define the explicit guidelines, prompt configurations, and layouts for all non-video content types supported by this application.

### 5.1 CAPS Lesson Plans & Unit Plans
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

### 5.2 Diagnostic & Print-Ready Worksheets
* **Visual Standards**:
  * **Header Badge**: A prominent box containing `"NAME: ______________ DATE: ______________"` styled with dotted fields.
  * **Score Cards**: A distinct, highlighted capsule block styled with a thick yellow/amber border indicating `"SCORE: ________ / [MARKS] Marks"` placed in the top or bottom right.
  * **Primary Grades (R-3)**: Ultra-large text (`text-2xl` or `text-3xl`), double spacing, and thick-dotted tracer blocks for trace-and-copy handwriting exercises.
  * **Option Containers**: Avoid circular pill bounds (`rounded-full`) for wrapped lines to prevent border clipping. Use robust containers with `rounded-2xl` padding instead.
  * **Visual Elements**: Bold question numbers styled as numbered circles, responsive options styled as tap-friendly boxes, and plenty of visual breathing room.

### 5.3 Study Guides & Learning Notes
* **Target Audience**: Learners revising key curricular concepts.
* **Visual Standards**:
  * Clean, multi-column layouts using bento grids to compartmentalize ideas.
  * **Aesthetic Accents**: Highlighted formula panels, key vocabulary callouts, and margin spaces for learner notes.
  * **Critical Thinking**: "Think Deeper" badges and visual lightbulb callout blocks designed with deep text contrast to spark intellectual curiosity.

### 5.4 Formal Assessments & Rubrics
* **Tests & Quizzes**:
  * Structured exam-style formatting with clear mark allocations per sub-question (e.g., `[5 Marks]` aligned to the right-hand margin).
  * **Diagnostic Answer Key (Memo)**: A complete, fully calculated step-by-step marking guidelines section matching the exam structure exactly.
* **Rubrics**:
  * Perfectly aligned HTML grid tables mapping core Criteria (vertical axes) against Performance Levels 1 to 4 or 1 to 7 (horizontal axes) with exhaustive performance descriptors in each grid cell. No empty placeholders!

### 5.5 Visual Posters & Infographics
* **Strict Restriction**: **NO assessment tasks, fill-in-the-blanks, or test questions allowed.** These are visual-only teaching tools.
* **Visual Standards**:
  * **Hero Illustration**: A dedicated center-stage container depicting the core topic in a clean, semi-realistic children's non-fiction digital book design.
  * **Typography**: Highly scannable display fonts, punchy headers with appropriate leading, short action-oriented bullet lists, and context-specific emojis. No long, dense paragraphs of prose.

### 5.6 Report Comments, Curriculum Maps, & Progress Trackers
* **Report Comments**: Generates supportive, constructive individual learner evaluations detailing strengths, identified areas for remedial support, and action-oriented improvement strategies in standard CAPS terminology.
* **Curriculum Maps**: Grid-based sequencing planners detailing topic timelines, ATP alignments, and progression pacing across terms 1 to 4.
* **Progress Trackers**: Clean progress dashboard components that visualize performance metrics, completion rates, and formative milestone tracking.

---

## 📹 6. VIDEO GENERATION ENGINE (OMNIHUMAN-1 PRESERVATION MANDATE)

> [!CAUTION]
> **Video Content Generation is currently highly sensitive.** Do NOT alter, refactor, or attempt to replace the current Video Generation pipelines. The current OmniHuman-1 engine is the ONLY verified working solution that bypasses failing API systems.

### 6.1 Gradio Streaming Integration
* **OmniHuman-1 core mechanism**: Connects client-side directly to the free Hugging Face space `multimodalart/self-forcing` using the `@gradio/client` Node module.
* **Backend Endpoint (`/api/video/generate`)**:
  * Accepts `prompt`, `model`, `seed`, and `fps`.
  * If `model` is `omnihuman-1`, initiates a background `runGradioGeneration` job and returns a unique `"omni-" + Date.now()` tracking ID with state `processing`.
  * Integrates a robust 120-second timeout race promise to handle high-latency public Gradio queuing gracefully.
* **Background Process (`runGradioGeneration`)**:
  * Calls `client.predict("/video_generation_handler_streaming", { prompt, seed: -1, fps: 15 })` and monitors the response structure.
  * Correctly resolves nested response payloads, checking `result.data[0].video.url`, `result.data[0].url`, or string-match protocols before resolving.
  * **Resilient Fallback Policy**: If Gradio returns a timeout, connection error, or queue rejection, it MUST NOT throw a visible error. Instead, it falls back seamlessly to `matchEducationalVideo(promptText)` which scans local keywords against preset high-quality educational MP4 files and returns them as a successfully resolved video payload. This prevents user frustration and guarantees a perfect user experience under any network condition.

### 6.2 Status Inquiries (`/api/video/status/:id`)
* Continues polling the `omniJobs` map to deliver responsive video generation progress updates to the frontend without blocking server execution loops.
* Retains compatibility with the optional `replicate` video client should the user provide valid Replicate API credentials.
