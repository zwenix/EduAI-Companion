# EduAI Companion — Official Content Template (LIGHT v4)

> Source artwork:
> `docs/Decrease-the-size-of-the-header-banner-by-30-or-try-any-method-to-fit-all-text-in-the-header-into-1- (4).html`
> ("EduAI Companion 2026 | LIGHT Template v4").

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
| [`docs/content-normalisation-demo.html`](./content-normalisation-demo.html) | messy model output (labels ×3, solid banner, its own footer) next to the normalised result |

Regenerate both with `npm run render:template-demo`, then prove the contract
still holds with `npm run verify:template` (101 assertions — see
[Verification](#verification)).

---

## The three guarantees

| # | Guarantee | Where it is enforced |
| --- | --- | --- |
| 1 | **ONCE** — the compliance labels are written exactly one time per document, inside the designated gradient section | `EDUAI_COMPLIANCE_LABELS` + `buildTemplateComplianceBannerHTML()` render the only copy; `stripGeneratedComplianceMarkup()` deletes every model-authored copy first |
| 2 | **GRADIENT** — no top banner is ever one solid colour | `EDUAI_BANNER_GRADIENT` (navy → blue) on the host section, `EDUAI_HEADER_GRADIENT` (white → pale blue) on the compact header, `applyBannerGradients()` rewrites model banners inline |
| 3 | **FOOTER** — one canonical footer line, word for word | `EDUAI_TEMPLATE_FOOTER_LINE`, rendered by `buildTemplateFooterHTML()` after every model footer is removed |

### 1 · The designated compliance section (written once)

```
CAPS Code:FP-MATH-G2-T3-DH01 🇿🇦 ✅ CAPS Aligned✅ NPA Compliant✅ POPIA Compliant (2026)✅ SIAS Level 1 Inclusive✅ WP6 Differentiated
```

One `<section class="eduai-compliance-banner">` per document, full-bleed inside
its card, two-colour gradient, white bold text. The CAPS code is supplied by the
caller or derived by `buildCAPSCode()` (phase · subject · grade · term · topic).

Duplicates cannot survive, whatever the model emits:

- elements classed `*compliance*` / `*stamp*` / `eduai-compliance-banner` are removed;
- single-label tags (`<span>✅ CAPS Aligned</span>`) are removed;
- plain-text status rows are removed **only when the labels are all the element
  says** — a real sentence such as *"this resource is ✅ CAPS Aligned and can be
  filed into the SBA record"* keeps its wording with the labels lifted out;
- runs of labels, `CAPS Code:` prefixes, 🇿🇦/✅ marks and model copyright lines
  are stripped from body text;
- prompts (`master-prompt.ts`, `system-prompts.ts`, `server.ts`, the content /
  assessment / admin template prompts) tell the model not to emit stamps,
  banners or footers at all.

### 2 · Two-colour gradient banners

| Banner | Treatment |
| --- | --- |
| Compact document header | `EDUAI_HEADER_GRADIENT` — white → pale blue wash at watermark strength (never a solid bar, never one flat colour) |
| Designated compliance section | `EDUAI_BANNER_GRADIENT` — `linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)` |
| Any model-authored top banner | the same gradient, written **inline with `!important`** by `applyBannerGradients()` |

`applyBannerGradients()` targets `<header>` plus anything classed/id'd
`banner`, `hero`, `masthead`, `title-block`, `doc-title`, `page-title`,
`cover-head` or `top-bar`; it drops the model's `background`,
`background-color`/`-image` and `color` declarations and substitutes the
gradient plus white text and `print-color-adjust: exact`. Inline + `!important`
beats Tailwind utilities (`bg-emerald-700`) and model CSS in the browser, in
iframe previews, in html2canvas rasterisation and in Chromium PDF.
`EDUAI_LIGHT_CSS` and the SA pipeline's `SA_BASE_CSS` carry the same rule as a
CSS safety net.

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
│  COMPACT HEADER (26px, sticky, blur) — TWO-COLOUR WASH           │
│   white → pale blue gradient                                     │
│   (logo 15px @ 0.28)  EDUAI COMPANION 2026 | CAPS COMPLIANT …    │
│                       | GRADE 5 • TERM 2 • MATHEMATICS • …       │
├──────────────────────────────────────────────────────────────────┤
│  WHITE PAGE (max 800px, centred) over a faded watermark          │
│   ┌─ card (white, 16px radius, soft navy shadow) ─────────────┐  │
│   │  Lesson title (Fredoka 32px, #1e3a5f)                     │  │
│   │  (Grade 5) (Mathematics) (Worksheet) (Term 2)             │  │
│   │  ▓▓ DESIGNATED COMPLIANCE SECTION ▓▓ ← navy → blue        │  │
│   │     CAPS Code:… 🇿🇦 ✅ CAPS ✅ NPA ✅ POPIA ✅ SIAS ✅ WP6 │  │
│   │  …dynamic AI-generated content…                           │  │
│   └───────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  NAVY FOOTER BAND (#1e3a5f, centred, Fredoka 8pt)                │
│   © 2026 EduAI Companion | CAPS Compliant Educational Resource   │
│   | Developed for South African Educators | All Rights Reserved  │
│   to Developer: Z MSUTHU © 2026 |                                │
└──────────────────────────────────────────────────────────────────┘
```

### Header (single-line strapline — never wraps)

| Slot | Data |
| --- | --- |
| Fixed lead | `EDUAI COMPANION 2026 \| CAPS COMPLIANT EDUCATION RESOURCE` |
| Dynamic trail | `GRADE {grade} • TERM {term} • {SUBJECT} • {CONTENT TYPE}` (auto current SA term when not supplied) |

Fredoka 600, `clamp(7px,1.05vw,9px)` fluid, uppercase, `#1e3a5f` at 0.56
opacity, clamped to **one line** with `white-space:nowrap` +
`text-overflow:ellipsis` so the 26px bar can never grow or wrap on narrow
screens. The header stays quiet on purpose: the compliance section directly
below it is the document's dominant banner.

### Title block + meta pills

Plain AI fragments are lifted into an opaque white `<article class="card">` and
open with `<h1 class="lesson-title">`, the meta pills (grade, subject, content
type, term) and then the designated compliance section. Fragments that already
use LIGHT card structure (`article.card` / `.lesson-title`) keep it. AI prompts
steer the model to emit `<h2>` sections, `<ul class="objectives">`,
`<div class="activity">` and `<div class="tip">` natively — and never its own
page-level header, compliance stamps or footer.

---

## Idempotent *and* self-healing

`wrapWithTemplate()` can be called on anything, any number of times:

- **Current canonical output passes through byte-for-byte** — re-exporting the
  print-preview paper never double-wraps (`isCurrentTemplateOutput()` checks the
  v4 style block, one banner, one footer band, the exact footer text and each
  label exactly once).
- **Everything else is normalised**: `stripTemplateChrome()` lifts out embedded
  LIGHT stylesheets, `site-header` / `site-footer` bands, the watermark and the
  page shell (remembering the banner's position with a slot marker so it goes
  back exactly where it was), then the canonical chrome is rebuilt around the
  content.
- **Nothing is lost doing it**: `harvestMetaFromChrome()` recovers grade, term,
  subject, content type, title and CAPS code from the chrome being replaced, so
  re-wrapping an archived document without metadata still renders the same
  strapline and the same CAPS code. Caller metadata always wins.

This matters for content generated **before** a template revision: archived
worksheets in Firestore, previously downloaded HTML re-imported for printing,
and model output that copied our chrome all come back with one compliance
section, gradient banners and the current footer instead of keeping stale ones.

---

## Where the template is applied

| Surface | File | How |
| --- | --- | --- |
| **Single source of truth** | `src/lib/contentTemplate.ts` | `EDUAI_LIGHT_CSS`, `EDUAI_BANNER_GRADIENT`, `EDUAI_HEADER_GRADIENT`, `EDUAI_COMPLIANCE_LABELS`, `EDUAI_TEMPLATE_FOOTER_LINE`, `buildTemplate{Header,Footer,Watermark,TitleBlock,ComplianceBanner}HTML`, `stripTemplateChrome`, `stripGeneratedComplianceMarkup`, `applyBannerGradients`, `harvestMetaFromChrome`, `isCurrentTemplateOutput`, `wrapWithTemplate`, `metaFromPrintOptions` |
| **On-screen generation preview** (iframe) | `src/components/ContentCreator.tsx` (`HtmlPreviewFrame`) | full LIGHT document shell; content always wrapped — even when no metadata was supplied — so the header wash, compliance section and footer are never missing |
| **Print / PDF / HTML exports** | `src/lib/printUtils.ts` | `wrapWithBrandedTemplate` used by `printContent`, `downloadAsPDF`, `downloadAsHTML`; neutral shells (LIGHT owns all spacing) + `@page 15mm` |
| **Print preview modal (paper view)** | `src/components/PrintPreviewModal.tsx` | renders the exact `wrapWithTemplate()` output — WYSIWYG with exports |
| **Posters** | `src/components/PosterPreview.tsx` | one host compliance section, gradient banner, exact footer line |
| **SA structured document pipeline** | `src/lib/templates/sa-html-templates.ts` | `buildFullHTML` + `wrapContentWithSABranding` open with the LIGHT header, place the compliance section in the title block and close with the LIGHT footer; `SA_BASE_CSS` forces the gradient on generated banners |
| **Foundation Phase printable pack** | `src/lib/templates/foundation/render.ts` → `public/templates/foundation-phase/*.html` | `.fp-banner` gradient + host header, compliance section and footer; rebuild with `npm run build:fp-templates` |
| **DOCX exports** | `src/lib/assemblers/docx-assembler.ts` | running header/footer carry the compliance line and `EDUAI_TEMPLATE_FOOTER_LINE` in LIGHT navy |
| **Server-side PDF exports** | `src/lib/assemblers/pdf-assembler.ts` | Chromium's own header/footer layer is disabled — `buildFullHTML` already contains the single canonical footer |
| **Portfolio PDFs** | `src/components/StudentPortfolio.tsx` | jsPDF cover uses two adjacent fills (the gradient) plus the compliance line and the exact footer on every page |
| **ZIP packages** | `src/lib/assemblers/zip-packager.ts` | readme + compliance report import `EDUAI_TEMPLATE_FOOTER_LINE` |

The template logo is served from `public/eduai-logo.png` and resolved to an
absolute URL at render time so it survives iframe previews, popup print windows
and html2canvas rasterisation.

Portability guarantees:

- Header / watermark / compliance section / footer / page-shell layout is
  **fully inline**, so the markup survives React previews, iframe srcDocs,
  `window.print()` documents, html2canvas rasterisation and HTML downloads
  identically.
- Component styling ships as an embedded `<style data-eduai-light="v4">` block,
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
});
```

`PrintOptions` (used across all export helpers) accepts `term`, `school` and
`teacher`, which flow straight into the template.

## Verification

```bash
npm run verify:template     # 101 assertions, exits non-zero on any regression
npm run render:template-demo # regenerate the two committed demos
npm run build:fp-templates   # regenerate the Foundation Phase pack
```

`scripts/verify-content-template.ts` runs the production wrapper against the
awkward inputs models really produce — plain fragments, LIGHT-card markup,
standalone documents with their own header/footer, three separate copies of the
labels, solid inline banners, Tailwind colour utilities, and documents wrapped
by an older template — asserting for each: one compliance section, every label
exactly once, one CAPS code, one footer band with the exact canonical text, no
stale rights/generated sub-lines, gradient banners, byte-stable re-wrapping,
surviving content and metadata. It finishes by re-checking the committed
artefacts (both demos, the artwork and all 30 Foundation Phase files).

## Palette (sampled from the artwork)

| Token | Value |
| --- | --- |
| Navy / header text / footer band | `#1e3a5f` |
| Accent / gradient end | `#2563eb` (light `#3b82f6`) |
| Banner gradient | `linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)` |
| Header wash | `linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(219,234,254,0.72) 100%)` + 5px blur |
| Compliance section border | `#93c5fd`, text `#ffffff` |
| Footer text | `#e2e8f0` |
| Paper / cards | `#ffffff` (card border `#e2e8f0`) |
| Body text | `#334155` (muted `#475569`) |
| Meta pills | bg `#eff6ff`, border `#dbeafe`, text `#2563eb` |
