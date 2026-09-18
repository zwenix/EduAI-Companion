/**
 * CAPS Foundation Phase (Grade R–3) curriculum framework data.
 *
 * Every claim in this file is taken from the DBE Curriculum and Assessment
 * Policy Statement for Grades R–3 (2011, as amended) and the Foundation Phase
 * subject ADDENDUM / ATP conventions used by WCED schools. It exists so the
 * printable templates can quote the same numbers instead of inventing them.
 */

import type { FoundationGrade, LearningArea, LabelLanguage } from './types';

export const FOUNDATION_GRADES: FoundationGrade[] = ['R', '1', '2', '3'];

export const FOUNDATION_PHASE_LABEL = 'Foundation Phase (Grade R–3)';

/** Weekly instructional time (CAPS §1.4.3 Foundation Phase). */
export const WEEKLY_TIME_HOURS: Record<FoundationGrade, number> = {
    R: 23,
    '1': 23,
    '2': 23,
    '3': 25,
};

/** Daily classroom time implied by the weekly allocation. */
export const DAILY_TIME_LABEL: Record<FoundationGrade, string> = {
    R: '5 hours per day (incl. outdoor play / circuit time)',
    '1': '4½ hours per day',
    '2': '4½ hours per day',
    '3': '5 hours per day',
};

/** Languages, Mathematics and Life Skills splits used by the alignment strips. */
export const SUBJECT_ALLOCATION: Record<string, Record<FoundationGrade, string>> = {
    'Home Language': { R: '10 h languages (HL focus)', '1': '7–8 h HL', '2': '7–8 h HL', '3': '7–8 h HL' },
    'First Additional Language': { R: '—', '1': '2–3 h', '2': '2–3 h', '3': '3–4 h' },
    Mathematics: { R: '7 h', '1': '7 h (1 h 24 min per day)', '2': '7 h (1 h 24 min per day)', '3': '7 h (1 h 24 min per day)' },
    'Life Skills — Beginning Knowledge': { R: '1 h', '1': '1 h', '2': '1 h', '3': '2 h' },
    'Life Skills — Creative Arts': { R: '2 h', '1': '2 h', '2': '2 h', '3': '2 h' },
    'Life Skills — Physical Education': { R: '2 h', '1': '2 h', '2': '2 h', '3': '2 h' },
    'Life Skills — Personal & Social Well-being': { R: '1 h (personal/social)', '1': '1 h', '2': '1 h', '3': '1 h' },
    General: { R: 'per timetable', '1': 'per timetable', '2': 'per timetable', '3': 'per timetable' },
};

/** Home Language content areas per grade (CAPS Languages FP). */
export const HOME_LANGUAGE_AREAS: Record<FoundationGrade, string[]> = {
    R: [
        'Listening and Speaking',
        'Phonics and Print Awareness (reading & phonics)',
        'Writing and Handwriting',
        'Language Structure and Use (integrated)',
        'Thinking and Reasoning (integrated)',
    ],
    '1': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures and Conventions'],
    '2': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures and Conventions'],
    '3': ['Listening and Speaking', 'Reading and Viewing', 'Writing and Presenting', 'Language Structures and Conventions'],
};

/** Mathematics content areas with CAPS programme-of-assessment weightings. */
export const MATHS_AREAS = [
    'Numbers, Operations and Relationships',
    'Patterns, Functions and Algebra',
    'Space and Shape (Geometry)',
    'Measurement',
    'Data Handling (Statistics)',
] as const;

export const MATHS_WEIGHTINGS: Record<'1' | '2' | '3', Record<string, string>> = {
    '1': {
        'Numbers, Operations and Relationships': '65%',
        'Patterns, Functions and Algebra': '10%',
        'Space and Shape (Geometry)': '11%',
        Measurement: '9%',
        'Data Handling (Statistics)': '5%',
    },
    '2': {
        'Numbers, Operations and Relationships': '60%',
        'Patterns, Functions and Algebra': '10%',
        'Space and Shape (Geometry)': '13%',
        Measurement: '12%',
        'Data Handling (Statistics)': '5%',
    },
    '3': {
        'Numbers, Operations and Relationships': '58%',
        'Patterns, Functions and Algebra': '10%',
        'Space and Shape (Geometry)': '13%',
        Measurement: '14%',
        'Data Handling (Statistics)': '5%',
    },
};

/** Number-range progression used to keep maths work in the right band. */
export const NUMBER_RANGES: Record<FoundationGrade, { label: string; max: number; note: string }> = {
    R: { label: '0–10 (extending to 20)', max: 20, note: 'Count, order, compare and represent whole numbers up to at least 10.' },
    '1': { label: '0–100', max: 100, note: 'Number concept to 100; addition/subtraction with solutions up to 100; money to R20 and 5c–50c coins.' },
    '2': { label: '0–200 (towards 1 000)', max: 200, note: 'Extend number concept, place value (hundreds/tens/ones), multiplication tables 2, 3, 4, 5.' },
    '3': { label: '0–1 000', max: 1000, note: 'Whole numbers to at least 1 000 and common fractions by the end of Grade 3; tables 1–9.' },
};

