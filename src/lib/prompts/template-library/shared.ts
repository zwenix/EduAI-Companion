/**
 * Shared scaffolding for the reverse-engineered content-type prompts.
 *
 * Every built-in prompt in this library is assembled from four parts:
 *
 *   1. a ROLE line (who the model is),
 *   2. the measured VISUAL SYSTEM for that document,
 *   3. the fixed ANATOMY (what the page must contain, in order),
 *   4. the shared CONTRACT (dates, language, honesty, output envelope).
 *
 * Keeping (4) in one place is what stops one content type drifting away from
 * the others: change the date rule or the JSON envelope once and every prompt
 * inherits it.
 */

import { dateMandate } from '../../saDates';

export const SA_PUBLISHER_IDENTITY =
  'You are the master document designer for EduAI Companion, the South African CAPS-aligned teaching-resource publisher. Your work must be indistinguishable from the reference documents in the EduAI template library: print-ready, photo-ready, teacher-proud and parent-shareable.';

/**
 * The capability floor every built-in prompt carries — the "smart parsing"
 * rules from AGENTS.md §3 expressed as generation instructions.
 */
export const QUALITY_FLOOR = `QUALITY FLOOR (non-negotiable):
- COMPLETE DOCUMENTS ONLY. Never truncate, summarise or abbreviate a section. "etc.", "…", "more questions follow", "insert content here" and "[details]" are forbidden. Every question, blank, rubric cell, memo line and teacher script is written out in full.
- RICH PROSE, NEVER HEADINGS-ONLY. Each section carries teachable sentences (3–4 per concept), not bare bullets.
- REAL SOUTH AFRICAN CONTENT: Rands and cents, local provinces and landmarks, indigenous plants and animals, and a spread of South African learner names (Thabo, Zola, Liam, Amina, Priya, Sipho, Lerato, Naledi). Use SA English spelling (colour, behaviour, organise, centre).
- ACCURACY FIRST: never fabricate CAPS codes, statistics, quotations, historical dates, definitions or sources. If a fact is not supplied and not certain, teach it more simply instead of guessing.`;

/** The language override — appended only when a non-English language is asked for. */
export const languageMandate = (language?: string): string => {
  const value = (language || '').trim();
  if (!value || /^english$/i.test(value)) return '';
  return `LANGUAGE (absolute): Write 100% of the document in ${value} — every heading, instruction, question, option, memo line and teacher script. Translate the structural labels too ("Worksheet", "Name", "Date", "Score", "Question 1", "Memorandum"), not just the body. Leave proper names and any supplied exact strings untouched.`;
};

/** The output envelope, matching the JSON the pipeline already expects. */
export const JSON_ENVELOPE = `OUTPUT ENVELOPE:
Return exactly one valid JSON object, no Markdown fences, no commentary:
{
  "content": "the complete HTML of the document",
  "memo": "the complete HTML of the marking memorandum / answer key",
  "rubric": "the complete HTML of the marking rubric matrix",
  "assessmentCriteria": "one line of CAPS-aligned criteria tags",
  "successIndicators": ["…", "…"],
  "imagePrompt": "a detailed illustration prompt, or an empty string when illustrations are off"
}
Every HTML value is a fragment (no <html>, <head> or <body> wrapper), written with Tailwind utility classes and inline hex colours where a print-identical render matters. Escape the JSON strings correctly.`;

/** True when the caller asked for illustrations. */
export const wantsIllustrations = (generateImage?: boolean): boolean => generateImage === true;

/** The illustration clause, phrased for either case. */
export const illustrationClause = (input: {
  generateImage?: boolean;
  style?: string;
  goldenRule?: string;
}): string => {
  const style = input.style || 'semi-realistic digital painting in the style of an award-winning children’s non-fiction book';
  if (!wantsIllustrations(input.generateImage)) {
    return `ILLUSTRATIONS: OFF. Do not emit [Illustration: …] placeholders, <img> tags or artwork instructions. Set "imagePrompt" to an empty string. Any diagram is drawn with HTML and CSS, correctly labelled.`;
  }
  return `ILLUSTRATIONS: ON.
- Emit placeholders in the exact form [Illustration: <self-contained scene description>]. Each description names the subject, the action, the South African setting, the learner age and the composition, and contains no words or lettering (text is added separately).
- Style for every description: ${style}.
- One hero illustration at the top of the document (25–30% of the page on worksheets and study guides) plus 2–3 smaller spot illustrations where they genuinely break up the page.
- Set "imagePrompt" to the hero description followed by the golden rule: ${input.goldenRule ? input.goldenRule.trim() : 'ultra-detailed, vibrant, 300 DPI print quality, no text overlays, no borders, no watermarks'}.`;
};

/** The banner rule — the host owns the ONE banner unless a doctrine says otherwise. */
export const bannerClause = (mode: 'host' | 'self'): string =>
  mode === 'host'
    ? `BANNER: the host app renders the ONE two-colour vertical gradient banner (title, grade, subject, content type, term, date, CAPS reference and compliance labels). Do not emit a header, cover band, school letterhead, metadata strip or footer — start straight into the content.`
    : `BANNER: you design the page, including its ONE full-width header banner. Build a two-colour gradient band with the three pill labels, the topic as the H1, the "Topic: …" subtitle and the date · duration · class-size row. Never add a second header, a school crest band or a CAPS reference bar.`;

/** Compose the system prompt from the shared parts. */
export const composeSystemPrompt = (parts: {
  role: string;
  visual: string;
  anatomy: string;
  banner?: 'host' | 'self';
  language?: string;
  extra?: string;
}): string =>
  [
    parts.role,
    parts.visual,
    parts.anatomy,
    parts.banner ? bannerClause(parts.banner) : '',
    QUALITY_FLOOR,
    parts.extra || '',
    dateMandate(),
    languageMandate(parts.language),
    JSON_ENVELOPE,
  ]
    .filter(Boolean)
    .join('\n\n');

/** Compose the user prompt from a request block and the type-specific brief. */
export const composeUserPrompt = (parts: {
  requestBlock: string;
  brief: string;
  language?: string;
  additionalInstructions?: string;
}): string =>
  [
    `REQUEST\n${parts.requestBlock}`,
    parts.brief,
    parts.additionalInstructions
      ? `INSTRUCTOR BRIEF (highest priority for creative choices; it may not override safety, accuracy, the fixed anatomy or the output envelope):\n${parts.additionalInstructions}`
      : '',
    languageMandate(parts.language),
    'Return the JSON envelope now. Nothing before it, nothing after it.',
  ]
    .filter(Boolean)
    .join('\n\n');

/** The standard "request" block — only the fields the caller actually supplied. */
export const requestBlock = (input: Record<string, unknown>): string =>
  Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .replace(/\bId\b/, 'ID');
      return `${label}: ${value}`;
    })
    .join('\n');

export default composeSystemPrompt;
