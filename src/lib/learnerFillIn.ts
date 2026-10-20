/**
 * Learner fill-in fields — the **Name / Grade / Date** blanks a learner
 * completes BY HAND on a printed sheet.
 *
 * The rule this module enforces:
 *
 *   On any document a learner writes on, the Name, Grade and Date spaces are
 *   ALWAYS EMPTY. The app never pre-fills them, and it strips anything an AI
 *   model invented (a fictional learner name, today's date, a hardcoded grade)
 *   before the document reaches a preview, a print or a PDF.
 *
 * Three moving parts, used by `contentTemplate.ts`:
 *
 *  1. {@link isLearnerFillInContentType} — decides WHICH documents get the
 *     blank row. Worksheets, classroom tasks, activities, assessments and
 *     Foundation Phase packs qualify; teacher-facing documents (lesson plans,
 *     memos, rubrics, admin notices, posters) do NOT and keep their real
 *     metadata.
 *  2. {@link LEARNER_FILL_IN_ROW_HTML} — the ONE canonical blank row
 *     (`Name: ____  Grade: ____  Date: ____`), injected under the banner.
 *  3. {@link blankLearnerFillInValues} + {@link stripLearnerFillInRows} —
 *     defensive post-processing that empties any hallucinated value and drops
 *     any model-written duplicate of the row.
 *
 * The banner keeps printing the REAL grade pill ("Grade 3") for the teacher's
 * reference — only the fill-in row in the sheet body is blank. And when a
 * teacher explicitly types a learner name in the Document Banner Identity
 * panel, that name still wins over the blank (see `buildBannerPills`).
 */

/**
 * The taxonomy entries a learner writes on.
 *
 * Kept explicit (rather than pattern-only) so the behaviour is reviewable at a
 * glance; {@link isLearnerFillInContentType} adds a narrow fuzzy fallback for
 * free-form/harvested content types such as "Grade 5 Worksheet".
 */
export const LEARNER_FILL_IN_CONTENT_TYPES: readonly string[] = [
    // Classroom Tasks & Exercises
    'Worksheet',
    'Homework Task',
    'Classroom Exercise',
    'Group Activity',
    'Reading Comprehension',
    'Writing Task',
    'Research Task',
    'Learning Activity',
    // Assessments — every SA test/exam paper carries a Name/Grade/Date block
    'Controlled Test',
    'Examination',
    'Formal Assessment Task (FAT)',
    'Investigation',
    'Project Brief',
    'Case Study',
    'Oral/Speech Task',
    'Practical Task / Experiment',
    'Portfolio Task',
    'Diagnostic Assessment',
    // Foundation Phase (Grade R–3) packs and activities
    'Foundation Phase Activity',
    'Interactive Foundation Learning Pack',
    // Visual Lab sheets a learner handles/writes on
    'Cut-out Activity Cards',
    'Matching Cards',
];

/**
 * Narrow fuzzy fallback for free-form content types that are not in the
 * taxonomy above ("Worksheet - Fractions", "Practical Investigation", …).
 *
 * Deliberately tight: it must never catch teacher documents such as
 * "Lesson Plan", "Marking Memo", "Assessment Rubric" or "Letter to Parents".
 */
const LEARNER_FILL_IN_HINT =
    /\b(?:worksheet|werkvel|homework|huiswerk|classroom exercise|activity sheet|learning activity|cut-?out activity|reading comprehension|writing task|research task|controlled test|examination|exam paper|assessment task|\bFAT\b|investigation|practical task|portfolio task|diagnostic assessment)\b/i;

const normalise = (value?: string): string =>
    String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * True when a document of this content type is written ON BY A LEARNER, so its
 * Name / Grade / Date spaces must be left empty.
 */
export const isLearnerFillInContentType = (contentType?: string): boolean => {
    const type = normalise(contentType);
    if (!type) return false;
    const lower = type.toLowerCase();
    if (LEARNER_FILL_IN_CONTENT_TYPES.some((known) => known.toLowerCase() === lower)) return true;
    return LEARNER_FILL_IN_HINT.test(type);
};

/** Class + marker attribute of the canonical row (used for idempotency). */
export const LEARNER_FILL_IN_CLASS = 'eduai-learner-fillin';

/** One labelled blank. `&nbsp;` keeps the dashed rule visible but EMPTY. */
const blankField = (label: string, minWidth: number): string =>
    `<span style="display:inline-flex;align-items:baseline;gap:8px;white-space:nowrap;font-size:14px;font-weight:700;color:#1e293b;">` +
    `${label}:` +
    `<span style="display:inline-block;min-width:${minWidth}px;border-bottom:2px dashed #94a3b8;">&nbsp;</span>` +
    `</span>`;

