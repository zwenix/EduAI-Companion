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
| `nvidia-nemotron-ultra` | `nvidia/nemotron-ultra-550b-a55b` (Nemotron 3 Ultra 550B-A55B) — **PRIMARY reasoning engine** for lesson plans, assessments and learner diagnosis | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |
| `nvidia-deepseek` | `nvidia/deepseek-v4.1-flash` — **SECONDARY** engine | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |
| `gemini` | `gemini-3.8-flash` (latest GA; reasoning chain `gemini-3.7-flash` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemini-2.5-flash` only when 3.8 is unavailable) — **TERTIARY** engine | Google Gemini API |
| `nvidia-nemotron-lightning` | `nvidia/nemotron-3.5-lightning-30b-a3b` — **last** engine in the reasoning chain | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |
| `nvidia-nemotron-nano` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | FREE NVIDIA NIM endpoint `https://integrate.api.nvidia.com/v1`, key `NVIDIA_API_KEY` |

### The reasoning fallback chain (explicit user instruction, 24 Nov 2026)

Every model has a fallback. The priority is exactly:

1. **Primary** — `nvidia-nemotron-ultra` (NVIDIA Nemotron 3 Ultra 550B-A55B)
2. **Secondary** — `nvidia-deepseek` (NVIDIA NIM `nvidia/deepseek-v4.1-flash`)
3. **Tertiary** — `gemini` (`gemini-3.8-flash`, then the Gemini chain)
4. **Last** — `nvidia-nemotron-lightning` (`nvidia/nemotron-3.5-lightning-30b-a3b`)

`REASONING_CHAIN` in `src/lib/aiModels.ts` is that list. A request that starts
on any member walks the members after it, then wraps to the members before it
(`reasoningFallbacksFor()`), so *any* provider fault — quota, 401/402/403/404,
5xx, timeout, network, DNS — lands on the next healthy engine instead of
surfacing an error. Never write a fallback target as a literal; always ask the
registry.

### Vision / OCR chain (explicit user instruction, 24 Nov 2026)

Scanned worksheets, diagrams and handwritten work use their **own** provider
graph (`VISION_PROVIDER_CHAIN`), in this priority:

1. **Primary** — `nvidia-nemotron-vl` → `nvidia/nemotron-3.5-super-vl-120b-a12b`
2. `gemini` → Gemini multimodal (`gemini-3.8-flash`)
3. `nvidia-llama-vision` → `meta/llama-3.2-90b-vision-instruct`
4. `ocrspace` → OCR.space (text-only final resort)

All vision models call the FREE NVIDIA NIM endpoint with `NVIDIA_API_KEY`.

### NVIDIA NIM is MANDATORY for every Nemotron, DeepSeek and vision model
* ALL NVIDIA models MUST use the FREE NVIDIA NIM endpoint
  (`https://integrate.api.nvidia.com/v1`). NEVER route them through Groq,
  OpenRouter, Alibaba Model Studio, or any other provider or aggregator.
* Never fall back to the same request through Groq or OpenRouter when the
  NVIDIA key is missing — the baked `NVIDIA_API_KEY` (same key the client/APK
  ships, see `src/lib/aiSecrets.ts`) is the intended server fallback.
* The provider switch in `server.ts` (`/api/ai/:provider`) routes every
  `nvidia-*` id to the NVIDIA NIM client and maps each id to its exact model
  slug above. Do not remove, rename or re-map those cases.

### Gemini rules
* Gemini is the **tertiary** engine (and the second vision engine). It maps to
  `gemini-3.8-flash` (the current latest GA). DO NOT map it to outdated models
  like `gemini-2.0-flash`, `gemini-1.5`, `gemini-2.1`, or older 3.x Flash
  releases as defaults. EVER.
* Gemini must never be removed from the app: it is the guaranteed-answer engine
  in the reasoning and vision chains.

### Legacy ids (internal aliases only — not models)
* `alibaba-qwen`, `groq-qwen`, `qwen`, `qwen-image`, `nvidia-nemotron` (old
  Llama-based Nemotron 49B) and `nvidia-nemotron-ultra-legacy` are retired ids
  kept ONLY so stale saved settings keep working. They must resolve to the
  DeepSeek engine (`nvidia-deepseek`) — never resurrected as their own models.

### Strictly Banned / Removed
* **Alibaba Qwen is REMOVED** (24 Nov 2026): no Qwen text model
  (`qwen3.8-max`, `qwen3-max`, …), no Alibaba Model Studio client, no
  `ALIBABA_API_KEY` / `DASHSCOPE_*` credential. NVIDIA NIM
  `nvidia/deepseek-v4.1-flash` holds that slot.
* Groq and OpenRouter are banned as model providers for text generation — no
  Groq client, no OpenRouter client, no Groq/OpenRouter key fallback. (Groq
  Whisper TTS is a separate voice pipeline and is unaffected.)
* Llama-family models are not permitted for **text** generation. The single
  exception is the vision/OCR engine `meta/llama-3.2-90b-vision-instruct`,
  which is allowed for image reading only.
* Any other model not listed above is banned from text content generation.
* Outdated Gemini defaults (`gemini-2.0-flash`, `gemini-1.5-flash`,
  `gemini-2.1`) MUST NOT be used as defaults.
* Image generation (FLUX.1-schnell on Hugging Face / Pollinations /
  Google Imagen 3) and TTS/voice engines are separate pipelines — leave them
  exactly as configured.

### The frozen registry — single source of truth (added 2 Oct 2026)
All five provider ids, their exact model slugs, the reasoning chain, the
vision chain, the Gemini fallback chain, the NVIDIA NIM endpoint, the legacy-id
aliases and the fallback graphs live in EXACTLY ONE module:

* **`src/lib/aiModels.ts`** — exports `AI_PROVIDERS`, `AI_PROVIDER_LABELS`,
  `VISION_PROVIDERS`, `VISION_PROVIDER_CHAIN`, `OCR_PROVIDER_LABELS`,
  `REASONING_CHAIN`, `PRIMARY_REASONING_PROVIDER`, `reasoningFallbacksFor()`,
  `visionFallbacksFor()`, `GEMINI_MODEL_CHAIN`, `GEMINI_PRIMARY_MODEL`,
  `NVIDIA_BASE_URL`, `NVIDIA_MODELS`, `DEEPSEEK_DEFAULT_MODEL`,
  `resolveProviderModel()`, `isNemotronProvider()`, `isVisionProvider()`,
  `isNvidiaNimProvider()` and `isLegacyProvider()`.

Every call site IMPORTs from this registry — no model string, endpoint or
provider-id list may be written as a literal anywhere else. Editing the registry
is a model-frozen change: it requires an explicit user instruction **and** an
update to the table above.

### Enforcement (do not weaken)
* `tests/ai-models.test.ts` asserts every value in this section against
  `src/lib/aiModels.ts` and fails on any drift — re-map, rename, upgrade,
  downgrade or re-route. A red test must never be "fixed" by relaxing the test.
* §7 (Repository Guardrails) defines the CI gate that runs it.

### Application Files Governing Models:
* **`server.ts`**: The API proxy handling `/api/ai/:provider` must resolve
  `gemini` to the Gemini chain above, and every `nvidia-*` id to its exact NIM
  model slug via the NVIDIA NIM endpoint. It contains NO Qwen, Groq or
  OpenRouter clients. It imports the ids, slugs, endpoints, legacy aliases and
  fallback chain from `src/lib/aiModels.ts` — do not re-inline them.
* **`src/contexts/AiContext.tsx`**: `AIProvider` is re-exported from, and
  `VALID_PROVIDERS` derived from, `AI_PROVIDERS` in `src/lib/aiModels.ts`. The
  resolved list must still be exactly `nvidia-nemotron-ultra`,
  `nvidia-deepseek`, `gemini`, `nvidia-nemotron-lightning`,
  `nvidia-nemotron-nano`, and the OCR list must be derived from
  `VISION_PROVIDER_CHAIN`.
* **`src/App.tsx`**: The AI-engine picker and auto-optimize candidates map over
  `AI_PROVIDERS` + `AI_PROVIDER_LABELS` and the OCR picker over
  `VISION_PROVIDER_CHAIN` + `OCR_PROVIDER_LABELS` from `src/lib/aiModels.ts`.
* **`src/services/multiAiService.ts`**: NVIDIA NIM client must call the exact
  slugs above on `https://integrate.api.nvidia.com/v1`. It has no Model Studio
  path. All values come from `src/lib/aiModels.ts`.
* **`src/services/unifiedAiService.ts` / `geminiService.ts` /
  `geminiClient.ts`**: Must dispatch OCR grading and fallback logic through the
  registry's reasoning and vision chains — no inlined model strings.

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

## 🔁 3c. WHEN A MENU "FLASHES", IT IS A REMOUNT — NOT AN ANIMATION

Every "the menus are all flashing" report so far has been React unmounting and
remounting a subtree, not a CSS animation. Check these two habits **before**
touching the frozen glow/border CSS in 3b:

1. **Sub-components declared inside a render body.** A `function FilterBar() {…}`
   written *inside* another component gets a brand-new component identity on
   every render, so React treats it as a different element type and
   unmounts/remounts the whole subtree: `motion` cards replay their
   `initial → animate` entrance, `.menu-glow-card` restarts its transition, and
   text inputs lose focus after every keystroke. Declare them at **module
   scope** and pass props — see `FilterBarBase` / `ToggleChip` /
   `GalleryListBase` in `src/components/FoundationPhaseTemplateStudio.tsx`
   (the CAPS Template Studio / Foundation Phase template archive).
2. **A ticking state high in the tree.** `App` kept a `currentTime` clock that
   nothing rendered; its 1 s `setInterval` re-rendered the entire app 60× a
   minute, which turned habit (1) into a visible once-per-second flash. Keep a
   clock/timer inside the leaf component that actually displays it, and delete
   intervals whose value is no longer rendered.

Both fixes are structural only — markup, class names and `AnimatePresence`
config stay byte-identical, so the frozen designs in 3b are unaffected.

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

---

## 🛡️ 7. REPOSITORY GUARDRAILS — CI, SECRETS, API ABUSE (added 2 Oct 2026)

These mechanisms protect the rules in §1–§6. Do not remove or bypass them without
explicit user instructions.

### 7.1 The CI gate (`npm run ci`)
`scripts/ci.sh` runs five stages in order and must stay green before any push:

1. **Secret scan** — `scripts/scan-secrets.mjs`
2. **Type check** — `tsc --noEmit`
3. **Unit tests** — `vitest run` (`tests/`, 11 suites)
4. **Content template contract** — `npm run verify:template` (101 assertions)
5. **Production build** — `npm run build`

* `npm run ci -- --skip-build` is the fast loop (stages 1–4).
* `.github/workflows/ci.yml` runs the same pipeline on every pull request. It is
  delivered as `docs/ci.workflow.yml` because the Arena GitHub App token cannot
  push workflow files — install it with the one-paste instructions in that file's
  header. Do not relocate the CI logic; `scripts/ci.sh` is the single definition.
* Never "fix" a failing test by deleting it or by loosening an assertion that
  encodes a FROZEN rule (§1). Fix the code, or ask the user.

### 7.2 Secrets
* Never commit credentials. `.env*` is ignored; `.env.example` holds placeholders.
* `src/lib/aiSecrets.ts` and `env-info.json` are the ONLY reviewed exceptions and
  are listed with reasons in the scanner's `ALLOWLIST`. Adding another exception
  requires a written justification in that list — never a blanket disable.
* If a real credential is ever committed: rotate it first, then remove it and
  purge it from history. Do not simply delete the line.

### 7.3 Firestore rules
* `firestore.rules` is the only authorisation layer for learner data. No rule may
  grant access to unauthenticated callers, and every collection requires a
  signed-in check plus a payload validator.
* `tests/firestore-rules.test.ts` fails CI if `if true` allowances reappear, if a
  collection loses its auth guard, or if the critical invariants (uid pinning,
  role-escalation block, `senderId` ownership, tutor-session privacy) change.
* The same suite derives the expected collection list **from the source code**
  (every `collection(db, '…')` call in `src/`), so a collection the client
  reads but the rules do not mention fails CI. Keep it that way when adding a
  collection.
* Editing the rules is not enough: they must be deployed with
  `bash scripts/deploy-firestore-rules.sh` before the change is live.

### 7.3b Serverless time budgets
* The whole API is one Vercel function with a 60 s `maxDuration`
  (`vercel.json`). A request that outlives it is killed by the platform and the
  browser receives a bare **HTTP 504** — the in-app fallback never runs.
* `src/lib/aiRouteBudget.ts` owns the budget for `/api/ai/:provider`
  (52 s total, 15 s Gemini reserve, ≤ 28 s per upstream attempt). Every
  upstream client must carry a `timeout` and `maxRetries: 0`, and every
  attempt must be capped by the remaining budget.
* `tests/ai-route-budget.test.ts` pins the arithmetic. Never raise a budget
  above the platform ceiling.
* The image routes (`/api/image-proxy`, `/api/images/generate`,
  `/api/images/qwen-generate`) are deliberately **outside** this budget —
  they are pinned to the pre-chain behaviour described in §7.3d.

### 7.3c Self-hosted web fonts
* The typefaces are served from the app's own origin (`/fonts/fonts.css`),
  NOT from `fonts.googleapis.com` — that host is blocked or unreachable on
  many school networks and every blocked request used to leave the UI on the
  fallback stack.
* `public/fonts/` is a **generated build artifact**
  (`scripts/build-self-hosted-fonts.mjs`, run automatically by `prebuild` /
  `predev`) and is git-ignored. Change the family/weight list in that script,
  never the generated files.
* The standalone export templates (zipped and opened from disk) are the only
  place that may still link Google Fonts.

### 7.3d Image generation — pinned to the pre-chain behaviour
* **Do not re-introduce the gated "provider chain" for images.** Image
  generation was rolled back to its earlier, working shape after the chain
  made every illustration fail (Pollinations was skipped unless
  `POLLINATIONS_API_KEY` was set, and when Gemini/Qwen also had no usable key
  the proxy answered 502 — i.e. no images at all).
* `/api/image-proxy` fetches `https://image.pollinations.ai/prompt/…`
  (`model=flux&enhance=true&nologo=true`) and streams the bytes straight
  back. No API key, no chain, no budget wrapper.
* `/api/images/generate` tries the Gemini image models
  (`gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`,
  `imagen-3.0-generate-002`) and otherwise hands back a **direct
  Pollinations URL** (`model=flux`). The `generate-image` content action does
  the same.
* `/api/images/flux-generate` renders **FLUX.1-schnell** with up to two free
  backends, in order:
  1. **Hugging Face Inference Providers** (`black-forest-labs/FLUX.1-schnell`,
     `router.huggingface.co/hf-inference/models`, legacy
     `api-inference.huggingface.co` host, one bounded cold-start retry);
     `HUGGINGFACE_API_KEY` (`HUGGINGFACE_IMAGE_MODEL` overrides the slug).
  2. **Cloudflare Workers AI** (`@cf/black-forest-labs/flux-1-schnell`); needs
     `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` ("Workers AI: Read").
     It takes only `prompt` (≤2048 chars), `steps` (≤8) and `seed` — it always
     renders 1024×1024, so the requested size is ignored on this path.
  The function budget is split between the configured backends, so two
  attempts cannot overrun `maxDuration`. With **neither** configured the route
  answers **HTTP 501 + `{configured:false}`** and the client stops attempting
  FLUX for the rest of the session.
* On the client, `src/lib/imageGeneration.ts` keeps its fixed provider
  priority/fallback graph (**Perchance → FLUX → Gemini → Pollinations →
  placeholder**) via `generateImageWithFallback()` (interactive images: the
  "Create Image" button, avatars, `AiImage`).
  `buildPollinationsUrl()` / `buildDirectImageUrl()` remain for the direct-URL
  helpers, but they are **not** the document illustration path any more.
* **Document illustrations must go through `src/lib/documentImageEngine.ts`
  (added 24 Nov 2026).** This is the "Perchance is the primary generator"
  rule, and it fixes the report *"the app bypasses Perchance and goes straight
  to Pollinations"*:
  * `replaceImagePlaceholders()` (`src/lib/imageReplacer.ts`) used to emit
    `<img src="/api/image-proxy?…">` for every `[Illustration: …]` — and that
    route renders with **Pollinations**. The browser-only Perchance engine was
    never in the path, so the primary engine could not win regardless of the
    Settings choice.
  * It now calls `resolveDocumentIllustrationTracked()`, which walks the
    **selected engine first** (`DEFAULT_IMAGE_PROVIDER` = Perchance) and then
    the frozen fallback graph. `src` is a seeded, always-renderable URL so the
    picture paints immediately; the async pass upgrades it to the primary
    engine's result and records telemetry.
  * The global recovery net (`src/lib/imageRecovery.ts`) and the print/PDF
    path (`src/lib/printUtils.ts` → `settlePendingIllustrations()`) use the
    same chain, so a failed illustration is re-resolved on Perchance rather
    than re-rolled on Pollinations, and exports wait for the primary result.
  * `src/main.tsx` warms the Perchance engine at boot (`warmUpPerchance()`):
    the first hidden-iframe request of a session needs Cloudflare clearance,
    and without the warm-up that first illustration timed out into the
    fallback chain.
  * Never re-add a path that emits a `/api/image-proxy` or bare Pollinations
    `src` without first attempting the selected engine. Guarded by
    `tests/document-image-engine.test.ts` and the document-path block in
    `tests/image-providers.test.ts`.
* **Pollinations is the LAST resort, and it throttles.** The anonymous tier
  allows roughly one image every 45 s per IP and answers **HTTP 402
  `{error:{code:"FREE_LIMIT", retryAfter}}`** (sometimes a 200 HTML banner)
  beyond that. Consequences that are now enforced in code:
  * An `<img>` probe cannot see a status, so `classifyImageResponse()` fetches
    first and only falls back to the `<img>` probe when CORS hides the status.
  * A 402/429 is terminal for the provider: the client records a cooldown
    (`POLLINATIONS_COOLDOWN_MS`) and **skips Pollinations entirely** until the
    window passes. Never re-add seed-retry loops on a rate limit — the old four
    attempts cost ~90 s and always failed.
  * `POST /api/images/pollinations-generate` (server proxy) and the direct URL
    are BOTH tried once, because they use different IPs; one being throttled
    does not imply the other is.
  * `POLLINATIONS_API_KEY` removes the throttle (`sk_` keys have no IP limit).
    This is the documented fix for "free limit reached" reports.
* **Every engine may fail — the result must still render.** The final fallback
  is `buildPlaceholderImageUrl()`: a self-contained SVG data URL (no network,
  deterministic, escaped) carrying the prompt and a reason. Never return a
  known-dead provider URL as if it were an image.
* `GET /api/images/status` is the first stop for any "images don't work"
  report: it lists configured engines and probes every upstream host, surfacing
  undici's real cause (`ENOTFOUND`, `ECONNRESET`, …) instead of `fetch failed`.
* **Retired engines (22 Oct 2026) — do not reintroduce:**
  * **Qwen-Image on NVIDIA NIM**: `qwen/qwen-image` *and*
    `qwen/qwen-image-2512` answer `404 page not found` at the gateway.
  * `qwen`, `qwen-image` and `nvidia-qwen` survive only as *aliases* that
    resolve to FLUX (client `normaliseImageProviderId()`, server
    `IMAGE_PROVIDER_ALIASES`) so stale saved settings keep working.
* **Perchance (reinstated 28 Oct 2026) — Image API v1 only.** The engine
  speaks Perchance's purpose-built, documented **Image API v1** at
  `https://perchance.org/perchance-ai-api`: "Works from any domain … No keys,
  no CORS, no backend. The app loads the API in a hidden iframe and receives
  the result via postMessage." Unlimited, no rate limits. Implementation:
  `src/services/perchanceClient.ts` (warm-up iframe once per session, one
  hidden iframe per image, reply matched by request id and Perchance origin,
  permanent `user.uploads.dev` URLs cached, max 2 concurrent, 60 s timeout,
  embed-mirror failover to `null.perchance.org`, circuit breaker benches the
  engine after 2 consecutive failures for 10 min). Rules that are enforced by
  `tests/image-providers.test.ts`:
  * ONLY `perchance-ai-api` may ever be framed. The generator pages
    (`ai-text-to-image-generator`, `ai-images-generator`) send
    `X-Frame-Options: SAMEORIGIN` and can never load — that dead bridge must
    not come back.
  * Never `fetch()` `perchance.org` from any layer (client or server): bare
    HTTP is answered by a Cloudflare 403. The hidden iframe IS the transport.
  * The engine is browser-only; server-side callers that ask for `perchance`
    are routed to FLUX (`/api/images/generate`).
  * The circuit breaker benches after **4** consecutive failures
    (`PERCHANCE_BENCH_AFTER_FAILURES`, raised from 2 on 24 Nov 2026) for 3
    minutes. A document renders illustrations in batches, and the old 2-failure
    threshold benched the PRIMARY engine for 10 minutes after one unlucky
    batch — which is what made later lessons silently use Pollinations. A bench
    is always clearable: `resetPerchanceBench()` backs the Settings "Try again"
    button, and `perchanceFailureInfo()` drives the honest status line.
  * Always send `PERCHANCE_NEGATIVE_PROMPT` (child-safety floor for a school
    product); callers may extend it, never replace it.
* The image **model list is frozen** — FLUX.1-schnell, Pollinations `flux`
  and the three Gemini image models are the approved image models. Changing
  them is a separate, explicit decision (`tests/image-providers.test.ts`
  guards the graph and the retired integrations).

### 7.4 API abuse protection
* `src/lib/rateLimit.ts` is mounted on `/api` in `server.ts` before every route
  handler. Do not remove, bypass or reorder it ahead of a new route.
* Budgets are defined in `RATE_LIMIT_RULES` (AI 30/min, images 20/min,
  video 10/min, media 40/min, general 120/min). A new expensive endpoint must be
  added to `ruleForPath()` with its own budget.
* `RATE_LIMIT_DISABLED=true` exists for local debugging only. Never set it in a
  deployed environment.

### 7.5 Repository hygiene
* Historical one-off scripts live in `archive/legacy-scripts/` (see
  `archive/README.md`). Do not import from, build, or extend that folder, and do
  not add new scratch scripts to the repository root — put maintained tooling in
  `scripts/` or `tests/`.
