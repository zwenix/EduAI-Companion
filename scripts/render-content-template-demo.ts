/**
 * Regenerates the committed template demos with the REAL production markup from
 * src/lib/contentTemplate.ts (LIGHT v5):
 *
 *   docs/content-template-preview.html    — pixel-accurate sample document
 *   docs/content-normalisation-demo.html  — messy model output (labels written
 *                                           three times, its own duplicate
 *                                           banner, title block, footer) next
 *                                           to the normalised result
 *   docs/sa-content-layout-preview.html   — the SA structured pipeline document
 *   docs/banner-palettes-preview.html     — the ONE banner in every content-type
 *                                           palette (bright two-colour vertical
 *                                           gradients), with contrast figures
 *
 * Run:  npm run render:template-demo   (or npx tsx scripts/render-content-template-demo.ts)
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    BANNER_PALETTES,
    BANNER_PALETTE_IDS,
    EDUAI_BANNER_GRADIENT,
    bannerPaletteFor,
    buildTemplateComplianceBannerHTML,
    contrastWithWhite,
    wrapWithTemplate,
} from '../src/lib/contentTemplate';
import { ADMIN_TYPES, TEACHING_CATEGORIES, VISUAL_TYPES } from '../src/lib/contentTypes';
import { buildFullHTML } from '../src/lib/templates/sa-html-templates';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Embed the logo as a data URI so the demo is fully standalone. A resized
// copy keeps the demo lean; fall back to the full asset.
const smallLogoPath = '/tmp/eduai-logo-small.png';
const logoSrc = existsSync(smallLogoPath) ? smallLogoPath : resolve(repoRoot, 'public/eduai-logo.png');
const logoB64 = readFileSync(logoSrc).toString('base64');
const logoDataUri = `data:image/png;base64,${logoB64}`;

// Sample metadata as it would flow from ContentCreator.
const meta = {
    subject: 'Mathematics',
    grade: '7',
    term: 'Term 3',
    contentType: 'Worksheet',
    date: '09/09/2026',
    title: 'Integers in Everyday Life',
};

const sampleContent = `
<h1 style="font-size:1.4rem;font-weight:800;color:#0f172a;border-bottom:2px solid #0284c7;padding-bottom:.5rem;margin:0 0 1rem;">Integers in Everyday Life — Grade 7 Mathematics</h1>
<div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:1.25rem;font-weight:600;color:#334155;">
  <span>Name: ______________________</span><span>Date: ____________</span><span class="score" style="border:2px solid #f59e0b;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:8px;">TOTAL: 20</span>
</div>
<h2 style="font-size:1.1rem;font-weight:700;color:#0369a1;margin:1.2rem 0 .6rem;">Question 1 — Temperature in the Karoo (4 marks)</h2>
<p style="line-height:1.8;color:#1e293b;margin:0 0 .75rem;">At sunrise the temperature at Sutherland was −6&nbsp;°C. By 14:00 it had risen by 19&nbsp;°C. What was the temperature at 14:00? Show your working.</p>
<div style="border-bottom:1px dotted #94a3b8;height:1.6rem;margin-bottom:1rem;"></div>
<h2 style="font-size:1.1rem;font-weight:700;color:#0369a1;margin:1.2rem 0 .6rem;">Question 2 — The Stokvel Account (6 marks)</h2>
<p style="line-height:1.8;color:#1e293b;margin:0 0 .75rem;">Thabo's stokvel starts the month with R250. He deposits R150, withdraws R90 for airtime, and the bank charges a R12 fee. Represent each step as an integer sum and calculate the final balance.</p>
<div style="border-bottom:1px dotted #94a3b8;height:1.6rem;margin-bottom:1rem;"></div>
<div style="border-bottom:1px dotted #94a3b8;height:1.6rem;margin-bottom:1rem;"></div>
<h2 style="font-size:1.1rem;font-weight:700;color:#0369a1;margin:1.2rem 0 .6rem;">Question 3 — Lifts and Drops (10 marks)</h2>
<p style="line-height:1.8;color:#1e293b;margin:0 0 .75rem;">A miner descends 240 m below sea level, then rises 85 m, then descends another 120 m. Write a number sentence using integers and find his final position relative to sea level.</p>
<div style="border-bottom:1px dotted #94a3b8;height:1.6rem;margin-bottom:.5rem;"></div>
<div style="border-bottom:1px dotted #94a3b8;height:1.6rem;margin-bottom:.5rem;"></div>
`.trim();

const templated = wrapWithTemplate(sampleContent, meta)
    .replace(/src="\/eduai-logo\.png"/g, `src="${logoDataUri}"`);

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EduAI Companion — Official Content Template Preview (LIGHT v5)</title>
<style>
  body { margin:0; padding:2.5rem 1rem; background:#0f172a; font-family:'Inter',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; align-items:center; gap:1.25rem; }
  .caption { color:#94a3b8; font-size:.8rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; text-align:center; }
  .sheet { width:100%; max-width:794px; background:#ffffff; box-shadow:0 25px 60px rgba(0,0,0,.55); border-radius:4px; }
  @media print { body { background:#fff; padding:0; } .caption { display:none; } .sheet { box-shadow:none; max-width:none; } }
</style>
</head>
<body>
  <div class="caption">EduAI Companion — Official Content Template v5 · one banner (title + every label + compliance) between the light-blue header and the footer</div>
  <div class="sheet">${templated}</div>
</body>
</html>`;

const outPath = resolve(repoRoot, 'docs/content-template-preview.html');
writeFileSync(outPath, page);
console.log(`Wrote ${outPath} (${(page.length / 1024).toFixed(0)} KB)`);

// ── Normalisation demo: what a model often emits vs. what we ship ───────────
const messyModelOutput = `<!DOCTYPE html>
<html><head><style>.banner{background:#007749}.stamp{background:#eff6ff;color:#2563eb;padding:4px 10px;border-radius:999px}</style></head>
<body>
<header class="school-header" style="padding:14px 4px;">
  <h1 style="margin:0;font-size:20px;color:#007749;">Springfield Primary School</h1>
  <p style="margin:4px 0 0;font-size:12px;color:#475569;">EMIS: 123456 | Western Cape Province | District: Metro East</p>
</header>
<div class="caps-bar" style="background:#002395;color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:700;margin-bottom:10px;">
  CAPS Reference: Mathematics Grade 2 Term 3 — Data Handling | ATP Week 6
</div>
<div class="doc-meta" style="background:#007749;color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:700;margin-bottom:10px;">
  Subject: Mathematics | Grade: 2 | Term: 3 | Date: 18/09/2026 | Total Marks: 20 | Duration: 45 minutes
</div>
<header class="banner" style="background:#002395;color:#fff;padding:20px;border-radius:12px;">
  <h1 style="margin:0 0 6px;font-size:24px;">Data Handling — Grade 2 Mathematics</h1>
  <p style="margin:0;">CAPS Code: FP-MATH-G2-T3-DH01</p>
  <div style="margin-top:8px;font-weight:700;">🇿🇦 ✅ CAPS Aligned ✅ NPA Compliant ✅ POPIA Compliant (2026) ✅ SIAS Level 1 Inclusive ✅ WP6 Differentiated</div>
</header>
<section class="compliance-strip" style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;">
  <span class="stamp">✅ CAPS Aligned</span><span class="stamp">✅ NPA Compliant</span>
  <span class="stamp">✅ POPIA Compliant (2026)</span><span class="stamp">✅ SIAS Level 1 Inclusive</span>
  <span class="stamp">✅ WP6 Differentiated</span>
</section>
<h2 style="color:#0369a1;">Activity 1 — Tally the favourite fruits</h2>
<p>Count the pictures in each column and complete the tally chart below.</p>
<div class="tip" style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px;">
  <strong>Teacher tip:</strong> this resource is ✅ CAPS Aligned and ✅ NPA Compliant, so it can be filed straight into the SBA record.
</div>
<footer class="site-footer" style="background:#111827;color:#fff;text-align:center;padding:14px;margin-top:24px;">
  <div>© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators</div>
  <div style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;">ALL CONTENT RIGHTS RESERVED TO • DEVELOPER: Z MSUTHU (C) 2026 • GENERATED: 09/09/2026</div>
</footer>
</body></html>`;

/**
 * Model-authored bands sitting above the content: a school header, a CAPS
 * reference bar, a metadata strip or a duplicate banner. The designated
 * `eduai-compliance-banner` is not counted — it is the ONE banner.
 */
