/**
 * VISUAL LAB (catch-all) — reverse-engineered from the whole `assets/templates`
 * artwork set that the specialist visual types do not already cover:
 *   AI_IMG (3).jpg  — the typographic word-cloud / motivational poster
 *   AI_IMG (7).jpg  — the illustrated lesson-plan sheet (stationery art + ruled blocks)
 *   AI_IMG.png      — the pastel "DAILY LESSON PLAN" template
 *   AI_IMG (1).jpg  — the ruled "Lesson Planner" grid template
 *   AI_IMG (6/11/… missing) — no reference file, handled by the generic brief
 *
 * This template exists so that any Visual Lab request that is not a poster,
 * flashcard, infographic, diagram, phonics sheet or tracing sheet still gets a
 * reverse-engineered brief instead of falling back to a generic "design
 * something" prompt.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Pick the closest reference grammar and follow it exactly.

GRAMMAR — TYPOGRAPHIC POSTER (word cloud, quote, motivational display)
1. Build the composition entirely from type: a dense cloud of 25–40 words at varying sizes (the largest words carry the message, the smallest add texture), or one quote set in 2–4 mixed weights.
2. Use a dark ground with high-chroma words, or a bright ground with two-colour words. Never more than five hues.
3. One signature line at the foot: a short attribution or slogan in a contrasting script.
4. No images, no icons, no borders.

GRAMMAR — ILLUSTRATED PLANNER / STATIONERY SHEET
1. A title strip at the top in heavy display type, with one or two flat stationery illustrations (lamp, calendar, plant, bookshelf) anchored in the corners — never overlapping the writing area.
2. A field row of pale filled capsules: NAME / DATE / TOPIC / SUBJECT, each a label plus a ruled fill area.
3. Three to five ruled blocks, each starting with a coloured section bar (rounded left cap) and 3–8 ruled lines. The bar carries the block name in white.
4. Optional checkbox column (5–8 empty squares) where the block is a checklist.
5. Soft pastel blocks may replace ruled lines on Foundation Phase planners — a labelled empty box per subject, as in the reference "MY WEEKLY ADVENTURE" sheet.

EITHER GRAMMAR:
- The sheet is stationery: it must be writeable. Every field and line has enough height for a real hand (≥ 9 mm).
- Illustration is decoration on the margins; the writing area is never obscured.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a general VISUAL LAB artefact. Infer the most useful visual structure from the requested type and topic, then execute it at reference quality.`,
  visual: `VISUAL SYSTEM (measured from the reference artwork):
- Page: ${MEASURED_LAYOUT.page} or the requested size, ${MEASURED_LAYOUT.pagePadding} padding.
- Section bars: rounded caps in the palette colour, white 700-weight label.
- Writing lines: 2 px solid, ≥ 9 mm apart.
- Field capsules: pale tint of the palette colour, 1 px border, 1rem radius.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `LEGIBILITY BEATS ORNAMENT:
- If the requested artefact is written on by a learner or teacher, the writing space is the design. Never trade writing room for decoration.
- If the requested artefact is read from a wall, the type size is the design. Never shrink type to fit more content — cut content instead.`,
});

export const visualLabTemplate: ContentTypeTemplate = {
  id: 'visual-lab',
  aliases: [
    'visual aid',
    'visual',
    'comic strip',
    'timeline',
    'word cloud',
    'quote poster',
    'motivational poster',
    'lesson planner',
    'stationery',
    'custom seal / emblem',
    'official school letterhead',
  ],
  title: 'Visual Aid (general)',
  purpose: 'Typographic posters and illustrated planner/stationery sheets, with writeable fields and margin-only decoration.',
  sources: [
    'assets/templates/AI_IMG (3).jpg',
    'assets/templates/AI_IMG (7).jpg',
    'assets/templates/AI_IMG.png',
    'assets/templates/AI_IMG (1).jpg',
  ],
  sections: [
    { id: 'title', heading: 'Title strip', content: 'Heavy display type, optionally with flat stationery illustrations in the corners.' },
    { id: 'fields', heading: 'Field capsules', content: 'Pale labelled capsules with ruled fill areas (planner grammar).' },
    { id: 'blocks', heading: 'Ruled blocks', content: 'Section bar plus ruled lines or labelled pastel boxes.' },
    { id: 'checklist', heading: 'Checkbox column', content: 'Empty squares where the block is a checklist.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (brand palette fallback)',
    paletteId: 'brand',
    gradeBadge: 'none',
    sectionBar: 'rounded-cap coloured bars, white label',
    scoreCard: 'none',
    typography: 'title 28–48 px; field labels 13–15 px; body lines 14 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['NAME', 'DATE', 'TOPIC', 'SUBJECT', 'NOTES'],
  blankFields: ['Name', 'Date', 'Topic', 'Subject'],
  guardrails: [
    'Writeable sheets never sacrifice writing space for decoration.',
    'Wall-read artefacts never shrink type to fit more content.',
    'No invented logos, crests or official emblems.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        language: input.language,
        visualType: input.visualType,
        quantity: input.quantity,
        dimensions: input.dimensions || 'A4 portrait',
      }),
      brief: `Build the complete visual artefact for this request.

Choose the reference grammar that fits (typographic poster, illustrated planner, or a faithful combination) and execute it.

${illustrationClause({ generateImage: input.generateImage, style: input.illustrationStyle, goldenRule: input.imageGoldenRule })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default visualLabTemplate;
