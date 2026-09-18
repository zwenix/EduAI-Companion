/**
 * EduAI Companion — LIGHT Template v4 (official, single source of truth)
 *
 * The branded chrome that wraps EVERY piece of generated content in the app
 * (on-screen previews, print, PDF, HTML and the SA document pipeline).
 *
 * Source artwork:
 *   docs/Decrease-the-size-of-the-header-banner-by-30-or-try-any-method-to-fit-all-text-in-the-header-into-1- (4).html
 *   ("EduAI Companion 2026 | LIGHT Template v4")
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  COMPACT HEADER (26px, sticky) — TWO-COLOUR WASH            │
 *   │   white → pale blue gradient, watermark-strength logo       │
 *   │   (logo 15px)  EDUAI COMPANION 2026 | CAPS COMPLIANT …      │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  WHITE PAGE (max 800px, centred) over a faded watermark     │
 *   │   ┌─ card ─────────────────────────────────────────────┐   │
 *   │   │ lesson title + meta pills (grade · subject · term) │   │
 *   │   │ ▓ DESIGNATED COMPLIANCE SECTION ▓ (two-colour      │   │
 *   │   │   navy → blue gradient) — the ONLY place the CAPS  │   │
 *   │   │   code and the 🇿🇦/CAPS/NPA/POPIA/SIAS/WP6 labels  │   │
 *   │   │   are ever written                                 │   │
 *   │   │ …dynamic generated content…                        │   │
 *   │   └────────────────────────────────────────────────────┘   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  NAVY FOOTER BAND (#1e3a5f, centred, 8pt)                  │
 *   │   © 2026 EduAI Companion | CAPS Compliant Educational      │
 *   │   Resource | Developed for South African Educators | All    │
 *   │   Rights Reserved to Developer: Z MSUTHU © 2026 |           │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Three guarantees this module owns (and the reason it exists):
 *  1. ONCE — the compliance labels are written exactly one time per document,
 *     inside the designated gradient section. Model-authored copies (badges,
 *     stamp rows, banner repeats, plain-text status lines) are stripped first.
 *  2. GRADIENT — no top banner is ever a single solid colour. The host banner
 *     and every model-authored banner/hero/header get the two-colour gradient.
 *  3. FOOTER — one canonical footer line, word for word, on every surface.
 *
 * Portability rules (same guarantees as the previous template):
 *  - Header / watermark / footer / page-shell layout is FULLY INLINE so the
 *    exact same markup survives React previews, iframe srcDocs,
 *    window.print() documents, html2canvas rasterisation and HTML downloads.
 *  - Component styling (cards, pills, objectives, activities, tips, buttons,
 *    responsive + print rules) ships as an embedded <style> block
 *    (EDUAI_LIGHT_CSS) prepended by wrapWithTemplate, so offscreen PDF
 *    containers and print windows are styled even without <head> control.
 *  - Content selectors are scoped under `.eduai-light-scope` so they never
 *    leak onto app UI or collide with the SA pipeline's own `.page` styles.
 *    The chrome selectors (.site-header / .site-footer / .watermark /
 *    .header-text) are global by design — verified collision-free.
 *  - wrapWithTemplate() is idempotent AND self-healing: current canonical
 *    output passes through untouched (re-exporting the print-preview paper
 *    never double-wraps), while older wrapped documents — and model output
 *    that copied our chrome — are stripped back to content and re-wrapped so
 *    stale footers, duplicate labels and solid banners cannot survive.
 */

export interface ContentTemplateMeta {
    /** Document title (lesson-title + HTML <title> where supported). */
    title?: string;
    /** Learning area / subject, e.g. "Mathematics". */
    subject?: string;
    /** Grade, e.g. "5", "R", "Grade 10". */
    grade?: string;
    /** Term, e.g. "Term 2" or "2". */
    term?: string;
    /** Content type, e.g. "Worksheet", "Lesson Plan", "Poster", "Notice". */
    contentType?: string;
    /** Generation date DD/MM/YYYY — defaults to today (SA format). */
    date?: string;
    /** Optional explicit CAPS code (for example FP-MATH-G2-T3-DH01). */
    capsCode?: string;
    /** CAPS compliance line — retained for backwards-compatible callers. */
    capsStatus?: string;
    /** NPA compliance line — defaults to "NPA Compliant (Gr R-12)". */
    npaStatus?: string;
    /** Optional school name (rendered in the footer where supported). */
    school?: string;
    /** Optional teacher name. */
    teacher?: string;
}

/**
 * Every top banner in a generated document is a TWO-COLOUR gradient — never a
 * solid block of one colour. Navy → accent blue is the official pairing; the
 * compact document header uses the same idea at watermark strength (white →
 * pale blue) so it stays quiet above the content banner.
 */
export const EDUAI_BANNER_GRADIENT = 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)';
export const EDUAI_HEADER_GRADIENT = 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(219,234,254,0.72) 100%)';

/** LIGHT Template v4 palette — sampled directly from the template artwork. */
export const EDUAI_TEMPLATE_COLOURS = {
    navy: '#1e3a5f',
    accent: '#2563eb',
    accentLight: '#3b82f6',
    // Two-colour wash (white → pale blue): the compact header reads like a
    // watermark but is still a gradient, matching every other top banner.
    headerGradient: EDUAI_HEADER_GRADIENT,
    headerBorder: '#cbd5e1',
    headerText: '#1e3a5f',
    footerBg: '#1e3a5f',
    footerText: '#e2e8f0',
    footerMuted: '#9fb3cc',
    paper: '#ffffff',
    cardBorder: '#e2e8f0',
    bodyText: '#334155',
    mutedText: '#475569',
    pillBg: '#eff6ff',
    pillBorder: '#dbeafe',
} as const;

export const EDUAI_TEMPLATE_URL = 'EDUAI-COMPANION.VERCEL.APP';
export const EDUAI_TEMPLATE_RIGHTS_LINE_1 = 'ALL CONTENT RIGHTS RESERVED TO';
export const EDUAI_TEMPLATE_RIGHTS_LINE_2 = 'DEVELOPER: Z MSUTHU (C) 2026';

