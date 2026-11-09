/**
 * MARKING MEMO — the companion document to every worksheet and assessment.
 *
 * The reference anatomy is the assessment pair in `assets/templates/`
 * (`gr3-life-skills-assessment`, `gr4-mathematics-assessment`,
 * `gr6-mathematics-assessment`): every assessment ships a memorandum that
 * mirrors the paper's numbering one-to-one, prints the mark split per step and
 * lists accepted alternatives.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, requestBlock } from './shared';

const BRIEF = `Build the memorandum exactly to this anatomy:

1. HEADER
   - Title: "Marking Memorandum — <Subject> <Assessment Type>".
   - Sub-line: "Grade <n>  |  Term <t>  |  Total: <marks> marks  |  Examiner: ________  |  Moderator: ________".
   - A one-line instruction to markers: "Award marks exactly as indicated. Accept any correct alternative method unless the question specifies one."

2. QUESTION-BY-QUESTION KEY (mirrors the paper one-to-one)
   - Every question number appears, in the paper's order, in the paper's numbering style.
   - For each: the expected answer, then the mark split in brackets — "✓ 1 mark for the correct formula · ✓ 1 mark for substitution · ✓ 1 mark for the answer".
   - Show the full working for every calculation: the operation, the intermediate value and the final answer with its unit.
   - Where several answers are acceptable, list them explicitly: "Accept 0,5 / 1⁄2 / 50%".
   - Where a question carries a method mark, say so: "Method mark: award 1 if the correct operation is shown even when the arithmetic slips."

3. MARK DISTRIBUTION SUMMARY
   - A table: section, question range, marks available, Bloom level(s) tested, and the CAPS topic strand.

4. COMMON ERRORS AND DIAGNOSTIC NOTES
   - Four to eight bullet rows: the error a learner typically makes, the misconception behind it, and the remedial action the teacher takes.

5. MODERATION BLOCK
   - "Total: ______ / <marks>" · "Marked by: ____________" · "Moderated by: ____________" · "Date: ____________".
   - A short moderation checklist: all questions marked, marks added correctly, alternatives accepted, mark distribution matches the paper.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a MARKING MEMORANDUM — the marking instrument a teacher follows while marking and a moderator audits afterwards. Completeness and arithmetic are the whole point.`,
  visual: `VISUAL SYSTEM (measured from the reference assessment pair):
- Page: ${MEASURED_LAYOUT.page}, ${MEASURED_LAYOUT.pagePadding} padding.
- Question numbers reproduce the paper's numbering exactly, in the memo's mark accent colour.
- Mark splits print as small ✓ chips inline with the answer, not as a separate column.
- Summary tables: 1 px rules, 12–13 px cells, shaded header row.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `ARITHMETIC IS CONTRACTUAL:
- The memo's marks must add to exactly the paper's stated total.
- Every calculation is re-checked before it is written. A wrong memo teaches a teacher to mark correct work wrong.`,
});

export const markingMemoTemplate: ContentTypeTemplate = {
  id: 'marking-memo',
  aliases: ['marking memo', 'memorandum', 'memo', 'answer key', 'marking guideline', 'memorandum key'],
  title: 'Marking Memorandum',
  purpose: 'A one-to-one marking key: every question, the mark split per step, accepted alternatives, a mark-distribution table and a moderation block.',
  sources: [
    'assets/templates/gr3-life-skills-assessment-term1-healthy-living.pdf',
    'assets/templates/gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf',
    'assets/templates/gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf',
  ],
  sections: [
    { id: 'header', heading: 'Memo header', content: 'Title, grade/term/total, examiner and moderator lines, marker instruction.' },
    { id: 'key', heading: 'Question-by-question key', content: 'Answer, full working, ✓ mark split, accepted alternatives.' },
    { id: 'distribution', heading: 'Mark distribution table', content: 'Section, question range, marks, Bloom level, CAPS strand.' },
    { id: 'errors', heading: 'Common errors', content: 'Error → misconception → remedial action rows.' },
    { id: 'moderation', heading: 'Moderation block', content: 'Total, marker, moderator, date and a four-point checklist.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (memo palette: green → teal)',
    paletteId: 'memo',
    gradeBadge: 'grade in the memo sub-line',
    sectionBar: 'numbered question blocks echoing the paper',
    scoreCard: 'moderation total capsule',
    typography: 'question numbers 16–18 px bold; answers 13–14 px; mark chips 11–12 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Marking Memorandum', 'Total:', 'Moderator:', 'Marked by:', 'Accept', 'Method mark'],
  blankFields: ['Examiner', 'Moderator', 'Date', 'Total achieved'],
  guardrails: [
    'The memo mirrors the paper numbering one-to-one — no missing question.',
    'Marks add up to exactly the paper total.',
    'Every calculation is re-checked.',
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
      brief: `Write the complete marking memorandum for this assessment.

If the paper is supplied in the brief, mirror its numbering exactly. If only a topic is supplied, reconstruct the paper's question numbering from the stated total and mark the memo against it, noting the assumption in "assessmentCriteria".

The "content" field carries the memo HTML; the "rubric" field carries the mark-distribution table plus the moderation checklist.`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default markingMemoTemplate;
