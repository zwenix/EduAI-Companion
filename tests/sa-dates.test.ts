/**
 * The date contract.
 *
 * Generated documents were printing invented dates because the date was
 * HARDCODED in the prompts — "Today's date is 25 August 2026" in the master
 * prompt, "2 June 2026" in the LIGHT doctrine — so the model dutifully
 * reproduced a date that had long since gone stale.
 *
 * The fix has three parts, and this file pins each one:
 *
 *   1. COMPUTED — every date the app produces is derived from the system clock
 *      at call time (`saDates.ts`). Nothing is a string literal.
 *   2. ONE DATE — the host banner is the only place a real date is printed.
 *      Every date FIELD in the body is hand-filled, so `blankFillInDates`
 *      empties it — while dates that ARE the lesson (a history timeline, a
 *      maths problem) survive untouched.
 *   3. CLOSING METADATA — a document ends with a metadata block carrying the
 *      title, grade, term, subject and today's real date, without repeating the
 *      compliance labels the contract counts exactly once.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import {
    currentSATerm,
    currentYear,
    dateMandate,
    saToday,
    saTodayLong,
} from '../src/lib/saDates';
import { blankFillInDates, FILL_IN_BLANK } from '../src/lib/learnerFillIn';
import {
    buildTemplateClosingMetaHTML,
    EDUAI_COMPLIANCE_LABELS,
    EDUAI_TEMPLATE_FOOTER_LINE,
    wrapWithTemplate,
} from '../src/lib/contentTemplate';
import { resolveMasterPrompt } from '../src/lib/prompts/master-prompt';
import { buildClassicEducationalPrompts } from '../src/lib/prompts/classic-templates';

const BLANK = FILL_IN_BLANK;

describe('saDates — every date is computed from the clock, never hardcoded', () => {
    it('saToday renders today as DD/MM/YYYY (South African order)', () => {
        const now = new Date(2026, 9, 20, 12, 0, 0); // 20 October 2026
        expect(saToday(now)).toBe('20/10/2026');
    });

    it('saToday zero-pads single-digit days and months', () => {
        expect(saToday(new Date(2027, 0, 5, 12, 0, 0))).toBe('05/01/2027');
    });

    it('saToday with no argument is today — not a frozen literal', () => {
        const now = new Date();
        const expected = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        expect(saToday()).toBe(expected);
    });

    it('saTodayLong writes the long South African form', () => {
        expect(saTodayLong(new Date(2026, 9, 20, 12, 0, 0))).toBe('20 October 2026');
    });

    it('currentYear follows the clock', () => {
        expect(currentYear(new Date(2026, 9, 20, 12, 0, 0))).toBe('2026');
        expect(currentYear(new Date(2031, 2, 1, 12, 0, 0))).toBe('2031');
        expect(currentYear()).toBe(String(new Date().getFullYear()));
    });

    it('currentSATerm matches the South African school calendar', () => {
        const at = (month: number, day = 15): string =>
            currentSATerm(new Date(2026, month - 1, day, 12, 0, 0));
        expect(at(2)).toBe('Term 1');   // February
        expect(at(5)).toBe('Term 2');   // May
        expect(at(8)).toBe('Term 3');   // August
        expect(at(11)).toBe('Term 4');  // November
        expect(at(1)).toBe('Term 1');   // January
    });
});

describe('dateMandate — the prompt tells the model today\'s real date', () => {
    it('states today\'s date and the current year', () => {
        const mandate = dateMandate(new Date(2026, 9, 20, 12, 0, 0));
        expect(mandate).toContain('20 October 2026');
        expect(mandate).toContain('20/10/2026');
        expect(mandate).toContain('2026');
    });

    it('enforces the one-date rule', () => {
        const mandate = dateMandate(new Date(2026, 9, 20, 12, 0, 0));
        expect(mandate).toMatch(/ONLY place a real date appears/i);
        expect(mandate).toMatch(/filled in by hand/i);
        expect(mandate).toContain(BLANK);
    });

    it('protects dates that ARE the lesson', () => {
        // Without this carve-out the rule would blank a History timeline.
        expect(dateMandate()).toMatch(/part of the lesson/i);
    });

    it('never contains the stale dates that caused the bug', () => {
        const mandate = dateMandate();
        expect(mandate).not.toContain('25 August 2026');
        expect(mandate).not.toContain('2 June 2026');
        expect(mandate).not.toContain('15 March 2026');
    });

    it('moves with the clock — a different day yields a different mandate', () => {
        const a = dateMandate(new Date(2026, 9, 20, 12, 0, 0));
        const b = dateMandate(new Date(2028, 3, 4, 12, 0, 0));
        expect(a).not.toBe(b);
        expect(b).toContain('4 April 2028');
    });
});

describe('resolveMasterPrompt — the placeholder is filled, never leaked', () => {
    it('resolves the ${dateMandate} placeholder in the master prompt', () => {
        const resolved = resolveMasterPrompt(new Date(2026, 9, 20, 12, 0, 0));
        expect(resolved).not.toContain('${dateMandate}');
        expect(resolved).toContain('20 October 2026');
    });

    it('carries the one-date rule', () => {
        expect(resolveMasterPrompt()).toContain(BLANK);
    });
});

describe('classic builders — the restored doctrine also hears today\'s date', () => {
    it('the classic educational prompt carries the real date and one-date rule', () => {
        const { system } = buildClassicEducationalPrompts({ type: 'Worksheet' });
        expect(system).toContain(saTodayLong());
        expect(system).toContain(BLANK);
    });

    it('the classic prompt keeps the restored design doctrine intact', () => {
        const { system } = buildClassicEducationalPrompts({ type: 'Worksheet' });
        expect(system).toContain('VISUAL STYLING DOCTRINE');
    });
});

describe('no prompt source file hardcodes a date', () => {
    /** Files that carry prompt text sent to a model. */
    const PROMPT_SOURCES = [
        'src/lib/prompts/master-prompt.ts',
        'src/lib/prompts/classic-templates.ts',
        'src/lib/compliance/sa-prompts.ts',
        'src/lib/compliance/sa-frameworks.ts',
        'src/lib/contentStyle.ts',
        'src/lib/saDates.ts',
        'src/lib/prompt-engine.ts',
        'src/lib/prompts/lab-prompts.ts',
        'server.ts',
        'src/services/geminiService.ts',
    ];

    const read = (file: string): string =>
        readFileSync(resolvePath(__dirname, '..', file), 'utf8');

    /**
     * Strip comments so a doc-comment that EXPLAINS the old bug ("the prompt
     * used to hardcode Today's date is 2 June 2026") is not itself flagged.
     */
    const codeOnly = (source: string): string =>
        source
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '')
            .replace(/^\s*\*.*$/gm, '');

    /**
     * Policy and legislation years are citations, not dates — CAPS was gazetted
     * in 2011, WP6 dates from 2001, POPIA is Act 4 of 2013, SIAS is the 2014
     * policy. Those must keep their real years forever.
     */
    const CITATION_YEARS = new Set(['2001', '2011', '2012', '2013', '2014']);

    it.each(PROMPT_SOURCES)('%s never tells the model what today\'s date is', (file) => {
        const code = codeOnly(read(file));
        expect(/Today\'s date is\s+(?!TODAY)[A-Za-z0-9]/i.test(code),
            `${file} hardcodes today's date in prompt text`).toBe(false);
    });

    it.each(PROMPT_SOURCES)('%s never asserts a fixed current year', (file) => {
        const code = codeOnly(read(file));
        expect(/current year is\s*\d{4}/i.test(code),
            `${file} asserts a hardcoded current year`).toBe(false);
        expect(/year must be\s*\d{4}/i.test(code),
            `${file} pins the year to a literal`).toBe(false);
    });

    it.each(PROMPT_SOURCES)('%s carries no hardcoded calendar date', (file) => {
        const code = codeOnly(read(file));
        // "15 March 2026", "2 June 2026", "25 August 2026" — the bug shapes.
        const dates = code.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi) ?? [];
        expect(dates, `${file} hardcodes date(s): ${dates.join(', ')}`).toEqual([]);
    });

    it.each(PROMPT_SOURCES)('%s uses no literal year except a policy citation', (file) => {
        const code = codeOnly(read(file))
            .replace(/©\s*\d{4}|\(c\)\s*\d{4}/gi, '')       // copyright mark
            .replace(/EDUAI_TEMPLATE_RIGHTS_LINE_2.*$/gm, '')
            // A Unicode escape such as \\u2010-\\u2015 (the dash range)
            // contains four digits that are code points, not years.
            .replace(/\\u[0-9a-fA-F]{4}/g, '')
            // A four-digit number used as a NUMBER, not a year: a function
            // argument (Math.min(2000, …)) or an operand in arithmetic.
            .replace(/\(\s*20\d{2}\s*[,)]/g, '(')
            .replace(/20\d{2}\s*[*+\/-]/g, '');
        const years = (code.match(/(?<![\d.])20\d{2}(?![\d.])/g) ?? [])
            .filter((year) => !CITATION_YEARS.has(year));
        expect(years, `${file} hardcodes year(s): ${years.join(', ')}`).toEqual([]);
    });
});

