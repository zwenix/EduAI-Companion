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

/** The restored master doctrine, re-exported for prompt builders. */
export const CLASSIC_MASTER_PROMPT = CLASSIC_MASTER_SYSTEM_PROMPT;

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
  return {
    system: `${CLASSIC_MASTER_PROMPT}\n\nYour task is to generate high-quality educational materials: ${type}.\nThe content must be strictly CAPS aligned, professionally formatted in HTML with Tailwind CSS, and ready for classroom use. DO NOT USE MARKDOWN.`,
    user: `Generate a ${type} based on the following details: ${details}. Format as valid HTML with Tailwind CSS classes. Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design).`,
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

  const system = `${CLASSIC_MASTER_PROMPT}\n\nGenerate high-quality ${contentType} for Grade ${input.grade || '4'} ${input.subject || ''}.\nThe response must be a JSON object, but the 'content', 'memo', and 'rubric' fields MUST be fully styled HTML. Use modern, beautiful Tailwind CSS styling directly in the class attributes for a professional, print-ready "award winning" layout. Include @media print styles if needed. DO NOT use Markdown.`;

  const user = `
            Type: ${contentType}
            Grade: ${input.grade || '4'}
            Subject: ${input.subject || ''}
            Topic: ${input.topic || ''}
            Language: ${input.language || 'English'}
            Objective: ${input.objective || ''}
            Learner Profile: ${input.learnerProfile || ''}
            Additional Info: ${input.additionalInstructions || ''}

            SPECIFIC VISUAL ENHANCEMENT:
            For every worksheet/document, create ONE stunning hero illustration at the top that occupies 25–30% of the page. 
            The illustration must be:
            - Directly related to the specific CAPS topic
            - Set in a recognizable South African context
            - Semi-realistic digital painting style (like children’s non-fiction books)
            - Emotionally engaging and curiosity-sparking
            - High detail, rich colors, perfect composition

            REQUIREMENTS FOR HTML DESIGN:
            - Include full-width colored banners (e.g. orange for Life Skills, teal/blue for Math, purple/pink for Languages).
            - Add a large circular badge in the top right for the Grade (e.g., "Grade 4").
            - "Name: ____ Date: _____ Total __ / ${input.totalMarks || 30}" layout below header (if applicable).
            - Question text styles: Make them bold with distinct numbered bullets (e.g. circles with white text).
            - Options/Answers: Enclose multiple choices or matching lists inside pill-shaped boxes with a colored border or background.
            - Footer: "EduAI Companion | CAPS Aligned | eduai-companion.github.io".
            - DO NOT USE MARKDOWN. Write raw HTML inside the JSON content values using tailwind CSS classes.
            ${studyGuideRequirements}
            
            GUIDE: ${goldenRule}
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
  illustrationStyle?: IllustrationStyle;
}

/** The restored poster blueprint — bubble letters, floating fact boxes, sky blue. */
export const classicPosterBlueprint = (input: ClassicVisualInput): string => `
              Create a stunning, print-ready educational poster for South African Grade ${input.grade || '4'} ${input.subject || ''} learners on the CAPS topic: "${input.topic || ''}"

              DESIGN REQUIREMENTS (Based on EduAI Companion Templates):
              - HTML/Tailwind ONLY. Do not use markdown.
              - Layout: A massive central Hero Image (illustration) taking up the middle 50% of the poster.
              - Top Banner: Large, playful, multi-colored bubble-letter style title (using text-shadows, varied colors per word) centered at the top.
              - Floating Fact Boxes: 4-6 small floating fact boxes positioned around the central image. Each box should have a thick colored outline (e.g., solid 4px red, green, blue border), white background, small playful SVG icon/emoji, and short, legible text.
              - Title Style: Give each letter or word a different vibrant color.
              - Visual hierarchy: Make it look like an adventure map or a colorful infographic.
              - Footer Layout: Include 3-4 neat little text boxes in a row at the very bottom containing extra info or activities. Include EduAI or CAPS branding.
              - Typography: Use bold, playful sans-serif fonts.
              - Colors: Sky blue background, primary color accents (bright yellow, striking red, vibrant green).
              
              Make it vibrant, instantly engaging, and child-friendly.
            `;

/** The restored flashcard blueprint — double-sided grid, vibrant per card. */
export const classicFlashcardBlueprint = (input: ClassicVisualInput): string => `
              Design a set of professional, double-sided educational flashcards for Grade ${input.grade || '4'} ${input.subject || ''} on "${input.topic || ''}".
              
              DESIGN REQUIREMENTS:
              - Show multiple cards in a grid (2 or 3 per row).
              - Each card should have:
                - Front side: Large title, high-quality icon/emoji, and a very short hint.
                - Back side: Explanation, a South African contextual example, and a small "Did you know?" fact.
              - Card style: rounded-3xl corners, thick colored borders (2px), subtle shadow.
              - Use vibrant colors that change per card.
              - Ensure text is large and legible (text-xl for titles).
            `;

/** The restored infographic / mind-map blueprint. */
export const classicInfographicBlueprint = (input: ClassicVisualInput): string => `
              Design a visually spectacular CAPS-aligned infographic/mind map on ${input.topic || ''} for Grade ${input.grade || '4'}.

              Requirements:
              - Central concept in the middle with radiating branches
              - Each branch has a beautifully illustrated icon (custom drawn, not generic)
              - South African contextual examples throughout
              - Color-coded sections with perfect visual hierarchy
              - Style: Modern flat design with subtle textures and depth
              - Include real South African case studies or examples where possible
            `;

/** The restored diagram blueprint — the process in a real SA landscape. */
export const classicDiagramBlueprint = (input: ClassicVisualInput): string => `
              Create a crystal-clear, beautifully illustrated scientific diagram of ${input.topic || ''} specifically adapted for South African Grade ${input.grade || '4'} learners.

              Show the process occurring in a real South African landscape:
              - Water cycle: Include Table Mountain, Drakensberg, or Karoo
              - Food chain: Use indigenous animals (lion, impala, acacia tree, vulture, etc.)
              - Rock cycle: Feature South African geological formations
              - Plant structure: Use protea, aloe, or fynbos species

              Style: Clean, labeled, semi-realistic illustration with arrows, soft shadows, and depth. National Geographic kids magazine quality.
            `;

/** The restored catch-all for visual types the doctrine did not specialise. */
export const classicGeneralVisualBlueprint = (input: ClassicVisualInput): string =>
  `Create a highly visual ${input.visualType || 'educational visual aid'} for Grade ${input.grade || '4'} ${input.subject || ''} on topic ${input.topic || ''}.`;

/**
 * Pick the restored blueprint for a visual type. The matching rules are the
 * original ones from commit 6d3f1d2 (poster → flashcard → infographic/mind map
 * → diagram → generic), so a request resolves to exactly the prompt it used to.
 */
export const classicVisualBlueprint = (input: ClassicVisualInput): string => {
  const value = (input.visualType || '').toLowerCase();
  if (value.includes('poster')) return classicPosterBlueprint(input);
  if (value.includes('flashcard') || value.includes('learning card')) {
    return classicFlashcardBlueprint(input);
  }
  if (value.includes('infographic') || value.includes('mind map')) {
    return classicInfographicBlueprint(input);
  }
  if (value.includes('diagram')) return classicDiagramBlueprint(input);
  return classicGeneralVisualBlueprint(input);
};

export const buildClassicVisualPrompts = (
  input: ClassicVisualInput,
): { system: string; user: string } => {
  const visualPrompt = classicVisualBlueprint(input);
  const goldenRule = imageGoldenRule(input.illustrationStyle);

  const system = `${CLASSIC_MASTER_PROMPT}${CLASSIC_VISUAL_SYSTEM_SUFFIX}`;

  const user = `
            ${visualPrompt}
            Language: ${input.language || 'English'}
            Style: ${input.style || ''}
            Color: ${input.colorScheme || ''}
            Content Details: ${input.specificContent || ''}
            Quantity: ${input.quantity ?? ''}
            Additional Info: ${goldenRule}
          `;

  return { system, user };
};

/* ────────────────────────────────────────────────────────────────────────────
 * generate-admin — letters, notices, permission slips, newsletters
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ClassicAdminInput {
  documentType?: string;
  schoolName?: string;
  tone?: string;
  purpose?: string;
  keyPoints?: string;
  includeReplySlip?: boolean;
  language?: string;
  illustrationStyle?: IllustrationStyle;
}

export const buildClassicAdminPrompts = (
  input: ClassicAdminInput,
): { system: string; user: string } => {
  const system = `${CLASSIC_MASTER_PROMPT}\n\nGenerate a formal ${input.documentType || 'school document'} for ${input.schoolName || 'the school'}.
          The tone should be ${input.tone || 'Formal & Professional'}.
          IMPORTANT: The 'content' field MUST be formatted as visually pleasing HTML string styled with Tailwind CSS classes. DO NOT use generic Markdown.`;

  const user = `
            Type: ${input.documentType || ''}
            Purpose: ${input.purpose || ''}
            Key Points: ${input.keyPoints || ''}
            Include Reply Slip: ${input.includeReplySlip === true ? 'Yes' : 'No'}
            Language: ${input.language || 'English'}
          `;

  return { system, user };
};
