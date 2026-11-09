/**
 * TRACING / HANDWRITING WORKSHEET — reverse-engineered from
 *   assets/templates/grR-phonics-tracing-letter-s.pdf
 *   assets/templates/AI_IMG (10).jpg  — number + finger-count flash cards
 *   assets/templates/AI_IMG (5).jpg   — alphabet flashcards with tracing
 *
 * Anatomy: bright banner with the starred title and the grade | term | strand
 * subtitle → name / date row → two or three "Trace:" rows of four dotted guide
 * boxes followed by ruled practice lines → one "Write:" free-writing row →
 * a small picture cue box with the key word → a colour-a-star progress strip.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Build the tracing worksheet exactly in this order:

1. BANNER
   - Full-width band (the reference uses a rose-pink band for handwriting).
   - White title led by a pencil icon: "Let's Trace the Letter S!".
   - White subtitle: "Grade R | Term 1 | Handwriting Practice".
   - One ⭐ at each end of the band.

2. NAME / DATE ROW
   - "Name: ______________________________    Date: ________________" — ruled and empty.

3. TRACE ROWS (two rows of four boxes)
   - Row label "Trace:" in the row colour, at the left edge.
   - Four large rounded guide boxes, each containing the letter in grey dotted/outline form at 96–120 px. The boxes carry a 2 px border in the row colour.
   - Immediately right of the boxes: three or four ruled practice lines at the same height, for the learner to repeat the letter by hand.
   - Row 1 uses one colour; row 2 uses a second colour so the repetition reads as two rounds.

4. WRITE ROW
   - Label "Write:" in a third colour, followed by two long ruled lines with no guide letters.

5. PICTURE CUE
   - A small rounded box at the right of the write row containing a simple picture of the key word and the word printed beneath it ("snake").

6. PROGRESS STRIP
   - "Colour a ▪ for each line you finish:" followed by four grey stars to colour in.

RULES:
- The letter is drawn in the SAME form the learner is taught to write — a single consistent letterform, never mixed print styles.
- Guide letters are grey outlines/dotted, never solid black; the learner traces them.
- Baseline guidance: ruled lines are solid blue/grey with a dashed midline where the phase uses one.
- No prose, no questions, no marks.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a FOUNDATION PHASE TRACING / HANDWRITING WORKSHEET (Grade R–2). Its entire job is repetition practice: big guide letters to trace, then ruled lines to copy.`,
  visual: `VISUAL SYSTEM (measured from the reference tracing sheet):
${measuredPaletteBrief(resolveMeasuredPalette('Phonics', 'worksheet'))}
- Guide letters: 96–120 px, grey outline or dotted, centred in their box.
- Boxes: 1rem radius, 2 px border in the row colour, white fill, 16 px internal padding.
- Ruled lines: 2 px solid in the row colour, letter-height apart, with a dashed midline for Foundation Phase.
- Stars: filled grey when uncoloured, 32 px.`,
  anatomy: BRIEF,
  banner: 'self',
  extra: `HANDWRITING ACCURACY:
- Match the letter form to the handwriting programme the sheet names (Jolly Phonics print, Nelson cursive, or the school's own). If none is named, use simple print forms.
- Numbers 0–9 use the same rule: one consistent numeral form per sheet, and the value shown as a matching count of objects or an array of dots.`,
});

export const tracingWorksheetTemplate: ContentTypeTemplate = {
  id: 'tracing-worksheet',
  aliases: ['tracing', 'handwriting', 'letter tracing', 'number tracing', 'handwriting practice', 'trace and copy'],
  title: 'Tracing / Handwriting Worksheet',
  purpose: 'Foundation Phase repetition practice: dotted guide letters in coloured boxes, ruled copy lines, a picture cue and a star progress strip.',
  sources: [
    'assets/templates/grR-phonics-tracing-letter-s.pdf',
    'assets/templates/AI_IMG (5).jpg',
    'assets/templates/AI_IMG (10).jpg',
  ],
  sections: [
    { id: 'banner', heading: 'Stars banner', content: 'Rose band, pencil icon, starred title, grade | term | strand subtitle.' },
    { id: 'fields', heading: 'Name / Date row', content: 'Ruled and empty.', learnerWriting: true },
    { id: 'trace', heading: 'Trace rows', content: 'Two rows of four grey guide boxes plus ruled copy lines.' },
    { id: 'write', heading: 'Write row', content: 'Two long ruled lines with no guides.' },
    { id: 'cue', heading: 'Picture cue', content: 'Key-word picture box with the word printed beneath.' },
    { id: 'progress', heading: 'Progress strip', content: '"Colour a ▪ for each line you finish:" plus four stars.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'rose-pink band (Foundation Phase palette)',
    paletteId: 'foundation',
    gradeBadge: 'grade in the banner subtitle',
    sectionBar: 'coloured row labels: Trace / Trace / Write',
    scoreCard: 'no marks — a star strip replaces scoring',
    typography: 'guide letters 96–120 px grey outline; labels 16–18 px 700 weight',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Trace:', 'Write:', 'Name:', 'Date:', 'Colour a', 'for each line you finish'],
  blankFields: ['Name', 'Date'],
  guardrails: [
    'One consistent letterform per sheet.',
    'Guide letters stay grey outlines — never solid.',
    'No questions, no marks, no prose.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade || 'R',
        subject: input.subject || 'Handwriting',
        topic: input.topic,
        term: input.term || '1',
        language: input.language,
      }),
      brief: `Build the complete tracing worksheet for this request.

Use two Trace rows of four guide boxes each, one Write row of two rule lines, a picture cue box for the key word, and the star progress strip.

${illustrationClause({ generateImage: input.generateImage, style: input.illustrationStyle, goldenRule: input.imageGoldenRule })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default tracingWorksheetTemplate;
