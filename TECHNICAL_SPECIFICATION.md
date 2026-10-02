# EduAI Companion — Technical Specification

| | |
| :--- | :--- |
| **Document version** | 1.1 |
| **Date** | 2 October 2026 |
| **Status** | Approved specification of the current implementation |
| **Changelog** | **1.1** — recorded the hardening and hygiene work of 2 Oct 2026: automated test suite (including `AGENTS.md` §1 parity checks), CI pipeline, secret scanner, API rate limiting, Firestore rule fixes, package rename, repository archive, and the single-source model registry with the corresponding `AGENTS.md` §1 update and new §7 guardrails (§§6.3, 9.3, 10.4, 11.1, 12, 14, 15). **1.0** — initial specification generated from source. |
| **Source revision** | `main` @ `5104ba65` (analysed on branch `arena/01a0fab6-eduai-companion`) |
| **Audience** | Engineers, maintainers, technical reviewers and integrators |
| **Related documents** | [`README.md`](README.md) · [`AGENTS.md`](AGENTS.md) · [`DESIGN.md`](DESIGN.md) · [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md) · [`security_spec.md`](security_spec.md) · [`SA_INTEGRATION_SUMMARY.md`](SA_INTEGRATION_SUMMARY.md) · [`docs/CONTENT_TEMPLATE.md`](docs/CONTENT_TEMPLATE.md) |

---

## 1. Introduction

### 1.1 Purpose

This document specifies the architecture, technology stack, interfaces, data model, security posture and non-functional requirements of **EduAI Companion** as implemented in this repository. It is written to be a practical engineering reference: every statement below reflects code that exists in the codebase, not an aspiration.

### 1.2 Scope

In scope:

- Product capability overview and intended users.
- Runtime and deployment architecture (web, PWA, Android).
- Frontend, backend and AI subsystem design.
- API surface and AI provider routing rules.
- Data storage, authentication and authorisation.
- Build, release and operations procedures.
- Known limitations, risks and recommended improvements.

Out of scope:

- Commercial terms, pricing and licensing.
- Detailed curriculum content itself (covered by the CAPS guides and template documents).
- Detailed visual design tokens (covered by `DESIGN.md`).

### 1.3 Definitions

| Term | Meaning |
| :--- | :--- |
| **CAPS** | Curriculum and Assessment Policy Statement — the South African national school curriculum (DBE). |
| **SBA** | School-Based Assessment. |
| **NPA** | National Protocol on Assessment — 7-point achievement rating scale. |
| **SIAS** | Screening, Identification, Assessment and Support policy (inclusive education support levels 1–4). |
| **WP6** | White Paper 6 — inclusive education; differentiation of content, process, product and environment. |
| **POPIA** | Protection of Personal Information Act (South Africa). |
| **ILDP / IDP** | Individual Learner Development Plan. |
| **Phase** | Foundation (R–3), Intermediate (4–6), Senior (7–9), FET (10–12). |
| **SPA** | Single-page application. |
| **PWA** | Progressive Web App. |
| **NIM** | NVIDIA Inference Microservices endpoint (`https://integrate.api.nvidia.com/v1`). |

---

## 2. Product Overview

### 2.1 Problem statement

South African teachers work under significant administrative load: lesson planning, differentiated worksheets, assessment setting and marking, reporting, and learner-support documentation — all against CAPS requirements. Learners need affordable, curriculum-aligned practice and tutoring. Parents need visibility of progress.

EduAI Companion addresses this by generating CAPS-aligned, classroom-ready material on demand; marking submissions; providing a conversational tutor; and consolidating progress information per role.

### 2.2 Users and roles

The application supports exactly four roles, selected during onboarding (`src/components/RoleSelection.tsx`) and stored on the user document (`role` field in `/users/{uid}`):

| Role | Primary workspace |
| :--- | :--- |
| **Teacher** | Dashboards, content studio, planners, class management, intervention hub, portfolios, autograder, analytics, communicator. |
| **Student (Learner)** | Dashboard, AI tutor, practice zone, study content creator, tasks/notifications, progress analytics, portfolio, collaborative workspace, gamification hub, own support plan. |
| **Parent/Guardian** | Child's progress and assessments, portfolio items, teacher chat, read-only support/intervention information. |
| **Admin** | School-wide analytics, classrooms manager, learner overview, content archive, tutor and autograder access. |

### 2.3 Goals

1. Reduce teacher preparation and marking time without lowering content quality.
2. Keep every generated artefact CAPS-aligned and South African in context and spelling.
3. Provide learners with instant, diagnostic practice and tutoring.
4. Give parents actionable visibility into progress.
5. Work acceptably on low-bandwidth, low-memory Android devices, including offline where possible.

### 2.4 Non-goals

- Full learner management/administration system (timetabling, fees, statutory reporting).
- Real-time multi-user editing of documents (the collaborative workspace is project/chat oriented, not OT/CRDT document co-editing).
- Full internationalisation framework; the product targets South African English and CAPS.
- Offline AI inference — AI features require connectivity; offline mode degrades to cached content and local mirrors.

### 2.5 Capability summary

| Domain | Capabilities |
| :--- | :--- |
| **Content generation** | Lesson plans, unit plans, worksheets, study guides/notes, formal assessments + memos, rubrics, posters/infographics, report comments, curriculum maps, progress trackers, admin documents. |
| **Assessment** | OCR/typed autograding with rubrics and feedback, practice assessment generation and marking, progress tracking, AutoGrading reports. |
| **Teaching operations** | Weekly planner, teacher's diary, class/roster management, seating, attendance, study groups, notifications/reminders. |
| **Learner support** | SIAS-aligned intervention plans, strategy library, support timetable, learner portfolios, IDP/ILDP. |
| **Communication** | Communicator Hub chat, direct messages, parent channels, collaborative workspaces, web push notifications. |
| **Media** | Educational image generation, illustration library, avatar video generation, text-to-speech voice tutor, how-to video library. |
| **Print & export** | Canonical A4 template, print preview, PDF, DOCX, ZIP package export, QR-coded worksheets, native Android share-sheet export. |
| **Foundation Phase** | 28 Grade R–3 printable templates (6 awards, 10 worksheets, 6 classroom exercises, 6 homework exercises) with offline gallery and print-all mode. |

---

## 3. System Architecture

### 3.1 Architectural style

EduAI Companion is a **client-heavy SPA with a thin Node/Express API gateway** and a **serverless-first deployment**:

- The React SPA holds UI, state, navigation, prompt composition, offline caches and (on native) direct provider calls.
- `server.ts` is a single Express application that proxies/aggregates AI providers, generates images, orchestrates video jobs, handles web push, and serves the SPA.
- Firestore is the system of record, accessed directly from the client via the Firebase SDK, protected by security rules.
- The same client bundle is packaged for the web/PWA and Android via Capacitor.

### 3.2 System context

```text
Teachers / Learners / Parents / Admins
        │  (browser or Android APK)
        ▼
EduAI Companion client (React 19 SPA)
        │                                   │
        │ same-origin HTTPS /api/*          │ Firebase SDK (Auth + Firestore)
        ▼                                   ▼
Express API server (server.ts)        Firebase project
        │                              • Authentication
        ├── Google Gemini API          • Cloud Firestore (+ security rules)
        ├── Alibaba Model Studio       • (No Firebase Hosting / Functions / Genkit)
        ├── NVIDIA NIM
        ├── OCR.space / Hugging Face
        ├── Perchance / Pollinations
        ├── Hugging Face Gradio (OmniHuman-1)
        └── Replicate (optional)
```

### 3.3 Containers and responsibilities

| Container | Implementation | Responsibilities |
| :--- | :--- | :--- |
| **Web/PWA client** | React 19 + Vite 6 (`src/`) | All UI, role-based navigation, content rendering, prompt composition, exports, offline caches, service worker registration. |
| **API server** | Express 4 (`server.ts`, ~2.4k LOC) | AI provider routing + fallback, OCR/TTS/image/video endpoints, web push, compliance package generation, ILDP reports, static hosting and SPA fallback. |
| **Serverless adapter** | `api/index.ts` + `vercel.json` | Wraps the esbuild bundle `dist/server.cjs` as a Vercel function (`maxDuration: 60`) and rewrites `/api/*`; all other routes serve the SPA. |
| **Android shell** | Capacitor 6 (`capacitor.config.ts`, `android/` generated in CI) | Native WebView, Google Sign-In plugin, filesystem/share export bridge, hardware back-button handling, icons and splash. |
| **Data platform** | Firebase 12 | Email/password, Google and anonymous auth; Firestore with persistent local cache. Rules in `firestore.rules`. |
| **Static assets** | `public/`, `src/assets/`, `dist/` | Icons, overlays, illustration library, Foundation Phase template packs, splash video, PWA icons. |

