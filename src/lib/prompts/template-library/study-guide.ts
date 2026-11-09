/**
 * STUDY GUIDE / LEARNING NOTES — reverse-engineered from
 *   assets/templates/Multiplication for Grade 3 Learners.pdf
 *   assets/templates/Number Poster Gr3.pdf
 *
 * Anatomy: a big playful title, a grade subtitle, then three or four full-width
 * topic cards — each with an icon, a coloured heading, one short explanatory
 * paragraph and a visual (worked example, diagram or chart) — closing on a
 * "Tip" strip. The document is notes, never a quiz.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Build the study guide exactly in this order:

1. TITLE BLOCK
   - A large, playful display title in the subject colour (the reference: "LET'S MULTIPLY!" in heavy rounded type).
   - A white pill subtitle underneath: "<Subject> for Grade <n>".
   - The host's ONE banner remains the document's only metadata header; the title block is content, not a second header.

2. TOPIC CARDS (three to five, full width, ordered by teaching sequence)
   - Each card is a white rounded card (radius 1.5–2rem) with a soft shadow on a pale tinted ground.
   - Card header: a small icon chip in the subject colour plus a coloured 700-weight heading ("What is Multiplication?", "Using Arrays", "Times Table Chart").
   - One explanatory paragraph of 2–4 sentences, with the key phrase bolded in the subject colour.
   - A visual block: a worked example, an array/grid, a labelled table or a diagram. Every number in a worked example must be correct and every row/column label printed.

3. WORKED EXAMPLE STRIP
   - One horizontal strip showing the concept with symbols and numbers together (the reference: ★★ + ★★ + ★★ → "3 groups of 2 = 3 × 2 = 6"), centred, with the answer in the accent colour.

4. TABLE / CHART BLOCK
   - When the topic has a reference table (times tables, number names, formulas, punctuation), print the whole table — every cell filled, correct and legible. Never an empty grid.

5. TIP STRIP
   - A pale callout at the end with a 💡 icon: "Tip: <one practical practice suggestion>" (the reference: "Practice skip counting: 2, 4, 6, 8!").

STUDY-NOTES RULE: the majority of the document is explanatory reading material a learner can revise from. Exercises, if any, are limited to a short self-check at the end — never a full worksheet.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a STUDY GUIDE / LEARNING NOTES page: the notes a learner reads and revises from. It is explanatory prose with worked examples — not a quiz, not a lesson plan, not a worksheet.`,
  visual: `VISUAL SYSTEM (measured from the reference study materials):
${measuredPaletteBrief(resolveMeasuredPalette('Mathematics', 'poster'))}
- Cards: white on a pale tinted ground, ${MEASURED_LAYOUT.cardRadius} radius, soft shadow, ${MEASURED_LAYOUT.blockGap} between cards.
- Headings: subject colour, 700 weight, 20–24 px. Key phrases bolded in the same colour.
- Worked-example strip: centred, 24–28 px numerals/symbols, answer in the accent colour.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `TEACHING ACCURACY:
- Every worked example is calculated twice in your head before you write it. A wrong times table or subtraction in a study guide teaches the error.
- Every definition is one sentence, in the learner's language level for the phase, and correct at that level (no university phrasing for Grade 3).`,
});

export const studyGuideTemplate: ContentTypeTemplate = {
  id: 'study-guide',
  aliases: ['study guide', 'study guide / learning notes', 'learning notes', 'revision pack', 'revision', 'summary notes'],
  title: 'Study Guide / Learning Notes',
  purpose: 'Revision-ready notes: sequential topic cards, correct worked examples, reference tables and a practice tip.',
  sources: [
    'assets/templates/Multiplication for Grade 3 Learners.pdf',
    'assets/templates/Number Poster Gr3.pdf',
  ],
  sections: [
    { id: 'title', heading: 'Playful title block', content: 'Display title in the subject colour plus a white pill grade subtitle.' },
    { id: 'cards', heading: 'Topic cards', content: 'Three to five cards: icon, heading, explanatory paragraph, visual block.' },
    { id: 'worked', heading: 'Worked example strip', content: 'Symbols and numbers together, answer in the accent colour.' },
    { id: 'table', heading: 'Reference table', content: 'The complete, correct table when the topic has one.' },
    { id: 'tip', heading: 'Tip strip', content: 'A pale 💡 callout with one practical practice suggestion.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (content type palette)',
    paletteId: 'poster',
    gradeBadge: 'white pill subtitle under the title',
    sectionBar: 'icon chip + coloured heading inside each card',
    scoreCard: 'none — a study guide is not marked',
    typography: 'display title 36–44 px; card headings 20–24 px; body 15–16 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Tip:', 'for Grade', 'What is', 'Using'],
  blankFields: [],
  guardrails: [
    'Notes, not a test: at most a short self-check at the end.',
    'Every worked example must be arithmetically correct.',
    'No empty tables or "fill this in" grids in a study guide.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        term: input.term,
        language: input.language,
        learnerProfile: input.learnerProfile,
      }),
      brief: `Write the complete study guide for this request.

SEQUENCE: split the topic into 3–5 teachable chunks a learner meets in this order, name each one as a card heading, and write the notes for each.

For every card give: the heading, a 2–4 sentence explanation that a learner at this grade can read alone, and a visual (worked example, array, labelled diagram or table).

Then add the tip strip: one sentence of practical practice advice specific to this topic.

The "memo" field carries the answers to any self-check questions; the "rubric" field carries a short "how to study this" checklist.`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default studyGuideTemplate;
