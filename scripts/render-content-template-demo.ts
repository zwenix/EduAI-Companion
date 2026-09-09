/**
 * Regenerates docs/content-template-preview.html — a standalone, pixel-accurate
 * demo of the official EduAI Companion content template rendered with the REAL
 * production markup from src/lib/contentTemplate.ts.
 *
 * Run:  npx tsx scripts/render-content-template-demo.ts
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wrapWithTemplate } from '../src/lib/contentTemplate';

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
<title>EduAI Companion — Official Content Template Preview</title>
<style>
  body { margin:0; padding:2.5rem 1rem; background:#0f172a; font-family:'Inter',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; align-items:center; gap:1.25rem; }
  .caption { color:#94a3b8; font-size:.8rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; text-align:center; }
  .sheet { width:100%; max-width:794px; background:#ffffff; box-shadow:0 25px 60px rgba(0,0,0,.55); border-radius:4px; }
  @media print { body { background:#fff; padding:0; } .caption { display:none; } .sheet { box-shadow:none; max-width:none; } }
</style>
</head>
<body>
  <div class="caption">EduAI Companion — Official Content Template · every generated document opens and closes with these bands</div>
  <div class="sheet">${templated}</div>
</body>
</html>`;

const outPath = resolve(repoRoot, 'docs/content-template-preview.html');
writeFileSync(outPath, page);
console.log(`Wrote ${outPath} (${(page.length / 1024).toFixed(0)} KB)`);