/**
 * THE canonical learner fill-in row: Name, Grade and Date, all three EMPTY.
 *
 * Inline styles (not Tailwind utilities) so it renders identically in the
 * on-screen preview iframe, the print pipeline, html2canvas rasterisation,
 * the Chromium PDF export and a standalone exported HTML file.
 */
export const LEARNER_FILL_IN_ROW_HTML: string =
    `<div class="${LEARNER_FILL_IN_CLASS}" data-learner-fillin="name-grade-date" ` +
    `style="display:flex;flex-wrap:wrap;align-items:baseline;gap:14px 32px;` +
    `margin:0 0 20px;padding:12px 16px;border:1px solid #cbd5e1;border-radius:12px;` +
    `background:#f8fafc;break-inside:avoid;page-break-inside:avoid;">` +
    blankField('Name', 220) +
    blankField('Grade', 90) +
    blankField('Date', 140) +
    `</div>`;

/** True when the markup already carries the canonical row. */
export const hasLearnerFillInRow = (html: string): boolean =>
    String(html || '').includes(LEARNER_FILL_IN_CLASS);

/**
 * Inject the canonical blank row directly AFTER the banner.
 *
 * Idempotent: a document that already carries the row is returned untouched,
 * so re-exporting a print preview never stacks a second row.
 */
export const injectLearnerFillInRow = (bannerHtml: string): string =>
    hasLearnerFillInRow(bannerHtml) ? bannerHtml : `${bannerHtml}\n${LEARNER_FILL_IN_ROW_HTML}`;

/** Label words (English + Afrikaans) the fill-in lines are written with. */
const FILL_IN_LABEL = '(?:Name|Naam|Grade|Graad|Date|Datum)';

/**
 * A block whose ENTIRE visible text is nothing but fill-in labels and blank
 * rules ("Name: ______ Date: ______", "Naam: … Graad: …").
 *
 * Used to delete a model-written duplicate of the canonical row. The pattern
 * can only match a pure label-and-blank line, so real content — a question, a
 * sentence, an instruction that merely mentions a name — is never removed.
 */
const FILL_IN_ONLY_TEXT = new RegExp(
    `^(?:(?:${FILL_IN_LABEL})\\s*[:.]?\\s*(?:_|–|—|-|\\s|&nbsp;|\\u00a0)*)+$`,
    'i',
);