### 3.4 Deployment topologies

#### 3.4.1 Local development

`npm run dev` → `tsx server.ts`:

- Express binds `0.0.0.0:3000` (hardcoded `PORT = 3000`).
- When `NODE_ENV !== "production"`, Vite is mounted in **middleware mode** with `appType: "spa"` and `allowedHosts: true`, so HMR and on-the-fly transforms work through the same origin.
- All `/api/*` routes are available on the same port, avoiding CORS entirely.

#### 3.4.2 Web / serverless production (Vercel)

- `npm run build` produces `dist/` (client) and `dist/server.cjs` (bundled server, `--packages=external`).
- `vercel.json` maps `/api/(.*)` → `api/index.ts`, which imports `dist/server.cjs`; non-API paths rewrite to `index.html`.
- The server detects `process.env.VERCEL` and **does not call `app.listen`**; the platform invokes the exported Express app per request.
- Function limit: 60 seconds (`maxDuration`). Long AI generations must complete within this window; the video pipeline deliberately returns a job id immediately and is polled.
- The native client uses `https://eduai-companion.vercel.app` as its backend base (`src/lib/imageGeneration.ts`).

#### 3.4.3 Android (Capacitor)

- `webDir: "dist"`, `appId: com.eduaicompanion.app`, `androidScheme: "https"`.
- Shortcuts for native behaviour are centralised in `src/lib/platform.ts` (`isNativeApp`, `isAndroidDevice`, `isWebViewRuntime`, `supportsSystemPrint`, `isLowMemoryDevice`).
- **On native, AI calls bypass the backend**: `src/services/multiAiService.ts` calls Qwen/NVIDIA endpoints directly, and OCR falls back to OCR.space directly, because there is no Node server in the APK. Embedded fallback credentials are documented in §13.3.
- Android cannot print or download blobs from the WebView. Boot-time installers in `src/main.tsx` (`installNativeDownloadBridge`, `installImageRecovery`, `installExportSafetyNet`) route exports through the native filesystem + share sheet and repair stuck export overlays (see `docs/android-export-print.md`).

#### 3.4.4 Installed PWA

- `vite-plugin-pwa` uses `injectManifest` with `src/sw.js` and Workbox `precacheAndRoute`.
- Precached globs: `js, css, html, ico, png, svg, woff, woff2, ttf` (≤ 10 MB per file). **Video is deliberately excluded** — the ~3 MB splash MP4 shipped as two copies previously forced a ~6 MB first-load download.
- `registerType: 'autoUpdate'`; manifest name `EduAI Core Console`, theme `#060b18`, standalone display.
- `src/sw.js` adds `push` and `notificationclick` handlers for Web Push.

### 3.5 Key request flows

#### 3.5.1 Text/content generation

1. UI collects content type, grade, subject, term, topic and options.
2. `src/lib/prompt-engine.ts` composes the system/user prompts from the master prompt, content templates and SA compliance prompts.
3. `src/services/unifiedAiService.ts` dispatches to the selected provider:
   - **Web**: `POST /api/ai/:provider` → provider client on the server.
   - **Native**: direct provider call from the device.
4. Gemini is attempted first when selected; provider failures are classified (`isProviderFailure`) and automatically re-routed to Gemini.
5. Output is validated/normalised (tag repair via `closeOpenHtmlTags`, template normalisation via `wrapWithTemplate()`), rendered, and offered for print/export.

#### 3.5.2 Autograding

1. Teacher/learner uploads an image or typed submission.
2. Image path: vision OCR (Gemini) or OCR.space; DOCX path: `mammoth` on the server.
3. `runOCRAndGrade` / `runTextGrade` in `geminiService.ts` grades against rubric criteria and returns marks plus feedback.
4. Results are stored (`auto_grading_reports`, `submissions`, learner portfolios) and surfaced in analytics.

#### 3.5.3 Image generation

1. Caller (content studio, illustration library, slide background) requests an image with size/placement/grade/subject context.
2. `src/lib/imageGeneration.ts` builds a styled prompt (SA context enhancer + educational art style).
3. Providers are attempted in the configured order; each provider has its own fixed fallback graph.
4. Final fallback is a direct Pollinations URL, so a URL is always returned.

#### 3.5.4 Video generation

1. `POST /api/video/generate` with `model: "omnihuman-1"` creates an in-memory job (`omni-<timestamp>`), returns `202`-style `{ id, status: 'processing' }` immediately.
2. `runGradioGeneration` calls the Hugging Face Space `multimodalart/self-forcing` via `@gradio/client` (`/video_generation_handler_streaming`, 15 fps, seed −1) with a 120-second timeout race.
3. The client polls `GET /api/video/status/:id`.
4. On timeout/queue failure the job resolves to `matchEducationalVideo(prompt)` — a curated local MP4 — rather than surfacing an error.
5. Optional Replicate models (`minimax/video-01`, `luma/ray`) are supported when `REPLICATE_API_TOKEN` is set; job state lives in memory.

---

## 4. Technology Stack

### 4.1 Core stack

| Layer | Technology | Version (package.json) | Role |
| :--- | :--- | :--- | :--- |
| Language | TypeScript | `~5.8.2` | All application code; `tsc --noEmit` is the lint gate. |
| UI runtime | React / React DOM | `^19.0.0` | Component model. |
| Build | Vite | `^6.2.0` | Dev server (middleware mode) and client bundling. |
| Server dev runner | tsx | `^4.21.0` | Runs `server.ts` directly. |
| Server bundler | esbuild | `^0.28.0` | Bundles the server to `dist/server.cjs`. |
| Styling | Tailwind CSS + `@tailwindcss/vite` + `@tailwindcss/typography` | `^4.1.14` / `^0.5.19` | Utility-first styling; tokens in `@theme` in `src/index.css`. |
| API server | Express | `^4.21.2` | HTTP API and static hosting. |
| Auth & data | Firebase | `^12.13.0` | Auth + Firestore SDK (client-side). |
| Mobile | Capacitor | `^6.2.1` core/android; plugins 6.x | Android packaging and native bridges. |
| PWA | vite-plugin-pwa (Workbox) | `^1.3.0` | Precache, autoupdate, installable manifest. |
| Analytics | @vercel/analytics | `^2.0.1` | Client analytics. |

### 4.2 AI and media dependencies

| Concern | Packages / services |
| :--- | :--- |
| Gemini | `@google/genai` `^1.29.0`; plain REST for the fallback chain. |
| OpenAI-compatible providers | `openai` `^6.34.0` (Alibaba Model Studio, NVIDIA NIM) and `axios`. |
| Hugging Face | `@huggingface/inference` `^4.13.15`, `@gradio/client` `^2.2.1` (OmniHuman-1). |
| Replicate | `replicate` `^1.4.0` (optional video). |
| OCR / documents | `mammoth` `^1.12.0` (DOCX text), OCR.space REST, Gemini vision. |
| Voice | Browser SpeechSynthesis, `google-tts-api` `^2.0.2`, Hugging Face inference, Groq `whisper` provider label (synthesis falls back to browser). |
| Charts / maths / markdown | `recharts` `^3.8.1`, `katex` `^0.17.0`, `react-markdown` `^10.1.0`, `marked` `^18.0.2`, `rehype-raw` `^7.0.0`. |
| Export | `html2pdf.js` `^0.14.0`, `jspdf` `^4.2.1`, `html2canvas` `^1.4.1`, `archiver` `^8.0.0`, dynamic optional `docx` / `puppeteer` / `jszip` with client-side fallback. |
| UX utilities | `motion` `^12.23.24`, `lucide-react` `^0.546.0`, `canvas-confetti`, `clsx`, `tailwind-merge`, `hls.js`, `idb` `^8.0.3`, `jsqr` `^1.4.0`, `web-push` `^3.6.7`. |

