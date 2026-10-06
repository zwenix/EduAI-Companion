# 🎓 EduAI Companion

<div align="center">
  <img src="https://i.ibb.co/tTc5gG5k/eduaicompanion-logo2-preview-1772467621580-2-preview-1772473153046.png" alt="EduAI Companion Logo" width="120px" />
  <p>
    <strong>Personalized Learning, Powered by AI.</strong>
  </p>
  <p>
    A CAPS-aligned educational platform for South African schools that empowers teachers, engages learners and keeps parents informed.
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite 6">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript 5.8">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express" alt="Express 4">
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase" alt="Firebase 12">
  <img src="https://img.shields.io/badge/Capacitor-6-119EFF?logo=capacitor" alt="Capacitor 6">
  <img src="https://img.shields.io/badge/PWA-offline--ready-5A0FC8" alt="PWA">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google" alt="Google Gemini">
  <img src="https://img.shields.io/badge/AI-Qwen_3.8_Max-FF6A00" alt="Alibaba Qwen">
  <img src="https://img.shields.io/badge/AI-NVIDIA_Nemotron-76B900?logo=nvidia" alt="NVIDIA Nemotron">
</p>

---

## 🚀 Overview

**EduAI Companion** is a South African, CAPS-aligned learning platform. It combines a React single-page application, an Express API server and multiple large-language-model providers to automate teacher administration, generate classroom-ready teaching material, tutor and assess learners, and surface progress insight for parents.

Key characteristics of the product as it exists in this repository:

- **Four roles with tailored workspaces** — Teacher, Learner, Parent and Admin each get their own sidebar, dashboards and permissions.
- **CAPS-first content generation** — lesson plans, worksheets, study guides, assessments, memos, rubrics, posters and admin documents, tuned to the DBE curriculum and South African context (Rand, local names, provinces, indigenous flora and fauna).
- **Multi-model AI routing** — Google Gemini is the primary engine, with Alibaba Cloud Qwen 3.8 Max and NVIDIA NIM Nemotron models selectable, plus an automatic "route to Gemini" fallback path.
- **Runs on the web, as an installable PWA and as an Android APK** — one React codebase, shipped three ways.

> 📐 For the full architecture, API reference, data model and non-functional requirements, see **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)**.

---

## ✨ Core Features

### 👩🏫 Teacher workspace

| Module | Description |
| :--- | :--- |
| 📊 **Teacher Dashboard** | Command centre with showcase cards, class snapshots, pending work and quick links into every module. |
| 🧰 **Teacher's Toolbox** | The content factory: weekly planner, lesson planner / content studio, CAPS Template Studio (R–3), content archive and illustration library. |
| 🗓️ **Curriculum & Planning** | Weekly planner, lesson planner, teacher's diary, CAPS syllabus hub, planning reminders, printable template studio and resource archive. |
| 🤖 **Intelligent AI** | Socratic AI tutor (text + voice) and the Autograder (OCR or typed submissions graded against a rubric with detailed feedback). |
| 🏫 **Classes & Learners** | Class/roster management, seating, attendance, study groups, the SIAS-aligned Learner Intervention Hub (7 tabs, intervention plans, strategy library, support timetable) and Learner Profiles & Portfolios. |
| 📈 **Analytics & Reports** | Subject/term analytics, class performance charts, report comments, curriculum maps and the CAPS gamification hub. |
| 💬 **Message & Collaborate** | Communicator Hub chat with learners, parents and colleagues, plus a collaborative workspace. |
| 🔔 **Alerts & Diary Planner** | Notifications, reminders and personal planning entries. |
| 🎨 **CAPS Template Studio (Grade R–3)** | 28 ready-to-print Foundation Phase documents — 6 awards, 10 worksheets, 6 classroom exercises and 6 homework exercises — authored as data and rendered to A4 (offline gallery and "print all 28" mode included). |
| 🖼️ **Illustration & Video tools** | Educational illustration library, AI image generation and an avatar video lab. |

### 🎒 Learner workspace

