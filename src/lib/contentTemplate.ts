/**
 * EduAI Companion — Official Content Template (v1.0)
 *
 * The single source of truth for the branded chrome that wraps EVERY piece of
 * generated content in the app (on-screen previews, print, PDF, HTML and the
 * SA document pipeline).
 *
 * The template reproduces the official EduAI Companion document template:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  GREY GRADIENT HEADER BAND (#bcbdbd)                        │
 *   │   compliance line   (○ logo)   grade / term line            │
 *   │        CONTENT TYPE • SUBJECT • DATE • SA RESOURCE line     │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  WHITE CONTENT AREA with the faded EduAI elephant watermark │
 *   │  …dynamic generated content…                                │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  NAVY FOOTER BAND (#1a3057)                                 │
 *   │   ALL CONTENT RIGHTS RESERVED TO      GENERATED: …          │
 *   │   DEVELOPER: Z MSUTHU (C) 2026        EDUAI-COMPANION.VERCEL.APP │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Everything is plain inline CSS (no Tailwind) so the exact same markup
 * survives: React previews, iframe srcDocs, window.print() documents,
 * html2canvas rasterisation and HTML file downloads.
 */

export interface ContentTemplateMeta {
    /** Document title (used where space allows, e.g. HTML <title>). */
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

/** Template palette — sampled directly from the official template artwork. */
export const EDUAI_TEMPLATE_COLOURS = {
    headerBandTop: '#cfd1d2',
    headerBand: '#bcbdbd',
    headerBandBottom: '#a9aeb4',
    headerText: '#000000',
    headerTextGlow: '#ffffff',
    footerTop: '#1e3559',
    footerBand: '#1a3057',
    footerBottom: '#142640',
    footerText: '#ffffff',
    footerMuted: '#c7d2e4',
    paper: '#ffffff',
} as const;

export const EDUAI_TEMPLATE_URL = 'HTTPS://EDUAI-COMPANION.VERCEL.APP';
export const EDUAI_TEMPLATE_RIGHTS_LINE_1 = 'ALL CONTENT RIGHTS RESERVED TO';
export const EDUAI_TEMPLATE_RIGHTS_LINE_2 = 'DEVELOPER: Z MSUTHU (C) 2026';

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
    const match = raw.match(/(?:grade\s*)?([rR]|\d{1,2})/);
    if (!match) return raw.toUpperCase();
    return `GRADE ${match[1].toUpperCase()}`;
};

/**
 * Bold black uppercase type with the hand-drawn white halo used on the
 * official template header. text-shadow is used instead of
 * -webkit-text-stroke because html2canvas renders it reliably.
 */
const TEMPLATE_TYPE_GLOW = [
    '1px 1px 0 #fff', '-1px -1px 0 #fff', '1px -1px 0 #fff', '-1px 1px 0 #fff',
    '0 1px 0 #fff', '0 -1px 0 #fff', '1px 0 0 #fff', '-1px 0 0 #fff',
    '0 0 3px #fff',
].join(',');

const TEMPLATE_FONT = `'Arial Black', 'Arial Bold', Arial, 'Inter', system-ui, -apple-system, sans-serif`;

/**
 * The grey header band: compliance badges flanking the centred circular logo,
 * with the informational strip (content type • subject • date) underneath —
 * exactly like the official template, with the placeholder text replaced by
 * live CAPS / NPA / term / grade / content-type data.
 */