### 4.3 Repository layout (top level)

| Path | Purpose |
| :--- | :--- |
| `server.ts` | Express application; the single server entry point. |
| `api/index.ts` | Vercel function adapter. |
| `src/` | Application source (~72k LOC across TS/TSX). |
| `public/` | Static assets, icon packs, Foundation Phase template packs. |
| `scripts/` | Build/verification scripts and Android wiring. |
| `docs/` | Long-form engineering documentation. |
| `firestore.rules` | Firestore security rules (source of truth). |
| `signing/` | Stable Android debug keystore used by CI (fingerprint-sensitive — do not replace). |
| `*.cjs`, `*.py`, `fixes.patch`, `MANUAL_PUSH.md` | Historical one-off patch scripts retained at the root (see §14). |

---

## 5. Frontend Architecture

### 5.1 Application shell

- `index.html` loads `/src/main.tsx`, which mounts `<App />` inside `<AiProvider>` and `<Analytics />`.
- `src/App.tsx` (~3.6k LOC) is the shell: authentication observer, role resolution, sidebar category/sub-tab routing, top bar, overlays, toasts, offline sync, and lazy feature rendering.
- Navigation is a two-level model: **sidebar categories** (Dashboard, Teacher's Toolbox, Curriculum & Planning, Intelligent AI, Classes & Learners, Analytics & Reports, Message & Collaborate, Help/Support Desk) each containing **sub-tabs** that render a feature component. `getSidebarCategories`, `getSubTabsForCategory` and `getCategoryForTab` centralise the role-specific maps.
- Landing hubs are rendered by `src/components/CategoryOverview.tsx`, which contains bespoke, deliberately frozen card/slideshow layouts per category.

### 5.2 Component inventory

55 components live in `src/components/`. Principal groups:

| Group | Components (examples) |
| :--- | :--- |
| Shell & identity | `LandingPage`, `LoginPage`, `RoleSelection`, `SplashScreen`, `Logo`, `Mascot`, `LoadingMascot`, `ProfileSettings`, `Settings`, `PasswordSecurity` |
| Dashboards | `TeacherDashboard`, `StudentDashboard`, `ParentDashboard`, `AdminDashboard` |
| Content creation | `ContentCreator`, `ContentSlideshow`, `CategoryOverview`, `IllustrationLibrary`, `PosterPreview`, `ReaderModeModal`, `WorksheetQRScannerModal` |
| Curriculum & planning | `CurriculumSuite`, `WeeklyPlanner`, `TeacherPlanner`, `AlertsPage`, `StudentNotes` |
| Assessment | `AutoGrading`, `OCRScanner`, `StudentPractice`, `ProgressReports` |
| Classes & learners | `ClassManagement`, `LearnerInterventionHub`, `LearnerPortfolioHub`, `StudentPortfolio`, `StudentRecordsPanel`, `StudentDevelopmentHub`, `StudentTasksNotifications` |
| Communication | `Messenger`, `CollaborativeWorkspace`, `NotificationsDropdown` |
| AI & media | `AITutorPage`, `StudentAITutorBubble`, `VideoLabConsole`, `VideoGenerationHistory`, `EduVideoPlayer`, `AiImage` |
| Foundation Phase | `FoundationPhaseTemplateStudio`, `FoundationPhaseArchitect` |
| Support & export | `Helpdesk`, `ContentArchive`, `PrintPreviewModal`, `ExportProgressDialog`, `PageOverlay`, `ClassroomBackground` |

### 5.3 State and context

| State | Mechanism |
| :--- | :--- |
| AI provider selections | `src/contexts/AiContext.tsx` — text (`gemini`, `alibaba-qwen`, `nvidia-nemotron-nano`, `nvidia-nemotron-ultra`, `nvidia-nemotron-lightning`), TTS, OCR and image provider. Persisted to `localStorage` with legacy-id migration. |
| Authentication/role | Firebase `onAuthStateChanged` in `App.tsx`; cached role in `localStorage` (`userRole_{uid}`) with Firestore as source of truth. |
| Offline data | `src/lib/offlineDB.ts` (IndexedDB via `idb`): generic `cache` store and a `studyNotes` store with a date index; `localStorage` mirrors for dashboards and settings. |
| Domain data | Firestore real-time listeners per feature; Firestore persistent local cache is enabled with `persistentMultipleTabManager`. |

### 5.4 Design system

Defined in `src/index.css` (Tailwind 4 `@theme`) and documented in `DESIGN.md`:

- Brand tokens: cyan `#00B3FF` (action), yellow `#ffdf40` (achievement), pink `#FF00D4` (creativity), green `#00FF9F` (success), purple `#9b59b6` (AI), navy `#0a0f21` / `#030611` (surfaces).
- Fonts: Fredoka / Quicksand (display), Inter / Plus Jakarta Sans (body), Patrick Hand / Comic Neue (primary-grade handwriting).
- Patterns: glassmorphism (`.glass`), gradient mesh backdrops, tactile "kid shadows", steady neon glow classes.
- **Design freeze**: per `AGENTS.md` §3b, card borders, glows, hover states, slideshow mechanics and overlay dimming are frozen. The flashing regressions previously reported were caused by React remounts (components declared inside render bodies, or high-frequency parent clocks), not animation — see `AGENTS.md` §3c.

### 5.5 Offline and resilience behaviour

- Service worker precaches the app shell for fast repeat loads.
- Firestore persistent cache keeps recently-read documents available offline.
- Feature-level fallbacks: intervention profiles mirror to `localStorage` when rules/permissions fail; study notes persist in IndexedDB; ILDP reports have a local generator; video falls back to bundled MP4s; images fall back to a Pollinations URL.
- Boot-time safety nets: `installImageRecovery()` (re-resolve broken generated images), `installNativeDownloadBridge()` (Android downloads → filesystem + share), `installExportSafetyNet()` (remove stuck html2pdf overlays).

---

## 6. Backend / API Specification

### 6.1 Server composition

`server.ts` (~2,366 LOC) contains, in order:

1. Module-level Gemini helpers (`GEMINI_MODEL_CHAIN`, `geminiGenerateWithFallback`, `geminiStreamWithFallback`, failure-window caching and retry backoff).
2. Provider clients and utilities (Alibaba/OpenAI-compatible, NVIDIA NIM, key resolution from env/Vite/env-info, `failedRequestsLog`).
3. Express app setup: JSON/urlencoded body limit **50 MB** (base64 images), route handlers, Vite middleware or static hosting, and `app.listen(PORT, "0.0.0.0")`.

There is no authentication middleware, rate limiting, CSRF layer or CORS configuration on the API (see §13.2).

### 6.2 Endpoint catalogue

| Method | Path | Purpose | Key inputs |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | Liveness probe. | — |
| POST | `/api/ai/:provider` | Unified OpenAI-compatible text generation proxy. Provider ids: `gemini`, `alibaba-qwen`, `nvidia-nemotron-nano`, `nvidia-nemotron-ultra`, `nvidia-nemotron-lightning`. Supports streaming. | `messages`, `model?`, `temperature?`, `max_tokens?`, `stream?` |
| POST | `/api/ocr` | OCR.space proxy. | `image` (base64), `language?` |
| POST | `/api/tts/google` | Google Translate TTS URL builder (returns proxied URLs). | `text`, `lang` |
| GET | `/api/tts/proxy` | Streams Google TTS audio to bypass CORS/referrer restrictions. | `url` |
| POST | `/api/tts/hf` | Hugging Face TTS inference (returns base64 FLAC). | `text`, `model` |
| POST | `/api/images/generate` | Image generation (Gemini/Imagen path) with educational style augmentation. | `prompt`, `provider?` |
| POST | `/api/images/qwen-generate` | Qwen-Image via NVIDIA NIM with SA-context enhancer. | `prompt`, `placement?`, `grade?`, `subject?`, `saContext?` |
| GET | `/api/image-proxy` | Pollinations image proxy used by `<img>` tags (avoids client-side blocking). | `prompt`, `seed?`, `width?`, `height?` |
| POST | `/api/video/generate` | Starts an OmniHuman-1 or Replicate video job. | `prompt`, `model` |
| GET | `/api/video/status/:id` | Polls job status (in-memory for OmniHuman; Replicate prediction otherwise). | — |
| POST | `/api/sa/generate-package` | Full SA compliance package: CAPS pre-flight, prompt build, text generation (Qwen → Gemini), images, assemblers. | `request` (grade, subject, term, contentType…), `provider?`, `generateImages?` |
| POST | `/api/reports/ildp` | Individual Learner Development Plan as JSON; local deterministic fallback when Gemini is unconfigured. | `studentName`, `grade`, `subjects` |
| POST | `/api/gemini/action` | Gemini action endpoint (`gemini-3.8-flash`) with streaming support and the shared fallback chain. | `action`, `input`, `stream?` |
| GET | `/api/notifications/vapid-public-key` | Reports whether Web Push is configured. Returns `{ enabled: false }` when VAPID keys are absent. | — |
| POST | `/api/notifications/subscribe` | Stores a push subscription (in-memory map). | `subscription`, `userId?` |
| POST | `/api/notifications/unsubscribe` | Removes a push subscription. | `subscription` |
| POST | `/api/notifications/test-send` | Sends a test push to stored subscriptions. | `title?`, `body?`, `url?`, `userId?` |
| GET | `/splash.mp4` | Serves the splash video from `public/` (or repo root fallback). | — |
| * | non-API routes | Development: Vite middleware. Production: `express.static(dist)` + SPA fallback to `index.html`. | — |

### 6.3 Conventions and behaviour

- **Response shape**: AI endpoints return OpenAI-compatible `{ choices: [{ message: { content } }] }`; streaming emits SSE-style `data:` frames with `{ choices: [{ delta: { content } }] }` and a terminating `done: true` frame containing the full text.
- **Body limits**: 50 MB JSON/urlencoded to accommodate base64 images and documents.
- **Timeouts**: video generation uses a 120-second race; serverless functions are capped at 60 seconds by `vercel.json`.
- **Fallbacks**: provider failures never surface as raw provider errors to the learner experience where a fallback exists — the AI layer logs, classifies and re-routes to Gemini; the video layer substitutes curated educational clips.
- **Port**: 3000, bound to `0.0.0.0` (required for container/preview environments).
- **Abuse protection**: an in-memory fixed-window rate limiter is mounted on `/api` **before** all
  route handlers (`src/lib/rateLimit.ts`). Budgets per client per minute: AI 30, images 20,
  video 10, OCR/TTS/Gemini-action 40, general 120. `/api/health` and
  `/api/notifications/vapid-public-key` are exempt. Blocked requests receive
  `429` + `Retry-After`; every response carries `X-RateLimit-Limit` / `X-RateLimit-Remaining`.
  Disable with `RATE_LIMIT_DISABLED=true`. Keys are derived from `req.ip` (proxy-aware via
  `app.set('trust proxy', 1)`); see the per-process limitation in §13.2.

---

## 7. AI Subsystem

### 7.1 Text generation providers (frozen)

Per `AGENTS.md` §1, only the following models are permitted for text generation, reasoning, OCR-grading and tutor chat, and they must be called directly on the stated endpoints:

| Provider id | Model | Endpoint |
| :--- | :--- | :--- |
| `gemini` | `gemini-3.8-flash` (primary), with the frozen fallback chain below | Google Gemini API |
| `alibaba-qwen` | `qwen3.8-max` | Alibaba Cloud Model Studio, OpenAI-compatible workspace endpoint (`ALIBABA_API_KEY`) |
| `nvidia-nemotron-nano` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | NVIDIA NIM `https://integrate.api.nvidia.com/v1` (`NVIDIA_API_KEY`) |
| `nvidia-nemotron-ultra` | `nvidia/nemotron-ultra-550b-a55b` | NVIDIA NIM |
| `nvidia-nemotron-lightning` | `nvidia/nemotron-3.5-lightning-30b-a3b` | NVIDIA NIM |

**Gemini fallback chain (in order):** `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` → `gemini-2.5-flash`.

Additional routing rules:

- All Nemotron traffic must use NVIDIA NIM; Groq, OpenRouter and other aggregators are banned as providers.
- Llama-family models are removed from the application.
- Legacy ids (`groq-qwen`, `nvidia-nemotron`, `nvidia-nemotron-ultra-legacy`) resolve to `alibaba-qwen` so stale saved settings keep working; they are never resurrected as models.
- A verified working model is cached to cut fallback latency; if the whole chain fails, the cache is invalidated for a 60-second window and requests restart from the top with gentle backoff (503/429 storms).
- Alternative providers are selectable in the UI, but **any** provider failure is classified and seamlessly routed to Gemini (`src/services/unifiedAiService.ts`).
- Non-text pipelines (image, OCR, TTS, video) are explicitly excluded from the frozen model list and have their own provider graphs.

### 7.2 Prompt engineering system

Implemented under `src/lib/` and documented in `PROMPT_SYSTEM.md`:

| File | Responsibility |
| :--- | :--- |
| `prompts/master-prompt.ts` | Master system instruction: layout, colour schemes, grade rules, safety. |
| `prompts/system-prompts.ts` | Content-type system prompts (worksheet, visual aid, infographic, diagram…). |
| `prompts/content-templates.ts` | Layout-optimised worksheet, poster, study guide, bento infographic templates. |
| `prompts/admin-templates.ts` | Lesson plans, newsletters, policy documents. |
| `prompts/assessment-templates.ts` | Tests, memos and rubrics. |
| `prompts/caps-lesson-plan-prompt.ts` | FET lesson-plan system prompt (Grades 10–12). |
| `compliance/sa-frameworks.ts` | CAPS phases/subjects, NPA codes, Bloom's distributions, SIAS levels, WP6 differentiation, POPIA rules, SA context utilities. |
| `compliance/sa-prompts.ts` | SA system/user prompt builders and the quality checklist. |
| `prompt-engine.ts` | Context binding, variable injection, prompt compilation. |
| `prompt-validator.ts` | Heuristic validation of generated HTML/JSON (visual compliance, safety, curriculum tags, accessibility). |

Content is generated as **HTML styled with Tailwind classes**, not Markdown. Truncated model output is repaired by `closeOpenHtmlTags`. Every generated document is normalised through `wrapWithTemplate()` (`src/lib/contentTemplate.ts`) to guarantee three invariants: the compliance labels appear **once**, top banners are **gradients** (never flat), and the footer line is **exact** (`docs/CONTENT_TEMPLATE.md`).

### 7.3 South African compliance rules baked into generation

| Framework | Implementation |
| :--- | :--- |
| CAPS phases & SBA weights | Foundation R–3 (100% SBA), Intermediate 4–6 (75/25), Senior 7–9 (60/40), FET 10–12 (25/75). |
| NPA rating | 7-point scale (Code 7 = 80–100% → Code 1 = 0–29%). |
| Bloom's distribution | Phase-specific cognitive mix. |
| SIAS | Levels 1–4 support escalation and documentation fields. |
| WP6 | Differentiated content/process/product/environment strategies. |
| POPIA | Fictional learner names, no unnecessary PII, confidentiality notices. |
| SA context | Rand currency, DD/MM/YYYY dates, SA English spelling, local places/fauna/flora, IKS and ubuntu values. |

### 7.4 Image generation

`src/lib/imageGeneration.ts` implements a fixed fallback graph:

- **Priority**: Perchance (keyless, default) → Qwen-Image via NVIDIA NIM → Gemini image models (`gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`, `imagen-3.0-generate-002`) → Pollinations (always returns a URL).
- Placement-aware sizes (`header`, `inline`, `full_width`, `sidebar`) are defined in `QWEN_CONFIG`; Qwen generation runs with concurrency 2 and a 2-second pause between batches.
- `enhancePromptForSA()` injects rainbow-nation diversity, SA landmarks/flora, flag accents and a 300 DPI, no-text, no-watermark requirement.
- `/api/image-proxy` exists so `<img>` tags can render provider URLs that would otherwise be blocked client-side.

### 7.5 OCR and autograding

| Path | Engine |
| :--- | :--- |
| Primary | Gemini vision (`runOCRScan`, `runOCRAndGrade`). |
| Secondary (user-selectable) | OCR.space via `/api/ocr` (server) or direct call (native). |
| DOCX | `mammoth` raw-text extraction on the server. |
| QR worksheets | `jsqr` in `WorksheetQRScannerModal` for printed-code → digital twin. |

Grading returns structured marks, rubric alignment and feedback; results persist as `auto_grading_reports` and feed progress analytics and portfolios.

### 7.6 Voice

`src/services/ttsService.ts` supports:

- `browser` — Web SpeechSynthesis (also the forced fallback on native Android, where remote synthesis previously wasted a round trip).
- `huggingface` — via `/api/tts/hf`.
- `google-tts` — via `/api/tts/google` + `/api/tts/proxy`.
- `groq-whisper` — labelled provider; Whisper is an ASR model, so synthesis degrades to Google/browser TTS by design.

### 7.7 Video

Covered in §3.5.4. OmniHuman-1 is the verified free path; Replicate is optional. Job state is process-local.

---

## 8. Data Architecture

### 8.1 System of record

**Cloud Firestore** in Firebase project `gen-lang-client-0448588221` (database id `ai-studio-816109df-d3ec-4c24-b9b9-bc4f18f1e4c2`, see `firebase-applet-config.json`). The client initialises Firestore with:

- `experimentalForceLongPolling: true` (mobile/proxy resilience).
- `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` (offline + multi-tab).

### 8.2 Collection map (`firestore.rules`)

The rules file defines **28 collection paths** (26 top-level collections plus two `/users` subcollections):

| Domain | Collections |
| :--- | :--- |
| Identity | `users` (+ `/users/{uid}/archive`, `/users/{uid}/videoHistory`) |
| Directory | `students`, `classes`, `study_groups` |
| Collaboration | `collaborative_projects`, `collaborative_cursors`, `communicator_messages`, `direct_messages`, `messages`, `messenger_messages` |
| AI & sessions | `ai_tutor_sessions`, `ai_floating_sessions`, `created_content`, `lessons`, `omnihuman_videos` |
| Teaching & assessment | `illustrations`, `assignments`, `submissions`, `auto_grading_reports`, `published_reports` |
| Learner support | `learner_interventions`, `portfolio_items`, `student_records` |
| Operations | `notifications`, `activity_logs`, `planner_events` |

### 8.3 Client-side persistence

| Store | Contents |
| :--- | :--- |
| Firestore persistent cache | Recently read/written documents (LRU-managed by the SDK). |
| IndexedDB (`eduai-companion-db`) | Generic `cache` store; `studyNotes` store indexed by creation date. |
| `localStorage` | Provider selections (`eduai_provider`, `eduai_tts_provider`, `eduai_ocr_provider`, `eduai_image_provider`), role cache (`userRole_{uid}`), profile display fields, sync status, feature mirrors (e.g. intervention profiles when Firestore permissions fail). |
| In-memory (server) | `omniJobs` (video jobs), `pushSubscriptions` (web push), `failedRequestsLog` (diagnostics), cached model health. |

### 8.4 Data-quality controls

- Firestore rules validate field shapes, string sizes, enum values and immutability (see `security_spec.md`).
- Content documents are normalised to the canonical template before persistence/export.
- Generation outputs pass heuristic validation and JSON parsing guards (`safeJsonParse`) before being stored.

---

## 9. Authentication and Authorisation

### 9.1 Authentication methods

Implemented in `src/components/LoginPage.tsx` against Firebase Auth:

- Email + password (sign-up, sign-in, password reset).
- Google Sign-In (popup on web with redirect fallback for iframes/blocked popups; native Capacitor Google Auth on Android).
- Anonymous sign-in for trial/low-friction access.

The resolved role is stored on `/users/{uid}` and cached locally; `App.tsx` subscribes to `onAuthStateChanged` and resolves the role from Firestore, falling back to the cached role.

### 9.2 Android Google Sign-In identities

- Package: `com.eduaicompanion.app`.
- The **Web** OAuth client ID (`src/config/googleAuth.ts`) is used as audience for the ID token on both web and Android; it must exist in GCP project `725068822716`.
- An **Android** OAuth client must be registered with the package name and the CI keystore SHA-1 `73:BB:00:87:CF:0B:C5:43:B7:60:37:01:03:CE:D3:47:9E:5E:D5:FD` (SHA-256 also documented).
- The CI workflow copies `signing/android-debug.keystore` to `~/.android/debug.keystore`, and `scripts/wire-google-signin.mjs` installs `google-services.json` + `server_client_id` into the generated Android project.
- Error code 10 / 12501 / `invalid_client` troubleshooting is covered in `GOOGLE_SIGNIN_ANDROID_SETUP.md`.

### 9.3 Authorisation model

Authorisation is enforced in **Firestore security rules** (attribute-based access control):

- A user profile is only writable by the matching `uid`; self-assigned role escalation to `admin` is rejected.
- Student records are scoped to the creating teacher or the linked learner identity.
- Messages must be created with `senderId == request.auth.uid`; only sender/recipient may read them.
- Tutor sessions are private to their owner.
- Field allow-lists, size limits and timestamp immutability prevent state poisoning.

The API server itself does not verify Firebase ID tokens; it is a stateless provider gateway
protected by rate limiting (§6.3) but not authentication (§13.2).

**Rules hardening (2 October 2026).** Two wide-open rules were closed after a review of
`firestore.rules`:

| Collection | Before | After | Why it mattered |
| :--- | :--- | :--- | :--- |
| `planner_events` | `allow read, write: if true` | `if isSignedIn()` | Any unauthenticated caller could read, alter or delete **every** teacher's diary entry. |
| `illustrations` | `allow read: if true` | `if isSignedIn()` | The library's prompts and image URLs were world-readable. |

The rules are the deployed contract, so **these fixes take effect only after
`bash scripts/deploy-firestore-rules.sh` is run against the Firebase project.** `tests/firestore-rules.test.ts`
now fails the build if any allowance is granted to an unauthenticated caller, and the obligation is recorded in `AGENTS.md` §7.3 for future contributors.

Remaining coarse-grained policies (any authenticated user can read/write) are listed in §14 item 13.

### 9.4 Role capability matrix (functional)

| Capability | Teacher | Student | Parent | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Content generation studio | ✅ | ✅ (study notes/practice) | — | ✅ |
| Class & roster management | ✅ | — | — | ✅ |
| Autograding | ✅ | practice only | — | ✅ |
| AI tutor | ✅ | ✅ | — | ✅ |
| Progress analytics | class/school scope | own | own child | school-wide |
| Intervention/IDP authoring | ✅ | read-only | read-only | ✅ |
| Communication | ✅ | ✅ | teacher chat | ✅ |
| Administration/archive | — | — | — | ✅ |

*(Functional access as exposed by the navigation maps in `src/App.tsx`.)*

---

## 10. Non-Functional Requirements

### 10.1 Performance

- **First load**: app shell is code-split by route/feature; splash video is excluded from PWA precache specifically to avoid a ~6 MB first-load download.
- **Generation latency**: dominated by provider response time; the UI uses progress dialogs, export progress and loading mascots to keep long operations legible. Gemini fallback caching and a 16,384-token output budget reduce truncation/retries.
- **Images**: generated once and cached by the browser/proxy; the `/api/image-proxy` route avoids CORS-related re-fetches.
- **Android**: `isLowMemoryDevice()` lowers PDF raster scale; `android-webview` / `in-webview` classes disable expensive backdrop-blur/animations.

### 10.2 Reliability

Layered graceful degradation:

1. Preferred AI provider → automatic Gemini fallback.
2. Gemini primary model → ordered fallback chain with backoff and a 60-second failure window.
3. Image provider graph → Pollinations URL of last resort.
4. Video pipeline → bundled educational MP4.
5. ILDP → local deterministic generator when Gemini is unconfigured.
6. Firestore permission failures → `localStorage` mirrors for affected dashboards.
7. Export failures → safety net removes stuck overlays and routes to native share on Android.

### 10.3 Offline capability

- PWA shell precache (JS/CSS/HTML/icons/fonts).
- Firestore persistent cache for previously-read data.
- IndexedDB for study notes and generic cache.
- Offline sync indicator with a four-state status (`idle`, `syncing`, `offline`, `error`) surfaced in the shell.
- AI, image, video and most writes require connectivity by nature.

### 10.4 Security

See §13. Highlights: ABAC rules (hardened 2 Oct 2026), per-client API rate limiting,
a repository secret scanner wired into CI, a protected keystore, no server-side secret exposure
to the client bundle except the deliberate native fallback keys (§13.3).

### 10.5 Accessibility and inclusivity

- High-contrast layouts, large primary-grade typography, double-spaced handwriting blocks.
- Reading mode modal, TTS (voice) support and text scaling in generated materials.
- Dark mode across the app.
- Inclusive differentiation (SIAS/WP6) embedded in generated content.
- Accessibility is implemented by design and manual review; **no formal WCAG audit or automated a11y test suite exists yet**.

### 10.6 Localisation

South African English, ZAR currency, DD/MM/YYYY dates, local names/context. Foundation Phase templates are "bilingual-label ready". There is no i18n framework or additional locale bundles.

### 10.7 Compatibility

- Modern evergreen browsers (Chromium, Firefox, WebKit) on desktop and mobile.
- PWA install on Android and desktop; iOS is **not** a packaged Capacitor target (no `@capacitor/ios` dependency), and iOS PWA use is subject to Safari's platform limitations.
- Android WebView via Capacitor 6; CI builds with Android SDK 34 / Java 17. Android-specific export and download paths are handled by the native bridge.
- Node.js 20+ for local development (CI uses Node 22).

### 10.8 Scale and capacity

- Targeted at classroom/school scale; Firestore scales elastically.
- The API tier is stateless except for in-memory job/subscription maps, so it scales horizontally on Vercel but **cross-instance state is not shared** (see §14).
- Image/database document sizes are bounded by Firestore limits and rules-validated string lengths.

---

## 11. Build, Configuration and Operations

### 11.1 Environment variables

| Variable | Required | Used by | Notes |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` (aliases `GOOGLE_AI_API_KEY`, `GOOGLE_GENAI_API_KEY`, `VITE_GEMINI_API_KEY`) | ✅ | Server + client | Primary text/vision/image engine. |
| `ALIBABA_API_KEY`, `ALIBABA_API_BASE` (aliases `DASHSCOPE_*`) | optional | Server + native | Qwen 3.8 Max via Model Studio. |
| `NVIDIA_API_KEY` (alias `NVIDIA_API_TOKEN`) | optional | Server + native | Nemotron text + Qwen-Image. |
| `OCR_SPACE_API_KEY` | optional | Server/native | Secondary OCR. |
| `HUGGINGFACE_API_KEY` / `HF_TOKEN` | optional | Server | HF TTS/inference. |
| `REPLICATE_API_TOKEN` | optional | Server | Replicate video. |
| `ELEVENLABS_API_KEY` | optional | Client | Voice provider. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | optional | Server | Web Push; when absent the API reports `{ enabled: false }`. |
| `APP_URL` | optional | Server | Self-referential links/OAuth. |
| `NODE_ENV`, `PORT`, `VERCEL` | platform | Server | `VERCEL` disables `app.listen`; dev mode mounts Vite. |
| `RATE_LIMIT_DISABLED` | optional | Server | Set to `true` to switch off the `/api` rate limiter (not recommended in public deployments). |

`.env.example` documents the supported set. Firebase web configuration is committed in `firebase-applet-config.json` (web API keys and config are public identifiers, protected by Firebase security rules and API-key restrictions).

### 11.2 Build pipeline

```text
npm run build
├── vite build                     → dist/            (client bundle, PWA service worker)
└── esbuild server.ts --bundle
      --platform=node --format=cjs
      --packages=external --sourcemap
      --outfile=dist/server.cjs    → dist/server.cjs (server bundle)
```

`npm start` runs `node dist/server.cjs`. `npm run lint` runs `tsc --noEmit` over the whole project.

### 11.3 Android CI pipeline

`.github/workflows/build-android2.yml` (push to `main` or manual dispatch):

1. Checkout → Node 22 → Java 17 → Android SDK 34.
2. `npm ci` → `npm run build`.
3. `npx cap add android` → `@capacitor/assets generate` (icons/splash, `#060b18`) → `npx cap sync android`.
4. `node scripts/wire-google-signin.mjs` (native Google Sign-In config).
5. Copy the stable debug keystore and print its SHA-1/SHA-256.
6. `./gradlew assembleDebug` → rename to `EduAI-Companion.apk`.
7. Upload artifact, create a GitHub Release with registration fingerprints, and force-push the APK to the `apk-artifacts` branch.

### 11.4 Firestore rules deployment

`bash scripts/deploy-firestore-rules.sh` deploys `firestore.rules` to the project configured in `.firebaserc` using the Firebase CLI. Until this is run, newly added collections are denied at runtime.

### 11.5 Observability

- `/api/health` for liveness.
- Structured console logging with explicit prefixes (`[AI Routing]`, `[IMAGE GEN LOG]`, `[Image Gen]`).
- `failedRequestsLog` keeps the last failed provider requests in memory (provider, endpoint, model, error, payload) for diagnostics — it is **not persisted or exported**.
- `@vercel/analytics` provides web traffic analytics.
- No APM/tracing, error-reporting service or alerting is configured.

### 11.6 Release and rollback

- **Web/API**: Vercel deployments are atomic; rollback is a redeploy/alias of the previous build.
- **Android**: release per CI run (`apk-<run_id>`); the `apk-artifacts` branch always holds the latest APK. Rolling back means re-publishing an earlier release asset.
- **Rules**: Firestore rules are versioned in Git; redeploy the desired revision to roll back.
- **PWA**: `registerType: 'autoUpdate'` updates the service worker on next load; a stale cached shell can be resolved by a hard refresh (the SW takes over on the following navigation).

---

## 12. Quality Assurance

### 12.1 Automated checks present

| Check | Command | Coverage |
| :--- | :--- | :--- |
| **Full pipeline** | `npm run ci` (`scripts/ci.sh`) | The five stages below, in order, fail-fast. `--skip-build` shortens the loop. |
| **Secret scan** | `npm run scan:secrets` | Dependency-free scan of the working tree for credential-shaped material; fails on anything outside the reviewed allowlist (`scripts/scan-secrets.mjs`). |
| Type checking | `npm run lint` | Entire TS/TSX codebase (`tsc --noEmit`). |
| **Unit tests** | `npm test` (`vitest run`) | 7 suites / 118 tests — see 12.2. |
| **Coverage** | `npm run test:coverage` | V8 coverage over `src/lib/**` and `src/services/**`. |
| Content-template contract | `npm run verify:template` | 101 assertions on template normalisation (single compliance labels, gradient banners, exact footer). |
| Production build | `npm run build` | Vite client + esbuild server compile. |
| Template demos | `npm run render:template-demo` | Regenerates the byte-comparable demos in `docs/`. |
| Firestore rules emulator suite | *(not yet wired)* | `@firebase/eslint-plugin-security-rules` is a dev dependency for rule linting. |

### 12.2 Test suite (added 2 October 2026)

Tests live in `tests/` and run with Vitest in a Node environment (see `vitest.config.ts`,
which deliberately does not load the PWA plugin). All tests are pure logic — no network,
no credentials, no emulator.

| Suite | Locks down |
| :--- | :--- |
| `ai-models.test.ts` | The FROZEN provider list and model slugs: Gemini primary/fallback chain order, `qwen3.8-max`, the three NVIDIA NIM Nemotron slugs, the NVIDIA-only endpoint rule, legacy-id aliasing, and the sibling-engine fallback graph. It also **parses `AGENTS.md` §1** and asserts the document and the registry agree value for value, so neither can drift. |
| `ai-routing.test.ts` | Provider fallback behaviour in `unifiedAiService`: alternative engine → Gemini re-route, Gemini quota → Qwen drop-through, non-quota errors surfacing instead of being masked, image-aware tutor refusal to fall back, OCR.space ↔ Gemini vision fallback. |
| `content-template.test.ts` | The ONCE / GRADIENT / FOOTER contract on arbitrary (messy) model output, idempotent wrapping, CAPS-code derivation per phase. |
| `sa-frameworks.test.ts` | Phase detection, NPA SBA/exam weights per phase, the 7-point rating scale, Bloom's distributions summing to 100%, subject/phase validation, the SIAS levels, and the full `validateCAPSCompliance` checklist. |
| `foundation-templates.test.ts` | The documented 28 templates split 6/10/6/6, unique ids, authored (non-placeholder) content, grade scoping, filtering, and error-free rendering of every template (including bilingual mode). |
| `firestore-rules.test.ts` | Deny-by-default posture, per-collection auth guards, no unauthenticated allowance anywhere, the critical invariants (uid pinning, role-escalation block, senderId ownership, tutor-session privacy) and identifier/string size caps. |
| `rate-limit.test.ts` | Limiter window/limit maths, per-key and per-rule isolation, retry hints, key eviction, endpoint-class budgets, client-key derivation, plus a wiring guard on the middleware in `server.ts`. |

### 12.3 CI (GitHub Actions)

`.github/workflows/ci.yml` runs the same five stages on every pull request and push to
`main`, uploads the JUnit report (always) and the production bundle (on `main`).

> ⚠️ The workflow file is delivered as [`docs/ci.workflow.yml`](docs/ci.workflow.yml) because the
> Arena GitHub App token cannot push to `.github/workflows/*` (the same reason
> `docs/build-android2.workflow.yml` exists). Install it with a single paste, as described
> in the file header, or run the identical pipeline locally with `npm run ci`.

### 12.4 Testing gaps (remaining)

- **No end-to-end / browser tests** — the login → generate → export smoke path is still manual
  (Playwright is the recommended next addition).
- **No Firestore emulator suite** — `firestore.rules` is covered by static assertions only; the
  authoritative behavioural check is still the manual "Dirty Dozen" catalogue in `security_spec.md`.
- No automated accessibility, performance or visual-regression testing.

### 12.5 Suggested manual regression matrix (current practice)

1. Sign in as each of the four roles (email, Google, anonymous).
2. Generate each content type and export to PDF/DOCX/ZIP (web + Android).
3. Autograde an image and a typed submission; verify marks/feedback persist.
4. Create a class, add learners, run an intervention plan, publish a report.
5. Verify offline behaviour: load once, go offline, reopen dashboards and study notes.
6. Verify push notification subscription with/without VAPID keys.
7. Verify Foundation Phase studio renders and prints all 28 templates.
8. Verify Android Google Sign-In on a fresh install (code 10 means fingerprint/client mismatch).

---

## 13. Security and Privacy Considerations

### 13.1 Controls in place

- Firestore ABAC rules with field validation, immutability checks, size caps and role-escalation protection; adversarial catalogue in `security_spec.md` ("The Dirty Dozen").
- Firebase Auth handles credential storage and token issuance; no passwords touch the app server.
- Google Sign-In identity is pinned to a specific Web client ID and Android package + SHA-1; the keystore is treated as immutable (`AGENTS.md` §2).
- Web Push subscriptions are validated and expired endpoints (404/410) are pruned.
- 50 MB body limit is deliberate but should be paired with rate limiting in a public deployment (see below).

### 13.2 Known risks

| Risk | Detail | Recommended mitigation |
| :--- | :--- | :--- |
| **Unauthenticated API** | `/api/*` routes (including AI, image, video, push) do not verify Firebase ID tokens and have no rate limiting or quota. Anyone who discovers the deployment can consume provider quota. | Add Firebase ID-token verification middleware, per-user quotas/rate limits, and origin allow-listing. |
| **Client-embedded provider keys** | `src/lib/aiSecrets.ts` ships obfuscated fallback keys so the standalone APK works without a backend. Keys embedded in a client bundle or APK are extractable. | Restrict/rotate keys, prefer a token-issuing proxy, and never ship a public production build with committed keys. |
| **In-memory state** | Video jobs and push subscriptions live in process memory; they are lost on restart and not shared across serverless instances. | Move to Firestore/Redis for durable, shared state. |
| **No CSP/helmet headers** | Express sets none; generated HTML is rendered via `rehype-raw`/dangerously-set HTML paths. | Add `helmet` + a strict CSP, and sanitise generated HTML server-side. |
| **PII in Firestore** | Learner names, parent contacts and assessment data are stored. POPIA requires purpose limitation, access control and retention discipline. | Document retention policy, add data-export/erasure tooling, review rules periodically. |

### 13.3 Secrets handling

- `.env` is git-ignored; `.env.example` contains placeholders only.
- `env-info.json` at the repo root contains environment metadata with all credential values redacted (`[REDACTED]`) — safe to retain, but should be reviewed before public release.
- The deliberate exception is `src/lib/aiSecrets.ts`, which embeds reversed keys for native builds; its own header comment states this is acceptable only for private/personal use, not public distribution.

---

## 14. Known Limitations and Technical Debt

**Status key** — ✅ addressed · 🟡 partially addressed · ⬜ open.
The right-hand column records what was done, on which date, and what remains.

| # | Item | Status | Resolution / remaining work |
| :--- | :--- | :--- | :--- |
| 1 | No automated test suite | ✅ | **Fixed 2 Oct 2026.** Vitest 3 is configured (`vitest.config.ts`, `tests/`) with 7 suites / 118 tests covering AI model routing and fallback, the frozen provider registry, the content-template contract, CAPS/NPA/SIAS frameworks, the 28 Foundation Phase templates, Firestore rule invariants and rate limiting. `npm test` runs them; `npm run test:coverage` reports V8 coverage. *Remaining:* browser-level end-to-end tests (Playwright) for login → generate → export. |
| 2 | Unauthenticated API | 🟡 | **Mitigated 2 Oct 2026** with a dependency-free, per-client rate limiter on `/api` (§6.3) — AI 30/min, images 20/min, video 10/min, media 40/min, general 120/min — returning `429` + `Retry-After`. *Remaining:* Firebase ID-token verification and per-user quotas. The limiter is per process, so horizontally scaled deployments see `max × instances`. |
| 3 | `server.ts` is a 2.4k-LOC monolith | 🟡 | **Partially addressed 2 Oct 2026:** the frozen model list, endpoints, slugs, legacy aliases and fallback graph now live in one registry, `src/lib/aiModels.ts`, consumed by `server.ts`, `multiAiService.ts`, `AiContext.tsx` and `App.tsx`. *Remaining:* extract `/api/ai`, `/api/media` and `/api/notifications` into Express routers. |
| 4 | In-memory job/subscription state | ⬜ | Video jobs (`omniJobs`) and push subscriptions remain process-local: lost on restart and not shared between serverless instances. Persisting them requires care around the protected video pipeline (`AGENTS.md` §6) — plan as a dedicated change. |
| 5 | Legacy/scratch artefacts in repo root | ✅ | **Fixed 2 Oct 2026.** 102 one-off files (`fix_*`, `patch_*`, `update_*`, `test-*`, `fixes.patch`, env probes…) moved to `archive/legacy-scripts/` with a manifest in `archive/README.md`; `tsconfig.json` excludes the folder. |
| 6 | `package.json` name is `react-example` | ✅ | **Fixed 2 Oct 2026.** Renamed to `eduai-companion`, version set to `1.0.0`, a description added, `engines.node >= 20` declared, and both lockfiles refreshed/updated. |
| 7 | Optional server assemblers (`docx`, `puppeteer`, `jszip`) are not dependencies | ⬜ | Server-side DOCX/PDF/ZIP still degrade to the client-side renderer. Either declare them or document the intended deployment subset. |
| 8 | Provider costs depend on external free tiers | ⬜ | NIM / Gradio / Perchance endpoints can rate-limit or change without notice. The documented fallback graphs and the new rate limiter reduce exposure; production SLAs need paid tiers. |
| 9 | Frozen model list required coordinated edits in four files | ✅ | **Fixed 2 Oct 2026.** `src/lib/aiModels.ts` is now the single source of truth and `tests/ai-models.test.ts` fails CI on any drift from `AGENTS.md` §1. `AGENTS.md` §1 now documents the registry as the single source of truth and names `src/lib/aiModels.ts` in its file list; a new `AGENTS.md` §7 ("Repository Guardrails") records the CI gate, secret-scanning, rules-deployment and rate-limit obligations. |
| 10 | No i18n framework | ⬜ | South African English only. Introduce a message catalogue before hard-coding more copy if multilingual rollout is required. |
| 11 | GitHub App token cannot push workflow edits | 🟡 | **Confirmed again 2 Oct 2026** by a probe push (rejected with "refusing to allow a GitHub App to create or update workflow … without `workflows` permission"). The CI workflow is therefore delivered as a paste-in template at `docs/ci.workflow.yml`, following the existing `docs/build-android2.workflow.yml` convention. *Remaining:* grant the integration `workflows` permission, or paste both files in manually. |
| 12 | Documentation drift | 🟡 | README and this specification were rewritten from source on 2 Oct 2026, and `MANUAL_PUSH.md` was annotated as historical. *Remaining:* `CAPS_LESSON_PLAN_GUIDE.md` still references older service names — review at the next release. |
| 13 | Coarse-grained Firestore policies | ⬜ | Several collections use `allow read, write: if isSignedIn()` (any authenticated user): `students`, `assignments`, `submissions` (create/update), `learner_interventions`, `portfolio_items`, `student_records`, `collaborative_projects`, `collaborative_cursors`, `notifications`, `auto_grading_reports`, `published_reports`, `activity_logs`, `messages`, `messenger_messages`. A learner account can therefore read/write more than it should. Tightening requires role/ownership fields on write **and** scoped queries on read — a data-model change to schedule deliberately. |
| 14 | Planner events are shared school-wide | ⬜ | Follow-on from the hardening above: `planner_events` now requires authentication, but the client writes no owner field and queries the whole collection, so every signed-in user still sees every event. Per-teacher scoping needs an `ownerId` on write plus a scoped query. |
| 15 | Rules fixes must be deployed to take effect | ⬜ | The two vulnerabilities closed in `firestore.rules` (see §9.3) are only live once `bash scripts/deploy-firestore-rules.sh` is run against the Firebase project. |
| 16 | Embedded client fallback keys | ⬜ | `src/lib/aiSecrets.ts` still ships obfuscated provider keys for native builds (§13.3). A scanner now prevents *new* leaks, but removing these requires a token-issuing proxy and key rotation — a deliberate, coordinated change. |

---

## 15. Recommended Roadmap

Prioritised engineering recommendations, with the work completed on **2 October 2026** recorded
so the remaining items stay honest. Status key: ✅ done · 🟡 partly done · ⬜ open.

| # | Recommendation | Status | What landed / what is left |
| :--- | :--- | :--- | :--- |
| 1 | **Secure the API edge** — token verification, per-user quotas, helmet + CSP, smaller request limits, abuse alerting | 🟡 | Rate limiting is live (§6.3): per-client budgets per endpoint class, `429` + `Retry-After`, `X-RateLimit-*` headers, `RATE_LIMIT_DISABLED` override. **Left:** Firebase ID-token verification (needs admin credentials), helmet + CSP, reducing the 50 MB body limit, and alerting. |
| 2 | **Introduce automated tests** — prompt engine, template normalisation, provider fallback, Firestore rules, E2E smoke | 🟡 | Vitest suite (7 files / 118 tests) covers routing & fallback, the frozen registry, the template contract, CAPS frameworks, the Foundation Phase library, rule invariants and rate limiting; `npm test` / `npm run test:coverage`. **Left:** Playwright smoke for login → generate → export, and emulator-backed rule tests. |
| 3 | **Refactor `server.ts`** — routers + a single model registry | 🟡 | `src/lib/aiModels.ts` is now the one place the frozen provider list, endpoints, slugs, legacy aliases and sibling-engine graph live, consumed by both server and client. **Left:** extract `/api/ai`, `/api/media`, `/api/notifications` routers. |
| 4 | **Durable job and push state** — Firestore-backed video jobs and push subscriptions | ⬜ | Deferred deliberately: the video pipeline is protected by `AGENTS.md` §6 and push subscriptions are low-volume. Plan as a dedicated change. |
| 5 | **Repository hygiene** — archive scripts, rename the package, run lint/build/verify in CI | ✅ | 102 scratch files archived to `archive/legacy-scripts/`; package renamed to `eduai-companion` (v1.0.0) with refreshed lockfiles; `scripts/ci.sh` runs secret scan → `tsc` → tests → template contract → build, mirrored by `docs/ci.workflow.yml`. |
| 6 | **Secrets hardening** — remove embedded keys, rotate, add scanning | 🟡 | `scripts/scan-secrets.mjs` (dependency-free, 10 rule families, justified allowlist) runs first in CI and fails on new leaks; `src/lib/aiSecrets.ts` is a documented, reviewed exception. **Left:** remove the embedded keys via a token-issuing proxy and rotate them. |
| 7 | **Accessibility & performance audit** — WCAG 2.2 AA, Lighthouse budgets | ⬜ | Not started. The largest JS chunk is ~5.8 MB (1.6 MB gzipped) and PWA precache is ~44 MB, so code-splitting and payload budgets are the obvious first wins. |
| 8 | **POPIA operationalisation** — retention, export/erasure workflows, incident process | ⬜ | Not started; requires product/legal input rather than code alone. |

**Recommended next three changes** (highest value per unit of risk):

1. Verify Firebase ID tokens on `/api/*`, keeping the rate limiter as defence in depth.
2. Add Playwright smoke tests for the login → generate → export path on web and Android WebView.
3. Scope `planner_events` (and the other coarse collections in §14 item 13) to their owning teacher,
   including the client-side owner field and query changes.

---

## Appendix A — Endpoint quick reference

```text
GET  /api/health
POST /api/ai/:provider                 { messages, model?, temperature?, max_tokens?, stream? }
POST /api/ocr                          { image, language? }
POST /api/tts/google                   { text, lang }
GET  /api/tts/proxy?url=…
POST /api/tts/hf                       { text, model }
POST /api/images/generate              { prompt, provider? }
POST /api/images/qwen-generate         { prompt, placement?, grade?, subject?, saContext? }
GET  /api/image-proxy?prompt=…&seed=…&width=…&height=…
POST /api/video/generate               { prompt, model }
GET  /api/video/status/:id
POST /api/sa/generate-package          { request, provider?, generateImages? }
POST /api/reports/ildp                 { studentName, grade, subjects }
POST /api/gemini/action                { action, input, stream? }
GET  /api/notifications/vapid-public-key
POST /api/notifications/subscribe      { subscription, userId? }
POST /api/notifications/unsubscribe    { subscription }
POST /api/notifications/test-send      { title?, body?, url?, userId? }
GET  /splash.mp4
```

## Appendix B — Firestore collections

`users` (+ `archive`, `videoHistory`) · `students` · `classes` · `study_groups` · `collaborative_projects` · `collaborative_cursors` · `communicator_messages` · `direct_messages` · `messages` · `messenger_messages` · `ai_tutor_sessions` · `ai_floating_sessions` · `created_content` · `lessons` · `illustrations` · `assignments` · `submissions` · `auto_grading_reports` · `published_reports` · `learner_interventions` · `portfolio_items` · `student_records` · `omnihuman_videos` · `notifications` · `activity_logs` · `planner_events`

## Appendix C — Glossary of project-specific terms

| Term | Meaning in this codebase |
| :--- | :--- |
| **Content Factory / Content Studio** | The teacher content-generation module (`ContentCreator`). |
| **CAPS Template Studio** | Foundation Phase (R–3) printable template browser/print surface (`FoundationPhaseTemplateStudio`). |
| **Communicator Hub** | The messenger/chat module (`Messenger`). |
| **Autograder** | OCR/typed submission marking pipeline (`AutoGrading`, `OCRScanner`). |
| **Learning Development Hub** | Learner-facing IDP/ILDP view (`StudentDevelopmentHub`). |
| **Intervention Hub** | Teacher SIAS planning and learner-support console (`LearnerInterventionHub`). |
| **OmniHuman job** | Video generation job tracked by `omni-<timestamp>` id. |
| **Template normalisation** | `wrapWithTemplate()` canonicalisation enforcing ONCE / GRADIENT / FOOTER. |
| **Native bridge** | The `main.tsx` installers that adapt exports/images/downloads to the Android WebView. |

---

*End of specification. Changes to AI model routing, bundled assets, prompt templates or frozen UI designs must follow the constraints in [`AGENTS.md`](AGENTS.md).*
