/**
 * EduAI Companion — Classic content prompt engineering
 *
 * Restored verbatim from commit 6d3f1d2 (`server.ts`, the `generate-caps`,
 * `generate-visual`, `generate-admin` and `generate-educational` actions).
 * These are the prompts that produced the vibrant, banner-first EduAI look.
 *
 * They are used whenever `resolveContentDesignStyle()` returns `'classic'`
 * (the default). The LIGHT Template v5 builders stay untouched and remain
 * available behind the same switch.
 *
 * The only deliberate deltas from the original are additive and provider-safe:
 * the JSON envelope hint the current pipeline needs, and the anti-truncation
 * mandate. Neither changes the requested design.
 */

import {
  CLASSIC_IMAGE_PROMPT_GOLDEN_RULE,
  CLASSIC_MASTER_SYSTEM_PROMPT,
  imageGoldenRule,
  type IllustrationStyle,
} from '../contentStyle';
import { currentSATerm, dateMandate } from '../saDates';
import {
  builtInContentTypePrompt,
  buildDocumentBannerPromptData,
  SINGLE_MERGED_BANNER_SYSTEM_PROMPT,
} from './template-derived-prompts';

/** The restored master doctrine, re-exported for prompt builders. */
export const CLASSIC_MASTER_PROMPT = CLASSIC_MASTER_SYSTEM_PROMPT;

/**
 * The classic doctrine plus TODAY's real date mandate.
 *
 * The restored 6d3f1d2 text is kept byte-for-byte in `contentStyle.ts`, so the
 * date rule is appended here rather than written into it. This is what every
 * classic builder actually sends — it guarantees a model reached through
 * `server.ts`, the on-device engine or the alternative-engine rescue all hear
 * today's date and the one-date rule.
 */
const classicSystemPrompt = (): string =>
  `${CLASSIC_MASTER_PROMPT}\n${SINGLE_MERGED_BANNER_SYSTEM_PROMPT}\n${dateMandate()}`;

/** The restored image golden rule, re-exported for prompt builders. */
export const CLASSIC_IMAGE_GOLDEN_RULE = CLASSIC_IMAGE_PROMPT_GOLDEN_RULE;

/* ────────────────────────────────────────────────────────────────────────────
 * generate-educational
 * ──────────────────────────────────────────────────────────────────────────── */

export const buildClassicEducationalPrompts = (input: {
  type?: string;
  details?: string;
}): { system: string; user: string } => {
  const type = input.type || 'educational material';
  const details = input.details || '';
  const typePrompt = builtInContentTypePrompt(type);
  const bannerData = buildDocumentBannerPromptData({ contentType: type });
  return {
    system: `${classicSystemPrompt()}\n\n${typePrompt}\n\nYour task is to generate high-quality educational materials: ${type}. The content must be CAPS-aware, professionally formatted as an HTML fragment with Tailwind CSS, and ready for classroom use. Do not create a second title banner, metadata strip, compliance row, or footer.`,
    user: `Generate a ${type} based on the following details: ${details}.\n\n${bannerData}\nUse the EduAI visual style in the body: vivid section headers, pill-shaped blocks, distinct sections, accessible contrast and a print-ready layout. Start with substantive content below the host's single merged title/metadata/compliance banner.`,
  };
};

/* ────────────────────────────────────────────────────────────────────────────
 * generate-caps — worksheets, study guides, assessments, lesson plans
 * ──────────────────────────────────────────────────────────────────────────── */

/** The restored study-guide mandate — the document must be notes, not a quiz. */
export const CLASSIC_STUDY_GUIDE_REQUIREMENTS = `
            CRITICAL STUDY GUIDE REQUIREMENTS:
            - This is a Study Guide/Learning Notes document. The primary content MUST be comprehensive, article-like, or textbook chapter-like notes.
            - Break down the concepts logically into paragraphs, using rich explanations that a learner can actually study from.
            - Include illustrations or visual aids (describe or embed them using CSS/HTML shapes, or leave marked spaces for the hero illustration).
            - You can include a few exercises, examples, or a worksheet section at the end, but the MAJORITY of the document must be the detailed educational reading material and notes.
            `;