/** Fixed LIGHT header lead — dynamic grade/term/subject/type trail behind it. */
export const EDUAI_TEMPLATE_HEADER_BASE = 'EDUAI COMPANION 2026 | CAPS COMPLIANT EDUCATION RESOURCE';
/** Canonical footer text for every generated/exported educational resource. */
export const EDUAI_TEMPLATE_FOOTER_LINE =
    '© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators | All Rights Reserved to Developer: Z MSUTHU © 2026 |';

/**
 * One canonical compliance block is rendered by the host template. AI output
 * is cleaned of its own badges before this block is added, which prevents the
 * same labels from appearing in the document body, banner and footer.
 */
export const EDUAI_COMPLIANCE_LABELS =
    '🇿🇦 ✅ CAPS Aligned✅ NPA Compliant✅ POPIA Compliant (2026)✅ SIAS Level 1 Inclusive✅ WP6 Differentiated';

const LIGHT_HEADING_FONT = `'Fredoka', 'Quicksand', system-ui, -apple-system, sans-serif`;
const LIGHT_BODY_FONT = `'Inter', system-ui, -apple-system, sans-serif`;

/**
 * LIGHT Template v4 stylesheet. Chrome selectors are global (collision-free);
 * every content selector is scoped under `.eduai-light-scope`.
 */
export const EDUAI_LIGHT_CSS = `
/* ── EduAI LIGHT Template v4 ── */
.site-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    padding: 0 10px;
    height: 26px;
    /* Compact watermark-like chrome: a quiet two-colour wash (white → pale
       blue), never a solid bar and never a single flat colour. */
    background: ${EDUAI_HEADER_GRADIENT};
    background-image: ${EDUAI_HEADER_GRADIENT};
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid rgba(148,163,184,0.36);
    box-shadow: none;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
}
.site-header .logo {
    height: 15px;
    width: auto;
    display: block;
    flex-shrink: 0;
    opacity: 0.28;
}
.header-text {
    font-family: 'Fredoka', sans-serif;
    /* Small, muted strapline keeps the header present without competing with
       the full-width generated content banner. */
    font-size: clamp(7px, 1.05vw, 9px);
    font-weight: 600;
    color: #1e3a5f;
    opacity: 0.56;
    white-space: nowrap;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}
.watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 75%;
    max-width: 560px;
    height: auto;
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
}
.site-footer {
    background-color: #1e3a5f;
    color: #e2e8f0;
    text-align: center;
    font-size: 8pt;
    padding: 16px 20px;
    font-family: 'Fredoka', sans-serif;
    position: relative;
    z-index: 10;
    letter-spacing: 0.3px;
    line-height: 1.6;
}
.site-footer .footer-sub {
    font-size: 6.5pt;
    color: #9fb3cc;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-top: 4px;
}
.eduai-compliance-banner {
    display: block;
    width: 100%;
    margin: 14px 0 20px;
    padding: 11px 14px;
    border-radius: 10px;
    background: ${EDUAI_BANNER_GRADIENT};
    background-image: ${EDUAI_BANNER_GRADIENT};
    color: #ffffff;
    border: 1px solid #93c5fd;
    box-shadow: 0 3px 10px rgba(30,58,95,0.16);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.1px;
    text-align: left;
    overflow-wrap: anywhere;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.eduai-compliance-banner strong { font-weight: 800; }
/* The designated banner should span the available page/card width rather than
   sit inside the card's inner text padding. The negative margins stop at the
   white page edge and keep the banner visually dominant without widening the
   document itself. */
.eduai-light-scope .card > .eduai-compliance-banner {
    width: calc(100% + 56px) !important;
    max-width: none;
    margin-left: -28px !important;
    margin-right: -28px !important;
    box-sizing: border-box;
}
.eduai-light-scope .page > .eduai-compliance-banner {
    width: calc(100% + 40px) !important;
    max-width: none;
    margin-left: -20px !important;
    margin-right: -20px !important;
    box-sizing: border-box;
}
/* A generated content banner is allowed to use the complete available page
   width. These selectors target only direct top-level banners, so nested
   activity badges and ordinary body cards keep their normal layout. */
.eduai-light-scope .card > header:not(.site-header),
.eduai-light-scope .card > .content-banner,
.eduai-light-scope .card > .top-banner,
.eduai-light-scope .card > .header-banner,
.eduai-light-scope .card > .banner {
    width: calc(100% + 56px) !important;
    max-width: none;
    margin-left: -28px !important;
    margin-right: -28px !important;
    box-sizing: border-box;
}
.eduai-light-scope .page > header:not(.site-header),
.eduai-light-scope .page > .content-banner,
.eduai-light-scope .page > .top-banner,
.eduai-light-scope .page > .header-banner,
.eduai-light-scope .page > .banner {
    width: calc(100% + 40px) !important;
    max-width: none;
    margin-left: -20px !important;
    margin-right: -20px !important;
    box-sizing: border-box;
}
/* AI-authored documents use a variety of banner class names. Give all of
   their top/header banners the same two-colour treatment without touching
   ordinary cards and body sections. */
.eduai-light-scope > .page > article > header:not(.site-header),
.eduai-light-scope header:not(.site-header),
.eduai-light-scope .content-banner,
.eduai-light-scope .top-banner,
.eduai-light-scope .header-banner,
.eduai-light-scope .banner,
.eduai-light-scope [class*="banner"] {
    background: ${EDUAI_BANNER_GRADIENT} !important;
    background-image: ${EDUAI_BANNER_GRADIENT} !important;
    color: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.eduai-light-scope header:not(.site-header) *,
.eduai-light-scope .content-banner *,
.eduai-light-scope .top-banner *,
.eduai-light-scope .header-banner *,
.eduai-light-scope .banner * { color: inherit; }
.eduai-light-scope {
    position: relative;
    background: #ffffff;
    overflow: hidden;
}
.eduai-light-scope .page {
    position: relative;
    z-index: 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 28px 20px 60px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #1e293b;
    line-height: 1.65;
    box-sizing: border-box;
}
.eduai-light-scope .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(30,58,95,0.06);
}
.eduai-light-scope .card:last-child { margin-bottom: 0; }
.eduai-light-scope .lesson-title {
    font-family: 'Fredoka', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e3a5f;
    line-height: 1.2;
    margin: 0 0 8px;
}
.eduai-light-scope .lesson-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #475569;
}
.eduai-light-scope .meta-pill {
    background: #eff6ff;
    color: #2563eb;
    padding: 4px 10px;
    border-radius: 999px;
    font-weight: 500;
    border: 1px solid #dbeafe;
    white-space: nowrap;
}
.eduai-light-scope h2 {
    font-family: 'Fredoka', sans-serif;
    font-size: 22px;
    color: #1e3a5f;
    margin: 28px 0 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}
.eduai-light-scope h2:first-child { margin-top: 0; }
.eduai-light-scope h2::before {
    content: '';
    width: 4px;
    height: 22px;
    background: linear-gradient(180deg, #2563eb, #3b82f6);
    border-radius: 2px;
    display: inline-block;
    flex-shrink: 0;
}
.eduai-light-scope p { margin: 0 0 14px; color: #334155; }
.eduai-light-scope .objectives {
    list-style: none;
    margin: 16px 0;
    padding-left: 0;
}
.eduai-light-scope .objectives li {
    padding: 10px 14px 10px 38px;
    margin-bottom: 8px;
    background: #f8fafc;
    border-radius: 10px;
    position: relative;
    border-left: 3px solid #2563eb;
    color: #334155;
}
.eduai-light-scope .objectives li::before {
    content: '✓';
    position: absolute;
    left: 14px;
    top: 10px;
    color: #2563eb;
    font-weight: 700;
}
.eduai-light-scope .activity {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 18px;
    margin: 18px 0;
}
.eduai-light-scope .activity-header {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    color: #075985;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.eduai-light-scope .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #2563eb;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    font-family: 'Fredoka', sans-serif;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
}
.eduai-light-scope .tip {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding: 14px 16px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
    font-size: 14px;
    color: #334155;
}
/* Safety-net typography for plain AI fragments rendered without Tailwind
   (HTML downloads, print windows, PDF containers). */
.eduai-light-scope table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
.eduai-light-scope th, .eduai-light-scope td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
.eduai-light-scope th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
.eduai-light-scope img { max-width: 100%; height: auto; border-radius: 8px; }
.eduai-light-scope ul, .eduai-light-scope ol { padding-left: 1.5rem; margin-bottom: 14px; color: #334155; }
.eduai-light-scope ul.objectives { padding-left: 0; }
.eduai-light-scope a { color: #2563eb; }
@media (max-width: 640px) {
    .site-header { padding: 0 8px; gap: 5px; height: 23px; }
    .site-header .logo { height: 13px; }
    .header-text { font-size: clamp(7px, 1.6vw, 9px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .eduai-light-scope .page { padding: 20px 14px 50px; }
    .eduai-light-scope .card { padding: 20px; border-radius: 14px; }
    .eduai-light-scope .card > .eduai-compliance-banner { width: calc(100% + 40px) !important; margin-left: -20px !important; margin-right: -20px !important; }
    .eduai-light-scope .page > .eduai-compliance-banner { width: calc(100% + 28px) !important; margin-left: -14px !important; margin-right: -14px !important; }
    .eduai-light-scope .lesson-title { font-size: 26px; }
    .eduai-compliance-banner { font-size: 10px; padding: 10px 11px; }
    .eduai-light-scope h2 { font-size: 20px; }
}
@media (max-width: 390px) {
    .site-header { gap: 4px; padding: 0 6px; height: 21px; }
    .site-header .logo { height: 12px; }
    .header-text { font-size: clamp(6px, 1.35vw, 7px); }
    .eduai-light-scope .lesson-meta { gap: 6px; }
    .eduai-light-scope .card { padding: 18px 16px; }
    .eduai-light-scope .card > .eduai-compliance-banner { width: calc(100% + 36px) !important; margin-left: -18px !important; margin-right: -18px !important; }
    .eduai-light-scope .page > .eduai-compliance-banner { width: calc(100% + 28px) !important; margin-left: -14px !important; margin-right: -14px !important; }
}
@media print {
    .site-header { position: static; }
    .eduai-light-scope .card { box-shadow: none; break-inside: avoid; }
    .eduai-light-scope .btn { display: none !important; }
    /* The 50%-opacity logo watermark sits at 50% of the *whole* document, so
       in a browser print (usually without "background graphics") it bleeds
       through every page of content. Hide it on paper — the footer keeps the
       branding. It still appears in html2canvas PDFs (screen media). */
    .watermark { display: none !important; }
}
`.trim();