const topBands = (source: string): number =>
    [...String(source).matchAll(/class="([^"]*)"/gi)]
        .map((match) => match[1])
        .filter((classes) => /\b(?:school-header|caps-bar|doc-meta|banner)\b/i.test(classes))
        .filter((classes) => !/\beduai-compliance-banner\b/i.test(classes)).length;

const counts = (source: string): Record<string, number> => ({
    'CAPS Aligned': (source.match(/CAPS\s+Aligned/gi) || []).length,
    'NPA Compliant': (source.match(/NPA\s+Compliant/gi) || []).length,
    'POPIA Compliant': (source.match(/POPIA\s+Compliant/gi) || []).length,
    'SIAS Inclusive': (source.match(/SIAS[^<\n]{0,14}Inclusive/gi) || []).length,
    'WP6 Differentiated': (source.match(/WP6\s+Differentiated/gi) || []).length,
    'CAPS Code': (source.match(/CAPS\s*Code/gi) || []).length,
    'top bands above the content (school / CAPS / meta / duplicate banner)': topBands(source),
    'footer bands': (source.match(/<footer\b/gi) || []).length,
});

const normalised = wrapWithTemplate(messyModelOutput, {
    title: 'Data Handling',
    subject: 'Mathematics',
    grade: '2',
    term: 'Term 3',
    contentType: 'Worksheet',
    date: '18/09/2026',
}).replace(/src="\/eduai-logo\.png"/g, 'src="../public/eduai-logo.png"');

