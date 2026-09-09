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
 *   │  TRANSLUCENT HEADER BAR (60px, sticky, blur)                │
 *   │   (logo 36px)  EDUAI COMPANION 2026 | CAPS COMPLIANT …      │
 *   │   ─────────────── 2.5px #2563eb underline ───────────────   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  WHITE PAGE (max 800px, centred) over a faded watermark     │
 *   │   ┌─ card ─────────────────────────────────────────────┐   │
 *   │   │ lesson title + meta pills (grade · subject · term) │   │
 *   │   │ …dynamic generated content…                        │   │
 *   │   └────────────────────────────────────────────────────┘   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  NAVY FOOTER BAND (#1e3a5f, centred, 8pt)                  │
 *   │   © 2026 EduAI Companion | CAPS Compliant … | Developed…   │
 *   └─────────────────────────────────────────────────────────────┘
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
 *  - wrapWithTemplate() is idempotent: markup that already carries template
 *    chrome (e.g. re-exported from the print-preview paper) is returned
 *    untouched instead of being double-wrapped.
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
    /** CAPS compliance line — defaults to "CAPS Compliant". */
    capsStatus?: string;
    /** NPA compliance line — defaults to "NPA Compliant (Gr R-12)". */
    npaStatus?: string;
    /** Optional school name (rendered in the footer where supported). */
    school?: string;
    /** Optional teacher name. */
    teacher?: string;
}

/** LIGHT Template v4 palette — sampled directly from the template artwork. */
export const EDUAI_TEMPLATE_COLOURS = {
    navy: '#1e3a5f',
    accent: '#2563eb',
    accentLight: '#3b82f6',
    headerBg: 'rgba(255,255,255,0.35)',
    headerBorder: '#2563eb',
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
/** Primary LIGHT footer line — exactly as drawn in the template artwork. */
export const EDUAI_TEMPLATE_FOOTER_LINE =
    '© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators';

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
    gap: 12px;
    padding: 0 20px;
    height: 60px;
    background-color: rgba(255,255,255,0.35);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0.92;
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 2.5px solid #2563eb;
    width: 100%;
    box-sizing: border-box;
}
.site-header .logo {
    height: 36px;
    width: auto;
    display: block;
    flex-shrink: 0;
}
.header-text {
    font-family: 'Fredoka', sans-serif;
    font-size: 6pt;
    font-weight: 600;
    color: #1e3a5f;
    white-space: nowrap;
    letter-spacing: 0.4px;
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
    .site-header { padding: 0 14px; gap: 10px; height: 56px; }
    .site-header .logo { height: 32px; }
    .eduai-light-scope .page { padding: 20px 14px 50px; }
    .eduai-light-scope .card { padding: 20px; border-radius: 14px; }
    .eduai-light-scope .lesson-title { font-size: 26px; }
    .eduai-light-scope h2 { font-size: 20px; }
}
@media (max-width: 390px) {
    .site-header { gap: 8px; padding: 0 12px; }
    .eduai-light-scope .lesson-meta { gap: 6px; }
    .eduai-light-scope .card { padding: 18px 16px; }
}
@media print {
    .site-header { position: static; }
    .eduai-light-scope .card { box-shadow: none; break-inside: avoid; }
    .eduai-light-scope .btn { display: none !important; }
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

/**
 * The LIGHT translucent header bar: 36px logo + a single-line Fredoka 6pt
 * uppercase strapline. Dynamic grade / term / subject / type trail behind the
 * fixed artwork lead; the line is clamped to ONE line with an ellipsis so it
 * can never wrap or push the 60px bar taller on narrow screens.
 */
export const buildTemplateHeaderHTML = (meta: ContentTemplateMeta = {}): string => {
    const grade = normGrade(meta.grade);
    const term = normTerm(meta.term || (typeof document !== 'undefined' ? currentSATerm() : ''));
    const subject = String(meta.subject || '').trim().toUpperCase();
    const contentType = String(meta.contentType || '').trim().toUpperCase();
    const trail = [grade, term, subject, contentType].filter(Boolean).join(' • ');
    const strapline = trail ? `${EDUAI_TEMPLATE_HEADER_BASE} | ${trail}` : `${EDUAI_TEMPLATE_HEADER_BASE} |`;

    return `
<header class="site-header" style="box-sizing: border-box; display: flex; align-items: center; justify-content: flex-start; gap: 12px; padding: 0 20px; height: 60px; background-color: ${EDUAI_TEMPLATE_COLOURS.headerBg}; border-bottom: 2.5px solid ${EDUAI_TEMPLATE_COLOURS.headerBorder}; width: 100%; opacity: 0.92; page-break-inside: avoid; break-inside: avoid;">
  <img src="${getTemplateLogoSrc()}" alt="EduAI Logo" class="logo" style="height: 36px; width: auto; display: block; flex-shrink: 0;" />
  <span class="header-text" style="font-family: ${LIGHT_HEADING_FONT}; font-size: 8px; font-weight: 600; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; white-space: nowrap; letter-spacing: 0.4px; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">${esc(strapline)}</span>
</header>`.trim();
};

/**
 * The LIGHT navy footer band: the exact artwork line, plus a small muted
 * sub-line preserving the rights / developer / generation / URL chain.
 */
export const buildTemplateFooterHTML = (meta: ContentTemplateMeta = {}): string => {
    const date = esc(meta.date || saToday());
    const contentType = esc((meta.contentType || 'Educational Resource').toUpperCase());
    const school = meta.school ? ` • ${esc(String(meta.school).toUpperCase())}` : '';

    return `
<footer class="site-footer" style="box-sizing: border-box; background-color: ${EDUAI_TEMPLATE_COLOURS.footerBg}; color: ${EDUAI_TEMPLATE_COLOURS.footerText}; text-align: center; font-size: 8pt; padding: 16px 20px; font-family: ${LIGHT_HEADING_FONT}; letter-spacing: 0.3px; line-height: 1.6; page-break-inside: avoid; break-inside: avoid;">
  <div>${esc(EDUAI_TEMPLATE_FOOTER_LINE)}</div>
  <div class="footer-sub" style="font-size: 6.5pt; color: ${EDUAI_TEMPLATE_COLOURS.footerMuted}; letter-spacing: 0.6px; text-transform: uppercase; margin-top: 4px;">${EDUAI_TEMPLATE_RIGHTS_LINE_1} • ${EDUAI_TEMPLATE_RIGHTS_LINE_2} • Generated: ${date} • ${contentType}${school} • ${EDUAI_TEMPLATE_URL}</div>
</footer>`.trim();
};

/**
 * The faded EduAI watermark centred behind the content area. Absolutely
 * positioned (not fixed) so it rasterises identically in html2canvas, print
 * and iframe previews. Content cards are opaque white, so text always stays
 * fully legible over the 0.5-opacity artwork.
 */
export const buildTemplateWatermarkHTML = (): string => `
<img src="${getTemplateLogoSrc()}" alt="" aria-hidden="true" class="watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 75%; max-width: 560px; height: auto; opacity: 0.5; pointer-events: none; z-index: 0;" />`.trim();

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
    if (!title && !gradePill && !subjectPill && !typePill && !termPill) return '';
    const pills = [gradePill, subjectPill, typePill, termPill, meta.capsStatus || 'CAPS Aligned'].filter(Boolean);
    return `
  <h1 class="lesson-title">${esc(title || 'Educational Resource')}</h1>
  ${pills.length ? `<div class="lesson-meta">${pills.map((p) => `<span class="meta-pill">${esc(p)}</span>`).join('')}</div>` : ''}`.trim();
};