/** Life Skills content areas per grade. */
export const LIFE_SKILLS_AREAS: Record<FoundationGrade, string[]> = {
    R: ['Beginning Knowledge', 'Personal and Social Well-being', 'Physical Education', 'Creative Arts (Music · Movement and Dance · Visual Arts and Craft)'],
    '1': ['Beginning Knowledge', 'Social Well-being', 'Personal Well-being', 'Physical Education', 'Creative Arts (Visual Arts and Craft · Performing Arts)'],
    '2': ['Beginning Knowledge', 'Social Well-being', 'Personal Well-being', 'Physical Education', 'Creative Arts (Visual Arts and Craft · Performing Arts)'],
    '3': ['Beginning Knowledge', 'Social Well-being', 'Personal Well-being', 'Physical Education', 'Creative Arts (Visual Arts and Craft · Performing Arts)'],
};

/** Beginning Knowledge strands (Natural Sciences / Technology · Social Sciences). */
export const BEGINNING_KNOWLEDGE_STRANDS = {
    naturalSciences: ['Everyday materials', 'Living things — animals and plants', 'The earth and beyond', 'The human body and health', 'Food and nutrition', 'Safety and security'],
    socialSciences: ['My family and my home', 'My classroom and my school', 'My community and local history', 'My country and the world', 'Leadership and governance'],
};

/**
 * Programme of assessment (CAPS Foundation Phase).
 * Grade R is criterion-related (4 levels); Grades 1–3 use the 1–7 rating codes
 * with percentage bands, plus a portfolio of evidence and one task/test a term.
 */
export const FP_ASSESSMENT = {
    gradeR: {
        name: 'Grade R — criterion-related recording',
        scale: [
            { code: '4', label: 'Fully competent', band: '85–100%' },
            { code: '3', label: 'Largely competent', band: '65–84%' },
            { code: '2', label: 'Partially competent', band: '40–64%' },
            { code: '1', label: 'Not yet competent', band: '0–39%' },
        ],
        note: 'Assessment is continuous and integrated into the daily programme: observations, checklists, learner work samples and the Grade R portfolio.',
    },
    grades1to3: {
        name: 'Grades 1–3 — 7-point rating codes',
        scale: [
            { code: '7', label: 'Outstanding', band: '80–100%' },
            { code: '6', label: 'Meritorious', band: '70–79%' },
            { code: '5', label: 'Achievement', band: '60–69%' },
            { code: '4', label: 'Competent', band: '50–59%' },
            { code: '3', label: 'Partial competence', band: '40–49%' },
            { code: '2', label: 'Elementary', band: '30–39%' },
            { code: '1', label: 'Nil', band: '0–29%' },
        ],
        note: 'Informal (daily/weekly) checks happen every week; one formal task or test per subject per term; 25% of the year mark per term.',
    },
    forms: ['Oral', 'Written', 'Practical / performance', 'Portfolio of evidence'],
} as const;

/** Promotion requirement context (used in award wording, not as policy text). */
export const FP_PROMOTION_NOTE =
    'Grades R–9 report against the 7-point national scale; Foundation Phase promotion follows the National Policy on Promotion and Learning Achievement (NPPOLA).';

/** CAPS Foundation Phase assessment standards (Languages), quoted for AS refs. */
export const HL_ASSESSMENT_STANDARDS = [
    'AS 1 — Learning through listening, speaking, talking, discussing and reading aloud',
    'AS 2 — Learning through reading and viewing for knowledge and enjoyment',
    'AS 3 — Learning through writing, drawing, composing and presenting',
    'AS 4 — Developing language awareness through listening, speaking, reading and writing',
    'AS 5 — Developing competence in using language effectively for learning',
] as const;

/** Learning areas exposed to the Studio filter, in CAPS display order. */
export const LEARNING_AREAS: LearningArea[] = [
    'Home Language',
    'First Additional Language',
    'Mathematics',
    'Life Skills — Beginning Knowledge',
    'Life Skills — Creative Arts',
    'Life Skills — Physical Education',
    'Life Skills — Personal & Social Well-being',
    'General',
];

/** Language chips for the bilingual label toggle. */
export const LABEL_LANGUAGES: Array<{ id: LabelLanguage; name: string; short: string }> = [
    { id: 'en', name: 'English only', short: 'EN' },
    { id: 'xh', name: 'isiXhosa labels', short: 'XH' },
    { id: 'zu', name: 'isiZulu labels', short: 'ZU' },
    { id: 'af', name: 'Afrikaans labels', short: 'AF' },
];

/** Term helper — Q3 2026 style bands used for default print metadata. */
export const SA_TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'] as const;

/** 10 teaching weeks per term (CAPS ATP structure). */
export const WEEKS_PER_TERM = 10;

/**
 * Standard, ready-to-quote CAPS footer line for a printed document.
 * Kept short so it never wraps onto a second line on A4.
 */
export const capsFooterLine = (grade: string, area: string): string =>
    `CAPS Foundation Phase · Grade ${grade} · ${area} · DBE (2011, as amended) · ATP-aligned`;
