/**
 * Document renderer for the Foundation Phase template library.
 *
 * Produces fully self-contained A4 print HTML for any template descriptor:
 *   • `renderTemplatePage()` — the page markup + embedded <style> (used inside
 *     the Studio preview iframe and for the print pipeline).
 *   • `buildStandaloneDocument()` — a complete .html file with Google Fonts,
 *     A4 @page rules and a "Print" helper button (the printable pack).
 *   • `buildBundleDocument()` — many templates in one file, one page each,
 *     page-break separated, so a teacher prints a whole week in one go.
 *
 * Print contract (mirrors DESIGN.md §6): white A4, colour preserved, no
 * absolute positioning that clips, `break-inside: avoid` on every block, and
 * a black-ink-friendly variant for schools that photostat in greyscale.
 */

import type { Block, FoundationTemplate, RenderOptions, TemplateTheme } from './types';
import {
    artImg,
    confettiStrip,
    doodleCloud,
    doodleRosette,
    doodleStar,
    doodleSun,
    PALETTE,
    rainbowArc,
    scallopBand,
    escapeHtml as esc,
} from './art';
import { renderBlock, type Ctx, type Theme } from './blocks';
import { capsFooterLine, SUBJECT_ALLOCATION } from './caps';
import { pair } from './labels';

export const KIND_META = {
    award: {
        label: 'Awards & Certificates',
        emoji: '🏆',
        blurb: 'Bright certificates, praise slips and sticker awards for good academic achievement.',
        color: '#ffdf40',
    },
    worksheet: {
        label: 'Printable Worksheets',
        emoji: '✏️',
        blurb: 'CAPS-aligned practice sheets with tracing, counting, matching and marked questions.',
        color: '#06b6d4',
    },
    classroom: {
        label: 'Classroom Exercises',
        emoji: '',
        blurb: 'Oral, pair, group and movement activities on cut-out cards for the daily programme.',
        color: '#9b59b6',
    },
    homework: {
        label: 'Homework Exercises',
        emoji: '',
        blurb: 'Short, purposeful home tasks with parent checklists and reading logs.',
        color: '#2ed573',
    },
} as const;

const THEMES: Record<TemplateTheme, Theme> = {
    sunny: { primary: '#ffb703', secondary: '#ffd166', soft: '#fff6d8', band: '#ff8a3d', accent: '#2563eb' },
    bubblegum: { primary: '#ff5da2', secondary: '#ffa3c8', soft: '#ffe6f2', band: '#ff69b4', accent: '#9b59b6' },
    lagoon: { primary: '#06b6d4', secondary: '#67e8f9', soft: '#dff7fb', band: '#0ea5e9', accent: '#2563eb' },
    meadow: { primary: '#22c55e', secondary: '#86efac', soft: '#e3f9e8', band: '#16a34a', accent: '#0d9488' },
    grape: { primary: '#8b5cf6', secondary: '#c4b5fd', soft: '#efe9ff', band: '#7c3aed', accent: '#ec4899' },
    tangerine: { primary: '#f97316', secondary: '#fdba74', soft: '#ffeedd', band: '#ea580c', accent: '#eab308' },
    rainbow: { primary: '#e11d48', secondary: '#f59e0b', soft: '#eef6ff', band: '#2563eb', accent: '#16a34a' },
};

export const themeFor = (theme: TemplateTheme): Theme => THEMES[theme] ?? THEMES.sunny;

/** The Foundation Phase print stylesheet — the whole visual language. */
export const FP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Patrick+Hand&family=Comic+Neue:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap');

.fp-root {
  --ink: ${PALETTE.ink};
  --navy: ${PALETTE.navy};
  font-family: 'Nunito', 'Comic Neue', ui-sans-serif, system-ui, sans-serif;
  color: var(--ink);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  line-height: 1.45;
}
.fp-page {
  position: relative;
  box-sizing: border-box;
  width: 190mm;
  min-height: 272mm;
  margin: 0 auto;
  padding: 12mm 12mm 10mm;
  background: #fff;
  border: 2.2mm solid var(--fp-primary, ${PALETTE.cyan});
  border-radius: 10mm;
  overflow: hidden;
}
.fp-page::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8mm;
  border: 1mm dotted rgba(255,255,255,.9);
  pointer-events: none;
}
.fp-corners { position: absolute; inset: 0; pointer-events: none; }
.fp-corner { position: absolute; }
.fp-corner.tl { top: -4mm; left: -3mm; }
.fp-corner.tr { top: -3mm; right: -3mm; }
.fp-corner.bl { bottom: 1mm; left: -2mm; }
.fp-corner.br { bottom: 1mm; right: -3mm; }
.fp-confetti { opacity: .5; }

