# 🔧 EduAI Companion: Battle-Tested Prompt Engineering System (v4.0)

This document provides a comprehensive overview of **EduAI Prompt Engineering Framework v4.0**, detailing the modular components, pedagogical/visual strategies, prompt templates, validation mechanisms, and how to utilize the automated quality validator to ensure that all generated materials remain teacher-proud, parent-shareable, and immediately print-ready.

---

## 🏆 What's new in v4.0 — the World-Class Output Standard

Every prompt the application sends is now fronted by a single, model-agnostic
quality contract defined in **`src/lib/prompts/world-class-standard.ts`**. It is
prepended to the master prompt, to every content-type system prompt, to the
compressed (token-tight) prompt, and to the user-side prompt — so the same
publisher-grade bar applies no matter which engine is selected.

The standard has seven enforceable clauses:

| # | Clause | What it guarantees |
| :-- | :--- | :--- |
| 1 | **Completeness contract** | Whole artefact in one response. No `etc.`, `...`, stubs, "for brevity" summaries. Every question has a worked memo answer; every rubric cell has a descriptor. |
| 2 | **Factual & editorial precision** | SA English, correct subject notation and SI units, verified arithmetic, no invented references or statistics. |
| 3 | **Pedagogical rigour** | Real Bloom's progression, explicit CAPS content standards, named learner misconceptions confronted, substantive (not cosmetic) differentiation. |
| 4 | **Design & typographic excellence** | Deliberate hierarchy, consistent spacing scale, WCAG AA contrast, A4 print fidelity with no clipped or split blocks, phase-scaled type sizes. |
| 5 | **Voice & tone** | Warm, professional, inclusive; no filler and no marketing language inside a learning artefact. |
| 6 | **Reasoning hygiene** | Hybrid-thinking models (Nemotron 3 Ultra / 3.5 Lightning / Nano Omni) plan privately and emit only the finished deliverable — no `<think>` blocks, no "Here is the…" preamble. |
| 7 | **Silent pre-flight audit** | An eight-point internal checklist (completeness, arithmetic, CAPS alignment, cognitive spread, contrast, SA authenticity, banned phrases, advisor sign-off) that must pass before the model responds. |

A compact variant (`WORLD_CLASS_QUALITY_MANDATE_COMPACT`) is used on
token-tight paths such as chat turns and quick actions.

