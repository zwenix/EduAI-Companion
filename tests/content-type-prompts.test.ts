/**
 * Built-in content generation prompts — contract tests.
 *
 * The prompts in `src/lib/prompts/content-type-prompts.ts` are reverse-
 * engineered from the reference print templates in `assets/templates/` and
 * from the merged-banner contract in `src/lib/contentTemplate.ts`. These tests
 * pin the guarantees that keep the two in step:
 *
 *   1. EVERY content type the Content Creator offers resolves to a built-in
 *      prompt (no silent fall-through to a generic worksheet).
 *   2. Every prompt forbids the model from building its own banner/header/
 *      record row/compliance stamp/footer, and lists all the data the merged
 *      host banner already prints.
 *   3. The prompt family always agrees with the banner palette the host paints.
 *   4. The reference template files named in the prompts exist on disk.
 *   5. The composed prompts are complete documents: blueprint sections, answer
 *      space, marks/memo rules where relevant, no placeholder wording.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    CONTENT_TYPE_PROMPTS,
    CONTENT_TYPE_PROMPT_NAMES,
    FAMILY_RULES,
    MERGED_BANNER_CONTRACT,
    MERGED_BANNER_SLOTS,
    TAXONOMY_CONTENT_TYPES,
    buildContentTypePromptPair,
    buildContentTypeUserPrompt,
    contentTypeKey,
    getContentTypePrompt,
    phaseForGrade,
} from '../src/lib/prompts/content-type-prompts';
import { getSystemPrompt, getSystemPromptSpec, listSystemPromptContentTypes } from '../src/lib/prompts/system-prompts';
import { ADMIN_TYPES, TEACHING_CATEGORIES, VISUAL_TYPES } from '../src/lib/contentTypes';
import { bannerPaletteFor } from '../src/lib/bannerPalettes';
import {
    REVERSE_ENGINEERED_TEMPLATES,
    TEMPLATE_BANNER_FIELD_ORDER,
    templateSourcesForContentType,
} from '../src/lib/templates/template-specs';

const repoRoot = resolve(__dirname, '..');

describe('content-type prompt registry — coverage', () => {
    it('ships a built-in prompt for every type in the Content Creator taxonomy', () => {
        const missing = TAXONOMY_CONTENT_TYPES.filter((type) => !getContentTypePrompt(type));
        expect(missing).toEqual([]);
        expect(TAXONOMY_CONTENT_TYPES.length).toBeGreaterThanOrEqual(70);
    });

    it('covers every category of the taxonomy', () => {
        for (const type of [
            ...Object.values(TEACHING_CATEGORIES).flat(),
            ...Object.values(VISUAL_TYPES).flat(),
            ...Object.values(ADMIN_TYPES).flat(),
        ]) {
            expect(getContentTypePrompt(type).systemPrompt.length).toBeGreaterThan(1200);
        }
    });

    it('has a distinct blueprint and prompt per content type', () => {
        const prompts = new Set(Object.values(CONTENT_TYPE_PROMPTS).map((entry) => entry.systemPrompt));
        expect(prompts.size).toBe(Object.keys(CONTENT_TYPE_PROMPTS).length);
        expect(CONTENT_TYPE_PROMPT_NAMES.length).toBeGreaterThanOrEqual(80);
    });

    it('resolves legacy slugs, decorated names and unknown types', () => {
        expect(getContentTypePrompt('worksheet').contentType).toBe('Worksheet');
        // A decorated Foundation Phase name legitimately resolves to the
        // Foundation family (the banner palette rules do the same).
        expect(getContentTypePrompt('Worksheet (Foundation Phase)').family).toBe('foundation');
        expect(getContentTypePrompt('Controlled Test').family).toBe('assessment');
        expect(getContentTypePrompt('memorandum key').family).toBe('memo');
        expect(getContentTypePrompt('Letter to Parents').family).toBe('admin');
        // Never undefined, even for a genuinely unrecognised type: the brand
        // palette rules fall back to the worksheet document shape.
        expect(getContentTypePrompt('Zzz qqq vvv unknown thing').family).toBe('worksheet');
        expect(getContentTypePrompt('Zzz qqq vvv unknown thing').systemPrompt.length).toBeGreaterThan(1200);
    });

    it('keeps the family in step with the banner palette', () => {
        for (const entry of Object.values(CONTENT_TYPE_PROMPTS)) {
            const palette = bannerPaletteFor(entry.contentType).id;
            expect(entry.palette).toBe(palette);
            if (palette === 'assessment') expect(entry.family).toBe('assessment');
            if (palette === 'memo') expect(entry.family).toBe('memo');
            if (palette === 'foundation') expect(entry.family).toBe('foundation');
            if (palette === 'certificate') expect(entry.family).toBe('certificate');
            if (palette === 'cards') expect(entry.family).toBe('cards');
            if (palette === 'intervention') expect(entry.family).toBe('intervention');
        }
    });
});

describe('content-type prompts — merged banner contract', () => {
    it('lists every merged banner slot exactly once in the contract', () => {
        for (const slot of MERGED_BANNER_SLOTS) {
            expect(MERGED_BANNER_CONTRACT).toContain(slot);
        }
        // The data the reference templates printed up top:
        for (const slot of [
            'document title',
            'topic / focus subtitle line',
            'grade · subject · content type · term · date pills',
            'learner record strip (Name / Date / Term / Total ___ / N)',
            'sign-off strip (Teacher / Moderator / Comment / Signature)',
            'CAPS code + CAPS/ATP reference line',
            'compliance labels',
        ]) {
            expect(MERGED_BANNER_CONTRACT).toContain(slot);
        }
    });

    it('tells every prompt never to build a banner, record row, stamp or footer', () => {
        for (const entry of Object.values(CONTENT_TYPE_PROMPTS)) {
            const prompt = entry.systemPrompt;
            expect(prompt).toContain('THE HOST OWNS THE ONLY BANNER');
            expect(prompt).toMatch(/Do NOT emit <header>/);
            expect(prompt).toMatch(/name\/date\/term\/total record row/);
            expect(prompt).toMatch(/compliance labels/);
            expect(prompt).toMatch(/Start straight into real content|Start straight into/);
        }
    });

    it('forbids placeholders and demands complete, print-ready output', () => {
        for (const entry of Object.values(CONTENT_TYPE_PROMPTS)) {
            expect(entry.systemPrompt).toContain('Completeness: zero placeholders');
            expect(entry.systemPrompt).toMatch(/zero placeholders|Never write “etc\.”/);
            expect(entry.systemPrompt).toMatch(/Return the document BODY as clean HTML/);
            expect(entry.systemPrompt).toContain('memo     —');
        }
    });

    it('keeps the CAPS · NPA · SIAS · WP6 · POPIA content law in every prompt', () => {
        for (const entry of Object.values(CONTENT_TYPE_PROMPTS)) {
            expect(entry.systemPrompt).toMatch(/CAPS: grade-appropriate content/);
            expect(entry.systemPrompt).toMatch(/NPA: per-question mark allocation/);
            expect(entry.systemPrompt).toMatch(/SIAS & White Paper 6/);
            expect(entry.systemPrompt).toMatch(/POPIA: never write a real learner/);
        }
    });
});

describe('content-type prompts — family craft rules', () => {
    it('describes the measured template scale in every family', () => {
        for (const rule of Object.values(FAMILY_RULES)) {
            expect(rule).toMatch(/A4|Display|print/);
        }
    });

    it('gives assessed types mark tags and answer space', () => {
        const test = getContentTypePrompt('Controlled Test');
        expect(test.systemPrompt).toMatch(/SECTION A/);
        expect(test.systemPrompt).toMatch(/every question tagged|Every question carries|mark tag/i);
        expect(test.systemPrompt).toMatch(/memo/i);

        const worksheet = getContentTypePrompt('Worksheet');
        expect(worksheet.systemPrompt).toMatch(/SECTION A — recall/);
        expect(worksheet.systemPrompt).toMatch(/ruled lines 396–510 pt/);
        expect(worksheet.systemPrompt).toMatch(/memorandum/);
    });

    it('keeps Foundation Phase pages mark-free and glyph-led', () => {
        const pack = getContentTypePrompt('Interactive Foundation Learning Pack');
        expect(pack.family).toBe('foundation');
        expect(pack.systemPrompt).toMatch(/48 pt/);
        expect(pack.systemPrompt).toMatch(/Never a marks box|never a marks box/i);
        expect(pack.systemPrompt).toMatch(/reward/i);
    });

    it('keeps display types free of record rows', () => {
        const poster = getContentTypePrompt('Educational Poster');
        expect(poster.family).toBe('poster');
        expect(poster.systemPrompt).toMatch(/no learner record row/i);
        const cards = getContentTypePrompt('Flashcards (Term + Definition)');
        expect(cards.family).toBe('cards');
        expect(cards.systemPrompt).toMatch(/cut guides/i);
    });

    it('keeps admin documents procedurally complete', () => {
        const letter = getContentTypePrompt('Letter to Parents');
        expect(letter.systemPrompt).toMatch(/reply slip/i);
        const slip = getContentTypePrompt('Permission Slip');
        expect(slip.systemPrompt).toMatch(/signature block/i);
        const register = getContentTypePrompt('Attendance Register');
        expect(register.systemPrompt).toMatch(/signature/i);
    });
});

describe('content-type prompts — reference template evidence', () => {
    it('names at least one template for the types the PDFs document', () => {
        for (const type of ['Worksheet', 'Controlled Test', 'Examination', 'Alphabet Chart', 'Educational Poster', 'Study Guide / Learning Notes']) {
            expect(getContentTypePrompt(type).blueprint.sources?.length || templateSourcesForContentType(type).length).toBeGreaterThan(0);
        }
    });

    it('every named source file exists in assets/templates', () => {
        const named = new Set<string>();
        for (const spec of REVERSE_ENGINEERED_TEMPLATES) named.add(spec.file);
        templateSourcesForContentType('Worksheet').forEach((file) => named.add(file));
        for (const file of named) {
            expect(existsSync(resolve(repoRoot, 'assets/templates', file)), `missing assets/templates/${file}`).toBe(true);
        }
    });

    it('records every banner field the templates printed, in banner order', () => {
        for (const field of ['title', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'marks', 'teacher', 'moderator', 'comment', 'capsCode', 'compliance', 'country', 'resourceUrl']) {
            expect(TEMPLATE_BANNER_FIELD_ORDER).toContain(field);
        }
    });
});

describe('content-type prompts — prompt pair + legacy API', () => {
    it('builds a system + user pair with the banner data restated as host-owned', () => {
        const { system, user, prompt } = buildContentTypePromptPair('Examination', {
            grade: '6',
            subject: 'Mathematics',
            topic: 'Numbers, Algebra, Geometry & Data',
            term: 'Term 3',
            totalMarks: 60,
        });
        expect(system).toContain('THE HOST OWNS THE ONLY BANNER');
        expect(user).toContain('Grade: 6');
        expect(user).toContain('Total marks: 60');
        expect(user).toContain('BANNER DATA');
        expect(user).toMatch(/print NONE of it/);
        expect(prompt.contentType).toBe('Examination');
    });

    it('puts the instructor brief last and calls it highest priority', () => {
        const user = buildContentTypeUserPrompt('Worksheet', {
            grade: '3',
            additionalInstructions: 'Use a spaza-shop context for question 3.',
        });
        expect(user.indexOf('INSTRUCTOR BRIEF')).toBeGreaterThan(user.indexOf('BANNER DATA'));
        expect(user).toContain('spaza-shop context');
    });

    it('maps grades to phases', () => {
        expect(phaseForGrade('R')).toBe('Foundation Phase');
        expect(phaseForGrade('3')).toBe('Foundation Phase');
        expect(phaseForGrade('5')).toBe('Intermediate Phase');
        expect(phaseForGrade('8')).toBe('Senior Phase');
        expect(phaseForGrade('11')).toBe('FET Phase');
    });

    it('legacy getSystemPrompt() returns the built-in per-type prompt', () => {
        const prompt = getSystemPrompt('permission-slip');
        expect(prompt).toBe(getContentTypePrompt('Permission Slip').systemPrompt);
        expect(prompt).toContain('THE HOST OWNS THE ONLY BANNER');
        // A worksheet and a test must NOT share the same system prompt.
        expect(getSystemPrompt('worksheet')).not.toBe(getSystemPrompt('controlled-test'));
        expect(getSystemPromptSpec('Poster').family).toBe('poster');
        expect(listSystemPromptContentTypes().length).toBe(CONTENT_TYPE_PROMPT_NAMES.length);
    });

    it('slug keys are URL-safe and unique', () => {
        const slugs = Object.keys(CONTENT_TYPE_PROMPTS);
        expect(new Set(slugs).size).toBe(slugs.length);
        for (const slug of slugs) expect(slug).toBe(contentTypeKey(slug));
        expect(contentTypeKey('Flashcards (Term + Definition)')).toBe('flashcards-term-definition');
    });
});
