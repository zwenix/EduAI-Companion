/**
 * EduAI Companion — LIGHT Template v5 (official, single source of truth)
 *
 * The branded chrome that wraps EVERY piece of generated content in the app
 * (on-screen previews, print, PDF, HTML and the SA document pipeline).
 *
 * Source artwork:
 *   docs/Decrease-the-size-of-the-header-banner-by-30-or-try-any-method-to-fit-all-text-in-the-header-into-1- (4).html
 *   ("EduAI Companion 2026 | LIGHT Template v5")
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  PAGE HEADER (26px, sticky) — VERY LIGHT BLUE, 70% CLEAR    │
 *   │   #dbeafe → #bfdbfe at 30% opacity (70% transparent), the   │
 *   │   brand only:   EDUAI COMPANION 2026 | OFFICIAL …           │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  WHITE PAGE (max 800px, centred) over a faded watermark     │
 *   │   ┌─ card ─────────────────────────────────────────────┐   │
 *   │   │ ▓ ONE DOCUMENT BANNER ▓ vertical TWO-COLOUR        │   │
 *   │   │   gradient (navy #1e3a5f → blue #2563eb) holding    │   │
 *   │   │   EVERYTHING exactly once:                          │   │
 *   │   │     lesson title                                    │   │
 *   │   │     grade · subject · content type · term · date     │   │
 *   │   │     school · teacher · learner (when supplied)       │   │
 *   │   │     CAPS code + 🇿🇦/CAPS/NPA/POPIA/SIAS/WP6 labels   │   │
 *   │   │ …dynamic generated content…                         │   │
 *   │   └────────────────────────────────────────────────────┘   │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  NAVY FOOTER BAND (#1e3a5f, centred, 8pt)                  │
 *   │   © 2026 EduAI Companion | CAPS Compliant Educational      │
 *   │   Resource | Developed for South African Educators | All    │
 *   │   Rights Reserved to Developer: Z MSUTHU © 2026 |           │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Three guarantees this module owns (and the reason it exists):
 *  1. ONCE — ONE banner per document. Title, labels, grade/subject/term/type,
 *     date, school/teacher and the compliance data live inside that single
 *     banner; the page header above it carries the brand only. Model-authored
 *     copies (badges, stamp rows, banner repeats, repeated title blocks,
 *     plain-text status lines) are stripped before the banner is rendered.
 *  2. GRADIENT — no top banner is ever a single solid colour. The document
 *     banner is a TWO-COLOUR VERTICAL gradient whose colours are chosen for
 *     the content type (see `bannerPalettes.ts`), and every model-authored
 *     banner/hero/header is repainted with the same document gradient.
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

import {
    BANNER_PALETTES,
    type BannerPalette,
    type BannerPaletteId,
    bannerGradientFor,
    bannerPaletteFor,
    isBannerGradient,
} from './bannerPalettes';

export {
    BANNER_PALETTES,
    BANNER_PALETTE_IDS,
    BANNER_GRADIENT_PATTERN,
    DEFAULT_BANNER_PALETTE_ID,
    bannerGradientFor,
    bannerPaletteFor,
    buildBannerGradient,
    contrastWithWhite,
    isBannerGradient,
    isBannerPaletteId,
    isKnownBannerGradient,
} from './bannerPalettes';
export type { BannerPalette, BannerPaletteId } from './bannerPalettes';

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
    /** Optional school name — rendered as a pill in the single banner. */
    school?: string;
    /** Optional teacher name — rendered as a pill in the single banner. */
    teacher?: string;
    /** Optional learner name — rendered as a pill in the single banner. */
    learner?: string;
    /** Optional CAPS reference text (the SA pipeline's curriculum reference). */
    capsReference?: string;
    /** Optional ATP week (the SA pipeline's annual teaching plan week). */
    atpWeek?: string;
    /** Extra banner pills (phase, duration, marks, Bloom's …), pre-escaped. */
    extraPills?: string[];
    /** Extra banner footnotes (Bloom's distribution …), pre-escaped. */
    extraNotes?: string[];
    /**
     * Explicit banner palette id (`worksheet`, `assessment`, `certificate`, …).
     * Normally omitted — the palette is derived from `contentType` — but it
     * lets a caller pin the colours for a document whose type is ambiguous.
     */
    palette?: BannerPaletteId | string;
}

/**
 * Every generated document owns exactly ONE top banner: the document banner.
 * Its background is always a TWO-COLOUR **VERTICAL** gradient and never a
 * solid block of one colour — and the two colours are chosen for the kind of
 * content being generated (bright, dynamic pairings: worksheets get burnt
 * orange → magenta, marking memos green → teal, certificates violet → gold,
 * posters fuchsia → burnt orange, Foundation Phase packs pink → azure …).
 * See `bannerPalettes.ts` for the full table and `bannerGradientFor()` for the
 * resolver.
 *
 * This constant is the **brand fallback** — the navy → azure gradient used for
 * content whose type cannot be recognised (and by callers that genuinely want
 * brand colours):
 *
 *     linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%)
 *
 * The page header above the banner is chrome, not a banner: a very light blue
 * wash (#dbeafe → #bfdbfe) at 70% transparency, so the content behind it stays
 * faintly visible while the bar keeps the brand on screen.
 */
export const EDUAI_BANNER_GRADIENT = BANNER_PALETTES.brand.gradient;

/** Very light blue (#dbeafe) at 70% transparency — the page-header tint. */
export const EDUAI_HEADER_TINT = 'rgba(219, 234, 254, 0.30)';
/** Second very light blue (#bfdbfe) at 70% transparency — gradient end stop. */
export const EDUAI_HEADER_TINT_DEEP = 'rgba(191, 219, 254, 0.30)';
/**
 * Page-header wash: the same very light blue twice (70% transparent) so the
 * bar is a two-colour gradient like every other band, never a flat fill.
 */
export const EDUAI_HEADER_GRADIENT = `linear-gradient(180deg, ${EDUAI_HEADER_TINT} 0%, ${EDUAI_HEADER_TINT_DEEP} 100%)`;

