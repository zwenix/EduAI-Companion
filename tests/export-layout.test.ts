import { describe, expect, it } from 'vitest';
import { EDUAI_LIGHT_CSS, tightenLeadingSpace, wrapWithTemplate } from '../src/lib/contentTemplate';
import { PDF_PAGEBREAK_OPTIONS } from '../src/lib/pdfHelper';

describe('PDF page-break options', () => {
  it('never uses avoid-all (it pushes whole-document wrappers onto page 2)', () => {
    expect(PDF_PAGEBREAK_OPTIONS.mode).not.toContain('avoid-all');
    expect(PDF_PAGEBREAK_OPTIONS.mode).toEqual(expect.arrayContaining(['css', 'legacy']));
  });

  it('only keeps small blocks whole', () => {
    for (const big of ['div', 'section', 'article', 'main', '.card', '.page']) {
      expect(PDF_PAGEBREAK_OPTIONS.avoid).not.toContain(big);
    }
    expect(PDF_PAGEBREAK_OPTIONS.avoid).toEqual(expect.arrayContaining(['tr', 'img', 'li']));
  });
});

describe('template spacing', () => {
  it('lets the card flow across printed pages', () => {
    const print = EDUAI_LIGHT_CSS.slice(EDUAI_LIGHT_CSS.lastIndexOf('@media print'));
    expect(print).toMatch(/\.card\s*\{[^}]*break-inside:\s*auto/);
    expect(print).not.toMatch(/\.card\s*\{[^}]*break-inside:\s*avoid/);
  });

  it('keeps the banner within ~1 line of the page header', () => {
    const doc = wrapWithTemplate('<h2>Intro</h2><p>Text</p>', { title: 'T', contentType: 'Lesson Plan' });
    expect(doc).toMatch(/<main class="page"[^>]*padding:\s*10px 20px 60px/);
    expect(EDUAI_LIGHT_CSS).toMatch(/\.page\s*\{\s*padding-top:\s*10px\s*!important/);
  });

  it('drops blank spacer markup opening the document', () => {
    const out = tightenLeadingSpace('<p>&nbsp;</p><br><br><div style="height:120px"></div><h1>Title</h1><p>x</p>');
    expect(out.startsWith('<h1')).toBe(true);
    expect(out).toContain('data-eduai-lead');
    expect(out).toContain('<p>x</p>');
  });

  it('tags the wrapper chain down to the first text and is idempotent', () => {
    const src = '<div class="min-h-screen pt-20"><div class="hero" style="margin-top:60px;min-height:300px"><br><h1>Water</h1></div><p>Body</p></div>';
    const once = tightenLeadingSpace(src);
    expect(once.match(/data-eduai-lead/g)?.length).toBe(3);
    expect(once).not.toContain('<br>');
    expect(tightenLeadingSpace(once)).toBe(once);
  });

  it('never swallows the banner slot comment', () => {
    const out = tightenLeadingSpace('<!--EDUAI_COMPLIANCE_SLOT--><h1>A</h1>');
    expect(out).toContain('EDUAI_COMPLIANCE_SLOT');
  });

  it('wrapped output still has exactly one banner', () => {
    const doc = wrapWithTemplate('<br><br><div class="hero" style="padding-top:80px"><h1>Lesson Plan</h1></div><p>x</p>', { title: 'Lesson Plan', contentType: 'Lesson Plan' });
    expect(doc.match(/class="eduai-compliance-banner"/g)?.length).toBe(1);
  });
});

describe('illustration placeholders', () => {
  it('never repaints an object-cover <img> with the banner gradient', async () => {
    const { replaceImagePlaceholders } = await import('../src/lib/imageReplacer');
    const body = replaceImagePlaceholders('[Illustration: learners counting flowers]<h2>Objectives</h2>');
    const doc = wrapWithTemplate(body, { title: 'Counting', contentType: 'Lesson Plan' });
    const img = doc.match(/<img[^>]*eduai-async-image[^>]*>/i)?.[0] || '';
    expect(img).toBeTruthy();
    expect(img).not.toMatch(/linear-gradient/i);
  });

  it('collapses pending illustrations and hides failed ones', () => {
    expect(EDUAI_LIGHT_CSS).toMatch(/img\.eduai-async-image\[data-eduai-pending\][^}]*height:\s*44px/);
    expect(EDUAI_LIGHT_CSS).toMatch(/img\[data-eduai-failed\]\s*\{\s*display:\s*none/);
  });

  it('the static utility layer really hides `.hidden`', async () => {
    const { EDUAI_DOC_TAILWIND_CSS } = await import('../src/lib/docTailwindCompat');
    expect(EDUAI_DOC_TAILWIND_CSS).toMatch(/\.hidden\s*\{\s*display:\s*none/);
    expect(EDUAI_DOC_TAILWIND_CSS).not.toMatch(/display:\s*hidden/);
  });
});
