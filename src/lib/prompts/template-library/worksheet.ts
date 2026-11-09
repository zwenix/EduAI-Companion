/**
 * WORKSHEET — reverse-engineered from
 *   assets/templates/gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf
 *   assets/templates/gr4-life-skills-worksheet-term2-emotions-relationships.pdf
 *   assets/templates/gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf
 *   assets/templates/gr1-phonics-blending-cvc-words.pdf
 *
 * Anatomy: banner (title + centred subtitle + circular grade badge) → name /
 * date / term row → numbered SECTION bars (each in its own colour) → numbered
 * question circles with ruled answer lines → SCORE capsule bottom-right →
 * teacher / comment lines → footer line.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import {
  MEASURED_LAYOUT,
  resolveMeasuredPalette,
  measuredPaletteBrief,
} from './visual-system';
import {
  SA_PUBLISHER_IDENTITY,
  composeSystemPrompt,
  composeUserPrompt,
  illustrationClause,
  requestBlock,
} from './shared';

const BRIEF = `Build the worksheet page for page, exactly in this order:

1. BANNER (the page's only header)
   - Full-width band in the subject palette, centred white title in 800-weight display type (e.g. "Maths Worksheet", "Life Skills — Emotions & Relationships").
   - Centred white subtitle one step smaller: the topic strand and term (e.g. "Place Value, Multiplication & Fractions", "Understanding Feelings | Grade 4 | Term 2").
   - A large circular grade badge overlapping the right edge of the band, tinted white-on-brand, reading "Grade 3" / "Grade R".
   - Never add a second header, school crest band or CAPS reference bar.

2. LEARNER FILL-IN ROW (immediately under the banner)
   - "Name: ____________________" and "Date: ______________" side by side, plus "Term: ___" when the document is term-scoped.
   - Both fields are RULED BLANKS and are left empty for the learner. Never pre-fill a name or a date.

3. SECTION BARS
   - Three to four numbered sections. Each prints a full-width pill bar in its own colour: "SECTION A — <strand>", "SECTION B — <strand>", "SECTION C — <strand>".
   - The bars cycle through the measured palette in order (A brand colour, B secondary, C tertiary). Each bar also carries its mark subtotal in square brackets when the section is marked: "SECTION A — Place Value [10 marks]".
   - The strands must map to the CAPS content for that term — never to arbitrary topics.

4. QUESTION BLOCKS
   - Each question is a numbered circle (white numeral on the accent colour) followed by the question text, then the answer affordance for its type:
     • Short answer / calculation → one or two full-width ruled lines in the accent colour.
     • Multiple choice → four pale capsule options "(a) …" "(b) …" "(c) …" "(d) …" laid out in a row that wraps without clipping (rounded-2xl, never rounded-full on wrapping text).
     • True / False → the statement, then "T / F" set inside two coloured circles at the right edge (green T, red F).
     • Matching → two columns of pale capsules, lettered A–E and numbered 1–5, with an instruction to draw a straight line.
     • Fill-in / cloze → a sentence with long ruled blanks in place of the missing words.
     • Diagram / draw → a dashed empty box sized for the drawing, with a centred pale hint in italics.
   - 4–9 questions per section, ordered easiest first (CAPS cognitive ramp), each with its mark value right-aligned in square brackets: "[2]".
   - Question text is 14–15 px, 500 weight; the whole block keeps generous white space so a Grade 3 hand fits.

5. SCORE CARD
   - A pale amber capsule with a thick amber border, bottom-right: the word "SCORE" above a large "______ / <total>".
   - The total is the sum of every question's marks and must match the marks printed on the section bars.

6. CLOSING ROWS
   - "Teacher: __________________   Comment: ________________________________"
   - For a formal assessment only, add "Moderator: __________________   Date: ________".
   - The host prints the one canonical footer; do not invent a second one.

MARKING PACK (in the envelope, not on the learner page)
- "memo": every question number, the correct answer, the mark split (e.g. "2/2 for the answer, 1/1 for the working") and the accepted alternatives.
- "rubric": an analytical rubric table — criteria rows, 4 performance levels (0–29%, 30–49%, 50–69%, 70–100%, or the CAPS 1–7 scale for Senior/FET), and a descriptor in every cell. No empty cells.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a learner WORKSHEET: a printed page the learner writes on with a pencil. It is not a lesson plan, not a study guide and not a poster. Every question is answerable on the page itself.`,
  visual: `VISUAL SYSTEM (measured from the reference worksheets):
${measuredPaletteBrief(resolveMeasuredPalette('Mathematics', 'worksheet'))}
- Page: ${MEASURED_LAYOUT.page}, ${MEASURED_LAYOUT.pagePadding} padding, print-first (avoid ink-heavy full-bleed fills).
- Section bars: ${MEASURED_LAYOUT.sectionBarRadius}, white 700-weight label, ${MEASURED_LAYOUT.typography.sectionBar}.
- Marks: ${MEASURED_LAYOUT.typography.marks}.
- Foundation Phase (R–3) only: enlarge body text to 16–18 px, double the line spacing and keep at most 6 questions per page.`,
  anatomy: BRIEF,
  banner: 'self',
  extra: `PHASE-AWARE DENSITY:
- Foundation Phase (R–3): 16–18 px body, huge ruled lines, at most three sections, tracing/drawing affordances instead of long prose answers.
- Intermediate (4–6): 14–15 px body, four sections, calculation space beside every sum.
- Senior (7–9) and FET (10–12): 13–14 px, exam-style numbering (1.1, 1.2, 2.1 …), mark subtotals per sub-question, working space.`,
});

export const worksheetTemplate: ContentTypeTemplate = {
  id: 'worksheet',
  aliases: [
    'worksheet',
    'werkvel',
    'homework task',
    'classroom exercise',
    'group activity',
    'reading comprehension',
    'writing task',
    'research task',
    'learning activity',
    'diagnostic assessment',
    'flashcards (written)',
  ],
  title: 'CAPS Worksheet',
  purpose:
    'A print-ready, marked practice page with CAPS strand sections, ruled answer space, a score capsule and a full memorandum.',
  sources: [
    'assets/templates/gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf',
    'assets/templates/gr4-life-skills-worksheet-term2-emotions-relationships.pdf',
    'assets/templates/gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf',
    'assets/templates/gr1-phonics-blending-cvc-words.pdf',
  ],
  sections: [
    {
      id: 'banner',
      heading: 'Banner',
      content: 'Two-colour subject band: title, strand subtitle, circular grade badge.',
      mustRender: ['Grade <n>', 'CAPS Aligned'],
    },
    {
      id: 'fill-in',
      heading: 'Learner fill-in row',
      content: 'Name, Date and (when term-scoped) Term, all ruled and empty.',
      blankFields: [],
      learnerWriting: true,
    },
    {
      id: 'sections',
      heading: 'Numbered section bars',
      content: 'Three to four CAPS strand sections, each a coloured pill with its mark subtotal.',
    },
    {
      id: 'questions',
      heading: 'Question blocks',
      content: 'Numbered questions with the answer affordance their type needs and right-aligned marks.',
    },
    {
      id: 'score',
      heading: 'Score capsule',
      content: 'Amber-bordered capsule, bottom-right, reading "SCORE ______ / <total>".',
      mustRender: ['SCORE', '/'],
    },
    {
      id: 'closing',
      heading: 'Teacher comment rows',
      content: 'Teacher and comment lines; moderator and date only on formal assessments.',
    },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'subject palette, two stops (see bannerPalettes.ts)',
    paletteId: 'worksheet',
    gradeBadge: 'circular white-on-brand badge overlapping the banner edge',
    sectionBar: 'full-width rounded pill bar, white label, cycling palette colours',
    scoreCard: 'pale amber capsule, thick amber border, bottom-right',
    typography: 'title 800–900 weight; body 14–15 px; marks 12–13 px right-aligned',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: [
    'Name:',
    'Date:',
    'Term:',
    'SECTION A —',
    'SECTION B —',
    'SECTION C —',
    'SCORE',
    'Teacher:',
    'Comment:',
  ],
  blankFields: ['Name', 'Date', 'Term', 'Score', 'Teacher', 'Comment'],
  guardrails: [
    'Never pre-fill the learner name or a date.',
    'Every mark must add up to the printed total.',
    'Never emit a second header, crest band or footer.',
    'A worksheet is answerable on the page — no "discuss in class" question without a written answer line.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) => {
    const palette = resolveMeasuredPalette(input.subject, 'worksheet');
    return composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        term: input.term,
        language: input.language,
        totalMarks: input.totalMarks ?? 30,
        learnerProfile: input.learnerProfile,
        objectives: input.objectives,
        resources: input.resources,
      }),
      brief: `Generate the complete CAPS worksheet for this request.

PALETTE FOR THIS DOCUMENT (measured, use these exact hex values):
${measuredPaletteBrief(palette)}

QUESTION MIX (use only the types that genuinely test the topic):
- One recall section (definitions, labels, short calculations).
- One application section (word problems or scenarios set in South Africa, using Rands and local names).
- One reasoning / synthesis section (compare, explain why, draw and label).
- Distribute marks so the printed total is exactly ${input.totalMarks ?? 30}.

${illustrationClause({
        generateImage: input.generateImage,
        style: input.illustrationStyle,
        goldenRule: input.imageGoldenRule,
      })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    });
  },
};

export default worksheetTemplate;