export const buildTemplateHeaderHTML = (meta: ContentTemplateMeta = {}): string => {
    const caps = esc((meta.capsStatus || 'CAPS Compliant').toUpperCase());
    const npa = esc((meta.npaStatus || 'NPA Compliant (Gr R-12)').toUpperCase());
    const grade = esc(normGrade(meta.grade));
    const term = esc(normTerm(meta.term || (typeof document !== 'undefined' ? currentSATerm() : '')));
    const rightLine1 = [grade, term].filter(Boolean).join(' • ') || 'ALL GRADES • ALL TERMS';
    const contentType = esc((meta.contentType || 'Educational Resource').toUpperCase());
    const subject = esc((meta.subject || 'General').toUpperCase());
    const date = esc(meta.date || saToday());

    return `
<div class="eduai-template-header" style="box-sizing: border-box; width: 100%; position: relative; overflow: visible; background: linear-gradient(180deg, ${EDUAI_TEMPLATE_COLOURS.headerBandTop} 0%, ${EDUAI_TEMPLATE_COLOURS.headerBand} 55%, ${EDUAI_TEMPLATE_COLOURS.headerBandBottom} 100%); border-bottom: 3px solid #8f979f; padding: 12px 18px 10px; font-family: ${TEMPLATE_FONT}; page-break-inside: avoid; break-inside: avoid;">
  <div style="display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%;">
    <div style="flex: 1; min-width: 0; text-align: right;">
      <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; text-transform: uppercase; line-height: 1.25; text-shadow: ${TEMPLATE_TYPE_GLOW};">✓ ${caps}</div>
      <div style="font-size: 10px; font-weight: 900; letter-spacing: 0.6px; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; text-transform: uppercase; line-height: 1.4; opacity: 0.92; text-shadow: ${TEMPLATE_TYPE_GLOW};">✓ ${npa}</div>
    </div>
    <div style="flex: 0 0 auto; width: 58px; height: 58px; border-radius: 50%; background: #ffffff; padding: 3px; box-shadow: 0 3px 8px rgba(15, 23, 42, 0.35); margin: -22px 0 -6px; position: relative; z-index: 2; box-sizing: border-box;">
      <img src="${getTemplateLogoSrc()}" alt="EduAI Companion" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; display: block;" />
    </div>
    <div style="flex: 1; min-width: 0; text-align: left;">
      <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; text-transform: uppercase; line-height: 1.25; text-shadow: ${TEMPLATE_TYPE_GLOW};">${rightLine1}</div>
      <div style="font-size: 10px; font-weight: 900; letter-spacing: 0.6px; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; text-transform: uppercase; line-height: 1.4; opacity: 0.92; text-shadow: ${TEMPLATE_TYPE_GLOW};">POPIA SECURE ✓ SIAS INCLUSIVE</div>
    </div>
  </div>
  <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(0, 0, 0, 0.14); text-align: center; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; text-transform: uppercase; line-height: 1.4; text-shadow: ${TEMPLATE_TYPE_GLOW};">
    ${contentType} • ${subject} • ${date} • SOUTH AFRICAN EDUCATIONAL RESOURCE
  </div>
</div>`.trim();
};

/**
 * The navy footer band: content rights (left) and generation data + official
 * URL (right), identical in style to the official template footer.
 */
export const buildTemplateFooterHTML = (meta: ContentTemplateMeta = {}): string => {
    const date = esc(meta.date || saToday());
    const contentType = esc((meta.contentType || 'Educational Resource').toUpperCase());

    return `
<div class="eduai-template-footer" style="box-sizing: border-box; width: 100%; margin-top: 24px; background: linear-gradient(180deg, ${EDUAI_TEMPLATE_COLOURS.footerTop} 0%, ${EDUAI_TEMPLATE_COLOURS.footerBand} 55%, ${EDUAI_TEMPLATE_COLOURS.footerBottom} 100%); border-top: 3px solid #8f979f; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; font-family: ${TEMPLATE_FONT}; color: ${EDUAI_TEMPLATE_COLOURS.footerText}; page-break-inside: avoid; break-inside: avoid;">
  <div style="text-align: left; line-height: 1.45;">
    <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">${EDUAI_TEMPLATE_RIGHTS_LINE_1}</div>
    <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">${EDUAI_TEMPLATE_RIGHTS_LINE_2}</div>
  </div>
  <div style="text-align: right; line-height: 1.45; min-width: 0;">
    <div style="font-size: 8px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: ${EDUAI_TEMPLATE_COLOURS.footerMuted};">Generated: ${date} • ${contentType}</div>
    <div style="font-size: 10px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase;">${EDUAI_TEMPLATE_URL}</div>
  </div>
</div>`.trim();
};

/**
 * The faded EduAI elephant watermark that sits behind the content area of
 * every page, exactly like the official template.
 */
export const buildTemplateWatermarkHTML = (): string => `
<div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; pointer-events: none; z-index: 0; min-height: 260px;">
  <img src="${getTemplateLogoSrc()}" alt="" style="width: 72%; max-width: 560px; opacity: 0.14; object-fit: contain; filter: saturate(0.9);" />
</div>`.trim();

/**
 * Wrap generated content in the official EduAI Companion template:
 * header band → watermark + content → navy footer band.
 */
export const wrapWithTemplate = (bodyHtml: string, meta: ContentTemplateMeta = {}): string => `
${buildTemplateHeaderHTML(meta)}
<div class="eduai-template-body" style="position: relative; background: ${EDUAI_TEMPLATE_COLOURS.paper}; overflow: hidden;">
  ${buildTemplateWatermarkHTML()}
  <div style="position: relative; z-index: 1;">
${bodyHtml || ''}
  </div>
</div>
${buildTemplateFooterHTML(meta)}`.trim();

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
