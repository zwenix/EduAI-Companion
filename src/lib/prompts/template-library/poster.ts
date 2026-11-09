/**
 * CLASSROOM POSTER — reverse-engineered from the reference poster set:
 *   assets/templates/AI_IMG (2).jpg   — the six-poster grammar set
 *   assets/templates/AI_IMG (14).jpg  — "IN THIS CLASSROOM … SCIENCE" acrostic
 *   assets/templates/AI_IMG (13).jpg  — numbered class-rules pencils
 *   assets/templates/AI_IMG (12).jpg  — composition-notebook rules cards
 *   assets/templates/AI_IMG (8).jpg   — chalkboard rules
 *   assets/templates/AI_IMG (4).jpg   — "LEARN" acrostic
 *   assets/templates/AI_IMG (15).jpg  — their / there / they're grammar set
 *   assets/templates/AI_IMG.jpg       — reading-matters quote poster
 *
 * Anatomy: a display title treatment → 5–7 large rules/facts, each on its own
 * band or card → one closing line. Readable from across a classroom, no prose.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, requestBlock } from './shared';

const BRIEF = `Design the poster exactly to this anatomy:

1. TITLE TREATMENT (the poster's whole identity)
   - One short, high-impact title (2–5 words): "CLASS RULES", "IN THIS CLASSROOM", "PUNCTUATION", "LET'S MULTIPLY!".
   - Choose one of the reference title treatments and commit to it:
     • Rainbow letters — each letter its own colour on a dark ground.
     • Acrostic — the key word runs down the left edge, one letter per rule ("S · C · I · E · N · C · E").
     • Chalkboard — hand-lettered white and coloured chalk on a textured dark ground with doodle stars.
     • Banner-and-ribbon — title in a scalloped ribbon on a light ground.
   - The title must be legible from 5 m across the room: minimum 48 px on screen, 40 mm in print.

2. CONTENT BANDS (5–7, one idea each)
   - Each rule/fact sits on its own band, card or pencil-strip, never in a paragraph.
   - Bands cycle a bright palette (the references use red, amber, green, teal, blue and violet in order) so each rule is separately recognisable.
   - One band = one imperative sentence or one fact, maximum 12 words for rules, 20 for concept facts.
   - Numbered posters print the number in a large numeral (1–6) in the band's leading circle.

3. VISUAL SUPPORT
   - Simple flat vector-style illustration, icon or diagram — classroom-object line art, character spot art or a labelled concept drawing. No photographic collage, no clip-art cheese.
   - Illustrations support meaning; they never carry text that duplicates the band.

4. CLOSING LINE
   - One short positive line at the foot of the poster: "We try our best." / "See you online at…" / "Great blending! You are a STAR reader!"

HARD RULES FOR POSTERS:
- NO assessment: no questions, no fill-in-the-blanks, no "answer here", no tasks.
- NO dense prose: no paragraph longer than two short sentences anywhere.
- Foundation Phase posters use 6 bands maximum and one instruction per band; Senior posters may use 3–4 concept bands with a labelled diagram.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a CLASSROOM POSTER — a display that teaches one idea at a glance from across the room. It is not a worksheet and never contains an exercise, a question or a blank to fill in.`,
  visual: `VISUAL SYSTEM (measured from the reference posters):
${measuredPaletteBrief(resolveMeasuredPalette('Life Skills', 'poster'))}
- Page: ${MEASURED_LAYOUT.page} unless a paper size is supplied; print-safe margins, no bleed-dependent design.
- One dominant title colour family, then a bright cycling band palette (red → amber → green → teal → blue → violet).
- Band radius 0.75–1.5rem, thick (3–4 px) outlines in the darker shade of each band colour.
- Body type never smaller than 16 px on screen / 12 pt in print.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `SAFE, SCHOOL-APPROPRIATE CONTENT:
- Rules are phrased positively and inclusively ("We keep our hands and feet to ourselves", "We listen when others are speaking"). Never shaming, never threatening, never punitive.
- No brand logos, no cartoony mascots that could read as another publisher's character, no watermarks.`,
});

export const posterTemplate: ContentTypeTemplate = {
  id: 'poster',
  aliases: [
    'educational poster',
    'poster',
    'word wall',
    'vocabulary display',
    'number chart / number line',
    'times tables chart',
    'classroom rules poster',
    'classroom rules',
    'topic anchor chart',
    'anchor chart',
    'labels & organizers',
    'classroom labels / signs',
    'book labels',
    'book cover design',
  ],
  title: 'Classroom Poster',
  purpose: 'A display poster: one title treatment, 5–7 large rule/fact bands, supporting illustration and a positive closing line.',
  sources: [
    'assets/templates/AI_IMG (2).jpg',
    'assets/templates/AI_IMG (4).jpg',
    'assets/templates/AI_IMG (8).jpg',
    'assets/templates/AI_IMG (12).jpg',
    'assets/templates/AI_IMG (13).jpg',
    'assets/templates/AI_IMG (14).jpg',
    'assets/templates/AI_IMG (15).jpg',
    'assets/templates/AI_IMG.jpg',
  ],
  sections: [
    { id: 'title', heading: 'Title treatment', content: 'Rainbow / acrostic / chalkboard / ribbon title, legible from 5 m.' },
    { id: 'bands', heading: 'Content bands', content: '5–7 bright bands, one idea each, numbered where the set is ordered.' },
    { id: 'art', heading: 'Visual support', content: 'Flat vector or labelled concept art that supports the meaning.' },
    { id: 'closing', heading: 'Closing line', content: 'One short positive line at the foot.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (poster palette)',
    paletteId: 'poster',
    gradeBadge: 'none — a poster is anonymous',
    sectionBar: 'cycling bright bands with thick darker outlines',
    scoreCard: 'none — posters are never marked',
    typography: 'title 48–96 px; bands 18–28 px; nothing below 16 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Class Rules', 'In this classroom', 'We'],
  blankFields: [],
  guardrails: [
    'No questions, no blanks, no tasks — a poster is a teaching aid.',
    'One idea per band; never a paragraph.',
    'Rule wording stays positive and inclusive.',
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
        dimensions: input.dimensions || 'A3 portrait',
      }),
      brief: `Design the complete poster for this request.

CONTENT PLAN:
- Write the title first, then the ${input.quantity || '5–7'} bands. Each band is one short imperative or one fact, ordered by importance.
- If the requested type is an acrostic-style poster, the key word determines the number of bands exactly.
- Add the closing line and the supporting illustration.

Set "description" inside the envelope to one sentence naming the poster's teaching purpose, and "printInstructions" to the paper size and a one-line print note.`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default posterTemplate;