/* ── banner ─────────────────────────────────────────── */
.fp-banner { position: relative; display: flex; align-items: flex-start; gap: 5mm; margin-bottom: 4mm; }
.fp-banner-text { flex: 1 1 auto; min-width: 0; }
.fp-kicker { font-family: 'Fredoka', sans-serif; font-size: 8pt; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--fp-band, ${PALETTE.navy}); margin: 0 0 1mm; }
.fp-title { font-family: 'Fredoka', sans-serif; font-size: 23pt; line-height: 1.06; font-weight: 700; color: var(--fp-band, ${PALETTE.navy}); margin: 0; letter-spacing: -.01em; }
.fp-subtitle { font-size: 10.5pt; font-weight: 700; color: #334155; margin: 1.5mm 0 0; }
.fp-art { display: block; flex: 0 0 auto; text-align: center; }
.fp-float-left { float: none; }
.fp-float-right { float: none; }
.fp-rainbow { margin: 1mm 0 3mm; }
.fp-badge-row { display: flex; flex-wrap: wrap; gap: 2mm; margin: 0 0 3mm; }
.fp-pill { font-family: 'Fredoka', sans-serif; font-size: 8.2pt; font-weight: 600; padding: 1.2mm 3mm; border-radius: 99mm; border: .5mm solid var(--fp-primary, ${PALETTE.cyan}); color: var(--fp-band, ${PALETTE.navy}); background: var(--fp-soft, #f6fbff); white-space: nowrap; }
.fp-pill.caps { background: ${PALETTE.navy}; color: #fff; border-color: ${PALETTE.navy}; }
.fp-pill.bloom { background: #fff; }

/* ── learner header (name / date / marks) ─────────────── */
.fp-learnerstrip { display: flex; align-items: stretch; gap: 3mm; margin: 0 0 4mm; }
.fp-field { flex: 1 1 auto; border: .7mm dashed var(--fp-primary, ${PALETTE.cyan}); border-radius: 4mm; padding: 2mm 3mm; background: #fffdf7; }
.fp-field b { display: block; font-family: 'Fredoka', sans-serif; font-size: 8.6pt; text-transform: uppercase; letter-spacing: .06em; color: var(--fp-band); }
.fp-field .fp-underline { display: block; border-bottom: .45mm dotted #64748b; min-height: 7mm; }
.fp-scorebox { flex: 0 0 46mm; border: 1.6mm solid #ffb703; border-radius: 4mm; padding: 1.6mm 2.4mm; text-align: center; background: #fffbe6; }
.fp-scorebox b { font-family: 'Fredoka', sans-serif; font-size: 10pt; display: block; color: #7a4b00; }
.fp-scorebox .fp-box { display: inline-block; border: .5mm solid #b45309; border-radius: 1.5mm; width: 7mm; height: 8mm; margin: .6mm .4mm 0 0; background: #fff; vertical-align: middle; }

/* ── alignment strip ─────────────────────────────────── */
.fp-caps { border: .55mm solid #dbeafe; border-left: 2.2mm solid var(--fp-primary, ${PALETTE.cyan}); background: #f7fbff; border-radius: 0 3mm 3mm 0; padding: 1.9mm 2.6mm; margin: 0 0 3.4mm; font-size: 8.2pt; color: #1e3a5f; break-inside: avoid; }
.fp-caps h4 { font-family: 'Fredoka', sans-serif; font-size: 9pt; margin: 0 0 1mm; color: #1d4ed8; text-transform: uppercase; letter-spacing: .05em; }
.fp-caps dl { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1mm 5mm; margin: 0; }
.fp-caps dt { font-weight: 800; }
.fp-caps dd { margin: 0; }
.fp-caps .fp-caps-note { margin: 1.5mm 0 0; font-style: italic; color: #475569; }
.fp-caps-compact { margin: 4mm 0 0; padding: 1.8mm 2.4mm; font-size: 7.4pt; background: #fbfdff; border-left-width: 1.6mm; }
.fp-caps-compact h4 { font-size: 7.6pt; margin: 0 0 .6mm; }
.fp-caps-compact dl { grid-template-columns: repeat(4, minmax(0,1fr)); gap: .4mm 4mm; }
.fp-caps-compact dt { font-size: 6.8pt; }
.fp-caps-compact dd { font-size: 7.4pt; }
.fp-caps-compact .fp-caps-note { font-size: 7pt; margin-top: 1mm; }

/* ── blocks ──────────────────────────────────────────── */
.fp-block { position: relative; margin: 0 0 3.6mm; padding: 2.4mm 3mm 2.8mm; border: .5mm solid #e6eef7; border-radius: 4.5mm; background: #fff; break-inside: avoid; page-break-inside: avoid; }
.fp-block:nth-of-type(even) { background: #fdfeff; }
.fp-block-head { display: flex; align-items: center; gap: 2mm; border-bottom: .9mm solid var(--fp-primary, ${PALETTE.cyan}); padding-bottom: 1.4mm; margin-bottom: 2mm; flex-wrap: wrap; }
.fp-block-pencil { display: inline-flex; align-items: center; }
.fp-block-title { font-family: 'Fredoka', sans-serif; font-size: 12.6pt; margin: 0; color: var(--fp-band, ${PALETTE.navy}); flex: 1 1 auto; }
.fp-block-title em { font-style: normal; font-family: 'Nunito', sans-serif; font-size: 9pt; font-weight: 800; color: ${PALETTE.purple}; margin-left: 1.5mm; }
.fp-badge { font-family: 'Fredoka', sans-serif; font-size: 7.6pt; font-weight: 600; color: #fff; padding: .8mm 2.4mm; border-radius: 99mm; }
.fp-marks { font-family: 'Fredoka', sans-serif; font-size: 8.6pt; font-weight: 700; padding: .8mm 2.6mm; border-radius: 99mm; }
.fp-instruction { margin: 0 0 2mm; font-size: 10pt; font-weight: 700; color: #334155; }
.fp-instruction em { font-style: normal; color: ${PALETTE.purple}; font-weight: 800; }
.fp-bi { font-size: 8.6pt; }
.fp-items { display: block; }
.fp-item { display: flex; flex-direction: column; gap: 1mm; padding: 1.1mm 0; border-bottom: .35mm dotted #cbd5e1; }
.fp-item:last-child { border-bottom: 0; }
.fp-item-head { display: flex; align-items: center; gap: 2.4mm; }
.fp-item-symbol { font-size: 13pt; }
.fp-num { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 7.4mm; height: 7.4mm; border-radius: 99mm; color: #fff; font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 10pt; box-shadow: 0 0 0 .5mm #fff inset; }
.fp-item-text { margin: 0; font-size: 11pt; font-weight: 700; color: #1f2937; flex: 1 1 auto; }
.fp-item-marks { font-family: 'Fredoka', sans-serif; font-size: 8.6pt; color: #64748b; }
.fp-parts { list-style: none; margin: .5mm 0 0 9mm; padding: 0; display: flex; flex-direction: column; gap: 1.2mm; }
.fp-parts li { font-size: 10.5pt; }
.fp-parts li span { font-weight: 800; color: var(--fp-band); margin-right: 1mm; }
.fp-part-marks { font-style: normal; color: #64748b; font-size: 9pt; }
.fp-options { display: flex; flex-wrap: wrap; gap: 2mm; margin: 1mm 0 0 9.8mm; }
.fp-option { display: inline-flex; align-items: center; gap: 1.6mm; border: .5mm solid #d7e3f2; border-radius: 3mm; padding: 1.4mm 2.4mm; font-size: 10.5pt; background: #fff; }
.fp-option b { font-family: 'Fredoka', sans-serif; color: var(--fp-band); }
.fp-tick { display: inline-block; border: .7mm solid #334155; border-radius: 1.4mm; background: #fff; flex: 0 0 auto; }
.fp-item-lines { margin: .5mm 0 0 0; }
.fp-copyrow { display: flex; gap: 3mm; margin: 1mm 0 0 0; flex-wrap: wrap; }
.fp-copycell { flex: 1 1 40mm; }

/* ── writer's lines ─────────────────────────────────── */
.fp-writer { display: flex; flex-direction: column; gap: 1mm; }
.fp-wline { position: relative; height: 11.6mm; border-bottom: .5mm solid #94a3b8; background: linear-gradient(to bottom, transparent 49.6%, #cbd5e1 49.6%, #cbd5e1 50.4%, transparent 50.4%); }
.fp-wline::before { content: ''; position: absolute; left: 0; right: 0; top: 25%; border-top: .4mm dashed #f2a3c4; }
.fp-wguide { position: absolute; left: 1mm; bottom: 1mm; font-family: 'Patrick Hand', cursive; font-size: 11mm; color: rgba(100,116,139,.55); }
.fp-wdot { position: absolute; inset: 0; }

/* ── tracing ───────────────────────────────────────── */
.fp-tracer-grid { display: flex; flex-direction: column; gap: 1.5mm; }
.fp-tracerow { display: flex; align-items: center; gap: 3mm; border-bottom: .35mm dotted #cbd5e1; padding-bottom: .4mm; }
.fp-tracemodel { flex: 0 0 44mm; font-family: 'Patrick Hand', cursive; font-size: 11.6mm; line-height: 1.05; color: var(--fp-band, ${PALETTE.navy}); letter-spacing: .5mm; }
.fp-tracemodel.fp-manuscript, .fp-ghost.fp-manuscript { font-family: 'Comic Neue', 'Patrick Hand', cursive; letter-spacing: 1mm; }
.fp-tracepractice { flex: 1 1 auto; display: flex; gap: 3mm; align-items: center; }
.fp-ghost { font-family: 'Patrick Hand', cursive; font-size: 11.6mm; line-height: 1.05; color: transparent; -webkit-text-stroke: .35mm #b6c6d8; letter-spacing: .5mm; }
.fp-frames { display: flex; flex-wrap: wrap; gap: 3mm; margin-top: 2mm; }
.fp-frame { flex: 1 1 60mm; font-size: 10pt; font-weight: 700; color: #334155; }
.fp-tracer { font-family: 'Patrick Hand', cursive; font-size: 12mm; color: #cbd5e1; -webkit-text-stroke: .3mm #94a3b8; display: block; }

/* ── counting / boxes ───────────────────────────────── */
.fp-countgrid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 2.6mm; }
.fp-countcard { border: .5mm dashed var(--fp-primary); border-radius: 3.5mm; padding: 1.6mm; background: #fff; }
.fp-countdot-wrap { display: flex; flex-wrap: wrap; gap: 1.2mm; min-height: 12mm; align-items: center; }
.fp-countdot { font-size: 7.2mm; line-height: 1; }
.fp-countanswer { display: flex; align-items: center; gap: 1.6mm; margin-top: 1mm; font-family: 'Fredoka', sans-serif; font-size: 10pt; }
.fp-countprompt { margin: .5mm 0 0; font-size: 8.6pt; color: #475569; font-weight: 700; }
.fp-extra-task { margin: 2mm 0 0; font-size: 9.4pt; font-weight: 800; color: ${PALETTE.purple}; }
.fp-boxes { display: inline-flex; gap: 1.2mm; }
.fp-box { border: .55mm solid #64748b; border-radius: 1.4mm; background: #fffdf7; display: inline-block; }

/* ── matching ──────────────────────────────────────── */
.fp-match { display: flex; flex-direction: column; gap: 3.2mm; }
.fp-matchrow { display: grid; grid-template-columns: 1fr 24mm 1fr; align-items: center; gap: 0; }
.fp-matchcell { border: .5mm solid #d7e3f2; border-radius: 3mm; padding: 2mm 2.4mm; font-size: 10.6pt; font-weight: 700; background: #fff; }
.fp-match-left { border-color: var(--fp-primary); background: var(--fp-soft); }
.fp-matchline { height: 22mm; background: repeating-linear-gradient(90deg, #94a3b8 0 2mm, transparent 2mm 4mm) center/100% .4mm no-repeat; position: relative; }
.fp-matchline::before, .fp-matchline::after { content: ''; position: absolute; top: 50%; width: 2.4mm; height: 2.4mm; border-radius: 99mm; background: var(--fp-primary); transform: translateY(-50%); }
.fp-matchline::before { left: 0; } .fp-matchline::after { right: 0; }

/* ── colour / circle ────────────────────────────────── */
.fp-swatches { display: flex; flex-wrap: wrap; gap: 1.6mm; margin-bottom: 2mm; }
.fp-swatch { display: inline-flex; align-items: center; gap: 1.2mm; font-size: 8.6pt; font-weight: 800; text-transform: capitalize; border: .4mm solid #e2e8f0; border-radius: 99mm; padding: .6mm 2mm; background: #fff; }
.fp-swatch-dot { width: 3.4mm; height: 3.4mm; border-radius: 99mm; border: .4mm solid #334155; }
.fp-citems { display: flex; flex-wrap: wrap; gap: 2.4mm; }
.fp-citems-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); }
.fp-citem { position: relative; min-width: 24mm; text-align: center; border: .6mm dashed #94a3b8; border-radius: 4mm; padding: 2mm 2mm 5mm; background: #fff; }
.fp-citem-face { font-size: 13mm; line-height: 1.1; display: block; font-weight: 800; font-family: 'Comic Neue', cursive; }
.fp-citem-cap { display: block; font-size: 8.6pt; font-weight: 700; color: #475569; }
.fp-citem-actions { position: absolute; bottom: .8mm; left: 0; right: 0; display: flex; justify-content: center; gap: 1.2mm; }
.fp-citem-actions i { font-style: normal; font-size: 7.4pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; background: var(--fp-soft); border-radius: 99mm; padding: .3mm 1.6mm; color: var(--fp-band); }

/* ── tables / grids ─────────────────────────────────── */
.fp-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.fp-table th, .fp-table td { border: .45mm solid #b9cadd; padding: 1.6mm 2mm; text-align: left; vertical-align: middle; }
.fp-table thead th { font-family: 'Fredoka', sans-serif; background: var(--fp-soft); color: var(--fp-band); text-align: center; }
.fp-blankcell { background: #fffdf7; min-height: 10mm; height: 12mm; }
.fp-prefill { font-weight: 800; text-align: center; background: #f1f5f9; }
.fp-gridtable td { height: var(--cell, 13mm); }
.fp-gbox { display: flex; flex-direction: column; gap: 1.6mm; }
.fp-gboxrow { display: flex; align-items: center; gap: 1.6mm; }
.fp-glabel { flex: 0 0 34mm; font-size: 9.6pt; font-weight: 800; }
.fp-gcell { flex: 1 1 auto; border: .55mm solid #64748b; border-radius: 1.6mm; background: #fffdf7; display: inline-flex; align-items: center; justify-content: center; font-family: 'Fredoka', sans-serif; font-weight: 600; }
.fp-pic { font-size: 6mm; letter-spacing: .5mm; }
.fp-rubric { font-size: 8.8pt; }
.fp-rubric th { font-weight: 800; }
.fp-rubric-crit { width: 26%; }

/* ── cut & paste / cards ────────────────────────────── */
.fp-cutline { display: flex; align-items: center; gap: 1.6mm; margin: 1mm 0 1.6mm; }
.fp-cut-icon { display: inline-flex; }
.fp-cut-dash { flex: 1 1 auto; border-top: .6mm dashed #f87171; }
.fp-cut-label { font-size: 7.6pt; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: #ef4444; }
.fp-strip-wrap { display: flex; flex-wrap: wrap; gap: 1.8mm; align-items: center; border: .5mm dotted #f87171; border-radius: 3mm; padding: 2mm; background: #fff7f7; }
.fp-piece { flex: 0 1 auto; text-align: center; border: .6mm dashed var(--fp-primary); border-radius: 2.6mm; padding: 1.6mm 3mm; background: #fff; min-width: 16mm; }
.fp-piece b { font-family: 'Fredoka', sans-serif; font-size: 11pt; display: block; }
.fp-piece i { font-style: normal; font-size: 6.4pt; text-transform: uppercase; color: #94a3b8; letter-spacing: .08em; }
.fp-slotgrid { display: flex; flex-direction: column; gap: 2mm; margin-bottom: 2mm; }
.fp-slotrow { display: flex; align-items: center; gap: 2mm; }
.fp-slotctx { flex: 0 0 auto; font-size: 10pt; font-weight: 700; }
.fp-slot { flex: 1 1 auto; min-height: 12mm; border: .6mm dashed #94a3b8; border-radius: 2.4mm; background: repeating-linear-gradient(-45deg, #fbfdff 0 3mm, #f3f8ff 3mm 6mm); display: flex; align-items: center; justify-content: center; font-family: 'Fredoka', sans-serif; font-size: 11pt; }
.fp-cardgrid { display: flex; flex-wrap: wrap; gap: 2.4mm; }
.fp-card { position: relative; border: .7mm solid var(--fp-primary); border-radius: 4mm; padding: 2.6mm 2mm; text-align: center; background: #fff; min-height: 26mm; display: flex; flex-direction: column; justify-content: center; gap: 1mm; }
.fp-card-dashed { border-style: dashed; }
.fp-card-scalloped { border-style: solid; box-shadow: 0 0 0 .5mm #fff, 0 0 0 1mm var(--fp-primary); }
.fp-card-face { font-family: 'Fredoka', sans-serif; font-size: 14pt; font-weight: 700; color: var(--fp-band); line-height: 1.1; }
.fp-card-symbol { font-size: 9mm; line-height: 1; }
.fp-card-cap { font-size: 8.4pt; font-weight: 700; color: #475569; }
.fp-card-note { font-size: 7.2pt; color: #94a3b8; font-style: italic; }
.fp-cardfield { display: flex; align-items: flex-end; gap: 1.4mm; font-size: 8.4pt; font-weight: 800; color: #475569; text-align: left; }
.fp-cardrule { flex: 1 1 auto; display: block; border-bottom: .45mm dotted #64748b; min-width: 10mm; height: .4mm; }

/* ── word bank ─────────────────────────────────────── */
.fp-bank { display: flex; flex-wrap: wrap; gap: 1.8mm; border: .6mm dashed var(--fp-primary); background: var(--fp-soft); border-radius: 3mm; padding: 2mm; margin-bottom: 2.4mm; }
.fp-bankword { font-family: 'Fredoka', sans-serif; font-size: 11pt; font-weight: 600; background: #fff; border: .4mm solid #dbeafe; border-radius: 2mm; padding: 1mm 2.4mm; }
.fp-sents { display: flex; flex-direction: column; gap: 1.6mm; }
.fp-sent { display: flex; align-items: baseline; gap: 2mm; font-size: 10.6pt; font-weight: 700; }
.fp-sentno { font-family: 'Fredoka', sans-serif; color: var(--fp-band); }
.fp-gap { display: inline-block; min-width: 26mm; border-bottom: .5mm dotted #64748b; margin: 0 1mm; height: .8em; }

/* ── comprehension ─────────────────────────────────── */
.fp-passage { position: relative; border: .5mm solid #e2e8f0; background: #fffdf7; border-radius: 4mm; padding: 3mm; margin-bottom: 2.4mm; }
.fp-passage-title { font-family: 'Fredoka', sans-serif; font-size: 13pt; margin: 0 0 1.6mm; color: var(--fp-band); }
.fp-passage-line { margin: 0 0 1.6mm; font-size: 11.6pt; line-height: 1.75; font-family: 'Comic Neue', 'Nunito', sans-serif; }
.fp-vocab { margin: 0 0 2mm; }
.fp-vocab h5 { font-family: 'Fredoka', sans-serif; font-size: 9.6pt; margin: 0 0 1mm; color: var(--fp-band); text-transform: uppercase; letter-spacing: .05em; }
.fp-vocab ol { margin: 0; padding-left: 5mm; font-size: 9.6pt; }

/* ── checklists / rewards ──────────────────────────── */
.fp-checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1.8mm; }
.fp-checklist li { display: flex; align-items: center; gap: 2.2mm; font-size: 10.4pt; font-weight: 700; }
.fp-mark-star { filter: drop-shadow(0 0 .3mm rgba(0,0,0,.15)); }
.fp-heart { font-size: 6mm; line-height: 1; color: ${PALETTE.pink}; border: .5mm solid ${PALETTE.pink}; border-radius: 1mm; padding: 0 1.2mm; }
.fp-checkfoot { margin: 2mm 0 0; font-size: 9.4pt; font-weight: 800; color: #475569; }
.fp-reward { background: linear-gradient(135deg, #fff9e8, #fff); }
.fp-praise p { margin: 0 0 1mm; font-family: 'Patrick Hand', cursive; font-size: 12pt; color: var(--fp-band); }
.fp-stickerrow { display: flex; gap: 2mm; margin-top: 1.5mm; }
.fp-stickerslot { flex: 1 1 auto; height: 13mm; border: .6mm dotted #cbd5e1; border-radius: 3mm; display: inline-flex; align-items: center; justify-content: center; background: #fff; }
.fp-signrow { display: flex; gap: 6mm; margin-top: 3mm; }
.fp-signline { flex: 1 1 auto; }
.fp-signname { display: block; min-height: 6mm; font-family: 'Patrick Hand', cursive; font-size: 10.5pt; }
.fp-signrule { display: block; border-bottom: .5mm solid #334155; }
.fp-signlabel { display: block; font-size: 8.4pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #475569; }

/* ── callouts ───────────────────────────────────────── */
.fp-callout { position: relative; overflow: hidden; border-left: 2.4mm solid var(--fp-primary); border-radius: 0 3mm 3mm 0; padding: 2mm 2.6mm; margin: 0 0 3.2mm; break-inside: avoid; }
.fp-callout h4 { font-family: 'Fredoka', sans-serif; font-size: 10.4pt; margin: 0 0 1mm; color: var(--fp-band); position: relative; }
.fp-callout h4 em { font-style: normal; color: ${PALETTE.purple}; margin-left: 1.5mm; }
.fp-callout ul { margin: 0; padding-left: 4.6mm; font-size: 9.2pt; color: #334155; position: relative; }
.fp-callout li { margin-bottom: .6mm; }

/* ── certificate ───────────────────────────────────── */
.fp-cert { position: relative; text-align: center; padding: 6mm 4mm 4mm; }
.fp-cert-medal { position: absolute; top: -3mm; right: -1mm; width: 34mm; height: 34mm; overflow: hidden; border-radius: 50%; box-shadow: 0 2mm 6mm rgba(15,42,74,.16); }
.fp-cert-medal img { width: 100%; display: block; }
.fp-cert-eyebrow { font-family: 'Fredoka', sans-serif; text-transform: uppercase; letter-spacing: .22em; font-size: 8.6pt; color: var(--fp-band); margin: 0; }
.fp-cert-award { font-family: 'Fredoka', sans-serif; font-size: 26pt; line-height: 1.1; margin: 2mm 0 1mm; color: ${PALETTE.navy}; }
.fp-cert-ribbon { display: inline-block; font-family: 'Fredoka', sans-serif; font-size: 9.4pt; font-weight: 700; color: #fff; padding: 1.2mm 4mm; border-radius: 99mm; margin: 0 0 3mm; }
.fp-cert-line { font-size: 12pt; margin: 0 0 2mm; color: #334155; }
.fp-learner { display: block; font-family: 'Patrick Hand', cursive; font-size: 26pt; color: var(--fp-band); border-bottom: .6mm dashed var(--fp-primary); padding: 0 4mm 1mm; margin: 1mm auto 3mm; }
.fp-cert-reason { display: inline-flex; flex-direction: column; gap: 1mm; border: .55mm dashed var(--fp-primary); border-radius: 4mm; padding: 2.4mm 4mm; background: var(--fp-soft); margin-bottom: 3mm; }
.fp-cert-reason-label { font-family: 'Fredoka', sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: .12em; color: var(--fp-band); }
.fp-cert-reason-text { font-family: 'Patrick Hand', cursive; font-size: 14pt; color: #1f2937; }
.fp-cert-meta { display: flex; justify-content: center; flex-wrap: wrap; gap: 4mm; font-size: 9.4pt; margin: 0 0 2mm; }
.fp-cert-meta b { font-family: 'Fredoka', sans-serif; color: var(--fp-band); display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; }
.fp-cert-stickers { display: flex; justify-content: center; gap: 2mm; margin: 1mm 0 2mm; }
.fp-cert-message { font-family: 'Patrick Hand', cursive; font-size: 13pt; color: #475569; margin: 1mm 0 4mm; }
.fp-cert-signs { margin-top: 6mm; text-align: left; }
.fp-cert-signs .fp-signblock { flex: 1 1 0; }

/* ── memo ───────────────────────────────────────────── */
.fp-memo { border: .55mm solid #bbf7d0; background: #f2fdf5; border-radius: 4mm; padding: 3mm; break-inside: avoid; margin-top: 3mm; }
.fp-memo-head { display: flex; align-items: center; justify-content: space-between; gap: 3mm; margin-bottom: 1.6mm; }
.fp-memo-head h3 { font-family: 'Fredoka', sans-serif; font-size: 12pt; margin: 0; color: #15803d; }
.fp-memo-total { font-family: 'Fredoka', sans-serif; font-size: 9.4pt; background: #16a34a; color: #fff; border-radius: 99mm; padding: .8mm 3mm; }
.fp-memo-table { font-size: 9pt; background: #fff; }
.fp-memo-ref { width: 14mm; font-family: 'Fredoka', sans-serif; color: #15803d; font-weight: 700; }
.fp-memo-marks { width: 16mm; text-align: center; }
.fp-memo-table i { color: #64748b; }

/* ── footer ─────────────────────────────────────────── */
.fp-foot { margin-top: 4mm; }
.fp-foot-text { display: flex; justify-content: space-between; align-items: center; gap: 3mm; font-size: 7.4pt; color: #64748b; margin: 1mm 0 0; font-family: 'Fredoka', sans-serif; letter-spacing: .02em; flex-wrap: wrap; }
.fp-foot-text b { color: ${PALETTE.navy}; }
.fp-scall-top { transform: rotate(180deg); margin-bottom: -1mm; }

/* ── accessibility variants ─────────────────────────── */
.fp-large .fp-page { font-size: 12pt; }
.fp-large .fp-item-text, .fp-large .fp-passage-line { font-size: 14pt; letter-spacing: .02em; }
.fp-large .fp-instruction { font-size: 11.6pt; }
.fp-large .fp-block { padding: 4mm; }
.fp-large .fp-wline { height: 15mm; }
.fp-large .fp-tracemodel, .fp-large .fp-ghost { font-size: 16mm; }
.fp-large .fp-countdot { font-size: 9.5mm; }

.fp-ink .fp-page { border-color: #334155; }
.fp-ink .fp-block:nth-of-type(even) { background: #fff; }
.fp-ink .fp-pill, .fp-ink .fp-badge, .fp-ink .fp-marks, .fp-ink .fp-marks * { color: #1f2937 !important; background: #fff !important; }
.fp-ink .fp-pill.caps { background: #fff !important; }
.fp-ink .fp-caps, .fp-ink .fp-callout, .fp-ink .fp-memo { background: #fff; }
.fp-ink .fp-scorebox { border-color: #334155; background: #fff; }
.fp-ink .fp-confetti { opacity: .18; }
.fp-ink .fp-cert-award, .fp-ink .fp-title { color: #000; }
.fp-ink .fp-ghost { -webkit-text-stroke: .35mm #64748b; }
.fp-ink .fp-art img { filter: grayscale(.82) contrast(1.05); }

@media screen {
  .fp-root { padding: 6mm 0; background: #eef4fb; }
  .fp-page { box-shadow: 0 12px 34px rgba(15,42,74,.18); }
}
@media print {
  @page { size: A4 portrait; margin: 8mm; }
  html, body { background: #fff !important; }
  .fp-root { padding: 0 !important; background: #fff !important; }
  .fp-page { box-shadow: none !important; margin: 0 auto !important; width: 100% !important; min-height: auto !important; border-width: 2mm !important; }
  .fp-noprint { display: none !important; }
  .fp-block, .fp-callout, .fp-memo, .fp-card, .fp-countcard, .fp-item, .fp-cert { break-inside: avoid; page-break-inside: avoid; }
  .fp-page-break { break-before: page; page-break-before: always; }
}
`;

/* ─────────────────────────── page-count estimator ───────────────────────────
 * The Studio labels each sheet with a computed A4 page count instead of an
 * authored guess. The model below mirrors the actual print CSS heights (in mm)
 * closely enough to flag the sheets that spill onto a second page, so a teacher
 * never discovers the overflow at the photocopier.
 */
const PAGE_HEIGHT_MM = 274;

const taskHeight = (items: Array<{ lines?: number; options?: string[]; parts?: string[]; copyWords?: string[] }>): number =>
    items.reduce(
        (sum, it) =>
            sum +
            11 +
            (it.lines ?? (it.options?.length || it.copyWords?.length ? 0 : 1)) * 12 +
            (it.options?.length ? 9 : 0) +
            (it.copyWords?.length ? 22 : 0) +
            (it.parts?.length ? it.parts.length * 6 : 0),
        6,
    );

export const estimatePageHeightMm = (tpl: FoundationTemplate, opts?: { includeMemo?: boolean }): number => {
    const isAward = tpl.kind === 'award';
    let mm = 30 /* banner */ + 16 /* name / date / score strip */ + (isAward ? 18 : 34) /* caps strip */ + 14 /* footer */;
    const includeMemo = opts?.includeMemo !== false;
    for (const b of tpl.blocks as Block[]) {
        if (b.kind === 'memo' && (!includeMemo || tpl.options?.hideMemo)) continue;
        switch (b.kind) {
            case 'task':
                mm += taskHeight(b.items);
                break;
            case 'trace':
                mm += b.items.length * 14 + (b.frames?.length ? 16 : 0);
                break;
            case 'count':
                mm += Math.ceil(b.items.length / 2) * 30;
                break;
            case 'match':
                mm += Math.max(b.left.length, b.right.length) * 15 + 12;
                break;
            case 'colour-circle':
                mm += Math.ceil(b.items.length / (b.layout === 'grid' ? 3 : 6)) * 26 + 12;
                break;
            case 'grid':
                mm += b.variant === 'boxes' ? b.rows.length * ((b.cellSize ?? 13) + 4) + 10 : (b.rows.length + 1) * ((b.cellSize ?? 13) + 1.5);
                break;
            case 'cut-paste':
                mm += b.slots.length * 14 + Math.ceil(b.pieces.length / 4) * 20 + 12;
                break;
            case 'word-bank':
                mm += 20 + b.sentences.length * 12;
                break;
            case 'comprehension':
                mm += 16 + b.passage.length * 9 + (b.vocabulary?.length ? 10 + b.vocabulary.length * 6 : 0) + taskHeight(b.questions);
                break;
            case 'checklist':
                mm += 14 + b.items.length * 12 + (b.footer ? 8 : 0);
                break;
            case 'reward':
                mm += 34;
                break;
            case 'callout':
                mm += 14 + b.lines.length * 9;
                break;
            case 'certificate':
                mm += 132 + (b.signatures?.length ? 16 : 0) + (b.stickers ? 10 : 0);
                break;
            case 'cards':
                mm += Math.ceil(b.cards.length / (b.perRow ?? 4)) * (32 + (b.cardFields?.length ?? 0) * 7) + 12;
                break;
            case 'movement':
                mm += 18 + b.steps.length * 13;
                break;
            case 'oral-pairs':
                mm += 22 + b.frames.length * 13 + b.prompts.length * 7;
                break;
            case 'data-table':
                mm += (b.rows.length + 1) * 12 + taskHeight(b.questions ?? []);
                break;
            case 'rubric':
                mm += (b.criteria.length + 1) * 22 + 10;
                break;
            case 'memo':
                mm += 18 + Math.max(b.items.length, tpl.caps.memo?.length ?? 0) * 11;
                break;
            default:
                mm += 20;
        }
        mm += 6.5; /* block chrome: title rule + margins */
    }
    return mm;
};

/** 1, 2, 3 … A4 pages this template needs at 100 % scale. */
export const estimatePageCount = (tpl: FoundationTemplate, opts?: { includeMemo?: boolean }): number =>
    Math.max(1, Math.ceil(estimatePageHeightMm(tpl, opts) / PAGE_HEIGHT_MM));

const themeVars = (t: Theme): string =>
    `--fp-primary:${t.primary};--fp-band:${t.band};--fp-soft:${t.soft};`;

const fieldStrip = (tpl: FoundationTemplate, ctx: Ctx): string => {
    const t = ctx.opts.fields ?? {};
    const lang = ctx.opts.labelLanguage ?? 'en';
    const bi = ctx.opts.bilingual && lang !== 'en';
    if (tpl.kind === 'award') {
        const school = t.school ? esc(t.school) : '________________________________';
        return `<div class="fp-learnerstrip" style="align-items:center">
      <div class="fp-field" style="flex:1 1 auto"><b>${bi ? pair('school', lang) : 'School'}</b><span class="fp-underline">${school}</span></div>
      <div class="fp-scorebox"><b>${bi ? pair('term', lang) + ' · ' + pair('week', lang) : 'Term / Week'}</b><span style="font-family:Fredoka;font-size:10pt">${esc(t.term || 'Term ____ · Week ____')}</span></div>
    </div>`;
    }
    const cells: Array<[string, string, string]> = [
        [bi ? pair('name', lang) : 'Name', t.learner ? esc(t.learner) : '', '2 1'],
        [bi ? pair('date', lang) : 'Date', t.date ? esc(t.date) : '', '1'],
        [bi ? pair('class', lang) : 'Class', t.class ? esc(t.class) : '', '1'],
    ];
    return `<div class="fp-learnerstrip">
      ${cells
          .map(
              ([label, value, flex]) =>
                  `<div class="fp-field" style="flex:${flex} 1 auto"><b>${esc(label)}</b><span class="fp-underline">${value || ''}</span></div>`,
          )
          .join('')}
      <div class="fp-scorebox"><b>${bi ? `${pair('score', lang)} / ${pair('marks', lang)}` : 'Score / Marks'}</b>
        <span style="display:block"><span class="fp-box"></span><span class="fp-box"></span> / <span class="fp-box"></span><span class="fp-box"></span></span>
      </div>
    </div>`;
};

const capsStrip = (tpl: FoundationTemplate, ctx: Ctx, compact = false): string => {
    const lang = ctx.opts.labelLanguage ?? 'en';
    const bi = ctx.opts.bilingual && lang !== 'en';
    const c = tpl.caps;
    const grades = tpl.grades.join(', ').replace(/\bR\b/, 'R');
    const marks = c.marks ? `${c.marks}` : 'Not marked / informal';
    const rows: Array<[string, string]> = [
        [bi ? `${pair('subject', lang)}` : 'CAPS learning area', `${tpl.learningArea} · Grade ${grades}`],
        ['Content area', c.contentArea],
        [bi ? pair('week', lang) : 'ATP placement', c.terms.join(' · ')],
        [bi ? pair('time', lang) : 'Time on task', c.timeOnTask],
        ['Skills practised', c.skills.join('; ')],
        ['Assessment', `${c.asRef ? c.asRef + ' · ' : ''}${marks}${c.marks ? ' marks' : ''}`],
        ['Setting', c.setting],
        ['Weekly allocation', SUBJECT_ALLOCATION[tpl.learningArea]?.[(tpl.grades[0] === 'R-1' || tpl.grades[0] === 'R-3' ? 'R' : tpl.grades[0]) as 'R' | '1' | '2' | '3'] ?? 'per timetable'],
    ];
    return `<div class="fp-caps${compact ? ' fp-caps-compact' : ''}">
  <h4>${compact ? 'Teacher record — ' : ''}${bi ? `${pair('assessment', lang)} · ` : ''}CAPS alignment (DBE, Foundation Phase)</h4>
  <dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  <p class="fp-caps-note">${esc(c.capsNote)} · Bloom's: ${c.blooms.join(', ')}.</p>
</div>`;
};

const banner = (tpl: FoundationTemplate, ctx: Ctx): string => {
    const t = ctx.theme;
    const kindMeta = KIND_META[tpl.kind];
    const lang = ctx.opts.labelLanguage ?? 'en';
    const bi = ctx.opts.bilingual && lang !== 'en';
    const art = tpl.art ? artImg(tpl.art, ctx.opts.assetMode ?? 'app', { size: tpl.kind === 'award' ? 54 : 46 }) : '';
    const pills: string[] = [
        `<span class="fp-pill caps">${kindMeta.emoji} ${esc(kindMeta.label.replace(/ & |s$/, ' '))}</span>`,
        ...tpl.grades.map((g) => `<span class="fp-pill">Grade ${esc(g)}</span>`),
        `<span class="fp-pill">${esc(tpl.learningArea)}</span>`,
        `<span class="fp-pill">Term ${esc(tpl.caps.terms[0]?.replace(/^Term\s*/, '') || '1–4')}</span>`,
        `<span class="fp-pill bloom">${esc(tpl.caps.blooms.join(' → '))}</span>`,
    ];
    if (bi) pills.push(`<span class="fp-pill">${pair('haveFun', lang)}</span>`);
    return `<header class="fp-banner">
  <div class="fp-banner-text">
    <p class="fp-kicker">${esc(tpl.titleKicker ?? `${kindMeta.emoji} EduAI Companion · CAPS Foundation Phase`)}</p>
    <h1 class="fp-title">${esc(tpl.title)}</h1>
    <p class="fp-subtitle">${esc(tpl.subtitle)}</p>
  </div>
  ${art}
</header>
<div class="fp-badge-row">${pills.join('')}</div>`;
};

const corners = (tpl: FoundationTemplate, ctx: Ctx): string => {
    if (ctx.opts.inkSaver) return '';
    const t = ctx.theme;
    return `<div class="fp-corners" aria-hidden="true">
  <span class="fp-corner tl">${doodleSun(24)}</span>
  <span class="fp-corner tr">${doodleCloud(20)}</span>
  <span class="fp-corner bl">${doodleStar(t.secondary, 18)}</span>
  <span class="fp-corner br">${tpl.kind === 'award' ? doodleRosette(30, t.secondary, '★') : doodleStar(t.primary, 18)}</span>
</div>`;
};

const footer = (tpl: FoundationTemplate, ctx: Ctx): string => {
    const t = ctx.theme;
    const grade = tpl.grades[0] === 'R' || tpl.grades.length > 1 ? tpl.grades.join('/') : tpl.grades[0];
    const brand = ctx.opts.brand ?? 'EduAI Companion · CAPS Compliant Educational Resource';
    const teacher = ctx.opts.fields?.teacher ? ` · ${esc(ctx.opts.fields.teacher)}` : '';
    return `<footer class="fp-foot">
  ${scallopBand(t.primary)}
  <p class="fp-foot-text">
    <span><b>${esc(brand)}</b>${teacher}</span>
    <span>${esc(capsFooterLine(grade, tpl.learningArea))}</span>
    <span>${tpl.caps.timeOnTask} · ${tpl.caps.marks ? `${tpl.caps.marks} marks` : 'informal checklist'}</span>
  </p>
</footer>`;
};

/** One A4 page of a template (style + markup), safe to drop into an iframe. */
export const renderTemplatePage = (tpl: FoundationTemplate, opts: RenderOptions = {}): string => {
    const theme = themeFor(tpl.theme);
    const ctx: Ctx = { opts, theme };
    const showMemo = opts.showMemo !== false && !tpl.options?.hideMemo;
    // A memo block may be authored empty — the CAPS alignment data is the single
    // source of truth for answers, so the two can never drift apart.
    const withMemoData = (tpl.blocks as Block[]).map((b) =>
        b.kind === 'memo' && (!b.items || b.items.length === 0)
            ? { ...b, items: tpl.caps.memo ?? [], total: b.total ?? tpl.caps.marks }
            : b,
    );
    const hasMemo = withMemoData.some((b) => b.kind === 'memo');
    const blocks = (
        showMemo && !hasMemo && tpl.caps.memo?.length
            ? [...withMemoData, { kind: 'memo', id: 'memo-auto', title: 'Memo / marking guide', items: tpl.caps.memo, total: tpl.caps.marks } as Block]
            : withMemoData
    ).filter((b) => (b.kind === 'memo' ? showMemo : true));
    const rootClass = ['fp-root', opts.largePrint ? 'fp-large' : '', opts.inkSaver ? 'fp-ink' : '']
        .filter(Boolean)
        .join(' ');
    const isAward = tpl.kind === 'award';
    // A certificate must look like a certificate: on awards the CAPS strip is
    // demoted to a compact teacher record at the foot of the page instead of
    // sitting above the learner's name.
    const capsHtml = capsStrip(tpl, ctx, isAward);
    return `<div class="${rootClass}" style="${themeVars(theme)}">
  <div class="fp-page" data-template="${esc(tpl.id)}" data-kind="${tpl.kind}">
    ${corners(tpl, ctx)}
    ${confettiStrip(isAward ? 34 : 18, tpl.id.length * 31 + 7)}
    ${isAward ? `<div class="fp-rainbow">${rainbowArc()}</div>` : ''}
    ${banner(tpl, ctx)}
    ${fieldStrip(tpl, ctx)}
    ${isAward ? '' : capsHtml}
    ${blocks.map((b) => renderBlock(b, ctx)).join('\n')}
    ${isAward ? capsHtml : ''}
    ${footer(tpl, ctx)}
  </div>
</div>`;
};

/** Full standalone .html document (print + Save as PDF ready). */
export const buildStandaloneDocument = (tpl: FoundationTemplate, opts: RenderOptions = {}): string => {
    const page = renderTemplatePage(tpl, opts);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(tpl.title)} · EduAI Companion CAPS Foundation Phase</title>
<meta name="description" content="${esc(tpl.blurb)}" />
<style>${FP_CSS}</style>
<style>body{margin:0;background:#eef4fb;font-family:'Nunito',system-ui,sans-serif}.fp-toolbar{max-width:190mm;margin:0 auto 4mm;display:flex;flex-wrap:wrap;gap:2mm;align-items:center;justify-content:space-between;padding:0 2mm}.fp-toolbar h2{font:600 11pt 'Fredoka',sans-serif;color:#1e3a5f;margin:0}.fp-btn{font:600 10pt 'Fredoka',sans-serif;border:0;border-radius:99mm;padding:2.4mm 5mm;background:#06b6d4;color:#fff;cursor:pointer;box-shadow:0 2mm 6mm rgba(6,182,212,.3)}.fp-btn.alt{background:#9b59b6;box-shadow:0 2mm 6mm rgba(155,89,182,.28)}.fp-btn.ghost{background:#fff;color:#1e3a5f;border:1px solid #cbd5e1;box-shadow:none}@media print{.fp-toolbar{display:none!important}}</style>
</head>
<body>
<div class="fp-toolbar fp-noprint">
  <h2>${esc(tpl.title)} — ≈${estimatePageCount(tpl)} × A4 at 100 % scale · print in colour</h2>
  <div>
    <button class="fp-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <a class="fp-btn alt" href="index.html">📚 All templates</a>
  </div>
</div>
${page}
</body>
</html>`;
};

/** Several templates in one A4 document (one page each, print-all support). */
export const buildBundleDocument = (
    templates: FoundationTemplate[],
    opts: RenderOptions = {},
    title = 'EduAI Companion — CAPS Foundation Phase Template Pack',
): string => {
    const pages = templates.map((tpl, i) => `<div class="${i ? 'fp-page-break' : ''}">${renderTemplatePage(tpl, opts)}</div>`).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>${FP_CSS}</style>
<style>body{margin:0;background:#eef4fb;font-family:'Nunito',system-ui,sans-serif}.fp-toolbar{max-width:190mm;margin:0 auto 4mm;padding:0 2mm;display:flex;gap:2mm;align-items:center;justify-content:space-between}.fp-btn{font:600 10pt 'Fredoka',sans-serif;border:0;border-radius:99mm;padding:2.4mm 5mm;background:#06b6d4;color:#fff;cursor:pointer}.fp-page-break{break-before:page;page-break-before:always;margin-top:6mm}@media print{.fp-toolbar{display:none!important}}</style>
</head>
<body>
<div class="fp-toolbar fp-noprint">
  <b>${templates.length} templates · ${esc(title)}</b>
  <button class="fp-btn" onclick="window.print()">🖨️ Print all (${templates.length} pages)</button>
</div>
${pages}
</body>
</html>`;
};

/** The pack landing page: every template, filterable, printable from a browser. */
export const buildPackIndex = (
    templates: FoundationTemplate[],
    opts: RenderOptions = {},
    meta: { generatedAt?: string; note?: string } = {},
): string => {
    const cards = templates
        .map(
            (tpl) => {
                const kindMeta = KIND_META[tpl.kind];
                return `<a class="pc" href="${esc(tpl.id)}.html" style="--k:${kindMeta.color}">
  <span class="pc-emoji">${kindMeta.emoji}</span>
  <b>${esc(tpl.title)}</b>
  <span class="pc-tags">${tpl.grades.map((g) => `<i>Grade ${esc(g)}</i>`).join('')}<i>${esc(tpl.learningArea)}</i></span>
  <span class="pc-blurb">${esc(tpl.blurb)}</span>
  <span class="pc-foot"><i>${esc(tpl.caps.timeOnTask)}</i><i>${tpl.caps.marks ? `${tpl.caps.marks} marks` : 'checklist'}</i><i>${esc(tpl.caps.terms[0] ?? 'All terms')}</i></span>
</a>`;
            }
        )
        .join('\n');
    const groups = (Object.keys(KIND_META) as Array<keyof typeof KIND_META>)
        .map((kind) => {
            const list = templates.filter((t) => t.kind === kind);
            if (!list.length) return '';
            return `<section class="grp" id="${kind}">
  <h2 style="--k:${KIND_META[kind].color}">${KIND_META[kind].emoji} ${esc(KIND_META[kind].label)} <small>${list.length}</small></h2>
  <p class="grp-blurb">${esc(KIND_META[kind].blurb)}</p>
  <div class="grid">${list
      .map(
          (tpl) => `<a class="pc" href="${esc(tpl.id)}.html" style="--k:${KIND_META[kind].color}">
    <span class="pc-emoji">${KIND_META[kind].emoji}</span>
    <b>${esc(tpl.title)}</b>
    <span class="pc-tags">${tpl.grades.map((g) => `<i>Grade ${esc(g)}</i>`).join('')}<i>${esc(tpl.learningArea)}</i></span>
    <span class="pc-blurb">${esc(tpl.blurb)}</span>
    <span class="pc-foot"><i>${esc(tpl.caps.timeOnTask)}</i><i>${tpl.caps.marks ? `${tpl.caps.marks} marks` : 'checklist'}</i><i>${esc(tpl.caps.terms[0] ?? 'All terms')}</i></span>
  </a>`,
      )
      .join('')}</div>
</section>`;
        })
        .join('\n');
    void cards;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>EduAI Companion — CAPS Foundation Phase Printable Pack</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');
*{box-sizing:border-box}
body{margin:0;font-family:'Nunito',system-ui,sans-serif;color:#12233f;background:linear-gradient(160deg,#fff9e8,#e0f7ff 45%,#ffe6f2)}
.wrap{max-width:1180px;margin:0 auto;padding:28px 20px 60px}
header{position:relative;overflow:hidden;border-radius:26px;padding:26px 26px 22px;background:#06b6d4;color:#fff;box-shadow:0 18px 40px rgba(6,182,212,.28)}
header:after{content:"";position:absolute;inset:auto -10% -60% -10%;height:80px;background:radial-gradient(closest-side,#fff8 0,#fff0 100%)}
.kick{font:600 12px/1 'Fredoka',sans-serif;letter-spacing:.22em;text-transform:uppercase;opacity:.92}
h1{font-family:'Fredoka',sans-serif;font-size:clamp(28px,4vw,44px);margin:8px 0 6px;line-height:1.05}
.sub{margin:0;max-width:70ch;font-size:15px;opacity:.96}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.chip{font:600 12px 'Fredoka',sans-serif;background:#fff;color:#0e7490;border-radius:99px;padding:6px 12px}
.chip.a{background:#ffdf40;color:#7a4b00}.chip.b{background:#ff69b4;color:#fff}.chip.c{background:#2ed573;color:#065f46}
.quicklinks{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 4px}
.quicklinks a,.quicklinks button{font:600 13px 'Fredoka',sans-serif;border:0;border-radius:99px;padding:9px 14px;background:#fff;color:#1e3a5f;text-decoration:none;box-shadow:0 4px 12px rgba(15,42,74,.1);cursor:pointer}
.quicklinks a:hover,.quicklinks button:hover{background:#ffdf40}
.grp{margin-top:30px}
.grp h2{font-family:'Fredoka',sans-serif;font-size:22px;margin:0 0 4px;display:flex;align-items:center;gap:8px;color:var(--k)}
.grp h2 small{font-size:12px;background:var(--k);color:#fff;border-radius:99px;padding:3px 9px}
.grp-blurb{margin:0 0 12px;color:#475569;font-size:13.5px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:14px}
.pc{display:flex;flex-direction:column;gap:7px;background:#fff;border-radius:18px;padding:16px 16px 12px;text-decoration:none;color:inherit;border-top:6px solid var(--k);box-shadow:0 10px 24px rgba(15,42,74,.09);transition:transform .16s ease,box-shadow .16s ease}
.pc:hover{transform:translateY(-4px);box-shadow:0 18px 34px rgba(15,42,74,.16)}
.pc-emoji{font-size:24px}
.pc b{font-family:'Fredoka',sans-serif;font-size:16px;line-height:1.2}
.pc-tags{display:flex;flex-wrap:wrap;gap:5px}
.pc-tags i{font-style:normal;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;background:#f1f5f9;color:#334155;border-radius:6px;padding:3px 6px}
.pc-blurb{font-size:12.5px;color:#475569;line-height:1.5}
.pc-foot{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:6px;border-top:1px dashed #e2e8f0}
.pc-foot i{font-style:normal;font-size:11px;color:#64748b}
.note{margin-top:28px;background:#fff;border-left:8px solid #ffdf40;border-radius:0 16px 16px 0;padding:14px 16px;font-size:13px;color:#334155}
footer{margin-top:26px;font-size:12px;color:#475569;text-align:center}
@media print{body{background:#fff}.quicklinks,.grp h2 small{display:none}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <p class="kick">EduAI Companion · CAPS compliant · Foundation Phase</p>
  <h1>Grade R–3 Printable Template Pack 🎨</h1>
  <p class="sub">Awards for good academic achievement, worksheets, classroom exercises and homework — bright, cartoon-styled and ready for the photocopier. Every sheet carries its CAPS content area, ATP placement, time on task, marks and memo.</p>
  <div class="chips">
    <span class="chip">${templates.length} templates</span>
    <span class="chip a">🏆 ${templates.filter((t) => t.kind === 'award').length} awards</span>
    <span class="chip b">✏️ ${templates.filter((t) => t.kind === 'worksheet').length} worksheets</span>
    <span class="chip c">🎒 ${templates.filter((t) => t.kind === 'homework').length} homework · 🎲 ${templates.filter((t) => t.kind === 'classroom').length} classroom</span>
    <span class="chip">A4 · print in colour</span>
  </div>
  <div class="quicklinks">
    <a href="all-templates.html">🖨️ Print every template in one go</a>
    <a href="#award">Awards</a><a href="#worksheet">Worksheets</a><a href="#classroom">Classroom</a><a href="#homework">Homework</a>
    <button onclick="window.print()">Print this index</button>
  </div>
</header>
${groups}
${meta.note ? `<p class="note">${esc(meta.note)}</p>` : ''}
<footer>
  ${esc(meta.generatedAt ? `Generated ${meta.generatedAt} · ` : '')}CAPS Grades R–3 (DBE 2011, as amended) · Illustrations: Elly the EduAI mascot · Rights reserved to the developer, Z Msuthu (© 2026)
</footer>
</div>
</body>
</html>`;
};

export { confettiStrip };