/** LIGHT Template v5 palette — sampled directly from the template artwork. */
export const EDUAI_TEMPLATE_COLOURS = {
    navy: '#1e3a5f',
    accent: '#2563eb',
    accentLight: '#3b82f6',
    // Very light blue @ 70% transparency: the page header the artwork calls
    // for, written as a two-stop vertical wash so it is never a solid bar.
    headerGradient: EDUAI_HEADER_GRADIENT,
    headerTint: EDUAI_HEADER_TINT,
    headerBorder: 'rgba(147,197,253,0.55)',
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

/**
 * Fixed page-header strapline — BRAND ONLY. Document data (grade, term,
 * subject, content type, date), the CAPS code and the compliance labels have
 * exactly one home: the document banner. Repeating them in the header would
 * duplicate the same information twice at the top of every page and eat the
 * vertical space that belongs to real content.
 */
export const EDUAI_TEMPLATE_HEADER_BASE = 'EDUAI COMPANION 2026 | OFFICIAL EDUCATIONAL RESOURCE';
/** Canonical footer text for every generated/exported educational resource. */
export const EDUAI_TEMPLATE_FOOTER_LINE =
    '© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators | All Rights Reserved to Developer: Z MSUTHU © 2026 |';

/**
 * The ONE banner is rendered by the host template; it is the only place the
 * CAPS code and these labels are written. AI output is cleaned of its own
 * badges, stamp rows and repeated title/meta blocks before this banner is
 * added, which prevents the same labels from appearing in the document body,
 * header and footer.
 */
export const EDUAI_COMPLIANCE_LABELS =
    '🇿🇦 ✅ CAPS Aligned✅ NPA Compliant✅ POPIA Compliant (2026)✅ SIAS Level 1 Inclusive✅ WP6 Differentiated';

const LIGHT_HEADING_FONT = `'Fredoka', 'Quicksand', system-ui, -apple-system, sans-serif`;
const LIGHT_BODY_FONT = `'Inter', system-ui, -apple-system, sans-serif`;

/**
 * LIGHT Template v5 stylesheet. Chrome selectors are global (collision-free);
 * every content selector is scoped under `.eduai-light-scope`.
 */
export const EDUAI_LIGHT_CSS = `
/* ── EduAI LIGHT Template v5 ── */
.site-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    padding: 0 10px;
    height: 26px;
    /* VERY LIGHT BLUE at 70% transparency (#dbeafe → #bfdbfe, alpha .30).
       Two stops, so the bar is a gradient like every other band in the
       template — never a solid fill. */
    background: ${EDUAI_HEADER_GRADIENT};
    background-image: ${EDUAI_HEADER_GRADIENT};
    background-color: ${EDUAI_HEADER_TINT};
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid ${EDUAI_TEMPLATE_COLOURS.headerBorder};
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
    opacity: 0.5;
}
.header-text {
    font-family: 'Fredoka', sans-serif;
    /* Brand-only strapline: the single document banner below owns the title,
       grade, subject, term, type, date and compliance data. */
    font-size: clamp(7px, 1.05vw, 9px);
    font-weight: 600;
    color: #1e3a5f;
    opacity: 0.78;
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
/* ── THE single document banner ──
   Title + every metadata pill + the CAPS reference and compliance labels live
   in this ONE band, so nothing at the top of a document is ever repeated. */
.eduai-compliance-banner {
    display: block;
    width: 100%;
    margin: 0 0 18px;
    padding: 14px 16px;
    border-radius: 10px;
    /* TWO-COLOUR VERTICAL GRADIENT — never a solid fill. The colours come
       from the document's content-type palette, published as a scoped custom
       property by wrapWithTemplate(); the brand pair is the fallback. */
    background: var(--eduai-banner-gradient, ${EDUAI_BANNER_GRADIENT});
    background-image: var(--eduai-banner-gradient, ${EDUAI_BANNER_GRADIENT});
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.45);
    box-shadow: 0 3px 12px rgba(15,23,42,0.22);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.1px;
    text-align: left;
    overflow-wrap: anywhere;
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.eduai-compliance-banner strong { font-weight: 800; }
/* Document title inside the banner. */
.eduai-light-scope .eduai-compliance-banner .lesson-title {
    font-family: 'Fredoka', sans-serif;
    font-size: clamp(19px, 3vw, 27px);
    font-weight: 700;
    line-height: 1.18;
    color: #ffffff;
    margin: 0 0 8px;
}
/* Metadata pills (grade · subject · type · term · date · school · teacher). */
.eduai-light-scope .eduai-compliance-banner .lesson-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin: 0 0 10px;
    color: #e2e8f0;
    font-size: 11px;
}
.eduai-light-scope .eduai-compliance-banner .meta-pill {
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.34);
    color: #ffffff;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 600;
    white-space: nowrap;
}
/* CAPS reference + 🇿🇦/CAPS/NPA/POPIA/SIAS/WP6 labels — written once, here. */
.eduai-compliance-banner .eduai-doc-compliance {
    display: block;
    border-top: 1px solid rgba(255,255,255,0.28);
    padding-top: 8px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.5;
    color: #ffffff;
}
.eduai-compliance-banner .eduai-doc-compliance .eduai-caps-code {
    font-weight: 800;
    letter-spacing: 0.2px;
}
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
/* When the banner opens a card it is the document's cover band: flush with the
   card's top edge and rounded to match, so no white gap is wasted above it. */
.eduai-light-scope .card > .eduai-compliance-banner:first-child {
    margin-top: -28px !important;
    margin-bottom: 20px !important;
    border-radius: 15px 15px 10px 10px;
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
   their top/header banners the document's own two-colour palette without
   touching ordinary cards and body sections. */
.eduai-light-scope > .page > article > header:not(.site-header),
.eduai-light-scope header:not(.site-header),
.eduai-light-scope .content-banner,
.eduai-light-scope .top-banner,
.eduai-light-scope .header-banner,
.eduai-light-scope .banner,
.eduai-light-scope [class*="banner"] {
    background: var(--eduai-banner-gradient, ${EDUAI_BANNER_GRADIENT}) !important;
    background-image: var(--eduai-banner-gradient, ${EDUAI_BANNER_GRADIENT}) !important;
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
    .eduai-light-scope .card > .eduai-compliance-banner:first-child { margin-top: -20px !important; border-radius: 13px 13px 10px 10px; }
    .eduai-light-scope .page > .eduai-compliance-banner { width: calc(100% + 28px) !important; margin-left: -14px !important; margin-right: -14px !important; }
    .eduai-light-scope .lesson-title { font-size: 26px; }
    .eduai-light-scope .eduai-compliance-banner .lesson-title { font-size: clamp(17px, 5.2vw, 22px); }
    .eduai-compliance-banner { font-size: 10px; padding: 10px 11px; }
    .eduai-light-scope .eduai-compliance-banner .lesson-meta { gap: 6px; font-size: 10px; }
    .eduai-light-scope h2 { font-size: 20px; }
}
@media (max-width: 390px) {
    .site-header { gap: 4px; padding: 0 6px; height: 21px; }
    .site-header .logo { height: 12px; }
    .header-text { font-size: clamp(6px, 1.35vw, 7px); }
    .eduai-light-scope .lesson-meta { gap: 6px; }
    .eduai-light-scope .card { padding: 18px 16px; }
    .eduai-light-scope .card > .eduai-compliance-banner { width: calc(100% + 36px) !important; margin-left: -18px !important; margin-right: -18px !important; }
    .eduai-light-scope .card > .eduai-compliance-banner:first-child { margin-top: -18px !important; }
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
    `<style data-eduai-light="v5">\n${EDUAI_LIGHT_CSS}\n</style>`;

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
 * The LIGHT page header: a 15px logo in a 26px VERY LIGHT BLUE bar that is
 * 70% transparent (#dbeafe → #bfdbfe at alpha .30), so content scrolling
 * underneath stays faintly visible.
 *
 * The bar is BRAND ONLY — grade, term, subject, content type, date and every
 * compliance label belong to the single document banner below it, and writing
 * them here as well would duplicate the same information twice at the top of
 * every page. Clamped to ONE line with an ellipsis so it can never wrap or
 * push the bar taller on narrow screens.
 */
export const buildTemplateHeaderHTML = (_meta: ContentTemplateMeta = {}): string => {
    const strapline = EDUAI_TEMPLATE_HEADER_BASE;

    return `
<header class="site-header" style="box-sizing: border-box; display: flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 0 10px; height: 26px; background: ${EDUAI_HEADER_GRADIENT}; background-image: ${EDUAI_HEADER_GRADIENT}; background-color: ${EDUAI_HEADER_TINT}; -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); border-bottom: 1px solid ${EDUAI_TEMPLATE_COLOURS.headerBorder}; box-shadow: none; width: 100%; page-break-inside: avoid; break-inside: avoid; min-width: 0;">
  <img src="${getTemplateLogoSrc()}" alt="EduAI Logo" class="logo" style="height: 15px; width: auto; display: block; flex-shrink: 0; opacity: 0.5;" />
  <span class="header-text" style="font-family: ${LIGHT_HEADING_FONT}; font-size: clamp(7px, 1.05vw, 9px); font-weight: 600; color: ${EDUAI_TEMPLATE_COLOURS.headerText}; opacity: 0.78; -webkit-print-color-adjust: exact; print-color-adjust: exact; white-space: nowrap; letter-spacing: 0.3px; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;">${esc(strapline)}</span>
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

/** Acronyms that keep their capitals when a pill is label-cased. */
const PILL_ACRONYMS = new Set([
    'CAPS', 'NPA', 'POPIA', 'SIAS', 'WP6', 'DBE', 'SBA', 'FET', 'FP', 'IP', 'SP',
    'EMS', 'HL', 'FAL', 'SAL', 'LS', 'NS', 'SS', 'LO', 'ICT', 'ISP', 'ILP', 'ATP',
]);

/** "worksheet" → "Worksheet"; anything already capitalised is left alone. */
const labelCase = (value?: string): string => {
    const raw = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!raw || /[A-Z]/.test(raw)) return raw;
    return raw.replace(/\b[a-z][a-z0-9]*\b/g, (word) =>
        PILL_ACRONYMS.has(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1));
};

