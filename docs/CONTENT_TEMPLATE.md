# EduAI Companion — Official Content Template (LIGHT v5)

> Source artwork:
> `docs/Decrease-the-size-of-the-header-banner-by-30-or-try-any-method-to-fit-all-text-in-the-header-into-1- (4).html`
> ("EduAI Companion 2026 | LIGHT Template v5").

Every piece of generated content in the app — worksheets, lesson plans,
posters, assessments, memos, rubrics, admin documents, student notes and
practice — is wrapped in this template. The **format and style** of the
artwork are retained exactly; the informational slots are filled with live
grade / term / subject / content-type / date data.

Two static demos are rendered byte-for-byte by the production
`wrapWithTemplate()`:

| Artefact | Shows |
| --- | --- |
| [`docs/content-template-preview.html`](./content-template-preview.html) | a finished sample document |
| [`docs/content-normalisation-demo.html`](./content-normalisation-demo.html) | messy model output (its own banner + labels ×3, solid bands, its own footer) next to the normalised result |
| [`docs/sa-content-layout-preview.html`](./sa-content-layout-preview.html) | the SA structured pipeline document (school letterhead, CAPS/ATP reference, marks, differentiation) |
| [`docs/banner-palettes-preview.html`](./banner-palettes-preview.html) | the ONE banner in **every content-type palette**, with contrast figures and the full content-type → palette table |