describe('blankFillInDates — every metadata date field is hand-filled', () => {
    it('blanks a dd/mm/yyyy date field', () => {
        expect(blankFillInDates('Date: 15/10/2026')).toBe(`Date: ${BLANK}`);
    });

    it('blanks the Afrikaans label', () => {
        expect(blankFillInDates('Datum: 2026-10-15')).toBe(`Datum: ${BLANK}`);
    });

    it('blanks ISO dates', () => {
        expect(blankFillInDates('Date: 2026-10-15')).toBe(`Date: ${BLANK}`);
    });

    it('blanks hyphen-separated dates', () => {
        expect(blankFillInDates('Signed on: 15-10-2026')).toBe(`Signed on: ${BLANK}`);
    });

    it('blanks long-form dates, English word order', () => {
        expect(blankFillInDates('Due date: 15 October 2026')).toBe(`Due date: ${BLANK}`);
    });

    it('blanks long-form dates, US word order', () => {
        expect(blankFillInDates('Completion date: October 15, 2026')).toBe(`Completion date: ${BLANK}`);
    });

    it('blanks a multi-word field label', () => {
        expect(blankFillInDates('Date of assessment: 15/10/2026')).toBe(`Date of assessment: ${BLANK}`);
    });

    it('blanks inside markup, keeping the tags', () => {
        const input = '<td style="padding:4px">Date: 15/10/2026</td>';
        expect(blankFillInDates(input)).toBe(`<td style="padding:4px">Date: ${BLANK}</td>`);
    });

    it('is idempotent — an already-blank field is not re-blanked', () => {
        const once = blankFillInDates('Date: 15/10/2026');
        expect(blankFillInDates(once)).toBe(once);
    });

    it('leaves an already-empty field alone', () => {
        expect(blankFillInDates(`Date: ${BLANK}`)).toBe(`Date: ${BLANK}`);
    });

    describe('dates that ARE the lesson survive', () => {
        it('a history timeline entry is untouched', () => {
            const line = '16 June 1976 — the Soweto Uprising began.';
            expect(blankFillInDates(line)).toBe(line);
        });

        it('a mathematics word problem keeps its dates', () => {
            const line = 'A farm was bought on 15/10/2026 and sold 3 years later.';
            expect(blankFillInDates(line)).toBe(line);
        });

        it('a bare year in prose is untouched', () => {
            const line = 'The first democratic election was held in 1994.';
            expect(blankFillInDates(line)).toBe(line);
        });

        it('a date range in a lesson body is untouched', () => {
            const line = 'World War II lasted from 1939 to 1945.';
            expect(blankFillInDates(line)).toBe(line);
        });
    });
});

