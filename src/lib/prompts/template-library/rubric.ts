/**
 * RUBRIC — the analytical / holistic marking matrix.
 *
 * Reverse-engineered from the marked assessment pairs in `assets/templates/`
 * plus the rubric grammar the app already ships: criteria down the left,
 * performance levels across the top, a descriptor in every cell, and a marks
 * row that adds to the assessment total.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, requestBlock } from './shared';

const BRIEF = `Build the rubric exactly to this anatomy:

1. HEADER
   - Title: "<Assessment / Task> — Marking Rubric".
   - Sub-line: grade · subject · term · total marks · CAPS strand.
   - A one-line note on how to use it: "Place each learner's work against the descriptors below and circle the level achieved per criterion."

2. CRITERIA TABLE
   - Left column: four to six criteria, each naming what is judged (Content & concepts · Application & accuracy · Organisation & layout · Language & terminology · Effort & presentation).
   - Weighting column: each criterion's marks, adding to the stated total.
   - Then one column per performance level. Use FOUR levels (0–29 · 30–49 · 50–69 · 70–100%) for Grades R–9, or the CAPS SEVEN-point scale (1–7 with the percentage bands) for Grades 10–12.
   - Every cell carries a complete descriptor: what the learner's work must show to earn that level for THAT criterion. No empty cells, no "good / bad", no placeholders.

3. TOTALS ROW
   - The marks available per level, the total possible, and an "Achieved: ____ / ____" line.

4. HOLISTIC SUMMARY (when the caller asks for a holistic rubric)
   - Four paragraphs, one per level, describing the whole task at that level — plus one closing "Feedback to the learner:" box with ruled lines.

HARD RULES:
- Descriptors are observable: a second marker must reach the same level from the same work.
- Criteria weights must add exactly to the total.
- No cell is empty and no criterion has fewer than the full set of levels.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a MARKING RUBRIC. Its only job is to let two different markers give the same work the same mark, and to tell the learner exactly what to do better.`,
  visual: `VISUAL SYSTEM (measured from the reference marked documents):
- Page: ${MEASURED_LAYOUT.page} landscape or portrait, ${MEASURED_LAYOUT.pagePadding} padding.
- Table: 1 px rules, shaded header row, level columns equal width, criteria column 24–28% wide.
- Descriptor text: 12–13 px, 500 weight, generous cell padding so the table stays readable.
- Level header cells carry their percentage band under the level name.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `MARK ALLOCATION:
- Choose criterion weights from the task, then confirm they add to the total before writing descriptors.
- If the caller supplied a total, the weights must hit it exactly; if not, default to 20 marks for a worksheet task and 50 for a project.
- Bloom's level belongs in the criterion name when the task is cognitive (e.g. "Application & accuracy (Bloom 3)").`,
});

export const rubricTemplate: ContentTypeTemplate = {
  id: 'rubric',
  aliases: ['assessment rubric', 'analytical rubric', 'holistic rubric', 'rubric', 'checklist / self-assessment', 'marking rubric'],
  title: 'Marking Rubric',
  purpose: 'A criteria × levels matrix with a complete observable descriptor in every cell, weights that add to the total, and a totals row.',
  sources: [
    'assets/templates/gr3-life-skills-assessment-term1-healthy-living.pdf',
    'assets/templates/gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf',
    'assets/templates/gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf',
  ],
  sections: [
    { id: 'header', heading: 'Rubric header', content: 'Title, grade/subject/term/total, and how-to-use line.' },
    { id: 'criteria', heading: 'Criteria table', content: '4–6 criteria with weights, one column per level, a full descriptor in every cell.' },
    { id: 'totals', heading: 'Totals row', content: 'Marks per level, total possible, achieved line.' },
    { id: 'holistic', heading: 'Holistic summary', content: 'One paragraph per level plus a feedback box (holistic mode only).' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (assessment palette)',
    paletteId: 'assessment',
    gradeBadge: 'grade in the sub-line',
    sectionBar: 'shaded table header row with percentage bands',
    scoreCard: 'totals row with "Achieved: ___ / ___"',
    typography: 'criteria 13–14 px 700 weight; descriptors 12–13 px; headers 13 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Marking Rubric', 'Criterion', 'Marks', 'Achieved:', 'Feedback to the learner:'],
  blankFields: ['Achieved', 'Marker', 'Date', 'Feedback'],
  guardrails: [
    'Every cell carries a full descriptor — no empty or placeholder cells.',
    'Criterion weights must add exactly to the total.',
    'Descriptors are observable enough for two markers to agree.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        term: input.term,
        totalMarks: input.totalMarks,
        language: input.language,
      }),
      brief: `Build the complete rubric for this request.

Choose analytical (criteria × levels) unless the brief asks for holistic. Use four levels for Grades R–9 and the CAPS seven-point scale for Grades 10–12.

State the criterion weights first and confirm they add to ${input.totalMarks ?? 'the total'}; only then write the descriptors.

Put the finished rubric HTML in "content" and the same matrix in "rubric" so either field can render it.`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default rubricTemplate;