/** Every date in the banner is South African DD/MM/YYYY, whatever came in. */
const normaliseDate = (value?: string): string => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (iso) return `${iso[3].padStart(2, '0')}/${iso[2].padStart(2, '0')}/${iso[1]}`;
    const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmy) return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
    return raw;
};

/**
 * Every value the single banner displays, deduplicated and ordered:
 * grade · subject · content type · term · date · school · teacher · learner,
 * followed by any caller-supplied extras. Nothing here is written anywhere
 * else in the document, which is what keeps the top of the page duplicate-free.
 */
const buildBannerPills = (meta: ContentTemplateMeta): string[] => {
    const pills: string[] = [];
    const push = (value?: string) => {
        const label = String(value ?? '').replace(/\s+/g, ' ').trim();
        if (!label) return;
        // Never show the same pill twice (e.g. a subject that equals the type).
        if (pills.some((existing) => existing.toLowerCase() === label.toLowerCase())) return;
        pills.push(label);
    };

    push(pillGrade(meta.grade));
    push(labelCase(meta.subject));
    push(labelCase(meta.contentType));
    push(pillTerm(meta.term));
    push(normaliseDate(meta.date) || saToday());
    if (meta.school) push(`School: ${meta.school}`);
    if (meta.teacher) push(`Teacher: ${meta.teacher}`);
    if (meta.learner) push(`Learner: ${meta.learner}`);
    (meta.extraPills || []).forEach(push);
    return pills;
};

/** The banner's title: the document title, else the type/subject pairing. */
const bannerTitle = (meta: ContentTemplateMeta): string =>
    String(meta.title || '').trim()
    || [meta.contentType, meta.subject].filter(Boolean).join(' • ')
    || 'Educational Resource';

/**
 * THE single document banner — the only banner in a generated document.
 *
 * Everything a reader (or an auditor) needs sits inside this one band,
 * exactly once: the title, the grade / subject / content-type / term / date
 * pills, school · teacher · learner when the caller supplies them, any extra
 * pills, and the CAPS code with the 🇿🇦/CAPS/NPA/POPIA/SIAS/WP6 labels.
 *
 * The background is a TWO-COLOUR VERTICAL GRADIENT at 180deg, picked from
 * `bannerPalettes.ts` for the document's content type — bright, dynamic
 * pairings (orange → magenta for worksheets, green → teal for memos, violet →
 * gold for certificates …) with the brand navy → azure pair as the fallback
 * for unrecognised types. It is written inline, together with the
 * `--eduai-banner-gradient` custom property, so the exact colours survive
 * iframe previews, print, html2canvas rasterisation and downloads, and so the
 * stylesheet safety nets repaint any stray model banner in the same palette.
 *
 * The class name stays `eduai-compliance-banner` because the rest of the
 * pipeline (chrome stripping, single-copy verification, CSS safety nets)
 * keys off it.
 */