describe('buildTemplateClosingMetaHTML — metadata at the end of the content', () => {
    const meta = {
        title: 'Fractions of a Whole',
        grade: '5',
        subject: 'Mathematics',
        term: '3',
        contentType: 'Worksheet',
        capsCode: 'FP-MATH-G5-T3-N01',
    };

    it('carries the document metadata', () => {
        const closing = buildTemplateClosingMetaHTML(meta);
        expect(closing).toContain('Fractions of a Whole');
        expect(closing).toContain('Grade 5');
        expect(closing).toContain('Mathematics');
        expect(closing).toContain('Term 3');
        expect(closing).toContain('Worksheet');
    });

    it('prints today\'s real date', () => {
        expect(buildTemplateClosingMetaHTML(meta)).toContain(saToday());
    });

    it('is NOT a <footer> — the canonical navy footer must stay the only one', () => {
        const closing = buildTemplateClosingMetaHTML(meta);
        expect(closing).toMatch(/^<aside\b/);
        expect(closing).not.toMatch(/<footer\b/i);
    });

    it('does not repeat the compliance labels', () => {
        const closing = buildTemplateClosingMetaHTML(meta);
        expect(closing).not.toContain(EDUAI_COMPLIANCE_LABELS);
        expect(closing).not.toMatch(/CAPS\s+Aligned/i);
        expect(closing).not.toMatch(/NPA\s+Compliant/i);
        expect(closing).not.toMatch(/POPIA\s+Compliant/i);
        expect(closing).not.toMatch(/SIAS[^\n]{0,14}Inclusive/i);
        expect(closing).not.toMatch(/WP6\s+Differentiated/i);
    });

    it('does not repeat the "CAPS Code" wording the contract counts once', () => {
        expect(buildTemplateClosingMetaHTML(meta)).not.toMatch(/CAPS\s*Code/i);
    });

    it('does not use the compliance-banner class the contract counts once', () => {
        expect(buildTemplateClosingMetaHTML(meta)).not.toContain('eduai-compliance-banner');
    });

    it('does not resurrect the stale rights or generated-on lines', () => {
        const closing = buildTemplateClosingMetaHTML(meta);
        expect(closing).not.toMatch(/ALL CONTENT RIGHTS RESERVED TO/i);
        expect(closing).not.toMatch(/GENERATED:\s*\d{2}\/\d{2}\/\d{4}/i);
    });

    it('leaves the date blank when the caller asks for it', () => {
        // Regression: this was inverted — it printed today's real date in the
        // exact case the caller asked for a hand-filled blank, which would
        // defeat `leaveDateBlank` on Foundation Phase packs.
        const blank = buildTemplateClosingMetaHTML({ ...meta, leaveDateBlank: true });
        expect(blank).toContain('Date: ______');
        expect(blank).not.toContain(saToday());
    });

    it('matches the opening banner\'s date treatment either way', () => {
        const withDate = buildTemplateClosingMetaHTML(meta);
        expect(withDate).toContain(saToday());
        expect(withDate).not.toContain('Date: ______');
    });

    it('omits fields that were never supplied', () => {
        const closing = buildTemplateClosingMetaHTML({ title: 'Notice' });
        expect(closing).toContain('Notice');
        expect(closing).not.toContain('Grade ');
        expect(closing).not.toContain('undefined');
    });
});