/** True for the content types the classic doctrine treats as study notes. */
export const isClassicStudyGuide = (contentType?: string): boolean => {
  const value = (contentType || '').toLowerCase();
  return (
    value.includes('study guide') ||
    value.includes('learning notes') ||
    value.includes('revision') ||
    value.includes('daily lesson notes')
  );
};

export interface ClassicCapsInput {
  contentType?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  language?: string;
  objective?: string;
  learnerProfile?: string;
  additionalInstructions?: string;
  totalMarks?: number;
  term?: string;
  duration?: string;
  capsReference?: string;
  atpWeek?: number | string;
  school?: string;
  teacher?: string;
  learner?: string;
  illustrationStyle?: IllustrationStyle;
}

export const buildClassicCapsPrompts = (
  input: ClassicCapsInput,
): { system: string; user: string } => {
  const contentType = input.contentType || 'Worksheet';
  const studyGuideRequirements = isClassicStudyGuide(contentType)
    ? CLASSIC_STUDY_GUIDE_REQUIREMENTS
    : '';
  const goldenRule = imageGoldenRule(input.illustrationStyle);
  const typePrompt = builtInContentTypePrompt(contentType, input);
  const bannerData = buildDocumentBannerPromptData({
    contentType,
    grade: input.grade,
    subject: input.subject,
    topic: input.topic,
    term: input.term || currentSATerm(),
    duration: input.duration,
    totalMarks: input.totalMarks,
    atpWeek: input.atpWeek,
    capsReference: input.capsReference,
    school: input.school,
    teacher: input.teacher,
    learner: input.learner,
  });

  const system = `${classicSystemPrompt()}\n\n${typePrompt}\n\nGenerate high-quality ${contentType} for Grade ${input.grade || '4'} ${input.subject || ''}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be fully styled HTML. Use modern, beautiful Tailwind CSS styling directly in the class attributes for a professional, print-ready layout. Do not use Markdown.`;

  const user = `
            Type: ${contentType}
            Grade: ${input.grade || '4'}
            Subject: ${input.subject || ''}
            Topic: ${input.topic || ''}
            Term: ${input.term || currentSATerm()}
            Duration: ${input.duration || ''}
            Total Marks: ${input.totalMarks ?? ''}
            CAPS Reference (if supplied): ${input.capsReference || ''}
            ATP Week (if supplied): ${input.atpWeek ?? ''}
            Language: ${input.language || 'English'}
            Objective: ${input.objective || ''}
            Learner Profile: ${input.learnerProfile || ''}
            Additional Info: ${input.additionalInstructions || ''}

            ${bannerData}
            REQUIRED BODY DESIGN:
            - Begin with the first real learning section; the host merges this current title/header and all available metadata/compliance into one opening banner.
            - Do not generate another banner, page title, grade badge, metadata row, CAPS reference strip, compliance stamps or footer copy.
            - Use vivid subject-colour section headers, readable cards and generous print-safe answer space.
            - Add a relevant illustration only when it supports the requested artifact. If used, keep it after the host banner, make it topic-specific and use this style guide: ${goldenRule.trim()}
            - For learner-facing tasks, the host supplies the one empty Name / Grade / Date row; do not repeat or pre-fill it. Put an assessment score box in the body only when marks apply.
            - Question text should be clear and numbered; choices or matching items may use accessible pill-shaped boxes with sufficient contrast.
            - Never add compliance labels or a second title. Write complete HTML inside the JSON content values using Tailwind classes.
            ${studyGuideRequirements}
          `;

  return { system, user };
};

/* ────────────────────────────────────────────────────────────────────────────
 * generate-visual — posters, flashcards, infographics, mind maps, diagrams
 * ──────────────────────────────────────────────────────────────────────────── */

export const CLASSIC_VISUAL_SYSTEM_SUFFIX =
  `\n\nThe 'content' field in your JSON response MUST be stunningly designed HTML with Tailwind CSS. DO NOT use generic Markdown.`;

export interface ClassicVisualInput {
  visualType?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  language?: string;
  style?: string;
  colorScheme?: string;
  specificContent?: string;
  quantity?: string | number;
  term?: string;
  capsReference?: string;
  atpWeek?: number | string;
  school?: string;
  teacher?: string;
  illustrationStyle?: IllustrationStyle;
}