/** The LIGHT stylesheet as an embeddable <style> block. */
export const buildTemplateStyleHTML = (): string =>
    `<style data-eduai-light="v4">\n${EDUAI_LIGHT_CSS}\n</style>`;

const esc = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/** Absolute, origin-correct logo URL — safe inside iframes, popups and html2canvas. */
export const getTemplateLogoSrc = (): string => {
    try {
        if (typeof document !== 'undefined' && document.baseURI) {
            return new URL('eduai-logo.png', document.baseURI).href;
        }
    } catch { /* fall through */ }
    return '/eduai-logo.png';
};

/** South African date format DD/MM/YYYY. */
export const saToday = (): string => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
};

/** Current SA school term from the calendar (Jan–Mar T1, Apr–Jun T2, Jul–Sep T3, Oct–Dec T4). */
export const currentSATerm = (): string => {
    const m = new Date().getMonth() + 1;
    if (m >= 1 && m <= 3) return 'Term 1';
    if (m >= 4 && m <= 6) return 'Term 2';
    if (m >= 7 && m <= 9) return 'Term 3';
    return 'Term 4';
};

const normTerm = (term?: string): string => {
    const raw = String(term ?? '').trim();
    if (!raw || /^(all|n\/a|none|-)$/i.test(raw)) return '';
    const digits = raw.match(/\d+/);
    if (digits) return `TERM ${digits[0]}`;
    return raw.toUpperCase();
};