describe('wrapWithTemplate — the closing block renders once, at the end', () => {
    const meta = {
        title: 'Fractions of a Whole',
        grade: '5',
        subject: 'Mathematics',
        term: '3',
        contentType: 'Worksheet',
    };
    const body = '<section><h2>Activity 1</h2><p>Date: 15/10/2026</p></section>';

    it('appends the closing metadata block', () => {
        const wrapped = wrapWithTemplate(body, meta);
        expect(wrapped).toContain('eduai-closing-meta');
    });

    it('places it after the content and before the footer element', () => {
        const wrapped = wrapWithTemplate(body, meta);
        const closingAt = wrapped.indexOf('eduai-closing-meta');
        // `site-footer` also matches the CSS rule inside <style>, so match the
        // element itself.
        const footerAt = wrapped.indexOf('<footer');
        const bodyAt = wrapped.indexOf('Activity 1');
        expect(closingAt).toBeGreaterThan(-1);
        expect(closingAt).toBeGreaterThan(bodyAt);
        expect(footerAt).toBeGreaterThan(closingAt);
    });

    it('renders exactly one closing block', () => {
        const wrapped = wrapWithTemplate(body, meta);
        expect((wrapped.match(/eduai-closing-meta/g) || []).length).toBe(1);
    });

    it('keeps the compliance labels at exactly one occurrence', () => {
        const wrapped = wrapWithTemplate(body, meta);
        expect(wrapped.split(EDUAI_COMPLIANCE_LABELS).length - 1).toBe(1);
    });

    it('keeps the canonical footer text exact and single', () => {
        const wrapped = wrapWithTemplate(body, meta);
        expect(wrapped.split(EDUAI_TEMPLATE_FOOTER_LINE).length - 1).toBe(1);
        expect((wrapped.match(/<footer\b/gi) || []).length).toBe(1);
    });

    it('strips a pre-filled date field on a learner worksheet', () => {
        // A Worksheet is a learner fill-in type: a pure "Date: …" line is a
        // duplicate of the canonical row, so it is removed rather than blanked.
        const wrapped = wrapWithTemplate(body, meta);
        expect(wrapped).not.toContain('Date: 15/10/2026');
        expect(wrapped).toContain('eduai-learner-fillin');
    });

    it('blanks a pre-filled date field on a teacher document', () => {
        // A Lesson Plan keeps its structure, so the date is emptied in place.
        const wrapped = wrapWithTemplate(body, { ...meta, contentType: 'Lesson Plan' });
        expect(wrapped).toContain(`Date: ${BLANK}`);
        expect(wrapped).not.toContain('Date: 15/10/2026');
    });

    it('prints today\'s real date in the banner and the closing block', () => {
        const wrapped = wrapWithTemplate(body, meta);
        // Banner pill + closing block: both computed from the clock.
        expect((wrapped.split(saToday()).length - 1)).toBeGreaterThanOrEqual(2);
    });

    it('prints no real date anywhere when leaveDateBlank is set', () => {
        const wrapped = wrapWithTemplate(body, { ...meta, leaveDateBlank: true });
        expect(wrapped).not.toContain(saToday());
        expect(wrapped).toContain('Date: ______');
    });

    it('can be suppressed with closingMeta: false', () => {
        const wrapped = wrapWithTemplate(body, { ...meta, closingMeta: false });
        expect(wrapped).not.toContain('eduai-closing-meta');
    });

    it('renders on a classic document too', () => {
        const classic = wrapWithTemplate(body, { ...meta, designStyle: 'classic' });
        expect(classic).toContain('eduai-closing-meta');
        expect(classic).toContain(saToday());
    });

    it('leaves a teaching-content date alone inside the body', () => {
        const timeline = '<section><h2>Timeline</h2><p>16 June 1976 — Soweto Uprising</p></section>';
        const wrapped = wrapWithTemplate(timeline, { ...meta, contentType: 'Study Guide' });
        expect(wrapped).toContain('16 June 1976 — Soweto Uprising');
    });
});