| Module | Description |
| :--- | :--- |
| 🏠 **Student Dashboard** | Personal goals, streak, tasks and class updates. |
| 🧠 **AI Tutor** | Chat-based tutoring with a floating "ask me" bubble, reading mode and text-to-speech. |
| 🧪 **Practice Zone** | Generate practice questions on a topic, answer them, and receive instant diagnostic marking. |
| 📝 **Study Content Creator** | Turn notes and source documents into structured study material. |
| ✅ **Assigned Tasks & Notifications** | Homework, assessments and due-date reminders. |
| 📊 **My Progress Analytics / My Portfolio** | Scores over time, assessment history and a living portfolio of work. |
| 🤝 **Collaborative Workspace** | Shared study groups and group projects. |
| 🎮 **CAPS & Gamification Hub** | Quizzes, quests and progress trophies. |
| 🆔 **Individual Learning Development** | Personalised support plan (strengths, barriers, actions) visible read-only to the learner. |

### 👪 Parent & 🛡️ Admin workspaces

| Module | Description |
| :--- | :--- |
| 💙 **Parent Dashboard** | Child's progress, assessment results, portfolio items, teacher contacts and read-only intervention/ILDP information. |
| 🏫 **Admin Dashboard** | School-wide analytics, classrooms manager, student overview, content archive and moderation tools. |

### 🧾 Output, export and accessibility

