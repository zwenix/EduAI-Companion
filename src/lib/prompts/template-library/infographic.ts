/**
 * INFOGRAPHIC — reverse-engineered from
 *   assets/templates/AI_IMG (9).jpg   — the punctuation grammar chart
 *   assets/templates/Number Poster Gr3.pdf — the dark bento number poster
 *   assets/templates/Multiplication for Grade 3 Learners.pdf — the card-stack explainer
 *
 * Anatomy: a titled header strip → a bento grid of 5–9 modules, one idea per
 * module, each with an icon, a short label and one or two sentences → a closing
 * strip. Colour is used to group modules, never to decorate.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Build the infographic exactly in this order:

1. HEADER STRIP
   - The title in heavy display type with a colour-block highlight behind the key word, and a one-line subtitle that says what the reader will learn.
   - The reference treatment: a wavy-edged coloured panel behind the title, with the grade or subject as a small right-aligned tag.

2. BENTO MODULE GRID
   - 5–9 modules arranged in a deliberate grid (one large anchor module plus smaller satellites, or a 3 × 3 bento).
   - Each module contains: an icon or tiny illustration, a 700-weight label of 1–3 words, and one or two sentences of explanation (never more).
   - Colour-group the modules by strand: each strand gets one hue, and every module in that strand inherits it.
   - The anchor module carries the central concept or the biggest visual.

3. KEY-FACT CHIPS
   - Where the topic has numbers, formulas or rules, print them as chips inside the module (the reference prints "100 Cents = R1.00", "Hundreds, Tens, Units").
   - Every number must be correct and every unit printed.

4. CLOSING STRIP
   - One full-width strip: a single takeaway sentence, plus one practice prompt in a lighter weight.

DESIGN DISCIPLINE:
- Total ink budget: modules are pale; only icons, labels and the header carry strong colour.
- Reading path must be explicit: numbered modules or arrows when the order matters.
- No paragraph longer than two sentences anywhere on the page.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is an INFOGRAPHIC: one topic explained as a visual argument across a bento grid of modules. It is read in 30 seconds and understood.`,
  visual: `VISUAL SYSTEM (measured from the reference infographics):
${measuredPaletteBrief(resolveMeasuredPalette('Mathematics', 'poster'))}
- Grid: ${MEASURED_LAYOUT.blockGap} gutters, ${MEASURED_LAYOUT.cardRadius} module radius, consistent internal padding.
- Module labels: 15–18 px, 700 weight. Explanations: 12–14 px.
- Header: title 34–48 px with a colour-block or wavy panel behind the key word.
- Icons: single flat-colour glyphs, one visual idea each.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `NEVER INVENT STATISTICS:
- Any number, percentage or comparison printed must be either supplied by the teacher, derived by correct arithmetic from supplied numbers, or a curriculum constant (100 cents = R1.00, the 7-point NPA scale).
- If the topic wants data the teacher did not supply, replace the statistic with a qualitative statement rather than inventing one.`,
});

export const infographicTemplate: ContentTypeTemplate = {
  id: 'infographic',
  aliases: ['infographic', 'grammar chart', 'topic overview chart', 'comparison chart', 'concept chart'],
  title: 'Infographic',
  purpose: 'One topic as a bento grid: header strip, 5–9 colour-grouped modules, key-fact chips and a one-line takeaway.',
  sources: [
    'assets/templates/AI_IMG (9).jpg',
    'assets/templates/Number Poster Gr3.pdf',
    'assets/templates/Multiplication for Grade 3 Learners.pdf',
  ],
  sections: [
    { id: 'header', heading: 'Header strip', content: 'Display title with colour-block highlight plus a one-line promise.' },
    { id: 'modules', heading: 'Bento modules', content: '5–9 modules, icon + label + one or two sentences, hue-grouped by strand.' },
    { id: 'chips', heading: 'Key-fact chips', content: 'Correct numbers, formulas and rules printed as chips.' },
    { id: 'closing', heading: 'Closing strip', content: 'One takeaway sentence plus a practice prompt.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (content type palette)',
    paletteId: 'poster',
    gradeBadge: 'right-aligned grade/subject tag in the header strip',
    sectionBar: 'hue-grouped modules',
    scoreCard: 'none — an infographic is never marked',
    typography: 'title 34–48 px; labels 15–18 px; module text 12–14 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['→', 'Tip', 'Challenge'],
  blankFields: [],
  guardrails: [
    'No invented statistics — supplied, derived or curriculum constants only.',
    'No module longer than two sentences.',
    'An explicit reading path when the order matters.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        language: input.language,
        dimensions: input.dimensions || 'A3 landscape',
      }),
      brief: `Build the complete infographic for this request.

Plan the grid first: state the anchor module, then the satellites, then assign a hue per strand. Then write each module's label and one or two sentences.

${illustrationClause({ generateImage: input.generateImage, style: input.illustrationStyle, goldenRule: input.imageGoldenRule })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default infographicTemplate;