The validator enforces clauses 1 and 6 automatically — see
[Harnessing the Quality Validator](#-harnessing-the-quality-validator).

---

## 🤖 Engine-aware prompting

Prompts are compiled once and dispatched to whichever engine the user selected
in **Settings → AI Configuration**. The registry in `src/lib/aiModels.ts` owns
the per-engine sampling parameters, output ceilings and reasoning switches:

| Engine | Model slug | Context | Sampling | Reasoning |
| :--- | :--- | ---: | :--- | :--- |
| Nemotron 3 Ultra 550B | `nvidia/nemotron-3-ultra-550b-a55b` | 1M | temp 0.6 / top_p 0.95 | hybrid, off for structured output |
| Nemotron 3.5 Lightning 30B | `nvidia/nemotron-3.5-lightning-30b-a3b` | 1M | temp 1.0 / top_p 0.95 (NVIDIA-recommended) | hybrid, off for structured output |
| Nemotron 3 Nano Omni 30B | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | 256k | temp 0.6 / top_p 0.95, budget 16 384 | on by default (vision/OCR/document work) |
| Gemini 3.8 Flash | `gemini-3.8-flash` | 1M | temp 0.7 | n/a |
| Qwen 3.8 Max | `qwen3.8-max` | 262k | temp 0.7 / top_p 0.95 | n/a |

Because clause 6 is part of every prompt, and because
`stripReasoningTraces()` scrubs the response on both the server and the client,
a thinking model can never leak its scratchpad into a worksheet.

---

## 🎯 Architectural Overview

The Prompt Engineering System v4.0 transitions the application from raw text queries to a structured, rule-bound layout paradigm. By combining an enhanced master system prompt with domain-specific templates, the AI output is guaranteed to follow strict South African CAPS curriculum rules while rendering beautiful, high-contrast, professional-grade classroom materials.

### 📦 Core File Ecosystem
- **`src/lib/prompts/world-class-standard.ts`**: **(v4.0)** The World-Class Output Standard — the non-negotiable quality contract prepended to every prompt, plus the banned-phrase list used by the validator.
- **`src/lib/aiModels.ts`**: **(v4.0)** Central text-engine registry — model slugs, context windows, sampling defaults, reasoning switches, fallback chains and payload construction shared by the server and the client.
- **`src/lib/prompts/master-prompt.ts`**: Holds the comprehensive master system instruction governing layout structure, visual color schemes, grade-appropriate rules, and safety fallbacks.
- **`src/lib/prompts/content-templates.ts`**: Custom guidelines for generating highly layout-optimized, CSS-ready Classroom Worksheets, Subject Posters, Study Guides, and Bento Infographics.
- **`src/lib/prompts/admin-templates.ts`**: Holds guidelines for generating formal school documents, including Lesson Plans, Classroom Newsletters, and Policy Documents.
- **`src/lib/prompts/assessment-templates.ts`**: Coordinates highly structured, print-ready Classroom Tests, Memorandum keys, and Grade Rubrics.
- **`src/lib/prompt-engine.ts`**: Standardizes context binding, variable injection, and prompt compilation prior to dispatching model completions.
- **`src/lib/prompt-validator.ts`**: Automated heuristic evaluation engine that grades generated raw HTML/JSON on visual compliance, safety, curriculum tags, accessibility and **completeness**.
- **`scripts/validate-outputs.ts`**: Command-line developer script to test prompts locally and validate outputs against the quality heuristics.

---

## 🎨 Visual Layout & Phase Paradigm

### 1. The Visual Hierarchy System
Every dynamically generated worksheet must include specific structural regions defined directly with inline Tailwind CSS classes:
* **Subject Color-Coding**: Cool/warm gradients dynamically matching administrative and domain structures:
  - **Mathematics**: Teal & Blue Gradients (`from-teal-500 to-blue-600`)
  - **Natural Sciences**: Green & Turquoise Gradients (`from-emerald-500 to-teal-700`)
  - **Languages / Literacy**: Purple & Indigo Gradients (`from-purple-500 to-indigo-600`)
  - **Social Sciences / Life Skills**: Orange, Warm Amber & Gold Gradients (`from-amber-500 to-red-600`)
* **Metadata Badge**: Cheerful, high-contrast badges wrapping total marks (e.g., `TOTAL SCORE: _____ / 30`) inside borders matching the subject color palette.
* **Metadata Strip**: Elegant name, date, and grade dotted underline form lines for student signatures.
* **Tactile Matching Grids**: Interactive two-column rows replacing textual lists with elegant visual block pairing cards.
* **Handwriting Tracing Blocks**: Dotted-style letters (e.g., dotted lines bottom borders) with large typography for easy classroom tracing assignments.

### 2. Phase-Appropriate Customization
Language complexity, text size, and structural density scale automatically based on the requested South African educational phase:
- **Foundation Phase (Grade R-3)**: Large rounded typography (minimum 16pt equivalent), primary palettes, simple outline graphic containers, generous interactive white space mapping (min 1.5rem padding).
- **Intermediate Phase (Grade 4-6)**: Clean layouts (minimum 14pt), single distinct accent colors, visual process diagrams, and engaging "Challenge Corner" block stamps.
- **Senior Phase (Grade 7-9)**: Traditional structure (12pt), clear multi-level heading configurations, dual column layouts, formulas, and "Think Deeper" question blocks containing bulb icons.
- **FET Phase (Grade 10-12)**: Higher density exam format (11pt/12pt), academic styling, past-exam layout hierarchies, visible mark distributions, and margin note areas.

---

## 🔒 Safety & Pedagogical Guardrails

To protect student learners and uphold rigorous tutoring standards, all generated outputs must abide by strict procedural rules:
- **No Markdown in Visual Fields**: The system requires the model to output rich, structured HTML5 instead of dry, raw markdown text.
- **Diverse SA Identity representation**: Diverse South African names (e.g., Thabo, Liam, Zola, Priya, Sarah), local contexts, and local currency indicators (Rands, cents) must be incorporated.
- **Immediate Safeness Deflection**: Direct safety interceptors blocking inappropriate requests, replacing completions with educational growth-mindset redirections.

---

## 🚦 Harnessing the Quality Validator

Before deploying or previewing new worksheets, developers can validate content quality using the built-in validation suite.

### 1. Visual Heuristics & Scoring System
The `PromptValidator` rates output content out of 100 on the following metrics:
- **Tailwind Style Integrity**: Scans for valid layout grid declarations and structural containers.
- **Accessibility Compliance**: Validates semantic division tags and checking for high contrast ratios (color-contrast ratio $\ge 4.5:1$).
- **CAPS Meta Markers**: Verifies standard grade indicators, subject classifications, and instructional CAPS references.
- **Layout Safety**: Checks for forbidden raw text patterns and incomplete print layouts.
- **Completeness (v4.0)**: Hard-fails output containing banned placeholder phrases (`etc.`, `...`, `for brevity`, `content continues`, …), leaked `<think>` / `<reasoning>` markup, conversational preamble, unclosed `<html>` documents, or more than two unbalanced `<div>` elements.

### 2. Running the Validation locally
You can execute the built-in test suite directly via the Node terminal:

```bash
npx tsx scripts/validate-outputs.ts
```

This reviews sample documents inside the output repository, generating a complete console report indicating passed test scenarios, average score points, and targeted fix recommendations for any failed elements.

---
*Created and maintained under the EduAI Companion v4.0 specifications.*
