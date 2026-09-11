/**
 * EduAI Companion — CAPS Foundation Phase (Grade R–3) printable template library.
 *
 * Bright, cartoon-styled, classroom-ready documents that are authored as data and
 * rendered by `./render.ts` into A4 print HTML. Consumed by:
 *   • `src/components/FoundationPhaseTemplateStudio.tsx` (in-app gallery + print/PDF),
 *   • `scripts/build-foundation-template-pack.mts` (standalone printable pack in
 *     `public/templates/foundation-phase/`),
 *   • anything else that wants a guaranteed-CAPS Foundation Phase artefact
 *     without calling an AI model at all (offline classrooms, zero token cost).
 *
 * Families: 🏆 awards for good academic achievement · ✏️ worksheets ·
 * 🎲 classroom exercises · 🎒 homework exercises.
 */

import type { FoundationGrade, FoundationTemplate, LearningArea, RenderOptions, TemplateKind } from './types';

import { buildBundleDocument, buildPackIndex, buildStandaloneDocument, renderTemplatePage } from './render';

import { AWARD_TEMPLATES } from './awards';
import { WORKSHEET_TEMPLATES } from './worksheets';
import { CLASSROOM_TEMPLATES } from './classroom';
import { HOMEWORK_TEMPLATES } from './homework';

export * from './types';
export * from './caps';
export { ART, artSrc, PALETTE } from './art';
export { KIND_META, renderTemplatePage, buildStandaloneDocument, buildBundleDocument, buildPackIndex, themeFor, FP_CSS, estimatePageCount, estimatePageHeightMm } from './render';
export { label, pair } from './labels';
export { AWARD_FIELDS, CLASSROOM_FIELDS, FIELDS_BY_KIND, HOMEWORK_FIELDS, PRACTICE_FIELDS } from './shared';

export const TEMPLATE_BY_KIND: Record<TemplateKind, FoundationTemplate[]> = {
    award: AWARD_TEMPLATES,
    worksheet: WORKSHEET_TEMPLATES,
    classroom: CLASSROOM_TEMPLATES,
    homework: HOMEWORK_TEMPLATES,
};

/** Every template in the library, grouped award → worksheet → classroom → homework. */
export const FOUNDATION_TEMPLATES: FoundationTemplate[] = [
    ...AWARD_TEMPLATES,
    ...WORKSHEET_TEMPLATES,
    ...CLASSROOM_TEMPLATES,
    ...HOMEWORK_TEMPLATES,
];

export const getFoundationTemplate = (id: string): FoundationTemplate | undefined =>
    FOUNDATION_TEMPLATES.find((t) => t.id === id);

/** Grade scopes are stored as ranges, so "1" matches both '1' and '1-3'. */
const coversGrade = (scopes: FoundationTemplate['grades'], grade: FoundationGrade): boolean =>
    scopes.some((scope) => {
        if (scope === grade) return true;
        const m = /^(\w)-(\w)$/.exec(scope);
        if (!m) return false;
        const order = ['R', '1', '2', '3', '4'];
        const lo = order.indexOf(m[1]);
        const hi = order.indexOf(m[2]);
        const at = order.indexOf(grade);
        return at >= lo && at <= hi;
    });

export interface TemplateFilter {
    kind?: TemplateKind | 'all';
    grade?: FoundationGrade | 'all';
    learningArea?: LearningArea | 'all';
    /** Free-text match over title, subtitle, blurb, tags and CAPS skills. */
    query?: string;
    /** Only templates that carry an answer memo. */
    withMemoOnly?: boolean;
}

export const filterFoundationTemplates = (filter: TemplateFilter = {}): FoundationTemplate[] => {
    const q = (filter.query ?? '').trim().toLowerCase();
    return FOUNDATION_TEMPLATES.filter((tpl) => {
        if (filter.kind && filter.kind !== 'all' && tpl.kind !== filter.kind) return false;
        if (filter.grade && filter.grade !== 'all' && !coversGrade(tpl.grades, filter.grade)) return false;
        if (filter.learningArea && filter.learningArea !== 'all' && tpl.learningArea !== filter.learningArea) return false;
        if (filter.withMemoOnly && !tpl.caps.memo?.length) return false;
        if (q) {
            const hay = [
                tpl.title,
                tpl.subtitle,
                tpl.blurb,
                tpl.learningArea,
                tpl.caps.contentArea,
                tpl.caps.capsNote,
                ...(tpl.tags ?? []),
                ...tpl.caps.skills,
                ...tpl.blocks.map((b) => b.title),
            ]
                .join(' ')
                .toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
};

/** Library stats for the Studio header + the standalone pack landing page. */
export const FOUNDATION_LIBRARY_STATS = (() => {
    const byKind = (k: TemplateKind) => FOUNDATION_TEMPLATES.filter((t) => t.kind === k).length;
    const marked = FOUNDATION_TEMPLATES.filter((t) => typeof t.caps.marks === 'number');
    return {
        total: FOUNDATION_TEMPLATES.length,
        awards: byKind('award'),
        worksheets: byKind('worksheet'),
        classroom: byKind('classroom'),
        homework: byKind('homework'),
        withMemo: FOUNDATION_TEMPLATES.filter((t) => t.blocks.some((b) => b.kind === 'memo') || t.caps.memo?.length).length,
        markedTemplates: marked.length,
        totalMarks: marked.reduce((sum, t) => sum + (t.caps.marks ?? 0), 0),
        grades: ['R', '1', '2', '3'] as FoundationGrade[],
        learningAreas: Array.from(new Set(FOUNDATION_TEMPLATES.map((t) => t.learningArea))) as LearningArea[],
    };
})();

/**
 * Convenience: render a single template for either host. Kept here so a caller
 * never has to know about asset-path plumbing.
 */
export const renderFoundationTemplate = (
    tpl: FoundationTemplate,
    opts: RenderOptions = {},
): { fragment: string; standalone: string } => {
    const resolved: RenderOptions = {
        assetMode: opts.assetMode ?? 'app',
        labelLanguage: opts.labelLanguage ?? 'en',
        bilingual: opts.bilingual ?? Boolean(opts.labelLanguage && opts.labelLanguage !== 'en'),
        ...opts,
    };
    return {
        fragment: renderTemplatePage(tpl, resolved),
        standalone: buildStandaloneDocument(tpl, resolved),
    };
};

export default FOUNDATION_TEMPLATES;