/** The restored poster blueprint, adapted to the single host-owned title banner. */
export const classicPosterBlueprint = (input: ClassicVisualInput): string => `
              Create a stunning, print-ready educational poster for South African Grade ${input.grade || '4'} ${input.subject || ''} learners on the CAPS topic: "${input.topic || ''}"

              DESIGN REQUIREMENTS (Based on EduAI Companion Templates):
              - HTML/Tailwind ONLY. Do not use markdown.
              - Layout: A clear central visual/illustration that teaches the topic, with 4–6 concise, accurate supporting facts or steps.
              - The host supplies the only title/banner; do not repeat the title inside the poster body.
              - Floating Fact Boxes: short, legible text with a strong outline, clean white space and a simple relevant visual cue (never emoji glyphs).
              - Visual hierarchy: clear reading path, accessible contrast and age-appropriate typography; no second header or footer.
              - Use South African context only when it directly clarifies the topic; keep all factual labels correct.
              Make it vibrant, instantly engaging, and classroom-ready.
            `;

/** The restored flashcard blueprint — double-sided grid, vibrant per card. */
export const classicFlashcardBlueprint = (input: ClassicVisualInput): string => `
              Design a set of professional, double-sided educational flashcards for Grade ${input.grade || '4'} ${input.subject || ''} on "${input.topic || ''}".

              DESIGN REQUIREMENTS:
              - Show consistently sized cards in a print-ready grid (2 or 3 per row).
              - Each front has one large retrieval cue and a short hint; each reverse has the concise answer/definition and a worked/contextual example when useful.
              - Use a clear front/back numbering system so a teacher can cut and pair the cards correctly.
              - Card style: rounded corners, thick colored borders, subtle shadow, large legible type.
              - No page-level title, duplicate banner, metadata strip or footer; the host supplies the single document banner.
            `;

/** The restored infographic / mind-map blueprint. */
export const classicInfographicBlueprint = (input: ClassicVisualInput): string => `
              Design a visually spectacular CAPS-aligned infographic/mind map on ${input.topic || ''} for Grade ${input.grade || '4'}.

              Requirements:
              - Central concept in the middle with radiating branches
              - Each branch has a meaningful, accurate label and useful visual cue
              - South African contextual examples only where they clarify the topic
              - Color-coded sections with perfect visual hierarchy and high contrast
              - Style: Modern flat design with subtle textures and depth
              - Do not add a second page title or document banner; the host supplies the title banner.
            `;

/** The restored diagram blueprint — the process in a real SA landscape. */
export const classicDiagramBlueprint = (input: ClassicVisualInput): string => `
              Create a crystal-clear, correctly labelled educational diagram of ${input.topic || ''} specifically adapted for South African Grade ${input.grade || '4'} learners.

              Show a relevant example in a real South African landscape when contextually useful (for example, water cycle, food chain, rock formations or local flora).
              Use correct arrows, direction, units and labels; do not force an unrelated landmark into the diagram.
              Style: Clean, legible, semi-realistic illustration with meaningful arrows and a simple key.
              The host supplies the title banner; do not generate a second page header or metadata strip.
            `;

/** The restored catch-all for visual types the doctrine did not specialise. */
export const classicGeneralVisualBlueprint = (input: ClassicVisualInput): string =>
  `Create a highly visual ${input.visualType || 'educational visual aid'} for Grade ${input.grade || '4'} ${input.subject || ''} on topic ${input.topic || ''}. Use accurate labels, readable print sizing, and no duplicate page title or banner.`;

/**
 * Pick the restored blueprint for a visual type. The matching rules preserve
 * the requested artifact shape rather than forcing every visual into a poster.
 */
export const classicVisualBlueprint = (input: ClassicVisualInput): string => {
  const value = (input.visualType || '').toLowerCase();
  if (value.includes('poster')) return classicPosterBlueprint(input);
  if (value.includes('flashcard') || value.includes('learning card')) return classicFlashcardBlueprint(input);
  if (value.includes('infographic') || value.includes('mind map')) return classicInfographicBlueprint(input);
  if (value.includes('diagram')) return classicDiagramBlueprint(input);
  return classicGeneralVisualBlueprint(input);
};

