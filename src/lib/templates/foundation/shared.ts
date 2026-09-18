import type { TemplateFieldSpec } from './types';

/**
 * Field sets the Studio renders as inputs. `key` maps 1-to-1 onto
 * `TemplateFieldValues`, and every label is paired with a short isiXhosa
 * equivalent so bilingual sheets stay consistent.
 */

const f = (
    key: TemplateFieldSpec['key'],
    label: string,
    labelXi: string,
    placeholder: string,
    extra: Partial<TemplateFieldSpec> = {},
): TemplateFieldSpec => ({ key, label, labelXi, placeholder, ...extra });

/** Everything an award needs to be filled in and signed. */
export const AWARD_FIELDS: TemplateFieldSpec[] = [
    f('learner', "Learner's name", 'Igama', 'Amahle Ndlovu', { required: true }),
    f('class', 'Class', 'Iklasi', '1B / 2C / R'),
    f('school', 'School name', 'Isikolo', 'Khayelitsha Primary School'),
    f('awardReason', 'Reason for the award', 'Ngenxa ka', 'excellent achievement in Mathematics (Term 2)'),
    f('marks', 'Marks / level achieved', 'Amanqaku', '78 / 80 (Level 7 · Outstanding)'),
    f('term', 'Term', 'Ithemu', 'Term 2, 2026'),
    f('date', 'Date of award', 'Umhla', '26 / 06 / 2026'),
    f('message', 'Personal message', 'Umyalezo', 'Your hard work is showing — keep going!', { multiline: true }),
    f('teacher', 'Class teacher', 'Utitshala', 'Mrs T. Mokoena'),
    f('principal', 'Principal', 'Umphathi wesikolo', 'Mr S. Adams'),
];

/** Worksheet / assessment header fields. */
export const PRACTICE_FIELDS: TemplateFieldSpec[] = [
    f('learner', "Learner's name", 'Igama', 'Lerato Dlamini'),
    f('class', 'Class', 'Iklasi', '2A'),
    f('school', 'School name', 'Isikolo', 'Sunridge Primary School'),
    f('date', 'Date', 'Umhla', '11 / 09 / 2026'),
    f('term', 'Term & week', 'Ithemu', 'Term 3 · Week 2'),
    f('teacher', 'Class teacher', 'Utitshala', 'Ms N. Jacobs'),
    f('marks', 'Marks achieved', 'Amanqaku', ''),
];

/** Homework sheets also capture the caregiver note. */
export const HOMEWORK_FIELDS: TemplateFieldSpec[] = [
    f('learner', "Learner's name", 'Igama', 'Ruan Hendricks'),
    f('class', 'Class', 'Iklasi', '1C'),
    f('date', 'Send date', 'Umhla', 'Mon 14 / 09 · Fri 18 / 09'),
    f('term', 'Term & week', 'Ithemu', 'Term 3 · Week 2'),
    f('teacher', 'Class teacher', 'Utitshala', 'Mrs P. Zungu'),
    f('message', 'Note to parents / caregivers', 'Umyalezo kubazali', 'Please spend 10 minutes with your child and sign the checklist.', { multiline: true }),
];

/** Classroom / circuit activity fields. */
export const CLASSROOM_FIELDS: TemplateFieldSpec[] = [
    f('class', 'Class', 'Iklasi', 'R2 / 1A'),
    f('teacher', 'Facilitator', 'Utitshala', 'Mr B. Khumalo'),
    f('date', 'Date', 'Umhla', '15 / 09 / 2026'),
    f('term', 'Term & week', 'Ithemu', 'Term 3 · Week 3'),
    f('message', 'Grouping / set-up note', 'Umyalezo', '6 groups of 5 · cards on each table', { multiline: true }),
];

export const FIELDS_BY_KIND = {
    award: AWARD_FIELDS,
    worksheet: PRACTICE_FIELDS,
    classroom: CLASSROOM_FIELDS,
    homework: HOMEWORK_FIELDS,
} as const;
