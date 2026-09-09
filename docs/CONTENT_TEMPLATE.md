# EduAI Companion — Official Content Template (LIGHT v4)

> Source artwork:
> `docs/Decrease-the-size-of-the-header-banner-by-30-or-try-any-method-to-fit-all-text-in-the-header-into-1- (4).html`
> ("EduAI Companion 2026 | LIGHT Template v4").

Every piece of generated content in the app — worksheets, lesson plans,
posters, assessments, memos, rubrics, admin documents, student notes and
practice — is wrapped in this template. The **format and style** of the
artwork are retained exactly; the informational slots are filled with live
grade / term / subject / content-type / date data.

A static demo rendered byte-for-byte by the production `wrapWithTemplate()`
lives in [`docs/content-template-preview.html`](./content-template-preview.html).
(Regenerate it any time with `./node_modules/.bin/tsx /tmp/light-test.mts` —
step 6 of the script; it also runs the 21 template assertions.)

---

## Template anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  TRANSLUCENT HEADER BAR  (60px, sticky, backdrop blur, 0.92)     │
│   (logo 36px)  EDUAI COMPANION 2026 | CAPS COMPLIANT EDUCATION   │
│                RESOURCE | GRADE 5 • TERM 2 • MATHEMATICS • …     │
│   ─────────────── 2.5px #2563eb underline ──────────────────     │
├──────────────────────────────────────────────────────────────────┤
│  WHITE PAGE (max 800px, centred)                                 │
│   ┌─ card (white, 16px radius, soft navy shadow) ─────────────┐  │
│   │  Lesson title (Fredoka 32px, #1e3a5f)                     │  │
│   │  (Grade 5) (Mathematics) (Worksheet) (Term 2) (CAPS …)    │  │
│   │  …dynamic AI-generated content…                           │  │
│   └───────────────────────────────────────────────────────────┘  │
│        …faded EduAI watermark behind the cards (opacity 0.5)…    │
├──────────────────────────────────────────────────────────────────┤
│  NAVY FOOTER BAND  (#1e3a5f, centred, Fredoka 8pt)               │
│   © 2026 EduAI Companion | CAPS Compliant Educational Resource   │
│   | Developed for South African Educators                        │
│   ALL CONTENT RIGHTS RESERVED TO • DEVELOPER: Z MSUTHU (C) 2026  │
│   • GENERATED: 09/09/2026 • WORKSHEET • EDUAI-COMPANION.…        │
└──────────────────────────────────────────────────────────────────┘
```

### Header (single-line strapline — never wraps)

| Slot | Data |
| --- | --- |
| Fixed lead | `EDUAI COMPANION 2026 \| CAPS COMPLIANT EDUCATION RESOURCE` |
| Dynamic trail | `GRADE {grade} • TERM {term} • {SUBJECT} • {CONTENT TYPE}` (auto current SA term when not supplied) |

Fredoka 600, 6pt, uppercase, `#1e3a5f`, clamped to **one line** with an
ellipsis so the 60px bar can never grow on narrow screens.

### Title block + meta pills

Plain AI fragments are lifted into an opaque white `<article class="card">`
(the cards stay fully legible over the watermark) and open with an
`<h1 class="lesson-title">` plus pills: grade, subject, content type, term,
`CAPS Aligned`. Fragments that already use LIGHT card structure
(`article.card` / `.lesson-title`) are kept as-is. AI prompts
(`src/lib/prompts/master-prompt.ts`, `system-prompts.ts`) steer the model to
emit this structure natively: `<h2>` sections, `<ul class="objectives">`,
`<div class="activity">`, `<div class="tip">` — and never its own page-level
header/footer chrome.

### Footer (rights band)

| Slot | Data |
| --- | --- |
| Primary line | `© 2026 EduAI Companion \| CAPS Compliant Educational Resource \| Developed for South African Educators` (exactly as drawn) |
| Sub-line (muted) | rights + developer + `GENERATED: {date} • {content type}` + school (if any) + official URL |

---

## Where the template is applied

| Surface | File | How |
| --- | --- | --- |
| **Single source of truth** | `src/lib/contentTemplate.ts` | `EDUAI_LIGHT_CSS`, `buildTemplateHeaderHTML`, `buildTemplateFooterHTML`, `buildTemplateWatermarkHTML`, `buildTemplateTitleBlockHTML`, `wrapWithTemplate` (idempotent), `metaFromPrintOptions` |
| **On-screen generation preview** (iframe) | `src/components/ContentCreator.tsx` (`HtmlPreviewFrame`) | full LIGHT document shell (Fredoka/Inter + `EDUAI_LIGHT_CSS`); content wrapped with `wrapWithTemplate` when metadata is available; teacher font choice overrides via `fontOverrideCss` |
| **Print / PDF / HTML exports** | `src/lib/printUtils.ts` | `wrapWithBrandedTemplate` used by `printContent`, `downloadAsPDF`, `downloadAsHTML`; neutral shells (LIGHT owns all spacing) + `@page 15mm` |
| **Print preview modal (paper view)** | `src/components/PrintPreviewModal.tsx` | renders the exact `wrapWithTemplate()` output — WYSIWYG with exports; Foundation/alt fonts via a template-scoped override that also survives re-export |
| **SA structured document pipeline** | `src/lib/templates/sa-html-templates.ts` | `buildFullHTML` + `wrapContentWithSABranding` open with the LIGHT header and close with the LIGHT footer (POPIA notice kept above it); LIGHT stylesheet injected into `<head>` (content selectors are `.eduai-light-scope`d, so SA `.page` styles never collide) |
| **DOCX exports** | `src/lib/assemblers/docx-assembler.ts` | running header/footer carry the LIGHT strapline/footer text in LIGHT navy |
| **Server-side PDF exports** | `src/lib/assemblers/pdf-assembler.ts` | Chromium footer template carries the LIGHT footer text in LIGHT navy |

The template logo is served from `public/eduai-logo.png` and resolved to an
absolute URL at render time so it survives iframe previews, popup print
windows and html2canvas rasterisation. (The artwork file's embedded base64
images are intentionally *not* copied — one shared asset keeps every export
light.)

Portability guarantees:

- Header / watermark / footer / page-shell layout is **fully inline**, so the
  markup survives React previews, iframe srcDocs, `window.print()` documents,
  html2canvas rasterisation and HTML downloads identically.
- Component styling ships as an embedded `<style data-eduai-light="v4">`
  block, so offscreen PDF containers and print windows are styled without
  `<head>` control.
- `wrapWithTemplate()` is **idempotent**: already-wrapped markup (including
  legacy chrome) passes through untouched instead of double-wrapping — this
  also fixed print/PDF/HTML re-exports launched from the preview paper.
- Print rules: sticky header goes static, cards avoid breaking inside, and
  interactive `.btn` elements are hidden on paper.

## Usage

```ts
import { wrapWithTemplate } from '../lib/contentTemplate';

const html = wrapWithTemplate(generatedBodyHtml, {
  title: 'Fractions: Halves and Quarters',
  subject: 'Mathematics',
  grade: '5',
  term: 'Term 2',
  contentType: 'Worksheet',
  date: '09/09/2026',          // defaults to today (SA format)
});
```

`PrintOptions` (used across all export helpers) accepts `term`, `school`
and `teacher`, which flow straight into the template.

## Palette (sampled from the artwork)

| Token | Value |
| --- | --- |
| Navy / header text / footer band | `#1e3a5f` |
| Accent / header underline | `#2563eb` (light `#3b82f6`) |
| Header bar | `rgba(255,255,255,0.35)` + 8px blur, opacity 0.92 |
| Footer text | `#e2e8f0` (sub-line `#9fb3cc`) |
| Paper / cards | `#ffffff` (card border `#e2e8f0`) |
| Body text | `#334155` (muted `#475569`) |
| Meta pills | bg `#eff6ff`, border `#dbeafe`, text `#2563eb` |