export const buildTemplateComplianceBannerHTML = (meta: ContentTemplateMeta = {}): string => {
    const title = bannerTitle(meta);
    // One palette per document, chosen from the content type (or pinned by an
    // explicit `meta.palette`). Never a solid fill, never the same colours for
    // every kind of content.
    const palette: BannerPalette = bannerPaletteFor(meta.contentType, meta.palette);
    const pills = buildBannerPills(meta);
    const capsCode = buildCAPSCode(meta);
    const capsReference = String(meta.capsReference || '').trim();
    const atpWeek = String(meta.atpWeek || '').trim();
    const notes = (meta.extraNotes || []).map((note) => String(note || '').trim()).filter(Boolean);

    const referenceTrail = [
        capsCode ? `CAPS Code:${capsCode}` : '',
        capsReference ? `CAPS: ${capsReference}` : '',
        atpWeek ? `ATP: ${atpWeek}` : '',
    ].filter(Boolean).join(' | ');

    return `
<section class="eduai-compliance-banner" data-eduai-palette="${palette.id}" aria-label="Document details and South African compliance" style="display:block; width:100%; box-sizing:border-box; --eduai-banner-gradient: ${palette.gradient}; background: ${palette.gradient}; background-image: ${palette.gradient}; color: #ffffff; border: 1px solid rgba(255,255,255,0.45); border-radius: 10px; padding: 14px 16px; margin: 0 0 20px; font-family: ${LIGHT_BODY_FONT}; font-size: 11px; font-weight: 700; line-height: 1.5; overflow-wrap: anywhere; page-break-inside: avoid; break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
  <h1 class="lesson-title" style="font-family: ${LIGHT_HEADING_FONT}; font-size: clamp(19px, 3vw, 27px); font-weight: 700; line-height: 1.18; color: #ffffff; margin: 0 0 8px;">${esc(title)}</h1>
  ${pills.length ? `<div class="lesson-meta" style="display:flex; flex-wrap:wrap; gap:7px; margin:0 0 10px; color:#e2e8f0;">${pills.map((pill) => `<span class="meta-pill" style="background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.34); color:#ffffff; padding:3px 10px; border-radius:999px; font-weight:600; white-space:nowrap;">${esc(pill)}</span>`).join('')}</div>` : ''}
  <div class="eduai-doc-compliance" style="display:block; border-top:1px solid rgba(255,255,255,0.28); padding-top:8px; font-size:11px; font-weight:700; line-height:1.5; color:#ffffff;"><span class="eduai-caps-code" style="font-weight:800; letter-spacing:0.2px;">${esc(referenceTrail)}</span> ${esc(EDUAI_COMPLIANCE_LABELS)}${notes.length ? ` <span style="display:block; margin-top:4px; font-weight:600; color:rgba(255,255,255,0.86);">${notes.map((note) => esc(note)).join(' • ')}</span>` : ''}</div>
</section>`.trim();
};

/**
 * Kept for backwards compatibility: the title block no longer exists as a
 * separate band, so it simply renders the single document banner.
 */
export const buildTemplateTitleBlockHTML = (meta: ContentTemplateMeta = {}): string =>
    buildTemplateComplianceBannerHTML(meta);

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
 * v5 style block, exactly ONE document banner (which carries the title, every
 * metadata pill and the compliance line), exactly one footer band and each
 * status label exactly once. Such documents pass through untouched, so
 * re-exporting the print-preview paper stays byte-stable. Anything older — or
 * model output that copied our chrome — is normalised by wrapWithTemplate.
 */
