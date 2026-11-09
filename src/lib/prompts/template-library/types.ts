/**
 * EduAI Companion — Reverse-engineered content-type template library.
 *
 * Every generated document in the app is produced by a *content type* (Worksheet,
 * Lesson Plan, Formal Assessment, Poster, Flashcards, Letter to Parents …). The
 * best of those documents were designed by hand and live in
 * `assets/templates/**` — a mix of finished A4 PDFs and reference artwork.
 *
 * This module is the single, typed description of what those files actually
 * contain. Each `ContentTypeTemplate` records:
 *
 *   • the source files the anatomy was reverse-engineered from,
 *   • the fixed page anatomy (sections, in order, with the marks they carry),
 *   • the exact visual system (banner, grade badge, section bars, score card …),
 *   • the fixed micro-copy each document must print verbatim,
 *   • the piece of learner/teacher data that must never be invented,
 *   • and — the point of the whole exercise — a **built-in generation prompt**
 *     (`systemPrompt` + `buildUserPrompt`) that reproduces that document.
 *
 * The prompts are provider-agnostic plain strings: `server.ts`, the on-device
 * Gemini client and every alternative engine receive the identical brief.
 */

/** The families of document the library can build a prompt for. */
export type TemplateContentType =
  | 'worksheet'
  | 'formal-assessment'
  | 'lesson-plan'
  | 'study-guide'
  | 'poster'
  | 'phonics-chart'
  | 'tracing-worksheet'
  | 'flashcards'
  | 'infographic'
  /** Labelled models AND radiating concept maps share one template. */
  | 'diagram'
  | 'visual-lab'
  | 'admin-document'
  | 'timetable-planner'
  | 'marking-memo'
  | 'rubric';

/** One fixed block of a page, in reading order. */
export interface TemplateSection {
  /** Stable id used by tests and the anatomy doc. */
  id: string;
  /** Heading the section prints (English canonical). */
  heading: string;
  /** What the section must contain. */
  content: string;
  /** Exactly what the document must render, when it is contractual. */
  mustRender?: string[];
  /** Marks this section carries, when the section is marked. */
  marks?: number;
  /** True when the section is learner-facing writing space. */
  learnerWriting?: boolean;
}

/** Colours + typography measured from the reference files. */
export interface TemplateVisualSystem {
  /** Two-colour vertical banner gradient used by the reference documents. */
  bannerGradient: string;
  /** The palette id in `bannerPalettes.ts` this document belongs to. */
  paletteId: string;
  /** Grade badge treatment. */
  gradeBadge: string;
  /** Section-bar treatment. */
  sectionBar: string;
  /** Score-card treatment. */
  scoreCard: string;
  /** Body type ramp. */
  typography: string;
  /** Footer line the host prints (documents never invent their own). */
  footer: string;
}

export interface ContentTypeTemplate {
  /** Canonical content type name. */
  id: TemplateContentType;
  /** Every UI label / server alias that resolves to this template. */
  aliases: string[];
  /** Human title used in docs. */
  title: string;
  /** One-sentence purpose. */
  purpose: string;
  /** Reference files the anatomy was reverse-engineered from. */
  sources: string[];
  /** The fixed page anatomy, in order. */
  sections: TemplateSection[];
  /** Measured visual system. */
  visual: TemplateVisualSystem;
  /** Micro-copy that must be reproduced exactly. */
  fixedCopy: string[];
  /** Fields that are printed blank for handwriting, never pre-filled. */
  blankFields: string[];
  /** Rules that keep the document honest (no invented data). */
  guardrails: string[];
  /** The built-in system prompt. */
  systemPrompt: string;
  /** The built-in user prompt builder. */
  buildUserPrompt: (input: TemplatePromptInput) => string;
}

/** Everything a caller may supply when building a prompt. */
export interface TemplatePromptInput {
  grade?: string;
  subject?: string;
  topic?: string;
  term?: string;
  week?: string | number;
  language?: string;
  duration?: string;
  totalMarks?: number;
  classSize?: string | number;
  objectives?: string;
  resources?: string;
  learnerProfile?: string;
  teacherName?: string;
  schoolName?: string;
  additionalInstructions?: string;
  /** Visual Lab only: the requested visual artefact. */
  visualType?: string;
  /** Admin Lab only: the requested document. */
  documentType?: string;
  /** Number of cards / questions / steps when the type supports it. */
  quantity?: string | number;
  /** Paper size + orientation. */
  dimensions?: string;
  /** Illustration style label already resolved by `contentStyle.ts`. */
  illustrationStyle?: string;
  /** Image golden-rule suffix already resolved by `contentStyle.ts`. */
  imageGoldenRule?: string;
  /** True when the caller wants [Illustration: …] placeholders. */
  generateImage?: boolean;
}