/** True when the markup already carries LIGHT (or legacy) template chrome. */
const hasTemplateChrome = (html: string): boolean =>
    /site-header|eduai-template-header|data-eduai-light/i.test(html || '');

/** True when the markup already provides its own LIGHT card structure. */
const hasLightCards = (html: string): boolean =>
    /<article[\s>]|class\s*=\s*["'][^"']*\b(card|lesson-title)\b/i.test(html || '');

/**
 * Wrap generated content in the LIGHT Template v4 chrome:
 * translucent header → watermark + centred 800px page → navy footer.
 * Plain fragments are lifted into an opaque white card (with a title block
 * when metadata is available); fragments that already use LIGHT card
 * structure are kept as-is. Idempotent — already-wrapped markup passes
 * through untouched.
 */
export const wrapWithTemplate = (bodyHtml: string, meta: ContentTemplateMeta = {}): string => {
    const html = String(bodyHtml || '');
    if (hasTemplateChrome(html)) return html;

    const inner = hasLightCards(html)
        ? html
        : `<article class="card">\n${buildTemplateTitleBlockHTML(meta)}\n${html}\n</article>`;

    return `
${buildTemplateStyleHTML()}
${buildTemplateHeaderHTML(meta)}
<div class="eduai-light-scope" style="position: relative; background: ${EDUAI_TEMPLATE_COLOURS.paper}; overflow: hidden;">
  ${buildTemplateWatermarkHTML()}
  <main class="page" style="position: relative; z-index: 1; max-width: 800px; margin: 0 auto; padding: 28px 20px 60px; font-family: ${LIGHT_BODY_FONT}; color: #1e293b; line-height: 1.65; box-sizing: border-box;">
${inner}
  </main>
</div>
${buildTemplateFooterHTML(meta)}`.trim();
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
