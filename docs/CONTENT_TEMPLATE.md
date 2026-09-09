# EduAI Companion — Official Content Template

> Source artwork: `docs/c659da21115e4f5ca2a94b0ee3e846f4 (1).png`
> (the official EduAI Companion template poster).

Every piece of generated content in the app — worksheets, lesson plans,
posters, assessments, memos, rubrics, admin documents, student notes and
practice — is now wrapped in this template. The **format and style** of the
original artwork are retained exactly; the placeholder text was replaced with
live informational and compliance data.

A pixel-accurate static demo of the markup lives in
[`docs/content-template-preview.html`](./content-template-preview.html).

---

## Template anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  GREY GRADIENT HEADER BAND  (#cfd1d2 → #bcbdbd → #a9aeb4)        │
│                                                                  │
│   ✓ CAPS COMPLIANT            ( ◉ LOGO )      GRADE 5 • TERM 2   │
│   ✓ NPA COMPLIANT (GR R-12)   white ring       POPIA SECURE ✓     │
│                               centred          SIAS INCLUSIVE     │
│   ──────────────────────────────────────────────────────────     │
│   WORKSHEET • MATHEMATICS • 09/09/2026 • SOUTH AFRICAN           │
│   EDUCATIONAL RESOURCE                                           │
├──────────────────────────────────────────────────────────────────┤
│  WHITE CONTENT AREA                                              │
│                                                                  │
│        …faded EduAI elephant watermark (opacity 0.14)…           │
│        …dynamic AI-generated content on top (z-index 1)…         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  NAVY FOOTER BAND  (#1e3559 → #1a3057 → #142640)                 │
│   ALL CONTENT RIGHTS RESERVED TO     GENERATED: 09/09/2026 •     │
│   DEVELOPER: Z MSUTHU (C) 2026       WORKSHEET                   │
│                                      HTTPS://EDUAI-COMPANION.    │
│                                      VERCEL.APP                  │
└──────────────────────────────────────────────────────────────────┘
```

### Header data (replaces the artwork placeholder text)

| Slot | Data |
| --- | --- |
| Left line 1 | `✓ CAPS COMPLIANT` (CAPS compliance badge) |
| Left line 2 | `✓ NPA COMPLIANT (GR R-12)` (National Protocol for Assessment) |
| Right line 1 | `GRADE {grade} • TERM {term}` (auto current SA term when not supplied) |
| Right line 2 | `POPIA SECURE ✓ SIAS INCLUSIVE` |
| Bottom strip | `{CONTENT TYPE} • {SUBJECT} • {DD/MM/YYYY} • SOUTH AFRICAN EDUCATIONAL RESOURCE` |

Typography mirrors the artwork: heavy black uppercase ("Arial Black" stack)
with a white halo rendered via `text-shadow`.

### Footer (rights band — retained from the artwork)

| Slot | Data |
| --- | --- |
| Left | `ALL CONTENT RIGHTS RESERVED TO / DEVELOPER: Z MSUTHU (C) 2026` |
| Right | `GENERATED: {date} • {content type}` + `HTTPS://EDUAI-COMPANION.VERCEL.APP` |

---

## Where the template is applied

| Surface | File | How |
| --- | --- | --- |
| **Single source of truth** | `src/lib/contentTemplate.ts` | `buildTemplateHeaderHTML`, `buildTemplateFooterHTML`, `buildTemplateWatermarkHTML`, `wrapWithTemplate`, `metaFromPrintOptions` |
| **On-screen generation preview** (iframe) | `src/components/ContentCreator.tsx` (`HtmlPreviewFrame`) | content wrapped with `wrapWithTemplate` when metadata is available |
| **Print / PDF / HTML exports** | `src/lib/printUtils.ts` | `wrapWithBrandedTemplate` used by `printContent`, `downloadAsPDF`, `downloadAsHTML` (replaces the old one-line header) |
| **Print preview modal (paper view)** | `src/components/PrintPreviewModal.tsx` | renders the identical header band, watermark and footer band — WYSIWYG with exports |
| **SA structured document pipeline** | `src/lib/templates/sa-html-templates.ts` | `buildFullHTML` + `wrapContentWithSABranding` open with the header band and close with the navy footer (POPIA notice kept above it) |
| **DOCX exports** | `src/lib/assemblers/docx-assembler.ts` | footer carries the rights line + official URL |
| **Server-side PDF exports** | `src/lib/assemblers/pdf-assembler.ts` | Chromium footer template carries the rights line + official URL |

The template logo is served from `public/eduai-logo.png` (copy of
`assets/logo.png`) and resolved to an absolute URL at render time so it
survives iframe previews, popup print windows and html2canvas rasterisation.

## Usage

```ts
import { wrapWithTemplate } from '../lib/contentTemplate';

const html = wrapWithTemplate(generatedBodyHtml, {
  subject: 'Mathematics',
  grade: '5',
  term: 'Term 2',
  contentType: 'Worksheet',
  date: '09/09/2026',          // defaults to today (SA format)
});
```

`PrintOptions` (used across all export helpers) now accepts `term`, `school`
and `teacher`, which flow straight into the template bands.

## Palette (sampled from the artwork)

| Token | Value |
| --- | --- |
| Header band | `#cfd1d2 → #bcbdbd → #a9aeb4` (bottom border `#8f979f`) |
| Header text | `#000000` with `#ffffff` halo |
| Footer band | `#1e3559 → #1a3057 → #142640` |
| Footer text | `#ffffff` (muted `#c7d2e4`) |
| Paper | `#ffffff` |
