/**
 * Builds the standalone CAPS Foundation Phase printable pack.
 *
 * Renders every template in `src/lib/templates/foundation` to a self-contained
 * A4 HTML file so a teacher can double-click it, print it, or drop it on a
 * school USB stick — no app, no login, no AI token, no network needed (the
 * Google Fonts import simply falls back to system fonts when offline).
 *
 * Run:  npx tsx scripts/build-foundation-template-pack.ts
 *   or: npm run build:fp-templates
 *
 * Output (committed, deterministic — same source data always regenerates the
 * same files):
 *   public/templates/foundation-phase/index.html        ← gallery + print links
 *   public/templates/foundation-phase/all-templates.html← every sheet, one print job
 *   public/templates/foundation-phase/<template-id>.html
 *   public/templates/foundation-phase/README.md         ← manifest + CAPS table
 *
 * Images are referenced relatively (../../illustrations/foundation/*.png) so the
 * pack works from the repo folder AND when the folder is copied elsewhere with
 * its sibling `illustrations/foundation` artwork.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    FOUNDATION_LIBRARY_STATS,
    FOUNDATION_TEMPLATES,
    KIND_META,
    buildBundleDocument,
    buildPackIndex,
    buildStandaloneDocument,
    estimatePageCount,
    type RenderOptions,
} from '../src/lib/templates/foundation';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outDir = join(repoRoot, 'public/templates/foundation-phase');

const BASE: RenderOptions = {
    assetMode: 'standalone',
    labelLanguage: 'xh',
    bilingual: true,
    brand: 'EduAI Companion · CAPS Compliant Foundation Phase Pack',
};

const today = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });

mkdirSync(outDir, { recursive: true });

const manifest: string[] = [
    '# CAPS Foundation Phase Printable Pack (Grade R–3)',
    '',
    `Generated ${today} by \`npx tsx scripts/build-foundation-template-pack.ts\`.`,
    'Source of truth: `src/lib/templates/foundation/` — edit the data there and re-run; never hand-edit the HTML in this folder.',
    '',
    `**${FOUNDATION_LIBRARY_STATS.total} templates** · 🏆 ${FOUNDATION_LIBRARY_STATS.awards} awards · ✏️ ${FOUNDATION_LIBRARY_STATS.worksheets} worksheets · 🎲 ${FOUNDATION_LIBRARY_STATS.classroom} classroom exercises · 🎒 ${FOUNDATION_LIBRARY_STATS.homework} homework · ${FOUNDATION_LIBRARY_STATS.withMemo} with a printed memo.`,
    '',
    '## How to use',
    '',
    '1. Open `index.html` in any browser (double-click works) and pick a template,',
    '   or open a single `<template-id>.html` file directly.',
    '2. Press **Print / Save as PDF** on the page. Choose A4, portrait, margins "Default",',
    '   and **tick "Background graphics"** so the colour borders and cartoon art survive.',
    '3. Need the whole week at once? `all-templates.html` prints every template as one job.',
    '',
    '### Print tips',
    '- Colour laser/inkjet: print at 100 % (no "fit to page" — it clips the border).',
    '- Photocopying in black & white: the sheets stay legible; the only loss is the',
    '  cartoon art. Set the copier to "Photo"/mixed mode for the awards.',
    '- To re-fill the learner/school/date lines after printing, edit the data file and',
    '  rebuild — or type into the browser copy in the app Studio (brighter workflow).',
    '',
    '## Contents',
    '',
];

for (const kind of ['award', 'worksheet', 'classroom', 'homework'] as const) {
    const list = FOUNDATION_TEMPLATES.filter((t) => t.kind === kind);
    manifest.push('', `### ${KIND_META[kind].emoji} ${KIND_META[kind].label}`, '');
    manifest.push('| File | Title | Grades | CAPS learning area | Content area | Term / weeks | Time | Marks | A4 |');
    manifest.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
    for (const tpl of list) {
        const row = [
            `\`./${tpl.id}.html\``,
            tpl.title.replace(/\|/g, '\\|'),
            tpl.grades.join(' · '),
            tpl.learningArea,
            tpl.caps.contentArea.replace(/\|/g, '\\|'),
            tpl.caps.terms.join('; '),
            tpl.caps.timeOnTask,
            tpl.caps.marks ? `${tpl.caps.marks}` : '—',
            `${estimatePageCount(tpl)} p`,
        ];
        manifest.push(`| ${row.join(' | ')} |`);
    }
}

manifest.push(
    '',
    '## Notes for Foundation Phase teachers',
    '',
    '- Every sheet carries its own **CAPS alignment strip** (content area, skills, ATP placement,',
    '  time on task, marks, Bloom\'s level) so a subject advisor can check compliance on the paper.',
    '- Instruction labels are **bilingual (English + isiXhosa short classroom verbs)**. To switch to',
    '  isiZulu or Afrikaans, change `labelLanguage` in this script (or the Studio toggle) and rebuild.',
    '- Memo pages print by default. For a marked test, rebuild with `showMemo: false`, or simply',
    '  fold/trim the memo before photocopying the class set.',
    '- Artwork: Elly the EduAI mascot + cartoon props in `public/illustrations/foundation/`.',
    '  These are original generated files — never overwrite them (AGENTS.md asset rules).',
    '',
);

let bytes = 0;
for (const tpl of FOUNDATION_TEMPLATES) {
    const html = buildStandaloneDocument(tpl, BASE);
    writeFileSync(join(outDir, `${tpl.id}.html`), html, 'utf8');
    bytes += Buffer.byteLength(html);
    console.log(`✓ ${tpl.id}.html`.padEnd(52), `${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`, `· ${tpl.grades.join('/')} · ${tpl.learningArea}`);
}

const bundle = buildBundleDocument(FOUNDATION_TEMPLATES, BASE, 'EduAI Companion — CAPS Foundation Phase Pack (all templates)');
writeFileSync(join(outDir, 'all-templates.html'), bundle, 'utf8');
bytes += Buffer.byteLength(bundle);

const index = buildPackIndex(FOUNDATION_TEMPLATES, BASE, {
    generatedAt: today,
    note:
        'Tip: open a card, press Print / Save as PDF, choose A4 and tick "Background graphics" so the colour borders and cartoon art survive. Every sheet is built for the Foundation Phase photocopier: large type, thick tracing lines, big tick boxes and a memo where marks apply.',
});
writeFileSync(join(outDir, 'index.html'), index, 'utf8');
bytes += Buffer.byteLength(index);

writeFileSync(join(outDir, 'README.md'), manifest.join('\n') + '\n', 'utf8');

console.log(
    `\n✅ ${FOUNDATION_TEMPLATES.length + 2} files written to public/templates/foundation-phase (${(bytes / 1024 / 1024).toFixed(2)} MB of HTML)`,
);
console.log('   Start with: public/templates/foundation-phase/index.html');
