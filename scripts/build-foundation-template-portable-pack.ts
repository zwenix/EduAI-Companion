/**
 * Assembles the *portable* Foundation Phase printable pack — the version you can
 * email, WhatsApp, put on a USB stick, or open on a school/parent device with no
 * EduAI login, no app, no internet.
 *
 * It is just a copy of the generated pack (public/templates/foundation-phase)
 * with its artwork placed next to it, so the relative `../../illustrations/...`
 * image references still resolve, plus a `START-HERE.html` launcher at the root
 * of the folder (a rewritten copy of the pack index, so one double-click opens
 * the gallery and every card link still works).
 *
 * Run:  npm run build:fp-templates   (regenerate the source pack first)
 *       npm run build:fp-pack
 *
 * Output (git-ignored by default — it is a generated artefact):
 *   <out>/START-HERE.html                     ← double-click this
 *   <out>/HOW-TO-PRINT.txt
 *   <out>/templates/foundation-phase/*.html   ← 28 sheets + print-all + index
 *   <out>/illustrations/foundation/*.png      ← the cartoon artwork
 *
 * Then zip/copy <out> anywhere. Override the destination with FP_PACK_OUT, e.g.
 *   FP_PACK_OUT=/tmp/fp-pack npx tsx scripts/build-foundation-template-portable-pack.ts
 */

import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACK_SRC = join(ROOT, 'public', 'templates', 'foundation-phase');
const ART_SRC = join(ROOT, 'public', 'illustrations', 'foundation');
const OUT = process.env.FP_PACK_OUT ? resolve(process.env.FP_PACK_OUT) : join(ROOT, 'build', 'foundation-phase-pack');

const TPL_REL = 'templates/foundation-phase';
const ART_REL = 'illustrations/foundation';

function ensureDir(dir: string) {
    mkdirSync(dir, { recursive: true });
}

function human(bytes: number) {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

if (readdirSync(PACK_SRC).filter((f) => f.endsWith('.html')).length < 30) {
    throw new Error(
        'public/templates/foundation-phase looks empty or partial — run `npm run build:fp-templates` first so the portable pack is built from current sources.',
    );
}

ensureDir(join(OUT, TPL_REL));
ensureDir(join(OUT, ART_REL));

let files = 0;
let bytes = 0;

/* ── 1. the A4 sheets ─────────────────────────────────────────────────── */
for (const file of readdirSync(PACK_SRC).sort()) {
    if (!/\.(html|md)$/.test(file)) continue;
    const from = join(PACK_SRC, file);
    const to = join(OUT, TPL_REL, file);
    copyFileSync(from, to);
    files++;
    bytes += statSync(to).size;
}

/* ── 2. the artwork they reference ────────────────────────────────────── */
let artCount = 0;
for (const file of readdirSync(ART_SRC).sort()) {
    if (!file.endsWith('.png')) continue;
    const to = join(OUT, ART_REL, file);
    copyFileSync(join(ART_SRC, file), to);
    artCount++;
    files++;
    bytes += statSync(to).size;
}

/* ── 3. root launcher: pack index with paths re-pointed into the folders ─ */
const indexSrc = readFileSync(join(PACK_SRC, 'index.html'), 'utf8');
const launcher = indexSrc
    .replace(/href="(?![a-zA-Z0-9._-]*:\/\/|\/|#|\.\.\/|mailto:)([A-Za-z0-9._-]+\.html)"/g, (_m, f: string) => `href="${TPL_REL}/${f}"`)
    .replace(/\.\.\/\.\.\/illustrations\/foundation\//g, `${ART_REL}/`)
    .replace(/<title>[\s\S]*?<\/title>/, '<title>CAPS Foundation Phase Pack — Grades R–3 (print at home, no login)</title>');

writeFileSync(join(OUT, 'START-HERE.html'), launcher, 'utf8');
files++;
bytes += statSync(join(OUT, 'START-HERE.html')).size;

/* ── 4. plain-text instructions for the staffroom ─────────────────────── */
const HOW_TO = `CAPS FOUNDATION PHASE PRINTABLE PACK — Grades R–3
Built by EduAI Companion. No login, no app, no internet needed.

WHAT YOU HAVE
  START-HERE.html ............ the gallery: 28 documents, filterable, one click to print
  templates/foundation-phase/  every sheet as its own A4 file (28) + all-templates.html
                               (all 28 in one print job) + README.md manifest
  illustrations/foundation/    the cartoon artwork the sheets reference (keep this folder!)

KEEP THE FOLDERS TOGETHER. The sheets are plain HTML but their pictures live in
illustrations/foundation — if you email ONE html file on its own it prints without
artwork (still usable, just uncoloured). Email the whole folder, or the zip.

TO PRINT (laptop/desktop)
  1. Double-click START-HERE.html (it opens in Chrome / Edge / Safari / Firefox).
  2. Open a sheet, then Ctrl+P (Windows/Linux) or Cmd+P (Mac).
  3. Paper: A4.  Colour.  Margins: Default (or "None" if you like full-bleed borders).
  4. "More settings" → tick BACKGROUND GRAPHICS — otherwise the coloured borders,
     rainbow bands, tracing lines and cartoon art disappear.
  5. Scale: 100%. Do not "Fit to page" on the certificates.

TO PRINT (phone/tablet)
  • Android: put the folder on the device (or open the zip with a file manager),
    tap START-HERE.html → open in Chrome → ⋮ → Print.
  • iPhone/iPad: Files app → open START-HERE.html in Safari → Share → Print.
    Turn "Background graphics"? iOS prints colour by default; if the borders vanish,
    use the laptop instead.

NO COLOUR PRINTER / PHOTOCOPIER ONLY?
  Open the sheet and print in "Grayscale" — every sheet keeps its contrast because
  the boxes use outlines, not fills. Avoid "Save ink" on the certificates: the
  dashed border is what makes them look like certificates.

SAVING A PDF TO SEND TO PARENTS
  Print dialog → Destination: "Save as PDF" / "Microsoft Print to PDF". Each sheet is
  one A4 page (a few worksheets are 2 — the pack shows "≈N × A4" on every card).

FILLING IN LEARNER NAMES / DATES
  The sheets print blank lines on purpose: write them by hand, or open the pack in the
  EduAI app (Teacher's Toolbox → CAPS Template Studio) to type names, school, term and
  the message first, then print. The app also lets you switch the labels to
  isiXhosa / isiZulu / Afrikaans, plus large-print and ink-saver modes.

${artCount} artwork files · ${readdirSync(join(PACK_SRC)).filter((f) => f.endsWith('.html')).length - 2} templates · generated ${new Date().toISOString().slice(0, 10)}
`;

writeFileSync(join(OUT, 'HOW-TO-PRINT.txt'), HOW_TO, 'utf8');
files++;

/* ── 4b. sanity pass: the launcher must not link to any sibling file directly */
if (/href="(?!\.{1,2}\/)[A-Za-z0-9._-]+\.html"/.test(launcher)) {
    throw new Error('START-HERE.html still contains an unwrapped link — the path rewrite regex needs updating.');
}

/* ── 5. report ────────────────────────────────────────────────────────── */
console.log(`✅ Portable pack ready: ${relative(ROOT, OUT)}  (${files} files, ${human(bytes)})`);
console.log(`   open ${relative(OUT, join(OUT, 'START-HERE.html'))} or zip it:`);
console.log(`     cd "${OUT}/.." && zip -qr "${OUT}.zip" "${OUT.split('/').pop()}"`);