const normGrade = (grade?: string): string => {
    const raw = String(grade ?? '').trim();
    if (!raw || /^(all|n\/a|none|-)$/i.test(raw)) return '';
    // NOTE: the optional "grade" prefix must match case-insensitively, or the
    // bare "r" inside the word "Grade" wins and "Grade 5" becomes "GRADE R".
    const withWord = raw.match(/grade\s*([rR]|\d{1,2})/i);
    if (withWord) return `GRADE ${withWord[1].toUpperCase()}`;
    const bare = raw.match(/^([rR]|\d{1,2})$/);
    if (bare) return `GRADE ${bare[1].toUpperCase()}`;
    if (/^reception$/i.test(raw)) return 'GRADE R';
    return raw.toUpperCase();
};

/** Title-case pill label for a grade value ("5" → "Grade 5", "R" → "Grade R"). */
const pillGrade = (grade?: string): string => {
    const raw = String(grade ?? '').trim();
    if (!raw || /^(all|n\/a|none|-)$/i.test(raw)) return '';
    if (/^grade/i.test(raw)) return raw.replace(/\s+/g, ' ');
    if (/^[rR]$/.test(raw) || /^reception$/i.test(raw)) return 'Grade R';
    if (/^\d{1,2}$/.test(raw)) return `Grade ${raw}`;
    return raw;
};

/** Title-case pill label for a term value ("2" → "Term 2"). */
const pillTerm = (term?: string): string => {
    const raw = String(term ?? '').trim();
    if (!raw || /^(all|n\/a|none|-)$/i.test(raw)) return '';
    if (/^term/i.test(raw)) return raw.replace(/\s+/g, ' ');
    if (/^\d$/.test(raw)) return `Term ${raw}`;
    return raw;
};


/** Build a stable, readable CAPS code when a caller has not supplied one. */
export const buildCAPSCode = (meta: ContentTemplateMeta = {}): string => {
    const explicit = String(meta.capsCode || '').trim();
    if (explicit) return explicit;

    const grade = normGrade(meta.grade);
    const gradeNumber = grade.match(/GRADE\s*([R\d]+)/i)?.[1]?.toUpperCase() || 'X';
    const phase = gradeNumber === 'R' || ['1', '2', '3'].includes(gradeNumber)
        ? 'FP'
        : ['4', '5', '6'].includes(gradeNumber)
            ? 'IP'
            : ['7', '8', '9'].includes(gradeNumber)
                ? 'SP'
                : ['10', '11', '12'].includes(gradeNumber) ? 'FET' : 'EDU';
    const subjectRaw = String(meta.subject || '').toLowerCase();
    const subject = subjectRaw.includes('math') ? 'MATH'
        : subjectRaw.includes('english') || subjectRaw.includes('language') ? 'LANG'
            : subjectRaw.includes('science') ? 'SCI'
                : subjectRaw.includes('life') ? 'LS'
                    : subjectRaw.includes('social') ? 'SS'
                        : subjectRaw.replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase() || 'GEN';
    const termMatch = String(meta.term || '').match(/(?:term\s*)?([1-4])/i);
    const term = termMatch ? `T${termMatch[1]}` : 'T1';
    const topic = String(meta.title || meta.contentType || '').toLowerCase();
    const topicCode = topic.includes('data') || topic.includes('handling') ? 'DH'
        : topic.includes('fraction') ? 'FR'
            : topic.includes('time') ? 'TM'
                : topic.includes('number') ? 'NUM'
                    : topic.split(/[^a-z0-9]+/).filter(Boolean).map((word) => word[0]).join('').slice(0, 3).toUpperCase() || 'RES';
    return `${phase}-${subject}-G${gradeNumber}-${term}-${topicCode}01`;
};

/**
 * Extract the body fragment from an AI document so the host can apply one
 * consistent banner/footer. Keeping this dependency-free also makes it safe in
 * server-side HTML generation where DOMParser is unavailable.
 */
export const extractGeneratedBodyHTML = (html: string): string => {
    let source = String(html || '').trim();
    const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
    if (body) source = body[1];
    source = source.replace(/<!doctype[^>]*>/gi, '');
    source = source.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
    source = source.replace(/<\/?html\b[^>]*>/gi, '');
    return source.trim();
};