Regenerate all four with `npm run render:template-demo`, then prove the contract
still holds with `npm run verify:template` (171 assertions — see
[Verification](#verification)).

---

## The three guarantees

| # | Guarantee | Where it is enforced |
| --- | --- | --- |
| 1 | **ONE BANNER** — the document title, every metadata pill (grade, subject, content type, term, date, school, teacher, learner) and the CAPS code + compliance labels live in **one** band at the top of the document, exactly once | `buildTemplateComplianceBannerHTML()` renders the only copy; `collapseLeadingChrome()` absorbs **every** band at the top of the document (school header, CAPS reference bar, formal assessment header, meta strip, duplicate banner, logo strip) into that banner, then `stripLeadingDuplicateBanner()` + `stripDuplicateTitleHeading()` delete anything banner-shaped that is left |
| 2 | **GRADIENT** — no top banner is ever one solid colour | the banner is a **two-colour vertical gradient chosen for the content type** (`bannerPalettes.ts`: worksheet = orange → magenta, lesson plan = indigo → violet, assessment = crimson → purple, memo = green → teal, poster = fuchsia → burnt orange, cards = teal → royal blue, admin = royal blue → sky, certificate = violet → gold, SIAS = deep violet → emerald, Foundation Phase = pink → azure; navy → azure only as the unknown-type fallback), `EDUAI_HEADER_GRADIENT` (very light blue @ 70% transparency) on the compact header, `applyBannerGradients()` repaints model banners in the document palette |
| 3 | **FOOTER** — one canonical footer line, word for word | `EDUAI_TEMPLATE_FOOTER_LINE`, rendered by `buildTemplateFooterHTML()` after every model footer is removed |

### 1 · The single document banner (everything, once)

```
┌─ section.eduai-compliance-banner ────────────────────────────────┐
│  h1.lesson-title        Fractions: Halves and Quarters           │
│  .lesson-meta pills     Grade 5 · Mathematics · Worksheet ·      │
│                         Term 2 · 18/09/2026 · School: … ·        │
│                         Teacher: … · Learner: …                  │
│  .eduai-doc-compliance  CAPS Code:… | CAPS: … | ATP: …           │
│                         🇿🇦 ✅ CAPS Aligned ✅ NPA Compliant      │
│                         ✅ POPIA Compliant (2026) ✅ SIAS Level 1 │
│                         Inclusive ✅ WP6 Differentiated           │
└──────────────────────────────────────────────────────────────────┘
```

One `<section class="eduai-compliance-banner">` per document, two-colour
**vertical** gradient, white bold text, written with an inline `style` so it
survives iframe previews, print, html2canvas rasterisation and downloads.

- **Nothing banner-ish may precede it.** The only thing above the one banner is
  the brand header (`<header class="site-header">`) and, in the SA pipeline, the
  decorative flag stripe. `collapseLeadingChrome()` walks the leading run of
  elements and absorbs every band the model opened the document with — a school
  header / letterhead, a CAPS reference bar, a "formal assessment header", a
  subject-grade-term-date-marks strip, a logo strip, a hero band or a second
  banner (even one nested inside a `.poster-container` wrapper) — harvesting the
  values they displayed (grade, subject, term, type, date, marks, duration,
  school, teacher, learner, CAPS code/reference, ATP week) into the banner's
  metadata before deleting the bands. `stripLeadingDuplicateBanner()` and
  `stripDuplicateTitleHeading()` then remove anything banner-shaped that is left
  and any second `<h1…lesson-title…>` repeating the title. Long paragraphs, real
  lists/tables, content illustrations and section headings are never touched.
- **Pills are deduplicated and ordered**: grade → subject → content type → term
  → date → school → teacher → learner → caller extras
  (`buildBannerPills()`). Values are title-cased only when fully lowercase
  (`worksheet` → `Worksheet`), dates are normalised to SA `DD/MM/YYYY`, the
  grade pill reads `Grade 5` / `Grade R` and the term pill `Term 2`.
- **The CAPS code** is supplied by the caller or derived by `buildCAPSCode()`
  (phase · subject · grade · term · topic, e.g. `FP-MATH-G2-T3-DH01`), optionally
  followed by the SA pipeline's `CAPS:` curriculum reference and `ATP: Week N`.

Duplicates cannot survive, whatever the model emits:

- elements classed `*compliance*` / `*stamp*` / `eduai-compliance-banner` are removed;
- single-label tags (`<span>✅ CAPS Aligned</span>`) are removed;
- plain-text status rows are removed **only when the labels are all the element
  says** — a real sentence such as *"this resource is ✅ CAPS Aligned and can be
  filed into the SBA record"* keeps its wording with the labels lifted out;
- runs of labels, `CAPS Code:` prefixes, 🇿🇦/✅ marks and model copyright lines
  are stripped from body text;
- any element that paints itself with a background repeating the title or two or
  more pills (a model "banner" rebuilt with inline CSS) is stripped too;
- prompts (`master-prompt.ts`, `system-prompts.ts`, `server.ts`, the content /
  assessment / admin template prompts) tell the model not to emit stamps,
  banners, title blocks or footers at all.

### 2 · Gradients, never flat colours

| Band | Treatment |
| --- | --- |
| Page header (chrome) | `EDUAI_HEADER_GRADIENT` — **very light blue at 70% transparency**: `rgba(219,234,254,0.30)` → `rgba(191,219,254,0.30)`, downward |
| Document banner | the **content-type palette** from `src/lib/bannerPalettes.ts` — always `linear-gradient(180deg, <from> 0%, <to> 100%)`, never a solid fill |
| Any model-authored top banner | the document's own palette gradient, written **inline with `!important`** by `applyBannerGradients(html, gradient)` |

#### Banner palettes (bright, dynamic, one per content family)

| Palette | Colours (top → bottom) | Used for |
| --- | --- | --- |
| `worksheet` | `#c2410c` → `#be185d` burnt orange → magenta | worksheets, homework, class exercises, written tasks |
| `lesson` | `#4338ca` → `#7c3aed` indigo → violet | lesson plans, daily/weekly notes, study guides, packs |
| `assessment` | `#be123c` → `#9333ea` crimson → purple | tests, examinations, FATs, investigations, projects |
| `memo` | `#15803d` → `#0e7490` green → teal | marking memos, rubrics, checklists, model answers |
| `poster` | `#c026d3` → `#c2410c` fuchsia → burnt orange | posters, charts, word walls, diagrams, displays, labels |
| `cards` | `#0f766e` → `#1d4ed8` teal → royal blue | flashcards, vocabulary/formula/matching/cut-out cards |
| `admin` | `#1d4ed8` → `#0369a1` royal blue → sky | notices, letters, permission slips, registers, policies |
| `certificate` | `#6d28d9` → `#b45309` violet → gold | certificates, awards, stickers, seals, emblems |
| `intervention` | `#5b21b6` → `#047857` deep violet → emerald | SIAS support, individualised learning plans, remediation |
| `foundation` | `#db2777` → `#2563eb` pink → azure | Foundation Phase packs and playful Grade R–3 activities |
| `brand` (fallback) | `#1e3a5f` → `#2563eb` navy → azure | only when the content type cannot be recognised |

`bannerPaletteFor(contentType, explicitId?)` resolves the palette from the
content type with first-match-wins rules (certificates before admin letters,
memos/rubrics before assessments, posters before admin, Foundation Phase packs
before generic worksheets); an explicit `meta.palette` id wins over the rules.
Every one of the 70+ content types in the Content Creator taxonomy
(`src/lib/contentTypes.ts`) resolves to a named palette — asserted in
`tests/content-template.test.ts` and `scripts/verify-content-template.ts`.
Both gradient stops are checked to keep white banner text legible
(WCAG contrast ≥ 4.5:1 — `contrastWithWhite()`).

`applyBannerGradients(html, gradient)` targets `<header>` plus anything
classed/id'd `banner`, `hero`, `masthead`, `title-block`, `doc-title`,
`page-title`, `cover-head`, `top-bar`, `letterhead`, `school-header`,
`caps-bar`, …; it drops the model's `background`, `background-color`/`-image`
and `color` declarations and substitutes the **document's palette gradient**
plus white text and `print-color-adjust: exact`. Inline + `!important` beats
Tailwind utilities (`bg-emerald-700`) and model CSS in the browser, in iframe
previews, in html2canvas rasterisation and in Chromium PDF. The wrapper
publishes the palette as the scoped custom property
`--eduai-banner-gradient` (on `.eduai-light-scope` in the LIGHT template, on
`<body>` in the SA pipeline), so `EDUAI_LIGHT_CSS`, `SA_BASE_CSS` and the
Foundation Phase pack's CSS repaint any stray model band in the same colours as
a safety net; the host banners also write the gradient **inline**.
DOCX has no CSS gradients, so Word's single banner table is shaded with the
palette's two stops (top row `from`, bottom row `to`).

### 3 · The canonical footer

```
© 2026 EduAI Companion | CAPS Compliant Educational Resource | Developed for South African Educators | All Rights Reserved to Developer: Z MSUTHU © 2026 |
```

One navy band, one line, no sub-line. `EDUAI_TEMPLATE_FOOTER_LINE` is the single
source of truth — the DOCX running footer, the ZIP readme/compliance report, the
portfolio PDF pages and the Foundation Phase pack all import it rather than
retyping it.

---

## Template anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPACT HEADER (26px, sticky, blur) — VERY LIGHT BLUE @ 70%     │
│   #dbeafe → #bfdbfe at alpha .30 (two-stop vertical wash)        │
│   (logo 15px @ 0.5)   EDUAI COMPANION 2026 | OFFICIAL            │
│                       EDUCATIONAL RESOURCE                       │
├──────────────────────────────────────────────────────────────────┤
│  WHITE PAGE (max 800px, centred) over a faded watermark          │
│   ┌─ card (white, 16px radius, soft navy shadow) ─────────────┐  │
│   │  ▓ THE ONE BANNER ▓  ← palette per content type, 180deg  │  │
│   │     Lesson title (Fredoka, white)                         │  │
│   │     (Grade 5) (Mathematics) (Worksheet) (Term 2) (date)   │  │
│   │     (School: …) (Teacher: …) (Learner: …)                 │  │
│   │     CAPS Code:… | CAPS: … | ATP: …                        │  │
│   │     🇿🇦 ✅ CAPS ✅ NPA ✅ POPIA ✅ SIAS ✅ WP6              │  │
│   │  …dynamic AI-generated content…                           │  │
│   └───────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  NAVY FOOTER BAND (#1e3a5f, centred, Fredoka 8pt)                │
│   © 2026 EduAI Companion | CAPS Compliant Educational Resource   │
│   | Developed for South African Educators | All Rights Reserved  │
│   to Developer: Z MSUTHU © 2026 |                                │
└──────────────────────────────────────────────────────────────────┘
```

### Header (brand only — never duplicates the banner)

| Slot | Data |
| --- | --- |
| Fixed strapline | `EDUAI COMPANION 2026 \| OFFICIAL EDUCATIONAL RESOURCE` |

Fredoka 600, `clamp(7px,1.05vw,9px)` fluid, uppercase, `#1e3a5f` at 0.78
opacity, clamped to **one line** with `white-space:nowrap` +
`text-overflow:ellipsis` so the 26px bar can never grow or wrap on narrow
screens. Grade, term, subject, content type, date, CAPS code and the compliance
labels deliberately do **not** appear here: they belong to the one banner below,
and repeating them would put the same information twice at the top of every
page.

### Banner title + meta pills

Plain AI fragments are lifted into an opaque white `<article class="card">` and
open with the single banner (title → pills → compliance line). Fragments that
already use LIGHT card structure (`article.card` / `.lesson-title`) keep it, with
the banner restored to the exact position the host gave it. AI prompts steer the
model to emit `<h2>` sections, `<ul class="objectives">`, `<div class="activity">`
and `<div class="tip">` natively — and never its own page-level header, banner,
title block, pills or footer.

---

## Idempotent *and* self-healing

`wrapWithTemplate()` can be called on anything, any number of times:

- **Current canonical output passes through byte-for-byte** — re-exporting the
  print-preview paper never double-wraps (`isCurrentTemplateOutput()` checks the
  `data-eduai-light="v5"` style block, one banner, one footer band, the exact
  footer text and each label exactly once).
- **Everything else is normalised**: `stripTemplateChrome()` lifts out embedded
  LIGHT stylesheets, `site-header` / `site-footer` bands, the watermark and the
  page shell (remembering the banner's position with a slot marker so it goes
  back exactly where it was), then the canonical chrome is rebuilt around the
  content — one banner, gradient bands, exact footer.
- **Nothing is lost doing it**: `harvestMetaFromChrome()` recovers grade, term,
  subject, content type, title and CAPS code from the chrome being replaced
  (including a legacy strapline such as
  `… | GRADE 5 • TERM 2 • MATHEMATICS • WORKSHEET` and legacy `.lesson-meta`
  pills), so re-wrapping an archived document without metadata still renders the
  same pills and the same CAPS code. Caller metadata always wins.

This matters for content generated **before** a template revision: archived
worksheets in Firestore, previously downloaded HTML re-imported for printing,
and model output that copied our chrome all come back with one banner, gradient
bands and the current footer instead of keeping stale ones.

---

## Where the template is applied

| Surface | File | How |
| --- | --- | --- |
| **Single source of truth** | `src/lib/contentTemplate.ts` | `EDUAI_LIGHT_CSS`, `EDUAI_BANNER_GRADIENT` (brand fallback), `EDUAI_HEADER_GRADIENT`, `EDUAI_HEADER_TINT`, `EDUAI_COMPLIANCE_LABELS`, `EDUAI_TEMPLATE_FOOTER_LINE`, `buildTemplate{Style,Header,Footer,Watermark,Banner,ComplianceBanner,TitleBlock}HTML`, `stripTemplateChrome`, `stripGeneratedComplianceMarkup`, `collapseLeadingChrome`, `mergeMeta`, `stripLeadingDuplicateBanner`, `stripDuplicateTitleHeading`, `applyBannerGradients`, `harvestMetaFromChrome`, `isCurrentTemplateOutput`, `wrapWithTemplate`, `metaFromPrintOptions` |
| **Banner palettes** | `src/lib/bannerPalettes.ts` | `BANNER_PALETTES`, `BANNER_PALETTE_IDS`, `bannerPaletteFor`, `bannerGradientFor`, `buildBannerGradient`, `isBannerGradient`, `isKnownBannerGradient`, `contrastWithWhite` |
| **Content-type taxonomy** | `src/lib/contentTypes.ts` | `TEACHING_CATEGORIES`, `VISUAL_TYPES`, `ADMIN_TYPES` — every type resolves to a named palette |
| **On-screen generation preview** (iframe) | `src/components/ContentCreator.tsx` (`HtmlPreviewFrame`) | full LIGHT document shell; content always wrapped — even when no metadata was supplied — so the light-blue header, the one banner and the footer are never missing |
| **Print / PDF / HTML exports** | `src/lib/printUtils.ts` | `wrapWithBrandedTemplate` used by `printContent`, `downloadAsPDF`, `downloadAsHTML`; neutral shells (LIGHT owns all spacing) + `@page 15mm` |
| **Print preview modal (paper view)** | `src/components/PrintPreviewModal.tsx` | renders the exact `wrapWithTemplate()` output — WYSIWYG with exports |
| **Posters** | `src/components/PosterPreview.tsx` | one host banner painted with the `poster` palette gradient, exact footer line |
| **SA structured document pipeline** | `src/lib/templates/sa-html-templates.ts` | `buildFullHTML` opens with the LIGHT header and the one banner (school letterhead, phase/duration/marks and CAPS/ATP folded into its pills/reference line) and closes with the LIGHT footer; `SA_BASE_CSS` repaints generated banners with `var(--eduai-banner-gradient, …)` `!important` (the palette is published on `<body>`) |
| **Foundation Phase printable pack** | `src/lib/templates/foundation/render.ts` → `public/templates/foundation-phase/*.html` | `.fp-banner` is the single banner, painted (CSS **and inline**) with the pack kind's palette — award = `certificate`, worksheet = `worksheet`, classroom = `cards`, homework = `foundation`; rebuild with `npm run build:fp-templates` |
| **DOCX exports** | `src/lib/assemblers/docx-assembler.ts` | running header/footer carry the compliance line and `EDUAI_TEMPLATE_FOOTER_LINE` in LIGHT navy |
| **Server-side PDF exports** | `src/lib/assemblers/pdf-assembler.ts` | Chromium's own header/footer layer is disabled — `buildFullHTML` already contains the single canonical footer |
| **Portfolio PDFs** | `src/components/StudentPortfolio.tsx` | the banner paints `bannerGradientFor('Portfolio Task')` (assessment palette) plus the compliance line and the exact footer on every page |
| **ZIP packages** | `src/lib/assemblers/zip-packager.ts` | readme + compliance report import `EDUAI_TEMPLATE_FOOTER_LINE` |

The template logo is served from `public/eduai-logo.png` and resolved to an
absolute URL at render time so it survives iframe previews, popup print windows
and html2canvas rasterisation.

Portability guarantees:

- Header / watermark / banner / footer / page-shell layout is **fully inline**,
  so the markup survives React previews, iframe srcDocs, `window.print()`
  documents, html2canvas rasterisation and HTML downloads identically.
- Component styling ships as an embedded `<style data-eduai-light="v5">` block,
  so offscreen PDF containers and print windows are styled without `<head>`
  control.
- Print rules: sticky header goes static, cards avoid breaking inside, the
  50%-opacity watermark is hidden on paper, and interactive `.btn` elements are
  hidden.

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
  school: 'Springfield Primary', // optional banner pills
  teacher: 'Mrs Ndlovu',
  learner: 'Thandi M.',        // optional
});
```

`PrintOptions` (used across all export helpers) accepts `term`, `school`,
`teacher` and `learner`, which flow straight into the banner.

## Verification

```bash
npm run verify:template      # 110 assertions, exits non-zero on any regression
npm run render:template-demo # regenerate the two committed demos
npm run build:fp-templates   # regenerate the Foundation Phase pack
```

`scripts/verify-content-template.ts` runs the production wrapper against the
awkward inputs models really produce — plain fragments, LIGHT-card markup,
standalone documents with their own header/footer, three separate copies of the
labels, an old title block next to the banner, solid inline banners, Tailwind
colour utilities, and documents wrapped by an older template — asserting for
each: one compliance section, every label exactly once, one CAPS code, one
footer band with the exact canonical text, no stale rights/generated sub-lines,
the two-colour vertical gradient, **nothing banner-ish before the one banner**,
the very light blue header tint, byte-stable re-wrapping, surviving content and
metadata. It finishes by re-checking the committed artefacts (both demos, the
artwork and all 30 Foundation Phase files — including that every one of the 28
pack documents carries the gradient inline). The palette contract adds 4 more
checks over the committed `docs/banner-palettes-preview.html` gallery: one
banner per palette, every palette gradient present exactly once, every gradient
a known two-stop 180deg palette gradient, and the whole taxonomy mapped in the
table.

## Palette (sampled from the artwork)

| Token | Value |
| --- | --- |
| Navy / header text / footer band | `#1e3a5f` |
| Accent / gradient end | `#2563eb` (light `#3b82f6`) |
| Banner gradient | **content-type palette** (`bannerPalettes.ts`) — e.g. worksheet `linear-gradient(180deg, #c2410c 0%, #be185d 100%)`, certificate `linear-gradient(180deg, #6d28d9 0%, #b45309 100%)`; `EDUAI_BANNER_GRADIENT` (`linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%)`) is the unknown-type fallback |
| Header wash (very light blue @ 70% transparent) | `rgba(219,234,254,0.30)` → `rgba(191,219,254,0.30)` + 5px blur |
| Header border | `rgba(147,197,253,0.55)` |
| Banner pills | bg `rgba(255,255,255,0.16)`, border `rgba(255,255,255,0.34)`, text `#ffffff` |
| Footer text | `#e2e8f0` |
| Paper / cards | `#ffffff` (card border `#e2e8f0`) |
| Body text | `#334155` (muted `#475569`) |