export const isCurrentTemplateOutput = (html: string): boolean => {
    const source = String(html || '');
    if (!/data-eduai-light="v5"/.test(source)) return false;
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
    // Host-owned title blocks from ANY template revision: the title and the
    // grade/subject/type/term pills now live inside the single document banner,
    // so leaving a second title block behind would duplicate them (v4 and
    // older), and the legacy SA shell's own `.doc-title-block` is unwrapped so
    // its heading/meta row cannot survive next to the banner either. The text
    // is harvested by harvestMetaFromChrome() BEFORE this runs.
    out = removeElementsByClass(out, 'lesson-meta');
    out = removeElementsByClass(out, 'doc-meta');
    out = removeElementsByClass(out, 'lesson-title');
    out = unwrapElementsByClass(out, 'doc-title-block');
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

/** Strip emoji/leading marks so a pill's text can be classified. */
const pillText = (value: string): string =>
    decodeEntities(String(value || '').replace(/<[^>]+>/g, ' '))
        .replace(/[\u{1F1E6}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE0F}\u{2600}-\u{26FF}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/** Content-type words that appear as pills in generated documents. */
const CONTENT_TYPE_HINT = /^(worksheet|lesson\s*plan|memo(?:randum)?|rubric|assessment|test|exam(?:ination)?|poster|infographic|mind\s*map|notice|letter|admin(?:istrative)?(?:\s*document)?|homework|revision|activity|report|portfolio|notes?)\b/i;

/**
 * Recover metadata from chrome that is about to be discarded, so re-wrapping an
 * archived document never loses the grade/term/subject/type its header (or its
 * older title block) carried — or the CAPS code its banner displayed. Explicit
 * caller metadata always wins; every harvested value is re-rendered inside the
 * single document banner, never as a second band.
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

    // Legacy straplines (v4 and older) carried "… | GRADE 5 • TERM 2 • MATHS".
    // The v5 strapline is brand-only, so it is only parsed when it actually
    // has a "•"-separated document trail behind the brand lead.
    const strapline = source.match(/class\s*=\s*["'][^"']*\bheader-text\b[^"']*["'][^>]*>([\s\S]*?)<\/[a-z]/i)?.[1];
    if (strapline && decodeEntities(strapline).includes('•')) {
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

    // Title-block pills — the v4 `.lesson-meta` row, the SA `.doc-meta` row or
    // the pills inside the v5 banner itself. Classifying them is what lets an
    // archived document keep its grade/term/subject/type/date/school in the
    // single banner after the old block has been stripped.
    const pillRows = [
        ...source.matchAll(/<([a-z][\w:-]*)\b[^>]*class\s*=\s*["'][^"']*\b(?:lesson-meta|doc-meta)\b[^"']*["'][^>]*>([\s\S]*?)<\/\1\s*>/gi),
    ].map((match) => match[2]);
    const pills = pillRows
        .flatMap((row) => [...row.matchAll(/<(?:span|div|li|p|strong)\b[^>]*>([\s\S]*?)<\/(?:span|div|li|p|strong)\s*>/gi)].map((m) => pillText(m[1])))
        .filter(Boolean);

    for (const pill of pills) {
        // Compliance stamps are never metadata — they are re-rendered by the
        // banner from EDUAI_COMPLIANCE_LABELS.
        if (/CAPS|NPA|POPIA|SIAS|WP6|compliant|aligned|inclusive|differentiated/i.test(pill)) continue;
        const grade = pill.match(/^grade\s*([rR]|\d{1,2})/i);
        if (grade && !harvested.grade) { harvested.grade = grade[1].toUpperCase(); continue; }
        const term = pill.match(/^term\s*([1-4])/i);
        if (term && !harvested.term) { harvested.term = `Term ${term[1]}`; continue; }
        const date = pill.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        if (date && !harvested.date) { harvested.date = date[1]; continue; }
        const school = pill.match(/^(?:school|skool)\s*:?\s*(.+)$/i);
        if (school && !harvested.school) { harvested.school = school[1].trim(); continue; }
        const teacher = pill.match(/^(?:teacher|educator)\s*:?\s*(.+)$/i);
        if (teacher && !harvested.teacher) { harvested.teacher = teacher[1].trim(); continue; }
        const learner = pill.match(/^(?:learner|student|name)\s*:?\s*(.+)$/i);
        if (learner && !harvested.learner) { harvested.learner = learner[1].trim(); continue; }
        if (CONTENT_TYPE_HINT.test(pill) && !harvested.contentType) {
            harvested.contentType = titleCaseWords(pill);
            continue;
        }
        if (!harvested.subject) harvested.subject = titleCaseWords(pill);
    }

    return harvested;
};

/** Merge recovered chrome metadata with caller metadata (caller wins). */
export const mergeMeta = (base: ContentTemplateMeta, override: ContentTemplateMeta): ContentTemplateMeta => {
    const merged = { ...base } as Record<string, unknown>;
    (Object.keys(override) as (keyof ContentTemplateMeta)[]).forEach((key) => {
        const value = override[key];
        if (value === undefined) return;
        // List-valued slots (extraPills / extraNotes) are copied verbatim.
        if (Array.isArray(value)) {
            if (value.length) merged[key] = value;
            return;
        }
        if (String(value).trim() !== '') merged[key] = value;
    });
    return merged as ContentTemplateMeta;
};

/**
 * Class/id fragments that identify a model-authored banner container. Kept to
 * genuine band names so ordinary card headers (`.activity-header`) and section
 * headings are never re-painted as banners.
 */
const BANNER_HINT = /\b(?:banner|hero|masthead|jumbotron|title-?block|doc-?title|page-?title|cover(?:-head)?|top-?bar|title-?bar|letterhead|school-?header|doc-?header|caps-?bar|reference-?bar)\b/i;

/**
 * Inline declarations that force the document's two-colour palette gradient.
 * Inline + !important beats Tailwind utilities and model CSS everywhere the
 * document is rendered: browser, iframe preview, html2canvas rasterisation and
 * Chromium PDF.
 */
const bannerGradientDeclarations = (gradient: string): string =>
    `background:${gradient} !important;background-image:${gradient} !important;color:#ffffff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;`;

const withGradientStyle = (attrs: string, gradient: string): string => {
    const BANNER_GRADIENT_DECLARATIONS = bannerGradientDeclarations(gradient);
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
 * Convert every solid top banner in generated content to the document's
 * two-colour gradient. Model output uses dozens of banner spellings
 * (`<header>`, `.banner`, `.hero`, `.doc-title`, inline `background:#007749`,
 * Tailwind `bg-emerald-700`), so the gradient is written inline on each of them
 * instead of relying on a class name surviving. The host's own compliance
 * banner and the compact document header are left exactly as built.
 *
 * @param gradient The document's palette gradient — defaults to the brand
 *                 navy → azure pair for callers that have no content type.
 */
export const applyBannerGradients = (html: string, gradient: string = EDUAI_BANNER_GRADIENT): string => {
    const source = String(html || '');
    const bannerGradient = isBannerGradient(gradient) ? gradient : EDUAI_BANNER_GRADIENT;
    return source.replace(/<(?!\/)([a-z][\w:-]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
        if (/^(style|script|svg|path|circle|rect|line|polygon|polyline|ellipse|g|defs|use|text|tspan)$/i.test(tag)) return match;
        if (/site-header|header-text|eduai-compliance-banner/i.test(attrs)) return match;
        const isHeaderTag = /^header$/i.test(tag);
        const classOrId = `${attrs.match(/class\s*=\s*["'][^"']*["']/i)?.[0] ?? ''} ${attrs.match(/id\s*=\s*["'][^"']*["']/i)?.[0] ?? ''}`;
        if (!isHeaderTag && !BANNER_HINT.test(classOrId)) return match;
        return `<${tag}${withGradientStyle(attrs, bannerGradient)}>`;
    });
};

/** True when the markup already provides its own LIGHT card structure. */
const hasLightCards = (html: string): boolean =>
    /<article[\s>]|class\s*=\s*["'][^"']*\b(card|lesson-title)\b/i.test(html || '');

/** Lower-case, punctuation-free text used to compare headings with the title. */
const normaliseForCompare = (value: string): string =>
    decodeEntities(String(value || '').replace(/<[^>]+>/g, ' '))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/** Tags that never take a closing partner, so they cannot nest the scan. */
const VOID_TAGS = /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|path|circle|rect|line|polyline|polygon|ellipse|use)$/i;

interface LeadingElement {
    /** Index of the opening tag. */
    start: number;
    /** Index just after the matching closing tag. */
    end: number;
    /** Index just after the opening tag. */
    innerStart: number;
    /** Index of the matching closing tag. */
    innerEnd: number;
    tag: string;
    attrs: string;
}

/** The first element of a fragment, with its depth-counted span (null if text). */
const firstElement = (source: string): LeadingElement | null => {
    const lead = source.length - source.replace(/^\s+/, '').length;
    const open = /^<([a-z][\w:-]*)\b([^>]*)>/i.exec(source.slice(lead));
    if (!open) return null;
    const tag = open[1];
    const attrs = open[2];
    const start = lead;
    const innerStart = lead + open[0].length;
    if (/\/>\s*$/.test(open[0]) || VOID_TAGS.test(tag)) {
        return { start, end: innerStart, innerStart, innerEnd: innerStart, tag, attrs };
    }
    const scan = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi');
    scan.lastIndex = innerStart;
    let depth = 1;
    let match: RegExpExecArray | null;
    while ((match = scan.exec(source)) !== null) {
        if (match[0].startsWith('</')) {
            depth -= 1;
            if (depth === 0) {
                return { start, end: match.index + match[0].length, innerStart, innerEnd: match.index, tag, attrs };
            }
        } else if (!/\/>\s*$/.test(match[0]) && !VOID_TAGS.test((match[0].match(/^<([a-z][\w:-]*)/i) || [])[1] || '')) {
            depth += 1;
        }
    }
    return null;
};

/**
 * Remove a model-authored banner at the very start of the content when it
 * repeats what the single document banner already says.
 *
 * Models love to open a document with their own `<header class="banner">`
 * carrying the title, the grade/term/subject row and (before sanitising) the
 * compliance stamps. Leaving it in place would put TWO banners with the same
 * information at the top of every page — exactly the duplication (and wasted
 * vertical space) the template must prevent. The block is removed only when it
 * is the first element AND its text repeats the banner's data: the document
 * title, at least two of the banner's pills, or nothing at all once the stamps
 * have been stripped. Ordinary content banners further down are untouched.
 */
export const stripLeadingDuplicateBanner = (html: string, meta: ContentTemplateMeta = {}): string => {
    const source = String(html || '');
    const element = firstElement(source);
    if (!element) return source;
    const classOrId = `${element.attrs.match(/class\s*=\s*["'][^"']*["']/i)?.[0] ?? ''} ${element.attrs.match(/id\s*=\s*["'][^"']*["']/i)?.[0] ?? ''}`;
    const painted = /background(-color|-image)?\s*:/i.test(element.attrs);
    if (!/^header$/i.test(element.tag) && !BANNER_HINT.test(classOrId) && !painted) return source;

    const text = normaliseForCompare(source.slice(element.innerStart, element.innerEnd));
    const title = normaliseForCompare(String(meta.title || ''));
    const pills = buildBannerPills(meta).map(normaliseForCompare).filter((pill) => pill.length >= 3);
    const pillHits = pills.filter((pill) => text.includes(pill)).length;

    const repeatsTitle = title.length >= 4 && (text.includes(title) || (title.includes(text) && text.length >= 8));
    const isStampOnly = text.length < 3;
    // Size guard: a banner holds a title and a few labels, never paragraphs, so
    // an ordinary opening card with an intro paragraph is left alone.
    if (!isStampOnly && !(repeatsTitle && text.length <= 240) && !(pillHits >= 2 && text.length <= 400)) return source;
    return (source.slice(0, element.start) + source.slice(element.end)).trim();
};

/* ────────────────────────────────────────────────────────────────────────────
 * ONE BANNER — absorb EVERY band the model opens a document with.
 *
 * Models are told that the host banner owns the title, the labels and the
 * compliance data, but real output still opens with a school header, a CAPS
 * reference bar, a formal examination header, a meta pill row, a logo strip or
 * a second banner. Each of those bands repeats information the single host
 * banner already shows — and steals the vertical space the teacher needs for
 * actual work — so the host absorbs them: their values are harvested into the
 * banner metadata and the bands themselves never reach the page.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Class/id tokens that name a band (rather than content) on their own, so a
 * leading element carrying one is treated as template chrome.
 */
const CHROME_TOKENS = new Set([
    'banner', 'hero', 'masthead', 'jumbotron', 'cover', 'coverhead', 'titleblock',
    'doctitle', 'pagetitle', 'topbar', 'titlebar', 'letterhead', 'schoolheader',
    'schoolname', 'school', 'skool', 'crest', 'emblem', 'brand', 'branding',
    'watermark', 'flagstripe', 'flags', 'dbe', 'emis', 'compliance', 'stamp',
    'stamps', 'badges', 'docmeta', 'lessonmeta', 'metadata', 'meta', 'docinfo',
    'infobar', 'kicker', 'subtitle', 'tagline', 'byline', 'capsbar', 'capsref',
    'assessmentheader', 'examheader', 'testheader', 'paperheader', 'title',
]);

/** Tokens that only ever name branding artwork — never a content illustration. */
const BRAND_ART_TOKENS = new Set([
    'logo', 'watermark', 'crest', 'emblem', 'brand', 'branding', 'coat', 'arms',
    'flagstripe', 'flags',
]);

/**
 * Tokens that may also name real content (a hero *illustration*, a cover
 * *image*, a section *title*). They only count as chrome when the element's own
 * text proves it is a band: it repeats the document title or is metadata.
 */
const CHROME_EVIDENCE_TOKENS = new Set([
    'hero', 'cover', 'coverhead', 'jumbotron', 'title', 'kicker', 'subtitle',
    'tagline', 'byline',
]);

/** Labels that mark a short band as document metadata rather than content. */
const META_LABEL_PATTERN = /\b(?:grade|graad|term|kwartaal|subject|vak|topic|onderwerp|date|datum|marks?|punte|duration|tyd|school|skool|teacher|onderwyser|educator|learner|leerder|class|klas|emis|district|distrik|province|provinsie|caps|atp|npa|sias|wp6|popia|total|score|name|naam)\b/gi;

/** Whitespace, comments and head-only tags that may precede the first band. */
const LEADING_SKIP_RE = /^(?:\s|<!--[\s\S]*?-->|<style\b[\s\S]*?<\/style\s*>|<script\b[\s\S]*?<\/script\s*>|<link\b[^>]*>|<meta\b[^>]*>)*/i;

/** "school-header" / "docTitle" → ["school", "header"] / ["doc", "title"]. */
const tokeniseClassNames = (value: string): string[] =>
    String(value || '')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[\s\-_:/.,]+/)
        .map((token) => token.toLowerCase())
        .filter(Boolean);

/** Visible text of a band, one line per block element. */
const bandText = (markup: string): string =>
    decodeEntities(
        String(markup || '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(?:p|div|li|h[1-6]|tr|section|header|footer|article|td|th|span|strong|em)>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
    )
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{2,}/g, '\n')
        .trim();

/** True when a short band is dominated by document labels (Grade, Term, …). */
const isMetadataBandText = (text: string, minLabels = 2, maxLength = 320): boolean => {
    if (!text || text.length > maxLength) return false;
    const hits = new Set((text.match(META_LABEL_PATTERN) || []).map((hit) => hit.toLowerCase()));
    return hits.size >= minLabels;
};

/**
 * A class-less metadata strip: at least four distinct document labels inside a
 * short, separator-driven line ("Subject: … · Term: 2 · Marks: 20"). Prose is
 * excluded — a sentence terminator followed by a space marks real writing.
 */
const isMetadataStrip = (text: string): boolean => {
    if (!text || text.length > 200) return false;
    if (/\.[ \n]/.test(text)) return false;
    return isMetadataBandText(text, 4, 200);
};

/**
 * Decide whether a leading element is template chrome (a band that repeats the
 * banner) rather than real content. Conservative by design: anything long, any
 * table/list structure, any paragraph with a full sentence, and any content
 * illustration is left exactly where the model put it.
 */
const isChromeBand = (markup: string, element: LeadingElement, meta: ContentTemplateMeta): boolean => {
    // Never touch the host's own chrome or the designated banner.
    if (/site-header|header-text|eduai-compliance-banner/i.test(element.attrs)) return false;

    const text = bandText(markup);
    if (text.length > 320) return false;
    if (/<(?:p|li|td|dd)\b[^>]*>[^<]{200,}/i.test(markup)) return false;
    if (/<(?:table|ol)\b/i.test(markup)) return false;
    if ((markup.match(/<li\b/gi) || []).length >= 4) return false;

    const tokens = tokeniseClassNames(
        `${element.attrs.match(/class\s*=\s*["']([^"']*)["']/i)?.[1] ?? ''} ${element.attrs.match(/id\s*=\s*["']([^"']*)["']/i)?.[1] ?? ''}`,
    );
    const strong = tokens.some((token) => CHROME_TOKENS.has(token));
    const headerTag = /^header$/i.test(element.tag);
    const headingTag = /^h[1-2]$/i.test(element.tag);

    // A pure logo / crest / flag image is branding; a hero illustration is not.
    if (!text && /<img\b/i.test(markup)) return tokens.some((token) => BRAND_ART_TOKENS.has(token));

    const title = normaliseForCompare(String(meta.title || ''));
    const repeatsTitle = title.length >= 4 && normaliseForCompare(text).includes(title);
    const metadataBand = isMetadataBandText(text);
    const metadataStrip = isMetadataStrip(text);
    // A hero/cover/title element is only chrome when its text proves it: a hero
    // illustration or a genuine section heading stays where the model put it.
    const ambiguousToken = tokens.some((token) => CHROME_EVIDENCE_TOKENS.has(token));
    const evidenced = repeatsTitle || metadataBand || metadataStrip;
    if (ambiguousToken && !evidenced) return false;
    if (!strong && !headerTag && !headingTag && !metadataStrip) return false;

    const score =
        (strong ? 2 : 0)
        + (headerTag ? 1 : 0)
        + (headingTag ? 1 : 0)
        + (repeatsTitle ? 2 : 0)
        + (metadataBand ? 2 : 0)
        + (metadataStrip ? 1 : 0)
        + (text.length === 0 ? 1 : 0)
        + (text.length <= 60 ? 1 : 0);
    return score >= 3;
};

/**
 * Recover the values a band was displaying so the single banner can render them
 * once (the band itself is deleted). Only gaps are filled: anything the caller
 * supplied, or an earlier (higher) band already produced, always wins.
 */
const harvestMetaFromBand = (markup: string, meta: ContentTemplateMeta): void => {
    const text = bandText(markup);
    if (!text) return;
    const grab = (pattern: RegExp): string => (text.match(pattern)?.[1] || '').replace(/\s+/g, ' ').trim();
    const set = (key: 'grade' | 'term' | 'subject' | 'contentType' | 'date' | 'capsCode' | 'capsReference' | 'atpWeek' | 'school' | 'teacher' | 'learner', value: string): void => {
        if (!value) return;
        if (String((meta as Record<string, unknown>)[key] ?? '').trim()) return;
        (meta as Record<string, unknown>)[key] = value;
    };

    set('grade', grab(/\bgrade\s*([rR]|\d{1,2})\b/i));
    const term = grab(/\bterm\s*([1-4])\b/i);
    set('term', term ? `Term ${term}` : '');
    set('subject', grab(/\b(?:subject|learning\s+area|vak)\s*[:\-–]\s*([^|•·\n]{2,60})/i));
    set(
        'contentType',
        grab(/\b(?:content\s*type|document\s*type|resource\s*type|assessment\s*type|type)\s*[:\-–]\s*([^|•·\n]{2,60})/i)
        || (text.match(CONTENT_TYPE_HINT)?.[1] ?? ''),
    );
    set('date', grab(/\b(\d{2}\/\d{2}\/\d{4})\b/));
    set('capsCode', (text.match(/\b([A-Z]{2,4}-[A-Z]{2,6}-G[R\d]{1,2}-T\d-[A-Z]{2,4}\d{2})\b/)?.[1] || '').toUpperCase());
    set('capsReference', grab(/\bCAPS\s+(?:reference|ref|curriculum\s+reference)\s*[:\-–]\s*([^|•·\n]{3,120})/i));
    const atp = grab(/\bATP\s*(?:week|placement)?\s*[:\-–]?\s*(\d{1,2})\b/i);
    set('atpWeek', atp ? `Week ${atp}` : '');
    set('school', grab(/\b(?:school|skool|school\s+name)\s*[:\-–]\s*([^|•·\n]{2,80})/i));
    set('teacher', grab(/\b(?:teacher|educator|onderwyser|class\s+teacher)\s*[:\-–]\s*([^|•·\n]{2,60})/i));
    set('learner', grab(/\b(?:learner|student|leerder)\s*(?:name)?\s*[:\-–]\s*([^|•·\n]{2,60})/i));

    // A letterhead band usually puts the school name in its own heading line.
    if (!meta.school) {
        const schoolLine = text
            .split('\n')
            .map((line) => line.trim())
            .find((line) => line.length <= 80 && /(?:primary|high|secondary|academy|college|school|skool)\b/i.test(line) && !/[:|•·]/.test(line));
        if (schoolLine) meta.school = schoolLine.replace(/^(?:welcome\s+to\s+)/i, '');
    }

    const extras = [...(meta.extraPills || [])];
    const marks = grab(/\b(?:total|marks?|punte)\s*[:\-–]?\s*(\d{1,3})\b/i);
    const duration = grab(/\bduration\s*[:\-–]\s*([^|•·\n]{1,30})/i);
    if (marks && !extras.some((pill) => /\bmarks?\b/i.test(pill))) extras.push(`📝 Total: ${marks} marks`);
    if (duration && !extras.some((pill) => /⏱/.test(pill))) extras.push(`⏱ ${duration}`);
    if (extras.length) meta.extraPills = extras;
};

/**
 * Strip EVERY model-authored band at the top of a document and fold the values
 * they displayed into the metadata the single host banner renders.
 *
 * The walk is limited to the leading run of elements (bands live at the top of
 * a document — real content stops it), is depth-aware, and descends into a
 * whole-document wrapper (`.poster-container`, a card, a page shell) so a
 * banner nested one level down is still absorbed. Returns the cleaned markup
 * plus the harvested metadata; nothing else about the document is touched.
 */
export const collapseLeadingChrome = (
    html: string,
    meta: ContentTemplateMeta = {},
): { html: string; meta: ContentTemplateMeta } => {
    const harvested: ContentTemplateMeta = {};
    let source = String(html || '');

    for (let guard = 0; guard < 12; guard += 1) {
        const lead = source.match(LEADING_SKIP_RE)?.[0] ?? '';
        const rest = source.slice(lead.length);
        if (!rest.trim()) break;
        const element = firstElement(rest);
        if (!element) break; // Real text starts here: the content has begun.
        const markup = rest.slice(element.start, element.end);

        if (isChromeBand(markup, element, meta)) {
            harvestMetaFromBand(markup, harvested);
            source = `${lead}${rest.slice(element.end)}`;
            continue;
        }

        // A single wrapper around the whole fragment (poster container, card,
        // page shell): collapse the bands nested directly inside it.
        if (!rest.slice(element.end).trim() && !/^(?:script|style|img|svg)$/i.test(element.tag)) {
            const inner = rest.slice(element.innerStart, element.innerEnd);
            const collapsed = collapseLeadingChrome(inner, mergeMeta(harvested, meta));
            if (collapsed.html !== inner) {
                source = `${lead}${rest.slice(0, element.innerStart)}${collapsed.html}${rest.slice(element.innerEnd)}`;
                Object.assign(harvested, mergeMeta(collapsed.meta, harvested));
            }
        }
        break;
    }

    return { html: source, meta: harvested };
};

/**
 * Drop a heading that merely repeats the banner title at the very start of the
 * content. The single banner already states the document title (and the grade
 * / subject / type / term pills that model headings love to append), so keeping
 * a second copy wastes the vertical space the teacher needs for real content.
 * Only the FIRST heading is considered, and only when its text overlaps the
 * banner title — every other heading in the document is untouched.
 */
export const stripDuplicateTitleHeading = (html: string, meta: ContentTemplateMeta = {}): string => {
    const source = String(html || '');
    const wanted = normaliseForCompare(String(meta.title || ''));
    if (!wanted) return source;
    const match = source.match(/^\s*<(h1|h2)\b[^>]*>([\s\S]*?)<\/\1\s*>/i);
    if (!match) return source;
    const heading = normaliseForCompare(match[2]);
    if (!heading) return source;
    const duplicated = heading === wanted
        || heading.startsWith(wanted)
        || (wanted.startsWith(heading) && heading.length >= 8);
    if (!duplicated) return source;
    return source.slice(match[0].length).trim();
};

/**
 * Wrap generated content in the LIGHT Template v5 chrome:
 * very light blue translucent page header → ONE full-width two-colour vertical
 * gradient document banner (title + every label + compliance) → watermark +
 * centred 800px page → navy footer.
 *
 * Plain fragments are lifted into an opaque white card that opens with the
 * banner; fragments that already use LIGHT card structure keep it. The call is
 * idempotent AND self-healing:
 *
 *  - current canonical output passes through byte-for-byte (print-preview
 *    re-exports never double-wrap);
 *  - older wrapped documents and model-copied chrome are stripped back to
 *    content and re-wrapped, so stale footers, duplicate title blocks,
 *    repeated compliance labels and solid banners cannot survive into a
 *    preview, print, PDF or HTML export.
 */
export const wrapWithTemplate = (bodyHtml: string, meta: ContentTemplateMeta = {}): string => {
    const original = String(bodyHtml || '');
    if (!original.trim()) return original;
    if (isCurrentTemplateOutput(original)) return original;

    // Values are harvested from the ORIGINAL body as well: legacy host title
    // blocks (`.lesson-meta`, `.doc-meta`, `.lesson-title`) are deleted by
    // stripTemplateChrome, and anything they displayed (marks, duration, CAPS
    // reference, school …) must survive inside the ONE banner.
    const beforeStrip = collapseLeadingChrome(cleanGeneratedBodyHTML(original));
    const stripped = stripTemplateChrome(original);
    // ONE banner: absorb EVERY band the model opened the document with — its own
    // banner, school header, CAPS reference bar, formal assessment header, meta
    // pill row, logo strip — into the banner's metadata, then delete the bands
    // themselves. This is what guarantees the labels, the compliance data and
    // the document details appear exactly once at the top of the page.
    const collapsed = collapseLeadingChrome(cleanGeneratedBodyHTML(stripped));
    const effectiveMeta = mergeMeta(
        mergeMeta(mergeMeta(harvestMetaFromChrome(original), beforeStrip.meta), collapsed.meta),
        meta,
    );
    // Then kill anything banner-shaped that repeats the banner and any heading
    // that repeats what the banner will show, before rendering the banner.
    const deduped = stripLeadingDuplicateBanner(collapsed.html, effectiveMeta);
    const cleaned = stripDuplicateTitleHeading(deduped, effectiveMeta);
    const banner = buildTemplateComplianceBannerHTML(effectiveMeta);
    // ONE palette per document, chosen for the content type: the banner, every
    // repainted model band and the stylesheet safety nets all use the same two
    // colours — published below as the scoped `--eduai-banner-gradient`.
    const gradient = bannerGradientFor(effectiveMeta.contentType, effectiveMeta.palette);

    let inner: string;
    if (cleaned.includes(COMPLIANCE_SLOT)) {
        // Exactly one banner, restored to the position the host gave it first.
        inner = cleaned.replace(COMPLIANCE_SLOT, () => banner);
    } else if (hasLightCards(cleaned)) {
        inner = `${banner}\n${cleaned}`;
    } else {
        inner = `<article class="card">\n${banner}\n${cleaned}\n</article>`;
    }

    return `
${buildTemplateStyleHTML()}
${buildTemplateHeaderHTML(effectiveMeta)}
<div class="eduai-light-scope" style="--eduai-banner-gradient: ${gradient}; position: relative; background: ${EDUAI_TEMPLATE_COLOURS.paper}; overflow: hidden;">
  ${buildTemplateWatermarkHTML()}
  <main class="page" style="position: relative; z-index: 1; max-width: 800px; margin: 0 auto; padding: 28px 20px 60px; font-family: ${LIGHT_BODY_FONT}; color: #1e293b; line-height: 1.65; box-sizing: border-box;">
${applyBannerGradients(inner, gradient)}
  </main>
</div>
${buildTemplateFooterHTML(effectiveMeta)}`.trim();
};

/** Map the print/export options onto the template metadata. */
export const metaFromPrintOptions = (
    options?: { subject?: string; grade?: string; contentType?: string; date?: string; term?: string; school?: string; teacher?: string; learner?: string; title?: string; className?: string; extraPills?: string[] },
    title?: string,
): ContentTemplateMeta => {
    const pills: string[] = [];
    if (options?.className) pills.push(`Class: ${options.className}`);
    if (options?.extraPills) pills.push(...options.extraPills);
    return {
        title: title || options?.title,
        subject: options?.subject,
        grade: options?.grade,
        term: options?.term,
        contentType: options?.contentType,
        date: options?.date,
        school: options?.school,
        teacher: options?.teacher,
        learner: options?.learner,
        extraPills: pills.length ? pills : undefined,
    };
};
