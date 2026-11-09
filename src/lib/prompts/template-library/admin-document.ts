/**
 * ADMIN DOCUMENT — reverse-engineered from
 *   assets/templates/about_blank_1.pdf — the "MY WEEKLY ADVENTURE" planner
 *   assets/templates/AI_IMG (7).jpg    — the lesson-plan stationery sheet
 *   assets/templates/AI_IMG (1).jpg    — the ruled "Lesson Planner" grid
 *
 * Plus the school-correspondence grammar the Admin Lab already ships: a subject
 * line, a salutation, short factual paragraphs, an action line, a sign-off block
 * and (when requested) a tear-off reply slip.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, requestBlock } from './shared';

const BRIEF = `Build the document in the grammar that fits the requested type.

GRAMMAR A — FORMAL CORRESPONDENCE (letters, notices, permission slips, invitations, policy letters, disciplinary notices)
1. A calm title strip naming the document ("Letter to Parents", "Permission Slip", "Meeting Invitation"). No crest, no official emblem, no imitation letterhead unless a letterhead was explicitly requested.
2. A reference block: REF, Date (blank for handwriting), Recipient, and the Subject line in bold.
3. A salutation, then three to five short paragraphs: purpose in the first sentence, the facts, then the action the reader must take.
4. A details table for logistics (date, time, venue, cost, what to bring) — every supplied value carried exactly, missing values omitted rather than invented.
5. A sign-off block: name line, role line, signature line, school stamp placeholder.
6. A tear-off reply slip only when the caller asks for one: "Please return by ______", consent / do-not-consent checkboxes, parent name, signature, date — all blank.

GRAMMAR B — PLANNER / STATIONERY SHEET (timetable, register, calendar, weekly planner)
1. A pastel header band with the sheet title and a friendly subtitle.
2. A metadata capsule row: Student / Grade & Class / Term & Year, or Teacher / Week / Class — all ruled and empty.
3. A grid: time or period in the first column, one column per day, generous row height. Break and recess rows span the full width in a tinted band with a centred label.
4. Optional legend or notes block beneath the grid.

GRAMMAR C — RECORD / REGISTER (attendance register, progress tracker)
1. Title strip plus the blank header fields (school, class, term, year).
2. One table: learners in rows, weeks or criteria in columns, empty cells, no invented data.
3. A totals row and a signature row at the foot.

HARD RULES:
- Never invent a name, an address, a phone number, an email, a reference number, a fee, a deadline, a policy, an approval or a school achievement.
- Missing fields are omitted in correspondence, and printed as functional ruled blanks in forms.
- Never claim DBE approval, legal compliance or official status; never imitate the South African coat of arms or a real school crest.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a SCHOOL ADMINISTRATION document. A real office will print it, sign it and send it home, so every supplied fact must be carried exactly and nothing may be invented.`,
  visual: `VISUAL SYSTEM (measured from the reference stationery):
- Page: ${MEASURED_LAYOUT.page}, ${MEASURED_LAYOUT.pagePadding} padding.
- Header band: pastel two-colour band, white title 24–30 px 800 weight, subtitle 15 px.
- Metadata capsules: pale tint, 1 px border, ${MEASURED_LAYOUT.cardRadius} radius, 13–15 px labels with ruled fill areas ≥ 9 mm tall.
- Tables: 1 px rules, 11–13 px cells, break rows tinted and full-width.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `POPIA AND TONE:
- Minimise personal information: no learner ID numbers, no medical detail, no home addresses.
- Tone is factual, respectful and proportionate. A disciplinary notice never presumes guilt and never shames.
- Plurals and salutations stay inclusive ("Dear Parent/Guardian").`,
});

export const adminDocumentTemplate: ContentTypeTemplate = {
  id: 'admin-document',
  aliases: [
    'letter to parents',
    'general notice to parents',
    'permission slip',
    'meeting invitation',
    'progress update letter',
    'report comment template',
    'general school notice',
    'subject improvement plan',
    'school calendar event notice',
    'academic achievement certificate',
    'participation certificate',
    'disciplinary notice',
    'homework policy letter',
    'detention notice',
    'achievement certificate',
    'newsletter',
    'admin document',
    'report comment',
    'curriculum map',
  ],
  title: 'School Administration Document',
  purpose: 'Correspondence, forms, planners and registers that carry supplied facts exactly, leave fill-in fields blank and never fabricate official data.',
  sources: [
    'assets/templates/about_blank_1.pdf',
    'assets/templates/AI_IMG (7).jpg',
    'assets/templates/AI_IMG (1).jpg',
  ],
  sections: [
    { id: 'title', heading: 'Title strip', content: 'Document name in a calm pastel band.' },
    { id: 'reference', heading: 'Reference block', content: 'REF, blank Date, Recipient and a bold Subject line (correspondence).' },
    { id: 'body', heading: 'Body', content: 'Three to five short factual paragraphs ending in the required action.' },
    { id: 'details', heading: 'Details table', content: 'Logistics carried exactly; missing values omitted, never invented.' },
    { id: 'sign-off', heading: 'Sign-off', content: 'Name, role, signature and stamp lines.' },
    { id: 'reply-slip', heading: 'Reply slip', content: 'Tear-off consent block, shown only when requested.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (admin palette: royal blue → sky)',
    paletteId: 'admin',
    gradeBadge: 'none — admin documents are not graded',
    sectionBar: 'pastel header band with white title',
    scoreCard: 'none',
    typography: 'title 24–30 px; body 12–14 px; table cells 11–13 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['REF:', 'Date:', 'Subject:', 'Dear Parent/Guardian', 'Yours faithfully', 'Signature:', 'Please return by'],
  blankFields: ['Date', 'Reference', 'Recipient', 'Signature', 'Parent name', 'Return date'],
  guardrails: [
    'Never invent a name, address, phone, email, reference, fee, deadline or policy.',
    'Never claim DBE approval or official status; never imitate a crest or coat of arms.',
    'Missing fields are omitted in letters and printed as blank fields in forms.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        schoolName: input.schoolName,
        documentType: input.documentType,
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        teacherName: input.teacherName,
        language: input.language,
      }),
      brief: `Write the complete ${input.documentType || 'school document'} for this request.

Choose the grammar (correspondence / planner / register), then build the whole document.

The "notes" content goes in "memo" — a short reviewer's note listing every field the office must fill before sending, and every supplied fact that was carried verbatim.`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default adminDocumentTemplate;
