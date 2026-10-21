/**
 * EduAI Companion — South African date helpers (single source of truth)
 *
 * Every date the app prints or asks a model for comes from here and is computed
 * at RUNTIME. Nothing in this module is hardcoded.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * The prompts used to carry literal strings such as "Today's date is 2 June
 * 2026" and "Today's date is 25 August 2026", baked in when they were written.
 * Once the calendar moved past them the model dutifully repeated a date that
 * was months out of date — which reads on the page as a hallucinated date. The
 * only date a generated document should ever carry is the one in the host
 * banner, and it must be today's actual date.
 *
 * THE ONE-DATE RULE
 * -----------------
 * The host banner is the ONLY place a real date is printed. Every other date on
 * a generated document is a field a learner or teacher fills in by hand, so it
 * is rendered blank. See `blankFillInDates` in `learnerFillIn.ts` and the date
 * mandate in `contentStyle.ts`.
 */

/** Two-digit zero-padded number. */
const pad = (value: number): string => String(value).padStart(2, '0');

/** English month names, for the long SA form. */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * Today in South African numeric format: `DD/MM/YYYY`.
 *
 * @param now Injectable for tests. Defaults to the real current date.
 */
export const saToday = (now: Date = new Date()): string =>
    `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

/**
 * Today in South African long format: `20 October 2026`.
 *
 * This is the form the banner and any document metadata should use when a
 * written-out date is wanted.
 */
export const saTodayLong = (now: Date = new Date()): string =>
    `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

/** The current four-digit year, computed — never hardcoded. */
export const currentYear = (now: Date = new Date()): string => String(now.getFullYear());

/**
 * Current SA school term from the calendar:
 * Jan–Mar T1, Apr–Jun T2, Jul–Sep T3, Oct–Dec T4.
 */
export const currentSATerm = (now: Date = new Date()): string => {
    const m = now.getMonth() + 1;
    if (m >= 1 && m <= 3) return 'Term 1';
    if (m >= 4 && m <= 6) return 'Term 2';
    if (m >= 7 && m <= 9) return 'Term 3';
    return 'Term 4';
};

/**
 * The date rule injected into every prompt.
 *
 * Tells the model two things that must never drift: what today actually is, and
 * that it must not write dates into the document body — those are hand-filled.
 */
export const dateMandate = (now: Date = new Date()): string => `
📅 DATE RULES (MANDATORY — COMPUTED, NOT ASSUMED):
- TODAY IS ${saTodayLong(now)} (${saToday(now)}). The current year is ${currentYear(now)}.
- NEVER invent, guess or reuse a date. Do not write any date you were not given.
- The host banner is the ONLY place a real date appears on the document — the app stamps today's date there automatically. Do NOT write a document date, an issue date, a signature date, or a completion date anywhere in the content.
- EVERY other date on the document is filled in by hand by the learner or teacher. Render those as an EMPTY blank line, e.g. "Date: __________" / "Datum: __________". Never pre-fill them.
- A date that IS the teaching content (for example a historical date in a History timeline, or a date used in a Mathematics problem) is part of the lesson and must stay exactly as the curriculum requires. This rule targets document metadata dates only.
- South African format when a date is unavoidable: DD/MM/YYYY (e.g. ${saToday(now)}) or "D Month YYYY".
`;

export default {
    saToday,
    saTodayLong,
    currentYear,
    currentSATerm,
    dateMandate,
};
