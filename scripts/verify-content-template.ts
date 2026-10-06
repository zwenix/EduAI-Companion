/**
 * Verifies the guarantees every piece of generated content must keep:
 *
 *   1. ONE BANNER — a document opens with the page header (brand only) and
 *                   exactly ONE document banner; the title, grade, subject,
 *                   content type, term, date, school/teacher, the CAPS
 *                   reference and the 🇿🇦 / CAPS Aligned / NPA / POPIA / SIAS /
 *                   WP6 labels are written once — inside that banner.
 *   2. GRADIENT   — the banner is a two-colour VERTICAL gradient (never a
 *                   solid fill) whose colours are chosen for the content type
 *                   (worksheet = orange → magenta, memo = green → teal,
 *                   certificate = violet → gold …), model-authored
 *                   banners/heroes are repainted in the SAME document palette,
 *                   and the page header is a very light blue bar at 70%
 *                   transparency.
 *   3. FOOTER     — one canonical footer line, word for word:
 *                   "© 2026 EduAI Companion | CAPS Compliant Educational
 *                    Resource | Developed for South African Educators | All
 *                    Rights Reserved to Developer: Z MSUTHU © 2026 |"
 *
 * It exercises the production wrapper with the awkward inputs models actually
 * produce (own header/footer chrome, duplicate stamp rows, duplicate title
 * blocks, solid inline banners, Tailwind colour utilities, documents wrapped
 * by an older template) and then re-checks the committed artefacts on disk.
 *
 * Run:  npm run verify:template
 *       npx tsx scripts/verify-content-template.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    BANNER_PALETTES,
    BANNER_PALETTE_IDS,
    EDUAI_BANNER_GRADIENT,
    EDUAI_BANNER_BRAND_LINE,
    EDUAI_TEMPLATE_URL,
    EDUAI_COMPLIANCE_LABELS,
    EDUAI_HEADER_GRADIENT,
    EDUAI_HEADER_TINT,
    EDUAI_TEMPLATE_FOOTER_LINE,
    applyBannerGradients,
    bannerGradientFor,
    bannerPaletteFor,
    buildTemplateComplianceBannerHTML,
    bannerRecordFieldsFor,
    bannerSignOffFor,
    buildBannerRecordFieldsHTML,
    contrastWithWhite,
    harvestMetaFromChrome,
    isBannerGradient,
    isCurrentTemplateOutput,
    isKnownBannerGradient,
    stripTemplateChrome,
    wrapWithTemplate,
} from '../src/lib/contentTemplate';
import { ADMIN_TYPES, TEACHING_CATEGORIES, VISUAL_TYPES } from '../src/lib/contentTypes';
import { buildFullHTML, buildMinimalSADocument } from '../src/lib/templates/sa-html-templates';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const LABELS: { name: string; pattern: RegExp }[] = [
    { name: 'CAPS Aligned', pattern: /CAPS\s+Aligned/gi },
    { name: 'NPA Compliant', pattern: /NPA\s+Compliant/gi },
    { name: 'POPIA Compliant', pattern: /POPIA\s+Compliant/gi },
    { name: 'SIAS … Inclusive', pattern: /SIAS[^<\n]{0,14}Inclusive/gi },
    { name: 'WP6 Differentiated', pattern: /WP6\s+Differentiated/gi },
];

const count = (source: string, pattern: RegExp): number =>
    (source.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)) || []).length;

let failures = 0;
let checks = 0;

const ok = (label: string, condition: boolean, detail = ''): void => {
    checks += 1;
    if (condition) {
        console.log(`  ✅ ${label}`);
    } else {
        failures += 1;
        console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
    }
};

/** The invariants that must hold for ONE generated document. */
const assertDocument = (label: string, html: string, expectedDocs = 1): void => {
    console.log(`\n▸ ${label}`);
    const banners = count(html, /<section[^>]*class\s*=\s*["'][^"']*\beduai-compliance-banner\b/gi);
    const footers = count(html, /<footer\b/gi);
    const canonicalFooters = count(html, new RegExp(EDUAI_TEMPLATE_FOOTER_LINE.replace(/[|]/g, '\\|'), 'g'));

    ok(`${expectedDocs} designated compliance section(s)`, banners === expectedDocs, `found ${banners}`);
    ok('labels written once per document', LABELS.every(({ pattern }) => count(html, pattern) === expectedDocs),
        LABELS.map(({ name, pattern }) => `${name}=${count(html, pattern)}`).join(' '));
    ok('CAPS Code written once per document', count(html, /CAPS\s*Code/gi) === expectedDocs, `found ${count(html, /CAPS\s*Code/gi)}`);
    ok(`${expectedDocs} footer band(s)`, footers === expectedDocs, `found ${footers}`);
    ok('exact canonical footer text', canonicalFooters === expectedDocs, `found ${canonicalFooters}`);
    ok('no stale rights/generated sub-lines', !/ALL CONTENT RIGHTS RESERVED TO|GENERATED:\s*\d{2}\/\d{2}\/\d{4}/i.test(html));
    const bannerTag = html.match(/<section[^>]*class\s*=\s*["'][^"']*\beduai-compliance-banner\b[^>]*>/i)?.[0] ?? '';
    const bannerGradient = bannerTag.match(/background:\s*(linear-gradient\([^;]+\))/i)?.[1] ?? '';
    ok('the ONE banner uses a two-colour VERTICAL gradient', isBannerGradient(bannerGradient), bannerGradient);
    ok('the banner gradient comes from the content-type palette',
        isKnownBannerGradient(bannerGradient),
        `${bannerGradient} — palette=${bannerPaletteFor((bannerTag.match(/data-eduai-palette="([^"]+)"/) ?? [])[1]).id}`);
    ok('the banner publishes its palette as a scoped custom property',
        bannerTag.includes(`--eduai-banner-gradient: ${bannerGradient}`));
    ok('no banner falls back to the plain navy → blue brand pair',
        !bannerGradient.includes('#1e3a5f') || bannerGradient === BANNER_PALETTES.brand.gradient);
    // ONE banner at the top of the page: nothing banner-ish may precede it.
    const leading = html.slice(0, html.indexOf('class="eduai-compliance-banner'));
    const leadingBands = (leading.match(/<(?:header|section|div|article|aside)\b[^>]*>/gi) || [])
        .filter((tag) => !/site-header/.test(tag))
        .filter((tag) => /<header\b/i.test(tag)
            || /(?:class|id)\s*=\s*["'][^"']*(?:banner|hero|masthead|title-block|doc-title|page-title|cover-head|top-bar)/i.test(tag));
    ok('only the brand header precedes the ONE banner', leadingBands.length === 0, leadingBands.join(' '));
    ok('page header is the very light blue 70%-transparent wash',
        !html.includes('site-header') || (html.includes(EDUAI_HEADER_GRADIENT) && html.includes(EDUAI_HEADER_TINT)));
};

const meta = {
    title: 'Data Handling',
    subject: 'Mathematics',
    grade: '2',
    term: 'Term 3',
    contentType: 'Worksheet',
    date: '18/09/2026',
};

console.log('════ EduAI content template — compliance / gradient / footer verification ════');

// ── 1. Plain AI fragment ────────────────────────────────────────────────────
const fragment = wrapWithTemplate('<h2>Activity 1</h2><p>Count the pictures and complete the tally.</p>', meta);
assertDocument('plain AI fragment', fragment);
ok('is recognised as current canonical output', isCurrentTemplateOutput(fragment));

// ── 2. Idempotency (print-preview re-export) ────────────────────────────────
console.log('\n▸ re-wrap / re-export idempotency');
ok('wrapping twice is byte-identical', wrapWithTemplate(fragment, meta) === fragment);
ok('re-export without metadata is byte-identical', wrapWithTemplate(fragment, {}) === fragment);
ok('meta is harvested from the chrome being replaced',
    JSON.stringify(harvestMetaFromChrome(fragment).grade) === '"2"'
    && harvestMetaFromChrome(fragment).subject === 'Mathematics'
    && harvestMetaFromChrome(fragment).contentType === 'Worksheet');

// ── 3. Model output that duplicates everything ──────────────────────────────
const greedyModelOutput = `<!DOCTYPE html>
<html><head><style>.banner{background:#007749}.stamp{background:#eff6ff}</style></head>
<body>
<header class="banner" style="background:#002395;color:#fff;padding:20px;">
  <h1>Data Handling — Grade 2</h1>
  <p>CAPS Code: FP-MATH-G2-T3-DH01</p>
  <div>🇿🇦 ✅ CAPS Aligned ✅ NPA Compliant ✅ POPIA Compliant (2026) ✅ SIAS Level 1 Inclusive ✅ WP6 Differentiated</div>
</header>
<section class="compliance-strip">
  <span class="stamp">✅ CAPS Aligned</span><span class="stamp">✅ NPA Compliant</span>
  <span class="stamp">✅ POPIA Compliant (2026)</span><span class="stamp">✅ SIAS Level 1 Inclusive</span>
  <span class="stamp">✅ WP6 Differentiated</span>
</section>
<div class="hero bg-emerald-700 text-white p-6"><h2>Hero band</h2></div>
<h2>Activity 1</h2><p>Count the pictures.</p>
<div class="tip"><strong>Tip:</strong> this resource is ✅ CAPS Aligned and ✅ NPA Compliant.</div>
<footer class="site-footer" style="background:#111827;color:#fff">
  <div>© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators</div>
  <div>ALL CONTENT RIGHTS RESERVED TO • DEVELOPER: Z MSUTHU (C) 2026 • GENERATED: 09/09/2026</div>
</footer>
</body></html>`;
const greedy = wrapWithTemplate(greedyModelOutput, meta);
assertDocument('model output with its own header, 3 label copies, solid banners + footer', greedy);
console.log('  ▸ solid banners converted');
ok('the model header repeating the banner data was removed', !/Data Handling — Grade 2</i.test(greedy) && count(greedy, /<h1\b/gi) === 1);
ok('inline solid #002395 banner became the gradient', !/style="[^"]*background:\s*#002395/i.test(greedy));
ok('Tailwind bg-emerald-700 hero overridden inline',
    greedy.includes(`class="hero`) && new RegExp(`class="hero[^"]*"[^>]*background-image:${bannerGradientFor('Worksheet').replace(/[()]/g, '\\$&')}`, 'i').test(greedy));
ok('every <header> in the body is a gradient', count(greedy, /<header\b(?![^>]*site-header)[^>]*background-image:\s*linear-gradient/gi) === count(greedy, /<header\b(?![^>]*site-header)/gi));
ok('the model footer band was removed', !/GENERATED: 09\/09\/2026/i.test(greedy));
ok('re-wrapping the cleaned document is stable', wrapWithTemplate(greedy, meta) === greedy);

// ── 3b. Model output that opens with SEVERAL bands — a school header, a CAPS
//        reference bar, a metadata strip and its own banner. Every band is
//        absorbed into the ONE banner: the data survives once, the bands (and
//        the vertical space they stole) do not.
const bandSpam = `<header class="school-header"><h1>Springfield Primary School</h1><p>EMIS: 123456 | Western Cape Province</p></header>
<div class="caps-bar" style="background:#002395;color:#fff">CAPS Reference: Mathematics Grade 5 Term 2 — Data Handling | ATP Week 4</div>
<div class="doc-meta" style="background:#007749;color:#fff">Subject: Mathematics | Grade: 5 | Term: 2 | Date: 04/10/2026 | Total Marks: 20 | Duration: 45 minutes</div>
<header class="banner" style="background:#de3831"><h1>Data Handling — Grade 5 Mathematics</h1></header>
<article class="card"><h2>Activity 1</h2><p>Count the tallies and complete the table.</p></article>`;
console.log('\n▸ model output with four stacked bands at the top of the page');
const banded = wrapWithTemplate(bandSpam, meta);
assertDocument('school header + CAPS bar + meta strip + duplicate banner', banded);
ok('the model bands themselves are gone',
    !/school-header|caps-bar|doc-meta/.test(banded) && !banded.includes('Data Handling — Grade 5 Mathematics'));
const bandedBanner = banded.slice(banded.indexOf('class="eduai-compliance-banner'), banded.indexOf('</section>'));
['School: Springfield Primary School', 'Total: 20 marks', '45 minutes', 'ATP: Week 4']
    .forEach((needle) => ok(`the ONE banner carries "${needle}"`, bandedBanner.includes(needle)));
ok('the real content is untouched', banded.includes('Count the tallies and complete the table.'));

// ── 3c. Per-content-type palettes — bright two-colour gradients, one per
//        content family, all legible with white text, all distinct.
console.log('\n▸ content-type banner palettes');
ok('at least eight palettes ship', BANNER_PALETTE_IDS.length >= 8, `${BANNER_PALETTE_IDS.length} palettes`);
ok('every palette is a two-stop 180deg gradient',
    BANNER_PALETTE_IDS.every((id) => isBannerGradient(BANNER_PALETTES[id].gradient)
        && BANNER_PALETTES[id].from !== BANNER_PALETTES[id].to));
ok('every palette keeps white text legible (contrast ≥ 4.5)',
    BANNER_PALETTE_IDS.every((id) => contrastWithWhite(BANNER_PALETTES[id].from) >= 4.5
        && contrastWithWhite(BANNER_PALETTES[id].to) >= 4.5),
    `min ${Math.min(...BANNER_PALETTE_IDS.map((id) => Math.min(
        contrastWithWhite(BANNER_PALETTES[id].from), contrastWithWhite(BANNER_PALETTES[id].to)))).toFixed(2)}`);
ok('the palette gradients are all different',
    new Set(BANNER_PALETTE_IDS.map((id) => BANNER_PALETTES[id].gradient)).size === BANNER_PALETTE_IDS.length);

const offeredTypes = [
    ...Object.values(TEACHING_CATEGORIES),
    ...Object.values(VISUAL_TYPES),
    ...Object.values(ADMIN_TYPES),
].flat();
const unmappedTypes = offeredTypes.filter((type) => bannerPaletteFor(type).id === 'brand');
ok(`all ${offeredTypes.length} Content Creator types resolve to a named palette`,
    unmappedTypes.length === 0, unmappedTypes.join(', '));

const paletteSample: Array<[string, string]> = [
    ['Lesson Plan', 'lesson'],
    ['Worksheet', 'worksheet'],
    ['Controlled Test', 'assessment'],
    ['Marking Memo', 'memo'],
    ['Educational Poster', 'poster'],
    ['Flashcards (Term + Definition)', 'cards'],
    ['Letter to Parents', 'admin'],
    ['Participation Certificate', 'certificate'],
    ['SIAS Individualized Learning Plan', 'intervention'],
    ['Interactive Foundation Learning Pack', 'foundation'],
];
paletteSample.forEach(([contentType, paletteId]) => {
    const palette = bannerPaletteFor(contentType);
    ok(`${contentType} → ${palette.label}`, palette.id === paletteId, palette.id);
});
const sampleGradients = paletteSample.map(([type]) => bannerGradientFor(type));
ok('ten different content families → ten different banner gradients',
    new Set(sampleGradients).size === sampleGradients.length);
ok('none of the ten families still uses the navy → blue brand pair',
    sampleGradients.every((gradient) => gradient !== BANNER_PALETTES.brand.gradient));

// The same body wrapped as different content types must come out with
// different banners — the whole point of the palette set.
const bodyForPalette = '<h2>Activity 1</h2><p>Count the tallies.</p>';
const palettedBanners = paletteSample.map(([contentType]) => {
    const doc = wrapWithTemplate(bodyForPalette, { title: 'Data Handling', grade: '5', subject: 'Mathematics', contentType });
    const tag = doc.match(/<section[^>]*class\s*=\s*["'][^"']*\beduai-compliance-banner\b[^>]*>/i)?.[0] ?? '';
    return { contentType, tag, gradient: tag.match(/background:\s*(linear-gradient\([^;]+\))/i)?.[1] ?? '' };
});
ok('each wrapped document carries its own palette on the banner',
    palettedBanners.every(({ contentType, gradient }) => gradient === bannerGradientFor(contentType)),
    palettedBanners.map(({ contentType, gradient }) => `${contentType}=${gradient}`).join(' | '));
ok('no wrapped document reuses another family\'s banner colours',
    new Set(palettedBanners.map(({ gradient }) => gradient)).size === palettedBanners.length);
ok('the wrapper publishes the palette for its stylesheet safety nets',
    palettedBanners.every(({ tag }) => tag.includes('--eduai-banner-gradient:')));

// ── 4. Document wrapped by an OLDER template (archived content) ─────────────
const legacyWrapped = `<style data-eduai-light="v3">.site-header{background:#1e3a5f}</style>
<header class="site-header" style="background:#1e3a5f"><img src="/eduai-logo.png" class="logo" /><span class="header-text">EDUAI COMPANION 2026 | CAPS COMPLIANT EDUCATION RESOURCE | GRADE 5 • TERM 2 • MATHEMATICS • WORKSHEET</span></header>
<div class="eduai-light-scope"><img class="watermark" src="/eduai-logo.png" /><main class="page"><article class="card">
<h1 class="lesson-title">Fractions: Halves and Quarters</h1>
<div class="lesson-meta"><span class="meta-pill">Grade 5</span><span class="meta-pill">CAPS Aligned</span></div>
<p>Body copy ✅ NPA Compliant ✅ POPIA Compliant (2026)</p>
</article></main></div>
<footer class="site-footer"><div>© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators</div><div class="footer-sub">ALL CONTENT RIGHTS RESERVED TO • DEVELOPER: Z MSUTHU (C) 2026 • GENERATED: 09/09/2026</div></footer>`;
console.log('\n▸ legacy document upgrade (archived content, no metadata passed)');
ok('legacy markup is NOT treated as current', !isCurrentTemplateOutput(legacyWrapped));
const upgraded = wrapWithTemplate(legacyWrapped, {});
assertDocument('legacy document re-wrapped', upgraded);
ok('strapline + pill metadata survived the upgrade inside the banner',
    ['>Grade 5<', '>Mathematics<', '>Worksheet<', '>Term 2<'].every((needle) => upgraded.includes(needle)));
const upgradedBannerEnd = upgraded.indexOf('</section>', upgraded.indexOf('class="eduai-compliance-banner'));
ok('the old title block did not survive next to the banner',
    upgradedBannerEnd > 0 && !/<h1\b/i.test(upgraded.slice(upgradedBannerEnd)));
ok('exactly one title heading remains', count(upgraded, /<h1\b/gi) === 1);
ok('title survived the upgrade', upgraded.includes('Fractions: Halves and Quarters'));
ok('body copy survived the upgrade', upgraded.includes('Body copy'));
ok('old style block replaced by v5', count(upgraded, /<style\b[^>]*data-eduai-light/gi) === 1 && /data-eduai-light="v5"/.test(upgraded));
ok('page shell is not nested twice', count(upgraded, /<main\b/gi) === 1 && count(upgraded, /class="eduai-light-scope"/gi) === 1);
ok('one watermark only', count(upgraded, /class="watermark"/gi) === 1);

// ── 5. Content with no metadata at all ──────────────────────────────────────
assertDocument('no metadata supplied', wrapWithTemplate('<p>Bare fragment.</p>', {}));

// ── 6. Already-LIGHT card structure from the model ──────────────────────────
const lightCards = `<article class="card"><h1 class="lesson-title">Whole Numbers</h1>
<div class="lesson-meta"><span class="meta-pill">Grade 4</span></div>
<h2>Activity</h2><p>Content.</p></article>`;
assertDocument('model already uses LIGHT cards', wrapWithTemplate(lightCards, { ...meta, grade: '4' }));

// ── 7. SA structured document pipeline ──────────────────────────────────────
const saDoc = buildFullHTML(buildMinimalSADocument('Data Handling', 'Mathematics', 'Grade 2', 3, '<p>Count the pictures.</p>', { totalMarks: 20 }));
assertDocument('SA structured pipeline (buildFullHTML)', saDoc);

// ── 8. Banner gradient helper in isolation ──────────────────────────────────
console.log('\n▸ applyBannerGradients()');
ok('adds the gradient to a bare banner div', applyBannerGradients('<div class="banner">Hi</div>').includes(EDUAI_BANNER_GRADIENT));
ok('replaces a solid inline background', !applyBannerGradients('<div class="top-banner" style="background:#007749;color:#fff">Hi</div>').includes('#007749'));
ok('leaves ordinary content cards alone', applyBannerGradients('<div class="card"><p>Hi</p></div>') === '<div class="card"><p>Hi</p></div>');
ok('leaves the host compliance banner alone',
    applyBannerGradients(buildTemplateComplianceBannerHTML(meta)) === buildTemplateComplianceBannerHTML(meta));
ok('chrome stripping removes every host band',
    !/<footer|site-header|watermark|data-eduai-light/i.test(stripTemplateChrome(fragment)));

// ── 9. Committed artefacts on disk ──────────────────────────────────────────
console.log('\n▸ committed artefacts');
const artefacts: { path: string; docs: number }[] = [
    { path: 'docs/content-template-preview.html', docs: 1 },
    { path: 'docs/sa-content-layout-preview.html', docs: 1 },
    { path: 'docs/Decrease-the-size-of-the-header-banner-by-30-or-try-any-method-to-fit-all-text-in-the-header-into-1- (4).html', docs: 1 },
];
const fpDir = join(repoRoot, 'public/templates/foundation-phase');
if (existsSync(fpDir)) {
    readdirSync(fpDir)
        .filter((file) => file.endsWith('.html'))
        .forEach((file) => {
            const html = readFileSync(join(fpDir, file), 'utf-8');
            // One set of labels per document in the file (all-templates.html bundles many).
            artefacts.push({ path: join('public/templates/foundation-phase', file), docs: count(html, /<footer\b/gi) || 1 });
        });
}

/** Every two-colour vertical banner gradient in a file (whitespace-insensitive). */
const collectGradients = (html: string): string[] =>
    html.replace(/\s+/g, ' ').match(/linear-gradient\(180deg, ?#[0-9a-f]{6} 0%, ?#[0-9a-f]{6} 100%\)/gi) || [];

const countGradients = (html: string): number => collectGradients(html).length;

for (const artefact of artefacts) {
    const full = resolve(repoRoot, artefact.path);
    if (!existsSync(full)) {
        ok(`${artefact.path} exists`, false, 'missing — regenerate it');
        continue;
    }
    const html = readFileSync(full, 'utf-8');
    const banners = count(html, /class="[^"]*\beduai-compliance-banner\b/gi);
    const footers = count(html, /<footer\b/gi) || count(html, /fp-foot-text/gi);
    const canonical = count(html, new RegExp(EDUAI_TEMPLATE_FOOTER_LINE.replace(/[|]/g, '\\|'), 'g'));
    const gradients = countGradients(html);

    // The pack's gallery/launcher page carries the footer and a gradient banner
    // but is not a generated document, so it holds no compliance section.
    if (banners === 0) {
        ok(`${artefact.path.replace(/^.*\//, '')} — launcher page: canonical footer + gradient banner`,
            canonical >= 1 && gradients >= 1 && LABELS.every(({ pattern }) => count(html, pattern) === 0),
            `canonical=${canonical} gradients=${gradients}`);
        continue;
    }

    const docs = Math.max(banners, artefact.docs);
    const labelsOnce = LABELS.every(({ pattern }) => count(html, pattern) === docs);
    ok(`${artefact.path.replace(/^.*\//, '')} — labels ×${docs}, canonical footer, gradient banners`,
        labelsOnce && canonical === docs && gradients >= docs && footers >= docs,
        `labels=${LABELS.map(({ pattern }) => count(html, pattern)).join('/')} banners=${banners} footers=${footers} canonical=${canonical} gradients=${gradients}`);
}

// ── 9b. The MERGED banner — every field the reference templates printed ─────
// The templates in `assets/templates/` put the brand line, grade badge, title,
// topic subtitle, the EduAI Companion/CAPS/URL line, grade/country, the
// Name · Date · Term · Total ___ / N record row and the teacher/moderator
// sign-off in their top band and page foot. All of it now lives inside the ONE
// host banner (specifications: src/lib/templates/template-specs.ts).
console.log('\n▸ merged banner data (reference templates → ONE banner)');
const mergedMeta = {
    title: 'Place Value and Fractions',
    subtitle: 'Place Value and Fractions',
    subject: 'Mathematics',
    grade: '3',
    term: 'Term 2',
    contentType: 'Worksheet',
    date: '06/10/2026',
    totalMarks: 30,
    duration: '45 minutes',
    teacher: 'Mrs Ndlovu',
    school: 'Springfield Primary',
};
const mergedBanner = buildTemplateComplianceBannerHTML(mergedMeta);
const mergedWrapped = wrapWithTemplate('<h2>Activity 1</h2><p>Write 357 in expanded notation.</p>', mergedMeta);
const mergedBannerMarkup = mergedWrapped.slice(
    mergedWrapped.indexOf('class="eduai-compliance-banner'),
    mergedWrapped.indexOf('</section>'),
);
ok('banner carries the page-header brand lockup', mergedBannerMarkup.includes(EDUAI_BANNER_BRAND_LINE), EDUAI_BANNER_BRAND_LINE);
ok('banner carries the resource URL + country', mergedBannerMarkup.includes(EDUAI_TEMPLATE_URL) && mergedBannerMarkup.includes('🇿🇦'), EDUAI_TEMPLATE_URL);
ok('banner carries the topic subtitle', mergedBannerMarkup.includes('eduai-doc-subtitle'));
ok('banner carries the learner record strip', mergedBannerMarkup.includes('eduai-record-strip') && bannerRecordFieldsFor(mergedMeta).join(',') === 'name,date,term');
ok('banner carries the total marks + duration', mergedBannerMarkup.includes('Total: 30 marks') && mergedBannerMarkup.includes('⏱ 45 minutes'));
ok('assessment banners carry Total ___ / N and the moderator line',
    buildTemplateComplianceBannerHTML({ ...mergedMeta, contentType: 'Controlled Test', totalMarks: 50 }).includes('___ / 50') &&
    bannerSignOffFor({ contentType: 'Controlled Test' }).includes('Moderator:'));
ok('display types (poster/cards) print no record row',
    bannerRecordFieldsFor({ contentType: 'Educational Poster' }).length === 0 &&
    bannerRecordFieldsFor({ contentType: 'Flashcards (Term + Definition)' }).length === 0);
ok('record strip can be disabled explicitly', buildBannerRecordFieldsHTML({ ...mergedMeta, recordFields: [], signOff: '' }) === '');
assertDocument('merged-banner worksheet (full wrap)', mergedWrapped);

// ── 10. Palette gallery artefact — one banner per palette, all legible ──────
console.log('\n▸ committed palette gallery');
const galleryPath = resolve(repoRoot, 'docs/banner-palettes-preview.html');
if (!existsSync(galleryPath)) {
    ok('docs/banner-palettes-preview.html exists', false, 'missing — run npm run render:template-demo');
} else {
    const gallery = readFileSync(galleryPath, 'utf-8');
    const galleryGradients = collectGradients(gallery);
    const uniqueGradients = new Set(galleryGradients.map((gradient) => gradient.replace(/\s+/g, ' ')));
    ok('gallery renders one banner per palette',
        count(gallery, /data-eduai-palette="/gi) === BANNER_PALETTE_IDS.length,
        `banners=${count(gallery, /data-eduai-palette="/gi)} palettes=${BANNER_PALETTE_IDS.length}`);
    ok('gallery shows every palette gradient exactly once',
        uniqueGradients.size === BANNER_PALETTE_IDS.length,
        `${uniqueGradients.size} distinct gradients`);
    ok('every gallery gradient is a known, two-stop, legible palette gradient',
        [...uniqueGradients].every((gradient) => isKnownBannerGradient(gradient) && isBannerGradient(gradient)));
    ok('gallery lists the content type → palette mapping for the whole taxonomy',
        count(gallery, /<tr><td>[^<]+<\/td><td><span class="chip"/g) >= 60,
        `${count(gallery, /<tr><td>[^<]+<\/td><td><span class="chip"/g)} rows`);
}

// ── Result ─────────────────────────────────────────────────────────────────
console.log(`\n════ ${checks - failures}/${checks} checks passed ════`);
if (failures) {
    console.error(`❌ ${failures} check(s) failed — the generated content no longer satisfies the template contract.`);
    process.exit(1);
}
console.log('✅ Compliance labels appear once, every top banner is a two-colour gradient, and the footer text is exact.');
console.log(`   Compliance section: ${EDUAI_COMPLIANCE_LABELS}`);
console.log(`   Footer:             ${EDUAI_TEMPLATE_FOOTER_LINE}`);