/** Visible text of a fragment, with entities and tags removed. */
const visibleText = (markup: string): string =>
    String(markup || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/g, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Remove model-generated Name/Date/Grade fill-in ROWS that would duplicate the
 * canonical one. Only pure label-and-blank blocks are removed.
 */
export const stripLearnerFillInRows = (html: string): string => {
    const source = String(html || '');
    if (!source) return source;
    // Non-nested block elements only, so the scan cannot swallow a section.
    return source.replace(
        /<(p|div)\b[^>]*>((?:(?!<(?:p|div)\b)[\s\S])*?)<\/\1>/gi,
        (match, _tag: string, innerMarkup: string) => {
            // Never touch the canonical row itself.
            if (match.includes(LEARNER_FILL_IN_CLASS)) return match;
            return FILL_IN_ONLY_TEXT.test(visibleText(innerMarkup)) ? '' : match;
        },
    );
};

/** Underline used when a pre-filled value is blanked out. */
export const FILL_IN_BLANK = '__________';

/**
 * Every label a document-metadata date is written under (English + Afrikaans).
 *
 * Deliberately a LABEL vocabulary, not a bare-date pattern: the one-date rule
 * targets dates a learner or teacher fills in by hand, not dates that ARE the
 * lesson. A History timeline entry ("16 June 1976 — Soweto Uprising") or a
 * Mathematics date problem is teaching content and must survive untouched, so
 * only a date sitting in a recognised field is blanked.
 */
const DATE_FIELD_LABEL =
    '(?:' +
    [
        'Date', 'Datum',
        'Date issued', 'Date completed', 'Date received', 'Date returned',
        'Date of assessment', 'Date of birth', 'Date of meeting', 'Date of event',
        'Due date', 'Closing date', 'Sperdatum', 'Vervaldatum',
        'Signed on', 'Onderteken op', 'Assessment date', 'Completion date',
        'Issued on', 'Gegee op', 'Handed in', 'Ingehandig',
    ].join('|') +
    ')';

/**
 * A date value in any common South African written form.
 *
 *   15/10/2026 · 15-10-2026 · 2026-10-15 · 15 October 2026 · October 15, 2026
 */
const DATE_VALUE =
    '(?:' +
    '\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}' +      // 15/10/2026, 15-10-26
    '|\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}' +       // 2026-10-15
    '|[A-Za-z]+\\.?\\s+\\d{1,2},?\\s+\\d{4}' +  // October 15, 2026
    '|\\d{1,2}\\s+[A-Za-z]+\\.?,?\\s+\\d{4}' +  // 15 October 2026
    ')';

/**
 * Blank EVERY document-metadata date in a generated body.
 *
 * This is the enforcement half of the one-date rule: the host banner prints
 * today's real date, and every other date on the page is a field the learner or
 * teacher completes by hand — so a date the model pre-filled is emptied.
 *
 * Applies to ALL content types, not only learner worksheets: a teacher-facing
 * lesson plan or an admin letter also carries fill-in dates (issued, signed,
 * meeting, due). Unlike {@link blankLearnerFillInValues}, it is safe to run on
 * any document because it only fires inside a recognised date FIELD — a date
 * that is part of the teaching content is left exactly as written.
 *
 *   "Date: 15/10/2026"          -> "Date: __________"
 *   "Datum: 2026-10-15"         -> "Datum: __________"
 *   "Due date: 15 October 2026" -> "Due date: __________"
 *   "16 June 1976 — Soweto"     -> untouched (teaching content, no field label)
 */
export const blankFillInDates = (html: string): string => {
    let out = String(html || '');
    if (!out) return out;

    // A labelled date field: blank the value, keep the label.
    out = out.replace(
        new RegExp(`(${DATE_FIELD_LABEL}\\s*:\\s*)${DATE_VALUE}`, 'gi'),
        `$1${FILL_IN_BLANK}`,
    );

    return out;
};

/**
 * Empty any value a model pre-filled on a Name / Grade / Date line.
 *
 * Handles the English and Afrikaans labels and only fires when the value sits
 * at the end of a line or directly before a tag, so prose that happens to
 * contain the word "name" is left alone.
 *
 *   "Name: Thabo"        -> "Name: __________"
 *   "Datum: 15/03/2026"  -> "Datum: __________"
 *   "Grade: 5"           -> "Grade: __________"
 */
export const blankLearnerFillInValues = (html: string): string => {
    let out = String(html || '');
    if (!out) return out;

    // "Name: Thabo Mokoena" / "Naam: Lerato" -> a blank rule.
    out = out.replace(
        new RegExp(`((?:Name|Naam)\\s*:\\s*)([A-Za-z][A-Za-z\\-.' ]{1,60})(?=<|\\n|$)`, 'gi'),
        `$1${FILL_IN_BLANK}`,
    );

    // "Date: 15/03/2026", "Datum: 2026-03-15", "Date: 15 March 2026",
    // "Date: 15 March, 2026", "Date: March 15, 2026".
    out = out.replace(
        new RegExp(
            `((?:Date|Datum)\\s*:\\s*)(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4}|\\d{4}[/\\-.]\\d{1,2}[/\\-.]\\d{1,2}|[A-Za-z]+\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\s+[A-Za-z]+,?\\s+\\d{4})(?=<|\\n|$)`,
            'gi',
        ),
        `$1${FILL_IN_BLANK}`,
    );

    // "Grade: 5" / "Graad: 5" / "Grade: Grade 5" / "Grade: 7A" / "Grade: R".
    // Kept tight on purpose: a grade value is a short token (digits with an
    // optional letter suffix, a letter+digit class code, or Grade R), never a
    // word — so prose such as "the grade of the slope" is left alone.
    out = out.replace(
        new RegExp(`((?:Grade|Graad)\\s*:\\s*)(?:Grade|Graad)?\\s*(\\d{1,2}[A-Za-z]?|[A-Za-z]\\d{1,2}|R)(?=<|\\n|$)`, 'gi'),
        `$1${FILL_IN_BLANK}`,
    );

    return out;
};

/**
 * Full defensive pass over a learner-facing body: empty any hallucinated
 * value, drop duplicate fill-in rows, then guarantee exactly one canonical
 * blank row.
 */
export const sanitiseLearnerFillInBody = (html: string): string =>
    stripLearnerFillInRows(blankLearnerFillInValues(String(html || '')));

export default {
    LEARNER_FILL_IN_CONTENT_TYPES,
    LEARNER_FILL_IN_CLASS,
    LEARNER_FILL_IN_ROW_HTML,
    FILL_IN_BLANK,
    isLearnerFillInContentType,
    hasLearnerFillInRow,
    injectLearnerFillInRow,
    stripLearnerFillInRows,
    blankFillInDates,
    blankLearnerFillInValues,
    sanitiseLearnerFillInBody,
};