const before = counts(messyModelOutput);
const after = counts(normalised);
const rows = Object.keys(before)
    .map((key) => `<tr><td>${key}</td><td class="bad">${before[key]}</td><td class="good">${after[key]}</td></tr>`)
    .join('');

const demoPage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EduAI Companion — Content Normalisation Demo</title>
<style>
  body { margin:0; padding:2rem 1rem 3rem; background:#0f172a; font-family:'Inter',system-ui,-apple-system,sans-serif; color:#e2e8f0; }
  h1 { font-size:1.15rem; letter-spacing:.08em; text-transform:uppercase; text-align:center; margin:0 0 .35rem; color:#fff; }
  p.lede { text-align:center; color:#94a3b8; font-size:.85rem; max-width:60rem; margin:0 auto 1.75rem; }
  .grid { display:grid; gap:1.25rem; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); max-width:110rem; margin:0 auto; }
  .pane { background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,.5); display:flex; flex-direction:column; }
  .pane > h2 { margin:0; padding:.6rem .9rem; font-size:.72rem; letter-spacing:.12em; text-transform:uppercase; color:#fff; }
  .pane.before > h2 { background:#7f1d1d; }
  .pane.after > h2 { background:${EDUAI_BANNER_GRADIENT}; }
  .pane .body { padding:0; overflow:auto; }
  .pane.before .body { padding:.9rem; color:#1e293b; font-size:.9rem; }
  table { border-collapse:collapse; margin:1.5rem auto 0; font-size:.8rem; }
  th, td { border:1px solid #334155; padding:.35rem .8rem; text-align:center; }
  th { background:#1e293b; color:#fff; text-transform:uppercase; letter-spacing:.08em; font-size:.65rem; }
  td:first-child { text-align:left; color:#cbd5e1; }
  td.bad { color:#fca5a5; font-weight:700; }
  td.good { color:#86efac; font-weight:700; }
  caption { caption-side:top; color:#94a3b8; font-size:.7rem; letter-spacing:.12em; text-transform:uppercase; padding-bottom:.5rem; }
</style>
</head>
<body>
  <h1>Content normalisation — ONE banner, two-colour vertical gradient, exact footer</h1>
  <p class="lede">Left: what a model often emits (its own banner repeating the title and the labels, a second stamp row and its own footer).
     Right: the same content through the production <code>wrapWithTemplate()</code> — the title, the grade/subject/term/type/date labels and
     the compliance line survive exactly once inside the single two-colour vertical gradient banner, and the footer text is exact.</p>
  <div class="grid">
    <section class="pane before">
      <h2>Before — raw model output</h2>
      <div class="body">${messyModelOutput.replace(/^[\s\S]*?<body>/i, '').replace(/<\/body>[\s\S]*$/i, '')}</div>
    </section>
    <section class="pane after">
      <h2>After — EduAI LIGHT Template v5</h2>
      <div class="body">${normalised}</div>
    </section>
  </div>
  <table>
    <caption>Occurrences per generated document</caption>
    <thead><tr><th>Item</th><th>Before</th><th>After</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

const demoPath = resolve(repoRoot, 'docs/content-normalisation-demo.html');
writeFileSync(demoPath, demoPage);
console.log(`Wrote ${demoPath} (${(demoPage.length / 1024).toFixed(0)} KB)`);

// ── SA pipeline demo: the same layout contract for structured documents ─────
const saDocument = buildFullHTML(
    {
        metadata: {
            title: 'Data Handling',
            subject: 'Mathematics',
            grade: '5',
            phase: 'Intermediate Phase',
            term: 2,
            contentType: 'worksheet',
            capsReference: 'Mathematics CAPS — Grade 5 — Term 2 — Data Handling',
            atpWeek: '4',
            totalMarks: 20,
            duration: '45 minutes',
            generatedDate: '04/10/2026',
            schoolBranding: { name: 'Springfield Primary School', district: 'Metro East', province: 'Western Cape', emis: '123456' },
            npaCompliance: { assessmentType: 'informal', isFormal: false },
            siasCompliance: { supportLevel: 'level_1', accommodationsIncluded: true, differentiationIncluded: true },
        },
        sections: [
            {
                sectionId: 1,
                heading: 'Section A — Reading the tally table',
                content: '<p>Study the tally table below and answer the questions.</p>',
                bloomsLevel: "Remembering",
                marks: 6,
                differentiatedContent: {
                    core: '<p>All learners complete questions 1–3.</p>',
                    extended: '<p>Advanced learners also explain why the totals differ.</p>',
                    simplified: '<p>Support learners use counters to re-count each row.</p>',
                },
                siasNotes: 'Extra time, larger print, peer buddy.',
            },
        ],
        siasSupport: {
            supportLevel: 'Level 1',
            teacherNotes: 'Classroom-level adjustments only.',
            accommodations: ['Extra time', 'Larger print', 'Peer buddy'],
            referralGuidance: null,
        },
        npaRatingTable: [
            { code: 7, description: 'Outstanding achievement', percentage: '80–100%' },
            { code: 4, description: 'Adequate achievement', percentage: '50–59%' },
        ],
        answerKey: {
            questions: [{ questionNumber: 1, answer: '8 learners chose apples.', bloomsLevel: 'Remembering', marks: 2, cognitiveLevel: 'Lower order' }],
            totalMarks: 20,
        },
    } as any,
    [],
).replace(/src="\/eduai-logo\.png"/g, `src="${logoDataUri}"`);

const saPage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EduAI Companion — SA pipeline content layout (Light Template v5)</title>
</head>
<body style="margin:0;background:#eef2f7;">
  <div style="padding:10px 14px;font:700 12px/1.5 Inter,system-ui,sans-serif;color:#475569;background:#fff;border-bottom:1px solid #dbe3ee;">
    SA content pipeline — very light blue 70%-transparent page header, ONE two-colour vertical gradient banner (title, every label, CAPS/ATP reference, compliance data), every section band on a 180° gradient, one canonical footer.
  </div>
  ${saDocument}
</body>
</html>`;

const saPath = resolve(repoRoot, 'docs/sa-content-layout-preview.html');
writeFileSync(saPath, saPage);
console.log(`Wrote ${saPath} (${(saPage.length / 1024).toFixed(0)} KB)`);


// ── Palette gallery: the ONE banner in every content-type palette ───────────
/**
 * One sample per palette, rendered with the production banner builder, so the
 * colours a teacher will actually see for each kind of content can be reviewed
 * at a glance (and contrasted against the old navy → blue default).
 */
const paletteSamples = [
    { palette: 'worksheet', contentType: 'Worksheet', title: 'Data Handling — Tallies', subject: 'Mathematics', grade: '5', term: 'Term 2' },
    { palette: 'lesson', contentType: 'Weekly Lesson Plan', title: 'The Water Cycle', subject: 'Natural Sciences', grade: '4', term: 'Term 3' },
    { palette: 'assessment', contentType: 'Controlled Test', title: 'Fractions and Decimals', subject: 'Mathematics', grade: '6', term: 'Term 1' },
    { palette: 'memo', contentType: 'Marking Memo', title: 'Fractions and Decimals — Memo', subject: 'Mathematics', grade: '6', term: 'Term 1' },
    { palette: 'poster', contentType: 'Educational Poster', title: 'Save Water — Poster', subject: 'Life Skills', grade: '3', term: 'Term 2' },
    { palette: 'cards', contentType: 'Flashcards (Term + Definition)', title: 'Sight Words — Flashcards', subject: 'English HL', grade: '2', term: 'Term 1' },
    { palette: 'admin', contentType: 'Letter to Parents', title: 'Parent Evening — Invitation', subject: 'Administration', grade: 'All', term: 'Term 3' },
    { palette: 'certificate', contentType: 'Participation Certificate', title: 'Star of the Term', subject: 'Life Skills', grade: '3', term: 'Term 3' },
    { palette: 'intervention', contentType: 'SIAS Individualized Learning Plan', title: 'SIAS Support Plan — Thabo', subject: 'Mathematics', grade: '4', term: 'Term 2' },
    { palette: 'foundation', contentType: 'Interactive Foundation Learning Pack', title: 'Grade R — Numbers 1–10', subject: 'Mathematics', grade: 'R', term: 'Term 1' },
    { palette: 'brand', contentType: 'Untitled Generation', title: 'Educational Resource', subject: 'General', grade: 'All', term: 'Term 1' },
] as const;

const paletteCards = paletteSamples.map((sample) => {
    const palette = BANNER_PALETTES[sample.palette];
    const banner = buildTemplateComplianceBannerHTML({
        title: sample.title,
        subject: sample.subject,
        grade: sample.grade,
        term: sample.term,
        contentType: sample.contentType,
        date: '04/10/2026',
        school: 'Springfield Primary School',
    });
    const topContrast = contrastWithWhite(palette.from).toFixed(2);
    const bottomContrast = contrastWithWhite(palette.to).toFixed(2);
    return `
  <section class="card">
    <header class="card-head">
      <div>
        <p class="kicker">${palette.id.toUpperCase()}${sample.palette === 'brand' ? ' (fallback)' : ''}</p>
        <h3>${palette.label}</h3>
        <p class="blurb">${palette.blurb}</p>
      </div>
      <dl class="swatches">
        <div><dt>Top stop</dt><dd><span class="chip" style="background:${palette.from}"></span>${palette.from} · ${topContrast}:1</dd></div>
        <div><dt>Bottom stop</dt><dd><span class="chip" style="background:${palette.to}"></span>${palette.to} · ${bottomContrast}:1</dd></div>
      </dl>
    </header>
    <p class="types"><strong>Content types:</strong> ${palette.types.join(' · ')}</p>
    <div class="banner-frame" style="--eduai-banner-gradient: ${palette.gradient};">
      ${banner}
    </div>
    <code class="css">${palette.gradient}</code>
  </section>`;
}).join('\n');

const offered = [
    ...Object.values(TEACHING_CATEGORIES),
    ...Object.values(VISUAL_TYPES),
    ...Object.values(ADMIN_TYPES),
].flat();
const offeredRows = offered.map((type) => {
    const palette = bannerPaletteFor(type);
    return `<tr><td>${type}</td><td><span class="chip" style="background:${palette.from}"></span>${palette.id}</td><td>${palette.label}</td></tr>`;
}).join('\n');

const palettePage = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EduAI Companion — banner palettes per content type (Light Template v5)</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; background: #eef2f7; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
  .page-head { background: linear-gradient(180deg, rgba(219,234,254,.30) 0%, rgba(191,219,254,.30) 100%); border-bottom: 1px solid rgba(147,197,253,.55); padding: 18px 22px; }
  .page-head h1 { font-family: 'Fredoka', sans-serif; margin: 0 0 6px; font-size: 22px; color: #1e3a5f; }
  .page-head p { margin: 0; font-size: 12.5px; color: #334155; max-width: 900px; line-height: 1.6; }
  main { max-width: 940px; margin: 0 auto; padding: 22px 18px 60px; display: grid; gap: 18px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 2px 10px rgba(15,23,42,.06); }
  .card-head { display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; align-items: flex-start; }
  .kicker { margin: 0 0 2px; font-size: 10px; letter-spacing: 1.4px; font-weight: 800; color: #2563eb; }
  .card h3 { font-family: 'Fredoka', sans-serif; margin: 0 0 4px; font-size: 17px; color: #1e293b; }
  .blurb { margin: 0; font-size: 12px; color: #475569; max-width: 520px; }
  .swatches { margin: 0; display: grid; gap: 4px; font-size: 11.5px; }
  .swatches div { display: flex; gap: 8px; align-items: center; }
  .swatches dt { font-weight: 700; color: #64748b; min-width: 68px; }
  .swatches dd { margin: 0; color: #334155; display: flex; align-items: center; gap: 6px; }
  .chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 1px solid rgba(15,23,42,.15); vertical-align: middle; }
  .types { margin: 10px 0 12px; font-size: 11.5px; color: #475569; }
  .banner-frame { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 10px; background: #f8fafc; }
  .css { display: block; margin-top: 10px; font-size: 11px; color: #1e3a5f; background: #eff6ff; border-radius: 8px; padding: 6px 8px; word-break: break-all; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  th { background: #eff6ff; color: #1e3a5f; font-size: 10.5px; letter-spacing: .6px; text-transform: uppercase; }
  h2 { font-family: 'Fredoka', sans-serif; font-size: 16px; margin: 6px 0 0; color: #1e3a5f; }
</style>
</head>
<body>
  <div class="page-head">
    <h1>ONE banner, a bright two-colour vertical gradient per content type</h1>
    <p>Every generated document opens with the very light blue 70%-transparent page header and exactly ONE document banner.
    That banner is always a two-colour <strong>vertical</strong> gradient (180deg, never a solid fill) whose colours are chosen for
    the kind of content: worksheets orange → magenta, lesson plans indigo → violet, assessments crimson → purple,
    memos green → teal, posters fuchsia → burnt orange, cards teal → royal blue, admin royal blue → sky,
    certificates violet → gold, SIAS support deep violet → emerald, Foundation Phase packs pink → azure.
    The navy → azure pair remains only as the fallback for unrecognised types.</p>
  </div>
  <main>
    <h2>Palettes (${paletteSamples.length})</h2>
    ${paletteCards}
    <section class="card">
      <h2>Every Content Creator content type → palette (${offered.length} types)</h2>
      <table>
        <thead><tr><th>Content type</th><th>Palette</th><th>Colours</th></tr></thead>
        <tbody>${offeredRows}</tbody>
      </table>
    </section>
  </main>
</body>
</html>`;

const palettePath = resolve(repoRoot, 'docs/banner-palettes-preview.html');
writeFileSync(palettePath, palettePage);
console.log(`Wrote ${palettePath} (${(palettePage.length / 1024).toFixed(0)} KB)`);
