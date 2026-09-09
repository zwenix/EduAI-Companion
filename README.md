# 🎓 EduAI Companion

<div align="center">
  <img src="https://i.ibb.co/tTc5gG5k/eduaicompanion-logo2-preview-1772467621580-2-preview-1772473153046.png" alt="EduAI Companion Logo" width="120px" />
  <p>
    <strong>Personalized Learning, Powered by AI.</strong>
  </p>
  <p>
    An intelligent educational platform designed to empower teachers, engage students, and inform parents.
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.x-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18.x-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Firebase-v11-orange?logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v3-blue?logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/AI-Google_Gemini-blue?logo=google" alt="Google Gemini">
  <img src="https://github.com/zwenix/EduAI-Companion/actions/workflows/ci-cd.yml/badge.svg" alt="CI/CD">
</p>

---

## 🚀 Overview

**EduAI Companion** is a cutting-edge web application built to revolutionize the educational landscape in South Africa and beyond. By leveraging the power of Industry Leading AI Tools, it provides a suite of intelligent tools that automate administrative tasks for teachers, offer personalized support for students, and deliver insightful progress reports to parents.

Our mission is to reduce teacher burnout, make learning more accessible and engaging, and create a collaborative educational ecosystem.

## ✨ Core Features

EduAI Companion is packed with features designed for every user role:

| Feature | Description | Target Users |
| :--- | :--- | :--- |
| 🤖 **AI Content Generator** | Instantly create CAPS-compliant lesson plans, exercises, assessments, and posters for any grade, subject, and topic. | Teachers, Admins |
| ✍️ **AI Autograding** | Automatically grade submitted assignments using a custom rubric, providing instant, detailed feedback to students. | Teachers |
| 🔍 **OCR & Handwriting Recognition** | Upload a photo of a handwritten document or worksheet, and the AI will extract the text for digital use or grading. | Teachers, Students |
| 🧪 **Practice Assessments** | Students can generate mock tests on specific topics to prepare for exams, complete them, and receive an automated grade. | Students |
| 🏫 **Class & Student Management** | Teachers can create classes, manage student rosters, and view all class-related activities from a central dashboard. | Teachers |
| 📊 **Progress Reports** | Visualize student performance over time with charts and detailed breakdowns of assignment scores and feedback. | Teachers, Parents, Students |
| 📢 **Communication Portal** | Teachers can post announcements to an entire class, ensuring parents and students stay informed. | Teachers, Parents, Students |

## 🛠️ Tech Stack

This project is built on a modern, robust, and scalable technology stack:

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [ShadCN/UI](https://ui.shadcn.com/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, App Hosting)
- **Generative AI:** [Google Gemini](https://gemini.google.com/) via [Firebase Genkit](https://firebase.google.com/docs/genkit)
- **Form Management:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
- **Deployment:** [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## 🔧 Getting Started

To get this project running locally, follow these steps.

### Prerequisites

- Node.js (v20 or later recommended)
- `npm` or a compatible package manager
- A Firebase project with Firestore and Authentication enabled.
- A Google AI Gemini API key.

### 1. Set Up Environment Variables

Create a `.env` file in the root of your project and add your Gemini API key:

```
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

### 2. Install Dependencies

Install all the required packages using npm:

```bash
npm install
```

### 3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📜 Available Scripts

- `npm run dev`: Starts the application in development mode.
- `npm run dev:genkit`: Starts the Genkit development UI locally (requires `dotenv-cli`).
- `npm run build`: Creates a production-ready build of the application.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase for potential errors.
- `npm run genkit:dev`: Starts the Genkit development UI for testing AI flows.

## 📂 Project Structure

The codebase is organized to maintain a clean separation of concerns:

```
/src
├── ai/                # All Genkit AI flows and configuration
├── app/               # Next.js App Router pages and layouts
├── components/        # Reusable React components (UI, layout, etc.)
├── firebase/          # Firebase configuration, providers, and custom hooks
├── hooks/             # Custom React hooks
├── lib/               # Utility functions, type definitions, and static data
└── styles/            # Global CSS styles
```

## 🔄 CI/CD — fully automated

Every code change flows end-to-end with **zero manual intervention**, powered by [GitHub Actions](.github/workflows/ci-cd.yml):

```
push / PR ──► test (tsc + build + boot smoke test)
            ──► Docker build & push → GHCR (ghcr.io/zwenix/eduaicompanion)
            ──► auto semver → git tag vX.Y.Z + GitHub Release   (main only)
            ──► rolling Kubernetes deploy (kubectl set image)   (main only)
```

- **Versioning** is computed automatically from Conventional Commits
  (`feat:` → minor, `feat!:` / `BREAKING CHANGE` → major, everything else → patch)
  by [`scripts/compute-version.mjs`](scripts/compute-version.mjs).
  Images are tagged `<version>`, `<sha>` and `:latest` (main) / `:pr-<n>` (PRs).
- **Container**: multi-stage [`Dockerfile`](Dockerfile) (Vite build stage + lean Node 22 runtime, non-root, `/api/health` healthcheck).
- **Kubernetes**: manifests in [`deploy/k8s/base/`](deploy/k8s/base) (Namespace, Deployment with rolling update + probes, Service; optional Ingress).
- **One-time cluster setup** (namespace, app Secret, GitHub secrets) is a ~5 minute job — see **[docs/cicd.md](docs/cicd.md)**.
- _Activation note:_ the workflow file itself ships as the paste-ready template
  [`docs/ci-cd.workflow.yml`](docs/ci-cd.workflow.yml) — paste it to
  `.github/workflows/ci-cd.yml` via the GitHub web UI (one-time, ~1 minute;
  reason and exact steps in the template header).

## 🤝 Contributing

This project is developed and maintained in Google AI Studio. Contributions and suggestions are welcome! Please feel free to discuss changes and make recommendations.

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  Developed by <strong>Zwelakhe Msuthu</strong> &copy; 2026
</p>
