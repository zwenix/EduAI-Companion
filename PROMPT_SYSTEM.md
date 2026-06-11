# 🔧 EduAI Companion: Battle-Tested Prompt Engineering System (v2.0)

This document provides a comprehensive overview of **EduAI Prompt Engineering Framework v2.0**, detailing the modular components, pedagogical/visual strategies, prompt templates, validation mechanisms, and how to utilize the automated quality validator to ensure that all generated materials remain teacher-proud, parent-shareable, and immediately print-ready.

---

## 🎯 Architectural Overview

The Prompt Engineering System v2.0 transitions the application from raw text queries to a structured, rule-bound layout paradigm. By combining an enhanced master system prompt with domain-specific templates, the AI output is guaranteed to follow strict South African CAPS curriculum rules while rendering beautiful, high-contrast, professional-grade classroom materials.

### 📦 Core File Ecosystem
- **`src/lib/prompts/master-prompt.ts`**: Holds the comprehensive master system instruction governing layout structure, visual color schemes, grade-appropriate rules, and safety fallbacks.
- **`src/lib/prompts/content-templates.ts`**: Custom guidelines for generating highly layout-optimized, CSS-ready Classroom Worksheets, Subject Posters, Study Guides, and Bento Infographics.
- **`src/lib/prompts/admin-templates.ts`**: Holds guidelines for generating formal school documents, including Lesson Plans, Classroom Newsletters, and Policy Documents.
- **`src/lib/prompts/assessment-templates.ts`**: Coordinates highly structured, print-ready Classroom Tests, Memorandum keys, and Grade Rubrics.
- **`src/lib/prompt-engine.ts`**: Standardizes context binding, variable injection, and prompt compilation prior to dispatching model completions.
- **`src/lib/prompt-validator.ts`**: Automated heuristic evaluation engine that grades generated raw HTML/JSON on visual compliance, safety, curriculum tags, and accessibility.
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

### 2. Running the Validation locally
You can execute the built-in test suite directly via the Node terminal:

```bash
npx tsx scripts/validate-outputs.ts
```

This reviews sample documents inside the output repository, generating a complete console report indicating passed test scenarios, average score points, and targeted fix recommendations for any failed elements.

---
*Created and maintained under the EduAI Companion v2.0 specifications.*