- **Print / PDF / DOCX / ZIP exports** with a canonical A4 template (single compliance banner, gradient headers, exact footer) and an Android-safe native export bridge (filesystem + share sheet).
- **Offline resilience** — service-worker precaching, IndexedDB caching and `localStorage` mirrors so dashboards keep working when Firestore rules or the network are unavailable.
- **Push notifications** via Web Push (VAPID) and a custom service worker.
- **QR scanning** — scan a printed worksheet QR code to open its digital twin.
- **Bilingual-friendly, high-contrast, South African design language** with dark mode, large primary-grade typography and inclusive layouts.

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Language** | [TypeScript](https://www.typescriptlang.org/) ~5.8 | `tsc --noEmit` is the lint gate (`npm run lint`). |
| **UI framework** | [React](https://react.dev/) 19 + React DOM 19 | Single-page app; no Next.js/SSR. |
| **Build tool** | [Vite](https://vite.dev/) 6 (`@vitejs/plugin-react`) | Client bundle; Express middleware hosts Vite in development. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) 4 (`@tailwindcss/vite`) + `@tailwindcss/typography` | Design tokens are declared in `@theme` inside `src/index.css`. No ShadCN/UI. |
| **Animation & icons** | [Motion](https://motion.dev/) 12 (`motion/react`, `framer-motion`) and [lucide-react](https://lucide.dev/) | Hover/glow design system is deliberately frozen — see `AGENTS.md` §3b. |
| **Charts & rich content** | Recharts, KaTeX, react-markdown, marked, rehype-raw | Progress charts, LaTeX maths and generated HTML rendering. |
| **Server** | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) 4 (`server.ts`) | Serves the API, static assets and the SPA fallback; dev mode proxies Vite. |
| **Server dev/build** | `tsx` (dev), [esbuild](https://esbuild.github.io/) (build) | `npm run dev` → `tsx server.ts`; `npm run build` → Vite `dist/` + bundled `dist/server.cjs`. |
| **Testing & CI** | [Vitest](https://vitest.dev/) 3 (+ `@vitest/coverage-v8`), `scripts/ci.sh`, `scripts/scan-secrets.mjs` | `npm run ci` mirrors the GitHub Actions pipeline; tests live in `tests/`. |
| **Database & auth** | [Firebase](https://firebase.google.com/) 12 — Authentication + Cloud Firestore | Email/password, Google and anonymous sign-in. Firestore uses a persistent local cache with multi-tab support. Attribute-based access control lives in `firestore.rules`. |
| **Text AI** | Google Gemini (**primary**, `gemini-3.8-flash` with a fallback chain), Alibaba Cloud Model Studio `qwen3.8-max`, NVIDIA NIM Nemotron (Nano Omni 30B, Ultra 550B, 3.5 Lightning 30B) | Client-selectable in Settings; every alternative engine falls back to Gemini on failure. |
| **Image AI** | Perchance (keyless, primary) → Qwen-Image via NVIDIA NIM → Gemini image / Imagen 3 → Pollinations | Provider fallback graph is fixed in `src/lib/imageGeneration.ts`. |
| **OCR / grading** | Gemini vision (primary), OCR.space (secondary), `mammoth` for DOCX text extraction | Used by the Autograder and worksheet scanning flows. |
| **Voice / TTS** | Browser SpeechSynthesis, Hugging Face TTS, Google TTS proxy, Groq `whisper` (falls back to browser synthesis) | Selectable TTS provider in Settings. |
| **Video generation** | [OmniHuman-1](https://huggingface.co/spaces/multimodalart/self-forcing) over Hugging Face Gradio (`@gradio/client`); optional Replicate (`minimax/video-01`, `luma/ray`) | Falls back gracefully to bundled educational MP4 clips. |
| **Documents & export** | `html2pdf.js`, `jsPDF`, `html2canvas`, `archiver`, `docx`/`puppeteer` (optional server-side), JSZip | Server-side assemblers degrade to client-side when optional packages are absent. |
| **Offline / PWA** | `vite-plugin-pwa` (injectManifest + Workbox precaching), custom `src/sw.js`, `idb` | Installable PWA with web-push notification handling. |
| **Mobile** | [Capacitor](https://capacitorjs.com/) 6 Android (`com.eduaicompanion.app`) | `@codetrix-studio/capacitor-google-auth`, `@capacitor/filesystem`, `@capacitor/share`, `@capacitor/app`. |
| **Analytics** | `@vercel/analytics` | Web analytics on the Vercel deployment. |
| **Deployment** | Vercel (web/API) + GitHub Actions (Android APK) | `vercel.json` rewrites `/api/*` to the serverless function `api/index.ts`, which wraps `dist/server.cjs`. |
| **CI release** | `.github/workflows/build-android2.yml` | Builds the web bundle, syncs Capacitor, generates icons/splash, assembles and publishes the APK to GitHub Releases and the `apk-artifacts` branch. |

> ⚠️ Older revisions of this README claimed Next.js, Firebase Genkit, ShadCN/UI and React Hook Form + Zod. **None of those are used.** The application is a Vite + React SPA with an Express backend, plain Tailwind CSS 4, Firebase Auth/Firestore, and its own prompt-engineering layer.

---

## 🏗️ Architecture at a Glance

```text
┌───────────────────────────────────────────────────────────────────────┐
│  Clients                                                              │
│  • Web PWA (React 19 + Vite 6)      • Android APK (Capacitor 6)       │
│  • Desktop / laptop browsers        • Installed mobile PWA            │
└──────────────────────────────┬────────────────────────────────────────┘
                               │  HTTPS (same-origin /api/*)
┌──────────────────────────────▼────────────────────────────────────────┐
│  Express server (server.ts)                                           │
│  • /api/ai/:provider     → Gemini / Qwen / Nemotron routing + fallback│
│  • /api/ocr, /api/tts/*  → OCR and speech services                    │
│  • /api/images/*         → image generation providers                 │
│  • /api/video/*          → OmniHuman-1 / Replicate job orchestration  │
│  • /api/notifications/*  → Web Push (VAPID)                           │
│  • /api/sa/*, /api/reports/ildp, /api/gemini/action                   │
│  • Vite middleware (dev) or static dist/ + SPA fallback (prod)        │
└──────┬───────────────────────────────┬────────────────────────────────┘
       │                               │
┌──────▼───────────────┐      ┌────────▼───────────────────────────────┐
│  AI providers        │      │  Firebase                              │
│  • Google Gemini     │      │  • Authentication (email, Google, anon)│
│  • Alibaba Model     │      │  • Cloud Firestore (26 collections,    │
│    Studio (Qwen 3.8) │      │    ABAC rules, persistent local cache) │
│  • NVIDIA NIM        │      │  • Web Push subscriptions (server RAM) │
│  • Perchance /       │      └────────────────────────────────────────┘
│    Pollinations / HF │
└──────────────────────┘
```

---

## 🔧 Getting Started

### Prerequisites

- **Node.js 20+** (CI builds with Node 22)
- **npm** (the lockfile and CI use `npm ci`; a `bun.lock` is also present)
- A **Firebase project** with Authentication and Cloud Firestore enabled
- At least one AI API key — **`GEMINI_API_KEY` is required** for the primary engine

### 1. Configure environment variables

Copy `.env.example` to `.env` and fill in what you need. Only `GEMINI_API_KEY` is required for the core experience; every other key unlocks an optional provider.

| Variable | Purpose |
| :--- | :--- |
| `GEMINI_API_KEY` | **Required.** Google Gemini text, vision/OCR and image models. |
| `ALIBABA_API_KEY` / `ALIBABA_API_BASE` | Alibaba Cloud Model Studio — Qwen 3.8 Max (OpenAI-compatible endpoint). |
| `NVIDIA_API_KEY` | NVIDIA NIM — Nemotron text models and Qwen-Image generation. |
| `OCR_SPACE_API_KEY` | Optional secondary OCR engine. |
| `HUGGINGFACE_API_KEY` / `HF_TOKEN` | Hugging Face TTS and inference. |
| `REPLICATE_API_TOKEN` | Optional Replicate video generation. |
| `ELEVENLABS_API_KEY` | Optional voice provider. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push notifications (generate with `npx web-push generate-vapid-keys`). |
| `APP_URL` | Public URL of the deployment (self-referential links / OAuth). |

Firebase web configuration lives in `firebase-applet-config.json` (project `gen-lang-client-0448588221`).

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev          # tsx server.ts — Express + Vite middleware
```

The app is available at **http://localhost:3000**. (There is no `next dev` and no port 3000 Next.js server — the Express server binds `0.0.0.0:3000` and hosts Vite in middleware mode.)

### 4. Build and run for production

```bash
npm run build        # Vite client bundle + esbuild-bundled Express server
npm start            # node dist/server.cjs
```

---

## 📜 Available Scripts

| Script | What it does |
| :--- | :--- |
| `npm run dev` | Starts `server.ts` with `tsx` (Express API + Vite middleware). |
| `npm run build` | Builds the client with Vite and bundles the server to `dist/server.cjs` with esbuild. |
| `npm start` | Runs the production server from `dist/server.cjs`. |
| `npm run preview` | Serves the built client with `vite preview`. |
| `npm run lint` | Type-checks the entire codebase (`tsc --noEmit`). This is the quality gate. |
| `npm run clean` | Removes `dist/`. |
| `npm run build:fp-templates` | Builds the Foundation Phase template pack. |
| `npm run build:fp-pack` | Builds the self-contained, offline "portable pack" for Foundation Phase printables. |
| `npm run render:template-demo` | Renders the canonical content-template demos into `docs/`. |
| `npm run verify:template` | Runs the 191-check verification of the content template contract — ONE banner, two-colour gradient, merged banner data, exact footer (see `docs/CONTENT_TEMPLATE.md`). |
| `npm test` | Runs the unit test suite (Vitest) — AI routing/fallback, frozen model registry (+ parity with `AGENTS.md` §1), content template, CAPS frameworks, Foundation Phase templates, Firestore rules, rate limiting. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:coverage` | Test run with V8 coverage for `src/lib` and `src/services`. |
| `npm run scan:secrets` | Dependency-free credential scan (fails on keys outside the reviewed exceptions). |
| `npm run ci` | The full pipeline exactly as CI runs it: secret scan → type check → unit tests → template contract → production build. |

---

## ✅ Quality & CI

```bash
npm run ci               # everything CI runs, locally
npm run ci -- --skip-build   # fast loop: scan · types · tests · template contract
```

`scripts/ci.sh` runs five stages in order and fails fast:

1. **Secret scan** (`scripts/scan-secrets.mjs`) — blocks credential-shaped material
   outside the reviewed exceptions (documented in the script's `ALLOWLIST`).
2. **Type check** — `tsc --noEmit`.
3. **Unit tests** — Vitest (`tests/`), covering AI provider routing and fallback,
   the frozen model registry, the content-template contract, CAPS/NPA/SIAS
   frameworks, the 28 Foundation Phase templates, Firestore rule invariants and
   the API rate limiter.
4. **Content template contract** — the 191-check ONCE/GRADIENT/FOOTER + merged-banner-data check.
5. **Production build** — Vite client bundle + esbuild server bundle.

The GitHub Actions workflow that runs this on every pull request is kept at
[`docs/ci.workflow.yml`](docs/ci.workflow.yml) (see the header there for the
one-minute manual install — the same convention used by
`docs/build-android2.workflow.yml`).

---

## 🖥️ Platform Targets & Deployment

### Web + API (Vercel)

`vercel.json` maps every `/api/*` request to the serverless function `api/index.ts` (a thin wrapper around the esbuild-bundled `dist/server.cjs`, 60-second max duration) and rewrites all other paths to `index.html` for the SPA. The Android build uses `https://eduai-companion.vercel.app` as its backend base URL.

### Android APK (Capacitor + GitHub Actions)

`.github/workflows/build-android2.yml` runs on every push to `main`:

1. Builds the web bundle (`npm run build`).
2. Adds the Android platform and generates icons/splash (`@capacitor/assets`).
3. Syncs assets and wires native Google Sign-In configuration.
4. Signs with the committed debug keystore (`signing/android-debug.keystore`) so the SHA-1 fingerprint stays stable.
5. Assembles `EduAI-Companion.apk`, uploads it as an artifact, creates a GitHub Release, and publishes it to the `apk-artifacts` branch.

Google Sign-In setup and troubleshooting: **[GOOGLE_SIGNIN_ANDROID_SETUP.md](GOOGLE_SIGNIN_ANDROID_SETUP.md)**.

### Firestore security rules

The live Firestore project only enforces the rules that have been **deployed**. If the repo's `firestore.rules` is newer than what is deployed, newly-added collections (`learner_interventions`, `portfolio_items`, `student_records`, …) are denied and the browser shows `Missing or insufficient permissions`.

```bash
npm install -g firebase-tools   # once
firebase login                  # once
bash scripts/deploy-firestore-rules.sh
```

Until the rules are deployed, affected dashboards fall back to their `localStorage` mirrors.

---

## 🔒 Security, Privacy & Compliance

- **Firestore ABAC rules** (`firestore.rules`) enforce zero-trust invariants: users can only write their own profile, role self-escalation is blocked, messages must be sent by the authenticated `senderId`, and tutor sessions are private to their owner. The adversarial test catalogue ("The Dirty Dozen") is documented in [`security_spec.md`](security_spec.md).
- **South African compliance** — CAPS alignment, NPA 7-point rating codes, SIAS support levels, WP6 differentiation and POPIA-conscious practices (fictional learner names, no unnecessary PII) are built into the generation prompts and output templates. See [`SA_INTEGRATION_SUMMARY.md`](SA_INTEGRATION_SUMMARY.md).
- **Firestore rules hardening (2 Oct 2026)** — two wide-open rules were closed: `planner_events`
  allowed **unauthenticated** read/write of every teacher's diary, and `illustrations` allowed
  unauthenticated reads. Both now require an authenticated session. **Rules only take effect once
  deployed** — run `bash scripts/deploy-firestore-rules.sh` (see above). The remaining
  coarse-grained collections (`assignments`, `published_reports`, `auto_grading_reports`,
  `activity_logs`, `messages`, `messenger_messages`, `planner_events` scoping) are tracked as
  technical debt in the specification.
- **API rate limiting** — `/api/*` is an unauthenticated provider gateway, so a dependency-free
  in-memory limiter caps requests per client per minute by endpoint class (AI 30, images 20,
  video 10, OCR/TTS 40, everything else 120) and returns `429` with `Retry-After`. It is per
  process (documented limitation) and can be disabled with `RATE_LIMIT_DISABLED=true`.
  Full protection still needs Firebase ID-token verification — see the roadmap.
- **Secret scanning** — `npm run scan:secrets` fails the build when credential-shaped material
  appears outside the reviewed exceptions (the script prints its allowlist and reasons).
- **Secrets** — environment variables are the supported way to supply API keys. Note that `src/lib/aiSecrets.ts` contains obfuscated fallback keys so the standalone Android APK can call providers without a backend; this is documented as acceptable only for private/personal builds, because keys embedded in an APK or JS bundle can be extracted. **Do not ship a public production build with committed keys** — replace them with environment variables or a proxy.

---

## 📂 Project Structure

```text
.
├── server.ts                      # Express API + AI provider routing (single server entry)
├── api/index.ts                   # Vercel serverless wrapper around dist/server.cjs
├── index.html                     # SPA shell
├── src/
│   ├── App.tsx                    # Application shell, role-based navigation, page routing
│   ├── main.tsx                   # React entry, Android detection, export safety nets
│   ├── components/                # 55 feature and UI components (dashboards, hubs, studios)
│   ├── contexts/AiContext.tsx     # Selected AI/TTS/OCR/image provider state
│   ├── services/                  # Gemini client, unified AI routing, multi-AI, OCR, TTS
│   ├── lib/                       # Prompt engine, content templates, assemblers, offline DB
│   │   ├── compliance/            # CAPS / NPA / SIAS / WP6 / POPIA frameworks and prompts
│   │   ├── prompts/               # Master, content, assessment and admin prompt templates
│   │   ├── templates/             # SA HTML templates + Foundation Phase template library
│   │   ├── assemblers/            # PDF / DOCX / ZIP assembly
│   │   └── notifications/         # Web Push manager
│   ├── data/                      # Static educational data and how-to guides
│   └── assets/                    # Bundled images, overlays, splash video
├── public/                        # Static icons, overlays, illustrations, Foundation Phase packs
├── scripts/                       # Template packs, Android wiring, rules deployment
├── signing/                       # Stable Android debug keystore used by CI
├── firestore.rules                # Firestore ABAC security rules
├── firebase.json / .firebaserc    # Firestore rules deployment configuration
├── capacitor.config.ts            # Android app configuration
├── vite.config.ts                 # Vite + PWA + Tailwind configuration
├── vercel.json                    # Serverless + SPA rewrite configuration
└── docs/                          # Long-form engineering documentation
```

---

## 📚 Related Documentation

| Document | Contents |
| :--- | :--- |
| **[TECHNICAL_SPECIFICATION.md](TECHNICAL_SPECIFICATION.md)** | Full technical specification: architecture, API reference, AI routing, data model, security, NFRs and known gaps. |
| [AGENTS.md](AGENTS.md) | Binding project constraints: frozen model list and its registry (`src/lib/aiModels.ts`), protected assets, UI design freeze, prompt preservation, repository guardrails (§7: CI gate, secrets, Firestore rules, rate limiting). |
| [DESIGN.md](DESIGN.md) | Design system: colour tokens, typography, glassmorphism, grade-appropriate layouts and print blueprint. |
| [PROMPT_SYSTEM.md](PROMPT_SYSTEM.md) | The prompt-engineering framework, templates and output validator. |
| [SA_INTEGRATION_SUMMARY.md](SA_INTEGRATION_SUMMARY.md) | CAPS/NPA/SIAS/WP6/POPIA compliance integration summary. |
| [security_spec.md](security_spec.md) | Firestore attribute-based access control and adversarial payload catalogue. |
| [FOUNDATION_PHASE_TEMPLATES.md](FOUNDATION_PHASE_TEMPLATES.md) | The 28 Grade R–3 printable templates, how to print them and how to add a template. |
| [CAPS_LESSON_PLAN_GUIDE.md](CAPS_LESSON_PLAN_GUIDE.md) | Lesson-plan generation guide (FET Grades 10–12). |
| [GOOGLE_SIGNIN_ANDROID_SETUP.md](GOOGLE_SIGNIN_ANDROID_SETUP.md) | Android Google Sign-In identity, keystore fingerprints and troubleshooting. |
| [docs/CONTENT_TEMPLATE.md](docs/CONTENT_TEMPLATE.md) | The canonical content template contract (merged banner, gradient, footer). |
| [docs/TEMPLATE_PROMPTS.md](docs/TEMPLATE_PROMPTS.md) | Reverse-engineering report for the `assets/templates/` print templates and the built-in per-content-type generation prompts derived from them. |
| [docs/ci.workflow.yml](docs/ci.workflow.yml) | The CI workflow (paste-in template — the GitHub App token cannot push workflow files). |
| [archive/README.md](archive/README.md) | The archived one-off scripts from the early build, and why they are not part of the app. |
| [docs/android-export-print.md](docs/android-export-print.md) | Root-cause analysis of Android print/export behaviour and the native export fix. |

---

## 🤝 Contributing

The project was originally scaffolded in Google AI Studio and is maintained in this repository. Before changing AI model routing, bundled assets, prompt templates or the frozen card/menu styling, read [`AGENTS.md`](AGENTS.md) — those areas are explicitly protected and regressions there have user-visible consequences.

Recommended pre-PR checks:

```bash
npm run ci            # scan · types · tests · template contract · build
```

Faster iteration while developing:

```bash
npm run test:watch        # unit tests only
npm run ci -- --skip-build
```

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  Developed by <strong>Zwelakhe Msuthu</strong> &copy; 2026
</p>
