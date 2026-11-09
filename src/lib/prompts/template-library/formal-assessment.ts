/**
 * FORMAL ASSESSMENT — reverse-engineered from
 *   assets/templates/gr3-life-skills-assessment-term1-healthy-living.pdf
 *   assets/templates/gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf
 *   assets/templates/gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf
 *
 * Anatomy: banner with title + "CAPS Term N | <strands>" subtitle + grade badge
 * → name / date / total row → three numbered SECTION bars, each announcing its
 * own mark subtotal in square brackets → exam-numbered questions with ruled
 * answer space and per-question marks in brackets → SCORE capsule → teacher /
 * moderator / date rows → footer.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, requestBlock } from './shared';

const BRIEF = `Build the assessment paper exactly in this order:

1. BANNER
   - Two-colour band in the subject palette. Centred white title: "<Subject> Assessment" (Maths uses "Mathematics Assessment", Life Skills uses "Life Skills Assessment").
   - Centred subtitle: "CAPS Term <t>  |  <strand 1>, <strand 2> & <strand 3>".
   - Circular grade badge on the right edge: "Grade <n>".

2. CANDIDATE ROW
   - "Name: ______________________    Date: ______________    Total: ___ / <marks>".
   - All three ruled and empty. The date is never pre-filled.

3. SECTION BARS (three, by CAPS cognitive strand)
   - "SECTION A — <Knowledge / Numbers & Patterns> [<marks> marks]"
   - "SECTION B — <Routine procedures / Operations> [<marks> marks]"
   - "SECTION C — <Problem solving / Fractions, Data & Measurement> [<marks> marks]"
   - Each bar is a full-width pill in its own colour with the white section label and the bracketed subtotal.
   - The three subtotals must add up exactly to the total printed in the candidate row.

4. QUESTIONS (exam conventions)
   - Every question is numbered in a solid circle, asked in one sentence, and followed by ruled working space sized to its mark value.
   - Marks are right-aligned in square brackets on every question: "[1]", "[2]", "[3]", "[4]".
   - Show-working questions must print "Show working" in the question text.
   - Include exactly the question types the strand needs: calculations, number sentences, patterns, fractions, measurement, data handling (tally table, bar/pie chart reading), geometry (perimeter, area, volume), integers, algebra, percentages.
   - Bloom distribution follows the phase: Foundation mostly remember/understand; Intermediate adds apply/analyse; Senior and FET add evaluate/create.
   - Never let a section bar overlap a question — each bar prints between blocks, not on top of them.

5. SCORE CAPSULE
   - Bottom-right, pale amber with a thick amber border: "SCORE" over "______ / <total>".

6. SIGN-OFF ROWS
   - "Teacher: ______________    Moderator: ______________    Date: __________".
   - The host prints the one canonical footer; do not add another.

MARKING PACK
- "memo": a numbered memorandum in the same order and numbering. Show the full calculation for every step, give the mark allocation per step ("1 mark for the correct operation, 1 mark for the answer"), and list accepted alternative answers.
- "rubric": the marking guideline grid — question, expected answer, marks, Bloom level, common errors.
- "assessmentCriteria": one line of CAPS criteria tags, e.g. "Numbers & Operations · Patterns · Fractions · Measurement · Data Handling".
- "successIndicators": 4–6 observable statements a teacher can tick.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a FORMAL ASSESSMENT PAPER — an invigilated test written for marks and filed for moderation. It is stricter than a worksheet: printed totals, mark subtotals per section, working space, and a memorandum that a moderator can follow line by line.`,
  visual: `VISUAL SYSTEM (measured from the reference assessment papers):
${measuredPaletteBrief(resolveMeasuredPalette('Mathematics', 'assessment'))}
- Page: ${MEASURED_LAYOUT.page}, ${MEASURED_LAYOUT.pagePadding} padding, generous working space — never squeeze a question to fit.
- Section bars: ${MEASURED_LAYOUT.sectionBarRadius}, white 700-weight label, ${MEASURED_LAYOUT.typography.sectionBar}.
- Marks: ${MEASURED_LAYOUT.typography.marks}.`,
  anatomy: BRIEF,
  banner: 'self',
  extra: `MARK ARITHMETIC IS CONTRACTUAL:
- Section subtotals + per-question marks must equal the printed total, exactly.
- A printed question without a mark value is a defect. A mark value not printed in square brackets is a defect.
- Reference mark totals: Grade 3 = 30, Grade 4 = 50, Grade 6 = 60. Scale other grades to their CAPS weighting but always state the total explicitly.`,
});

export const formalAssessmentTemplate: ContentTypeTemplate = {
  id: 'formal-assessment',
  aliases: [
    'controlled test',
    'test',
    'examination',
    'exam',
    'formal assessment task',
    'fat',
    'investigation',
    'project brief',
    'case study',
    'oral/speech task',
    'practical task / experiment',
    'portfolio task',
    'assessment',
  ],
  title: 'Formal Assessment Paper',
  purpose:
    'A CAPS assessment paper with strand sections, printed mark subtotals, working space, a moderator sign-off and a step-by-step memorandum.',
  sources: [
    'assets/templates/gr3-life-skills-assessment-term1-healthy-living.pdf',
    'assets/templates/gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf',
    'assets/templates/gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf',
  ],
  sections: [
    {
      id: 'banner',
      heading: 'Banner',
      content: 'Subject assessment band, CAPS term + strand subtitle, circular grade badge.',
    },
    {
      id: 'candidate',
      heading: 'Candidate row',
      content: 'Name, Date and Total blanks, all ruled and empty.',
      learnerWriting: true,
    },
    {
      id: 'sections',
      heading: 'Strand section bars',
      content: 'Three coloured bars with bracketed mark subtotals that sum to the total.',
    },
    {
      id: 'questions',
      heading: 'Exam questions',
      content: 'Circled numbers, one-sentence stems, working space and right-aligned bracketed marks.',
    },
    {
      id: 'score',
      heading: 'Score capsule',
      content: 'Amber capsule, bottom-right, "SCORE ______ / <total>".',
    },
    {
      id: 'sign-off',
      heading: 'Sign-off rows',
      content: 'Teacher, Moderator and Date lines.',
    },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'subject palette, two stops',
    paletteId: 'assessment',
    gradeBadge: 'circular badge on the right edge of the banner',
    sectionBar: 'full-width pill with bracketed mark subtotal',
    scoreCard: 'amber capsule bottom-right',
    typography: 'exam-style numbering; marks 12–13 px right-aligned',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: [
    'Assessment',
    'CAPS Term',
    'Total:',
    'SECTION A —',
    'SECTION B —',
    'SECTION C —',
    'marks]',
    'SCORE',
    'Teacher:',
    'Moderator:',
  ],
  blankFields: ['Name', 'Date', 'Total', 'Teacher', 'Moderator'],
  guardrails: [
    'Marks must add up exactly — section subtotals and question marks included.',
    'Every question prints its mark value in square brackets.',
    'Never pre-fill a candidate name or date.',
    'The memorandum mirrors the paper numbering one-to-one.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) => {
    const total = input.totalMarks ?? 50;
    return composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        term: input.term,
        duration: input.duration,
        totalMarks: total,
        language: input.language,
        learnerProfile: input.learnerProfile,
      }),
      brief: `Write the complete formal assessment for this request.

MARK PLAN (must be honoured exactly):
- Section A (knowledge / recall): 30% of ${total} marks.
- Section B (routine procedures / application): 40% of ${total} marks.
- Section C (problem solving / reasoning): 30% of ${total} marks.
- Round to whole marks and state the exact subtotal on each section bar; the three subtotals must equal ${total}.

QUESTION DESIGN:
- One instruction sentence per stem; no compound stems.
- Every question is answerable in the space printed beneath it.
- Include at least one data-handling item (tally table, chart or table reading) and one measurement or geometry item when the subject allows it.

PAPER METADATA to print in the memo header: grade, subject, term, duration, total marks, examiner, moderator, Bloom distribution.`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    });
  },
};

export default formalAssessmentTemplate;