export const buildClassicVisualPrompts = (
  input: ClassicVisualInput,
): { system: string; user: string } => {
  const visualType = input.visualType || 'Educational Visual Aid';
  const visualPrompt = classicVisualBlueprint({ ...input, visualType });
  const goldenRule = imageGoldenRule(input.illustrationStyle);
  const typePrompt = builtInContentTypePrompt(visualType, input);
  const bannerData = buildDocumentBannerPromptData({
    contentType: visualType,
    grade: input.grade,
    subject: input.subject,
    topic: input.topic,
    term: input.term || currentSATerm(),
    capsReference: input.capsReference,
    atpWeek: input.atpWeek,
    school: input.school,
    teacher: input.teacher,
  });

  const system = `${classicSystemPrompt()}${CLASSIC_VISUAL_SYSTEM_SUFFIX}\n\n${typePrompt}`;
  const user = `
            ${visualPrompt}
            ${bannerData}
            Language: ${input.language || 'English'}
            Style: ${input.style || ''}
            Color: ${input.colorScheme || ''}
            Content Details: ${input.specificContent || ''}
            Quantity: ${input.quantity ?? ''}
            BANNER RULE: Keep the current document title/header, grade, subject, term, content type, date, CAPS reference and compliance data in the one host-generated opening banner. Do not print a second title, banner, metadata row or compliance line in the visual body.
            Additional Info: ${goldenRule.trim()}
          `;

  return { system, user };
};

/* ────────────────────────────────────────────────────────────────────────────
 * generate-admin — letters, notices, permission slips, newsletters
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ClassicAdminInput {
  documentType?: string;
  schoolName?: string;
  grade?: string;
  subject?: string;
  term?: string;
  tone?: string;
  purpose?: string;
  keyPoints?: string;
  recipient?: string;
  timeDate?: string;
  venue?: string;
  classTeacher?: string;
  schoolPrincipal?: string;
  includeReplySlip?: boolean;
  language?: string;
  illustrationStyle?: IllustrationStyle;
}

export const buildClassicAdminPrompts = (
  input: ClassicAdminInput,
): { system: string; user: string } => {
  const documentType = input.documentType || 'School Document';
  const typePrompt = builtInContentTypePrompt(documentType, {
    grade: input.grade,
    subject: input.subject,
    topic: input.purpose,
  });
  const bannerData = buildDocumentBannerPromptData({
    contentType: documentType,
    grade: input.grade,
    subject: input.subject,
    topic: input.purpose,
    term: input.term || currentSATerm(),
    school: input.schoolName,
  });
  const system = `${classicSystemPrompt()}\n\n${typePrompt}\n\nGenerate a formal ${documentType} for ${input.schoolName || 'the school'}.\nThe tone should be ${input.tone || 'Formal & Professional'}.\nThe 'content' field must be a polished, print-ready HTML fragment styled with Tailwind CSS. Do not use generic Markdown or generate a duplicate page banner.`;
  const user = `
            Type: ${documentType}
            Purpose: ${input.purpose || ''}
            Key Points: ${input.keyPoints || ''}
            School: ${input.schoolName || ''}
            Grade: ${input.grade || ''}
            Subject: ${input.subject || ''}
            Recipient: ${input.recipient || ''}
            Event date/time (exactly as supplied; distinct from today's banner date): ${input.timeDate || ''}
            Venue: ${input.venue || ''}
            Class teacher: ${input.classTeacher || ''}
            Principal: ${input.schoolPrincipal || ''}
            Include Reply Slip: ${input.includeReplySlip === true ? 'Yes' : 'No'}
            Language: ${input.language || 'English'}
            ${bannerData}
            Preserve every supplied value exactly. Never invent recipients, dates, reference numbers, costs, contact details, signatures, or official crests/seals. Omit missing optional details rather than printing "Not specified". Use South African English spelling when English is requested. Respect POPIA and keep sensitive learner information private.
            The host merges the current content title/header with the available grade, subject, content type, current term/date, school, CAPS reference and compliance information in the only opening banner. Do not create a second banner, title strip, metadata row, compliance/footer copy or duplicate page header. Use only functional form fields requested by the document type.
          `;

  return { system, user };
};