/** Minimal entity decode for text lifted back out of rendered markup. */
const decodeEntities = (value: string): string =>
    String(value || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');

/**
 * Lift the status labels (and their 🇿🇦 / ✅ marks and separators) out of a run
 * of plain text, returning whatever real wording is left. An empty result means
 * the text was nothing but a compliance stamp row.
 */
const stripStatusLabelText = (text: string): string => {
    const labels = '(?:CAPS\\s+Aligned|NPA\\s+Compliant|POPIA\\s+Compliant(?:\\s*\\(2026\\))?|SIAS(?:\\s+Level\\s*1)?\\s+Inclusive|WP6\\s+Differentiated)';
    return decodeEntities(String(text || ''))
        .replace(new RegExp(`(?:🇿🇦\\s*)?(?:✅\\s*)?${labels}`, 'gi'), ' ')
        .replace(/CAPS\s*Code\s*:?\s*[A-Z0-9-]*/gi, ' ')
        .replace(/[🇿🇦✅]/gu, ' ')
        .replace(/\s*[|•·,;:/]\s*/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
};

/**
 * Remove compliance chrome emitted by an AI model. The renderer owns the
 * canonical block below; removing model-authored variants is what guarantees
 * the labels appear exactly once in each generated document.
 */
export const stripGeneratedComplianceMarkup = (html: string): string => {
    let cleaned = String(html || '');
    // Even a model-authored copy that uses our canonical class is removed here:
    // wrapWithTemplate will add the one host-owned copy after sanitisation.
    cleaned = cleaned.replace(/<([a-z][\w:-]*)\b(?=[^>]*(?:class|id)\s*=\s*[\"'][^\"']*eduai-compliance-banner[^\"']*[\"'])[^>]*>[\s\S]*?<\/\1>/gi, '');
    cleaned = cleaned.replace(/<([a-z][\w:-]*)\b(?=[^>]*(?:class|id)\s*=\s*[\"'][^\"']*(?:compliance|stamp)[^\"']*[\"'])[^>]*>[\s\S]*?<\/\1>/gi, '');
    cleaned = cleaned.replace(/<[^>]+>\s*(?:🇿🇦\s*)?(?:✅\s*)?(?:CAPS\s+Aligned|NPA\s+Compliant|POPIA\s+Compliant(?:\s*\(2026\))?|SIAS(?:\s+Level\s*1)?\s+Inclusive|WP6\s+Differentiated)\s*<\/[^>]+>/gi, '');
    // A plain-text status row (models separate labels with pipes or tightly
    // packed check marks instead of individual spans) is dropped whole — but
    // only when the labels are ALL the element says. Real sentences that merely
    // mention a status keep their wording with the labels lifted out.
    cleaned = cleaned.replace(/<([a-z][\w:-]*)\b([^>]*)>([^<]*)<\/\1>/gi, (match, tag: string, attrs: string, text: string) => {
        if (!/(?:CAPS\s+Aligned|NPA\s+Compliant)/i.test(text)) return match;
        if (!/(?:POPIA\s+Compliant|SIAS(?:\s+Level\s*1)?\s+Inclusive|WP6\s+Differentiated)/i.test(text)) return match;
        const residue = stripStatusLabelText(text);
        return residue ? `<${tag}${attrs}>${residue}</${tag}>` : '';
    });
    cleaned = cleaned.replace(/CAPS\s*Code\s*:[^<\n]*(?:<br\s*\/?>)?/gi, '');
    const complianceLabel = '(?:CAPS\\s+Aligned|NPA\\s+Compliant|POPIA\\s+Compliant(?:\\s*\\(2026\\))?|SIAS(?:\\s+Level\\s*1)?\\s+Inclusive|WP6\\s+Differentiated)';
    cleaned = cleaned.replace(new RegExp(`(?:🇿🇦\\s*)?(?:✅\\s*)?${complianceLabel}(?:\\s*(?:🇿🇦|✅|[|•·,;:/])?\\s*${complianceLabel})+`, 'gi'), '');
    cleaned = cleaned.replace(new RegExp(`(?:🇿🇦\\s*)?(?:✅\\s*)?${complianceLabel}(?:\\s*✅)?`, 'gi'), '');
    cleaned = cleaned.replace(/(?:^|>)\s*(?:🇿🇦\s*)?(?:✅\s*)?(?:CAPS\s+Aligned|NPA\s+Compliant|POPIA\s+Compliant(?:\s*\(2026\))?|SIAS(?:\s+Level\s*1)?\s+Inclusive|WP6\s+Differentiated)\s*(?=<|$)/gim, '$1');
    // Remove model-authored copies of either the old or new footer text. The
    // host adds the canonical footer after this cleanup.
    cleaned = cleaned.replace(/©\s*20\d{2}\s+EduAI\s+Companion[^<\n]*/gi, '');
    cleaned = cleaned.replace(/EduAI\s+Companion\s*[•|]\s*(?:CAPS|Curriculum)[^<\n]*/gi, '');
    cleaned = cleaned.replace(/(?:www\.)?eduai-companion\.(?:github\.io|vercel\.app)[^<\n]*/gi, '');
    return cleaned.trim();
};

/** Remove model footers before the single EduAI footer is appended. */
export const cleanGeneratedBodyHTML = (html: string): string => {
    let cleaned = stripGeneratedComplianceMarkup(extractGeneratedBodyHTML(html));
    cleaned = cleaned.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
    return cleaned.trim();
};

/**
 * The LIGHT compact translucent header: a 15px watermark-like logo in a
 * 26px white/translucent bar plus a single-line muted strapline. Dynamic grade
 * / term / subject / type trail behind the fixed artwork lead; the line is
 * clamped to ONE line with an ellipsis so it can never wrap or push the bar
 * taller on narrow screens. The designated content banner below carries the
 * two-colour gradient and compliance/status text.
 */
export const buildTemplateHeaderHTML = (meta: ContentTemplateMeta = {}): string => {
    const grade = normGrade(meta.grade);
    const term = normTerm(meta.term || (typeof document !== 'undefined' ? currentSATerm() : ''));
    const subject = String(meta.subject || '').trim().toUpperCase();
    const contentType = String(meta.contentType || '').trim().toUpperCase();
    const trail = [grade, term, subject, contentType].filter(Boolean).join(' • ');
    const strapline = trail ? `${EDUAI_TEMPLATE_HEADER_BASE} | ${trail}` : `${EDUAI_TEMPLATE_HEADER_BASE} |`;

    return `
<header class="site-header" style="box-sizing: border-box; display: flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 0 10px; height: 26px; background: ${EDUAI_TEMPLATE_COLOURS.headerGradient}; background-image: ${EDUAI_HEADER_GRADIENT}; -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); border-bottom: 1px solid rgba(148,163,184,0.36); box-shadow: none; width: 100%; page-break-inside: avoid; break-inside: avoid; min-width: 0;">
  <img src="${getTemplateLogoSrc()}" alt="EduAI Logo" class="logo" style="height: 15px; width: auto; display: block; flex-shrink: 0; opacity: 0.28;" />
  <span class="header-text" style="font-family: ${LIGHT_HEADING_FONT}; font-size: clamp(7px, 1.05vw, 9px); font-weight: 600; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; opacity: 0.56; -webkit-print-color-adjust: exact; print-color-adjust: exact; white-space: nowrap; letter-spacing: 0.3px; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">${esc(strapline)}</span>
</header>`.trim();
};

/** The single canonical footer band used by every generated export. */
export const buildTemplateFooterHTML = (_meta: ContentTemplateMeta = {}): string => `
<footer class="site-footer" style="box-sizing: border-box; background-color: ${EDUAI_TEMPLATE_COLOURS.footerBg}; color: ${EDUAI_TEMPLATE_COLOURS.footerText}; text-align: center; font-size: 8pt; padding: 16px 20px; font-family: ${LIGHT_HEADING_FONT}; letter-spacing: 0.3px; line-height: 1.6; page-break-inside: avoid; break-inside: avoid;">
  <div>${esc(EDUAI_TEMPLATE_FOOTER_LINE)}</div>
</footer>`.trim();

/**
 * The faded EduAI watermark centred behind the content area. Absolutely
 * positioned (not fixed) so it rasterises identically in html2canvas, print
 * and iframe previews. Content cards are opaque white, so text always stays
 * fully legible over the 0.5-opacity artwork.
 */
export const buildTemplateWatermarkHTML = (): string => `
<img src="${getTemplateLogoSrc()}" alt="" aria-hidden="true" class="watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 75%; max-width: 560px; height: auto; opacity: 0.5; pointer-events: none; z-index: 0;" />`.trim();

/** Render the one designated compliance section for a generated document. */
export const buildTemplateComplianceBannerHTML = (meta: ContentTemplateMeta = {}): string => `
<section class="eduai-compliance-banner" aria-label="South African compliance" style="display:block; width:100%; box-sizing:border-box; background: ${EDUAI_BANNER_GRADIENT}; background-image: ${EDUAI_BANNER_GRADIENT}; color: #ffffff; border: 1px solid #93c5fd; border-radius: 10px; padding: 11px 14px; margin: 14px 0 20px; font-family: ${LIGHT_BODY_FONT}; font-size: 11px; font-weight: 700; line-height: 1.5; overflow-wrap: anywhere; -webkit-print-color-adjust: exact; print-color-adjust: exact;"><strong>CAPS Code:${esc(buildCAPSCode(meta))} ${esc(EDUAI_COMPLIANCE_LABELS)}</strong></section>`.trim();

/**
 * The LIGHT title block (lesson-title + meta pills) injected above plain AI
 * fragments so every document opens exactly like the template artwork.
 * Returns '' when there is no metadata worth showing.
 */
export const buildTemplateTitleBlockHTML = (meta: ContentTemplateMeta = {}): string => {
    const title = String(meta.title || '').trim()
        || [meta.contentType, meta.subject].filter(Boolean).join(' • ')
        || '';
    const gradePill = pillGrade(meta.grade);
    const subjectPill = String(meta.subject || '').trim();
    const typePill = String(meta.contentType || '').trim();
    const termPill = pillTerm(meta.term);
    if (!title && !gradePill && !subjectPill && !typePill && !termPill) {
        return buildTemplateComplianceBannerHTML(meta);
    }
    const pills = [gradePill, subjectPill, typePill, termPill].filter(Boolean);
    return `
  <h1 class="lesson-title">${esc(title || 'Educational Resource')}</h1>
  ${pills.length ? `<div class="lesson-meta">${pills.map((p) => `<span class="meta-pill">${esc(p)}</span>`).join('')}</div>` : ''}
  ${buildTemplateComplianceBannerHTML(meta)}`.trim();
};

/**
 * Marker left where the host compliance banner was lifted out of markup that is
 * being re-wrapped. Remembering the position keeps re-wrapping stable: the
 * banner goes back exactly where the host first put it, so a document can never
 * end up carrying two copies of the compliance labels.
 */
const COMPLIANCE_SLOT = '<!--EDUAI_COMPLIANCE_SLOT-->';

interface ElementRange {
    /** Index of the opening tag. */
    start: number;
    /** Index just after the matching closing tag. */
    end: number;
    /** Index just after the opening tag. */
    innerStart: number;
    /** Index of the matching closing tag. */
    innerEnd: number;
}

/**
 * Dependency-free element scanner: finds every element whose class contains
 * `classToken` and returns its exact span (matching close tag found by depth
 * counting, so nested elements of the same tag are handled). Unbalanced markup
 * is skipped rather than mangled.
 */
const findElementRangesByClass = (source: string, classToken: string): ElementRange[] => {
    const ranges: ElementRange[] = [];
    const openRe = new RegExp(
        `<([a-z][\\w:-]*)\\b[^>]*class\\s*=\\s*["'][^"']*\\b${classToken}\\b[^"']*["'][^>]*>`,
        'gi',
    );
    let match: RegExpExecArray | null;
    while ((match = openRe.exec(source)) !== null) {
        const tag = match[1];
        const innerStart = match.index + match[0].length;
        if (/\/>\s*$/.test(match[0])) {
            ranges.push({ start: match.index, end: innerStart, innerStart, innerEnd: innerStart });
            openRe.lastIndex = innerStart;
            continue;
        }
        const scan = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi');
        scan.lastIndex = innerStart;
        let depth = 1;
        let closeStart = -1;
        let closeEnd = -1;
        let inner: RegExpExecArray | null;
        while ((inner = scan.exec(source)) !== null) {
            if (inner[0].startsWith('</')) {
                depth -= 1;
                if (depth === 0) {
                    closeStart = inner.index;
                    closeEnd = inner.index + inner[0].length;
                    break;
                }
            } else if (!/\/>\s*$/.test(inner[0])) {
                depth += 1;
            }
        }
        if (closeStart === -1) continue;
        ranges.push({ start: match.index, end: closeEnd, innerStart, innerEnd: closeStart });
        openRe.lastIndex = closeEnd;
    }
    return ranges;
};

const spliceRanges = (source: string, ranges: ElementRange[], render: (range: ElementRange) => string): string => {
    if (!ranges.length) return source;
    let out = '';
    let cursor = 0;
    for (const range of ranges) {
        out += source.slice(cursor, range.start) + render(range);
        cursor = range.end;
    }
    return out + source.slice(cursor);
};

/** Delete every element carrying `classToken`, optionally leaving a marker. */
const removeElementsByClass = (source: string, classToken: string, replacement = ''): string =>
    spliceRanges(source, findElementRangesByClass(source, classToken), () => replacement);

/** Replace every element carrying `classToken` with its own inner markup. */
const unwrapElementsByClass = (source: string, classToken: string): string =>
    spliceRanges(source, findElementRangesByClass(source, classToken), (range) =>
        source.slice(range.innerStart, range.innerEnd));

const countMatches = (source: string, pattern: RegExp): number =>
    (String(source || '').match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)) || []).length;

/** The five status labels, as individual matchers, for duplicate detection. */
const COMPLIANCE_LABEL_PATTERNS: RegExp[] = [
    /CAPS\s+Aligned/i,
    /NPA\s+Compliant/i,
    /POPIA\s+Compliant/i,
    /SIAS[^<\n]{0,14}Inclusive/i,
    /WP6\s+Differentiated/i,
];

/**
 * True when markup is already the CURRENT canonical template output: the LIGHT
 * v4 style block, exactly one compliance banner, exactly one footer band and
 * each status label exactly once. Such documents pass through untouched, so
 * re-exporting the print-preview paper stays byte-stable. Anything older — or
 * model output that copied our chrome — is normalised by wrapWithTemplate.
 */
export const isCurrentTemplateOutput = (html: string): boolean => {
    const source = String(html || '');
    if (!/data-eduai-light="v4"/.test(source)) return false;
    if (!source.includes(EDUAI_TEMPLATE_FOOTER_LINE)) return false;
    if (countMatches(source, /<[a-z][\w:-]*\b[^>]*class\s*=\s*["'][^"']*\beduai-compliance-banner\b/i) !== 1) return false;
    if (countMatches(source, /<footer\b[^>]*class\s*=\s*["'][^"']*\bsite-footer\b/i) !== 1) return false;
    return COMPLIANCE_LABEL_PATTERNS.every((pattern) => countMatches(source, pattern) === 1);
};

/**
 * Lift host/legacy template chrome out of markup so it can be re-wrapped in the
 * CURRENT canonical chrome. Documents saved before a template revision (or model
 * output that copied our header/footer) keep their content but lose the stale
 * bands — this is what stops a second footer, a second header or a second set of
 * compliance labels from surviving into a preview, print or PDF export.
 */
export const stripTemplateChrome = (html: string): string => {
    let out = String(html || '');
    // Embedded LIGHT stylesheets (any version) — re-added by wrapWithTemplate.
    out = out.replace(/<style\b[^>]*data-eduai-light[^>]*>[\s\S]*?<\/style\s*>/gi, '');
    // Compliance banner: remember where it sat, drop the (possibly stale) copy.
    out = removeElementsByClass(out, 'eduai-compliance-banner', COMPLIANCE_SLOT);
    // Sticky document header, footer bands and the watermark artwork.
    out = removeElementsByClass(out, 'site-header');
    out = out.replace(/<footer\b[^>]*>[\s\S]*?<\/footer\s*>/gi, '');
    out = out.replace(/<img\b[^>]*class\s*=\s*["'][^"']*\bwatermark\b[^"']*["'][^>]*\/?>/gi, '');
    // Page shell: keep the content, drop the wrapper so it is never nested twice.
    out = unwrapElementsByClass(out, 'eduai-light-scope');
    out = out.replace(/<main\b[^>]*class\s*=\s*["'][^"']*\bpage\b[^"']*["'][^>]*>([\s\S]*?)<\/main\s*>/gi, '$1');
    // At most one slot marker survives, whatever the input carried.
    if (countMatches(out, /<!--EDUAI_COMPLIANCE_SLOT-->/) > 1) {
        const parts = out.split(COMPLIANCE_SLOT);
        out = `${parts[0]}${COMPLIANCE_SLOT}${parts.slice(1).join('')}`;
    }
    return out.trim();
};

/** "MATHEMATICS" → "Mathematics" (used when recovering meta from old chrome). */
const titleCaseWords = (value: string): string =>
    decodeEntities(value)
        .toLowerCase()
        .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
        .trim();

/**
 * Recover metadata from chrome that is about to be discarded, so re-wrapping an
 * archived document never loses the grade/term/subject/type its header carried
 * — or the CAPS code its banner displayed. Explicit caller metadata always wins.
 */
export const harvestMetaFromChrome = (html: string): ContentTemplateMeta => {
    const source = String(html || '');
    const harvested: ContentTemplateMeta = {};

    const capsCode = source.match(/CAPS\s*Code\s*:?\s*<\/?(?:strong|b|span|em)?[^>]*>\s*([A-Z]{2,4}-[A-Z]{2,6}-G[R\d]{1,2}-T\d-[A-Z]{2,4}\d{2})/i)?.[1]
        || source.match(/\b([A-Z]{2,4}-[A-Z]{2,6}-G[R\d]{1,2}-T\d-[A-Z]{2,4}\d{2})\b/)?.[1];
    if (capsCode) harvested.capsCode = capsCode.toUpperCase();

    const title = source.match(/<h1\b[^>]*class\s*=\s*["'][^"']*\blesson-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h1\s*>/i)?.[1];
    if (title) {
        const cleanTitle = decodeEntities(title.replace(/<[^>]+>/g, '')).trim();
        if (cleanTitle) harvested.title = cleanTitle;
    }

    const strapline = source.match(/class\s*=\s*["'][^"']*\bheader-text\b[^"']*["'][^>]*>([\s\S]*?)<\/[a-z]/i)?.[1];
    if (strapline) {
        const trail = decodeEntities(strapline).split('|').pop() || '';
        const parts = trail.split('•').map((part) => part.trim()).filter(Boolean);
        const gradePart = parts.find((part) => /^GRADE\s+[R\d]{1,2}$/i.test(part));
        const termPart = parts.find((part) => /^TERM\s+\d$/i.test(part));
        if (gradePart) harvested.grade = gradePart.replace(/^GRADE\s+/i, '').toUpperCase();
        if (termPart) harvested.term = `Term ${termPart.replace(/^TERM\s+/i, '')}`;
        const rest = parts.filter((part) => part !== gradePart && part !== termPart);
        if (rest[0]) harvested.subject = titleCaseWords(rest[0]);
        if (rest[1]) harvested.contentType = titleCaseWords(rest[1]);
    }

    return harvested;
};

/** Merge recovered chrome metadata with caller metadata (caller wins). */
const mergeMeta = (base: ContentTemplateMeta, override: ContentTemplateMeta): ContentTemplateMeta => {
    const merged: ContentTemplateMeta = { ...base };
    (Object.keys(override) as (keyof ContentTemplateMeta)[]).forEach((key) => {
        const value = override[key];
        if (value !== undefined && String(value).trim() !== '') merged[key] = value;
    });
    return merged;
};

/** Class/id fragments that identify a model-authored banner container. */
const BANNER_HINT = /banner|hero|masthead|title-block|doc-title|page-title|cover-head|top-bar/i;

/**
 * Inline declarations that force the official two-colour gradient. Inline +
 * !important beats Tailwind utilities and model CSS everywhere the document is
 * rendered: browser, iframe preview, html2canvas rasterisation and Chromium PDF.
 */
const BANNER_GRADIENT_DECLARATIONS =
    `background:${EDUAI_BANNER_GRADIENT} !important;background-image:${EDUAI_BANNER_GRADIENT} !important;color:#ffffff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;`;

const withGradientStyle = (attrs: string): string => {
    const styleMatch = attrs.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
    if (!styleMatch) return `${attrs} style="${BANNER_GRADIENT_DECLARATIONS}"`;
    const quote = styleMatch[1];
    const kept = styleMatch[2]
        // Drop every solid background/colour the model chose …
        .replace(/background(?:-color|-image|-blend-mode|-size|-position)?\s*:[^;"']*;?/gi, '')
        .replace(/(?:^|;)\s*color\s*:[^;"']*;?/gi, ';')
        .replace(/;{2,}/g, ';')
        .replace(/^;+|;+$/g, '')
        .trim();
    const merged = kept ? `${kept};${BANNER_GRADIENT_DECLARATIONS}` : BANNER_GRADIENT_DECLARATIONS;
    return attrs.replace(styleMatch[0], () => `style=${quote}${merged}${quote}`);
};

/**
 * Convert every solid top banner in generated content to the official
 * two-colour gradient. Model output uses dozens of banner spellings
 * (`<header>`, `.banner`, `.hero`, `.doc-title`, inline `background:#007749`,
 * Tailwind `bg-emerald-700`), so the gradient is written inline on each of them
 * instead of relying on a class name surviving. The host's own compliance
 * banner and the compact document header are left exactly as built.
 */
export const applyBannerGradients = (html: string): string => {
    const source = String(html || '');
    return source.replace(/<(?!\/)([a-z][\w:-]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
        if (/^(style|script|svg|path|circle|rect|line|polygon|polyline|ellipse|g|defs|use|text|tspan)$/i.test(tag)) return match;
        if (/site-header|header-text|eduai-compliance-banner/i.test(attrs)) return match;
        const isHeaderTag = /^header$/i.test(tag);
        const classOrId = `${attrs.match(/class\s*=\s*["'][^"']*["']/i)?.[0] ?? ''} ${attrs.match(/id\s*=\s*["'][^"']*["']/i)?.[0] ?? ''}`;
        if (!isHeaderTag && !BANNER_HINT.test(classOrId)) return match;
        return `<${tag}${withGradientStyle(attrs)}>`;
    });
};

/** True when the markup already provides its own LIGHT card structure. */
const hasLightCards = (html: string): boolean =>
    /<article[\s>]|class\s*=\s*["'][^"']*\b(card|lesson-title)\b/i.test(html || '');

/**
 * Wrap generated content in the LIGHT Template v4 chrome:
 * compact two-colour header wash → full-width two-colour content banner →
 * watermark + centred 800px page → navy footer.
 *
 * Plain fragments are lifted into an opaque white card (with a title block and
 * the designated compliance section); fragments that already use LIGHT card
 * structure keep it. The call is idempotent AND self-healing:
 *
 *  - current canonical output passes through byte-for-byte (print-preview
 *    re-exports never double-wrap);
 *  - older wrapped documents and model-copied chrome are stripped back to
 *    content and re-wrapped, so stale footers, duplicate compliance labels and
 *    solid banners cannot survive into a preview, print, PDF or HTML export.
 */
export const wrapWithTemplate = (bodyHtml: string, meta: ContentTemplateMeta = {}): string => {
    const original = String(bodyHtml || '');
    if (!original.trim()) return original;
    if (isCurrentTemplateOutput(original)) return original;

    const effectiveMeta = mergeMeta(harvestMetaFromChrome(original), meta);
    const cleaned = cleanGeneratedBodyHTML(stripTemplateChrome(original));
    const banner = buildTemplateComplianceBannerHTML(effectiveMeta);

    let inner: string;
    if (cleaned.includes(COMPLIANCE_SLOT)) {
        // Exactly one banner, restored to the position the host gave it first.
        inner = cleaned.replace(COMPLIANCE_SLOT, () => banner);
    } else if (hasLightCards(cleaned)) {
        inner = `${banner}\n${cleaned}`;
    } else {
        inner = `<article class="card">\n${buildTemplateTitleBlockHTML(effectiveMeta)}\n${cleaned}\n</article>`;
    }

    return `
${buildTemplateStyleHTML()}
${buildTemplateHeaderHTML(effectiveMeta)}
<div class="eduai-light-scope" style="position: relative; background: ${EDUAI_TEMPLATE_COLOURS.paper}; overflow: hidden;">
  ${buildTemplateWatermarkHTML()}
  <main class="page" style="position: relative; z-index: 1; max-width: 800px; margin: 0 auto; padding: 28px 20px 60px; font-family: ${LIGHT_BODY_FONT}; color: #1e293b; line-height: 1.65; box-sizing: border-box;">
${applyBannerGradients(inner)}
  </main>
</div>
${buildTemplateFooterHTML(effectiveMeta)}`.trim();
};

/** Map the print/export options onto the template metadata. */
export const metaFromPrintOptions = (
    options?: { subject?: string; grade?: string; contentType?: string; date?: string; term?: string; school?: string; teacher?: string; title?: string },
    title?: string,
): ContentTemplateMeta => ({
    title: title || options?.title,
    subject: options?.subject,
    grade: options?.grade,
    term: options?.term,
    contentType: options?.contentType,
    date: options?.date,
    school: options?.school,
    teacher: options?.teacher,
});
