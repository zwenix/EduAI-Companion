/**
 * TIMETABLE / WEEKLY PLANNER — reverse-engineered from
 *   assets/templates/about_blank_1.pdf — "MY WEEKLY ADVENTURE"
 *
 * Anatomy: pastel gradient header with the sheet title and the tagline
 * "EduAI Companion: Planning for Success!" → a three-capsule metadata row
 * (Student Name / Grade & Class / Term / Year), each a pale tinted card with a
 * ruled fill line → a seven-column weekly grid whose first column is the time or
 * period and whose break rows span every day → an optional notes/checklist block.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, MEASURED_PALETTES, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, requestBlock } from './shared';

const BRIEF = `Build the planner exactly in this order:

1. HEADER
   - A pastel two-colour gradient band (the reference: teal → azure) with a large calendar/icon mark at the left.
   - White title in 30–40 px 800 weight ("MY WEEKLY ADVENTURE").
   - White subtitle one step smaller ("EduAI Companion: Planning for Success!").

2. METADATA CAPSULES (three side by side)
   - "Student Name:" (mint tint), "Grade & Class:" (sky tint), "Term / Year:" (lilac tint).
   - Each capsule is a rounded card with the label above a long ruled fill line.
   - All three are EMPTY. Never pre-fill a learner name, grade or year.

3. WEEKLY GRID
   - Header row: "Time / Period" then Monday → Friday in white on the band colour.
   - Left column: "07:30 – 08:00", "Period 1" … "Period 6", "Extra-Mural".
   - Break rows ("BREAK", "SHORT BREAK") span all five day columns as one tinted band with a centred label and one small icon.
   - Data cells are empty and lightly ruled; row heights are equal and generous (≥ 12 mm) so a learner can write in them.

4. NOTES / CHECKLIST BLOCK (below the grid)
   - A pale block titled "Notes" or "Goals this week", with three empty checkbox squares and ruled lines.
   - An optional "Teacher's signature" capsule at the bottom right.

HARD RULES:
- The planner is written on by a learner: every field, row and line must be blank.
- Period names and times come from the request; if none are supplied, use the reference pattern (registration, six periods, two breaks, extra-mural).
- No invented subjects inside the grid.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a WEEKLY TIMETABLE / PLANNER — stationery a learner writes their own week into. It carries no content of its own beyond labels.`,
  visual: `VISUAL SYSTEM (measured from the reference planner):
${measuredPaletteBrief(MEASURED_PALETTES['weekly-planner'])}
- Grid: 1 px rules, 11–13 px cell type, equal row height ≥ 12 mm.
- Break rows: full-width tinted bands (amber / pale yellow) with a centred 700-weight label.
- Capsules: ${MEASURED_LAYOUT.cardRadius} radius, pale tint, 1 px border.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `PRINT DISCIPLINE:
- The grid must survive A4 printing at 100% scale: no row may shrink below 12 mm.
- Never break the grid across pages; if there are more than nine rows, print a second page with the header repeated.`,
});

export const timetablePlannerTemplate: ContentTypeTemplate = {
  id: 'timetable-planner',
  aliases: ['timetable template', 'weekly planner', 'daily planner', 'study planner', 'homework planner', 'class timetable', 'planner'],
  title: 'Timetable / Weekly Planner',
  purpose: 'A blank, writeable weekly grid: pastel header, three empty metadata capsules, time/period column, five day columns and full-width break rows.',
  sources: ['assets/templates/about_blank_1.pdf'],
  sections: [
    { id: 'header', heading: 'Pastel header', content: 'Icon mark, white title, planning tagline.' },
    { id: 'capsules', heading: 'Metadata capsules', content: 'Student Name, Grade & Class, Term / Year — all empty.' },
    { id: 'grid', heading: 'Weekly grid', content: 'Time/Period column, Mon–Fri columns, full-width break rows, ≥ 12 mm rows.' },
    { id: 'notes', heading: 'Notes / goals block', content: 'Checkbox squares and ruled lines, empty.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'teal → azure pastel gradient',
    paletteId: 'foundation',
    gradeBadge: 'Grade & Class capsule',
    sectionBar: 'white header row on the band colour',
    scoreCard: 'none',
    typography: 'title 30–40 px; grid 11–13 px; capsules 13–15 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Student Name:', 'Grade & Class:', 'Term / Year:', 'Time / Period', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'BREAK', 'SHORT BREAK', 'Extra-Mural'],
  blankFields: ['Student Name', 'Grade & Class', 'Term / Year', 'Every grid cell', 'Notes'],
  guardrails: [
    'Every field and cell is blank — the planner is written on.',
    'Rows never shrink below 12 mm in print.',
    'No invented subjects inside the grid.',
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
        dimensions: input.dimensions || 'A4 portrait',
        classSize: input.classSize,
      }),
      brief: `Build the complete blank planner for this request.

Use the reference periods unless the brief names its own. Leave every field and every grid cell empty.

Set "printInstructions" to "A4 portrait, print at 100% scale; do not reduce the grid — print a second page when rows exceed nine."`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default timetablePlannerTemplate;
