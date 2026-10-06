# Reverse-engineered content templates → built-in generation prompts

> Source of truth: **`assets/templates/`** (12 reference PDFs + artwork).
> Machine-readable result: **`src/lib/templates/template-specs.ts`**.
> Prompts: **`src/lib/prompts/content-type-prompts.ts`**.
> Banner: **`src/lib/contentTemplate.ts`** (`buildTemplateComplianceBannerHTML`).

This document records the reverse-engineering pass that measured every reference
template, turned it into a specification, and generated a **built-in (system)
content-generation prompt for every content type** the Content Creator offers —
with **all the data the templates printed in their banner merged into the ONE
generated-content banner**, together with the app's page-header brand lockup.

---

## 1 · What was measured, and how

The PDFs are print output of the EduAI template engine, so they were read
mechanically rather than by eye:

| Layer | Tool | What it produced |
| --- | --- | --- |
| Text + structure | `pypdf` text extraction | every title, section heading, question, blank, mark tag, footer line |
| Layout | `pdfminer.six` (`LTTextLine` / `LTChar` / `LTRect` / `LTCurve`) | exact x/y positions, point sizes, font names, band and card rectangles |
| Colour | PDF content-stream scan (`rg` / `RG` before `re … f`) | the exact band, stripe, page-tint and accent colours |
| Fonts | PDF resource dictionary | `Helvetica`, `Helvetica-Bold`, `ZapfDingbats` (print templates) and `Fredoka One` + Material Icons (browser-printed sheets) |

Everything below is transcribed from that output — not estimated.

### 1.1 The shared A4 anatomy (595.28 × 841.89 pt)

```
┌───────────────────────────────────────────────────────────────┐
│ BANNER BAND  full bleed, 99.2–107.7 pt tall, content-type     │
│              colour pair (never a solid fill in the app: the  │
│              host paints it as a two-stop vertical gradient)  │
│   • grade badge disc ~85 pt with “Grade 3” 11 pt bold         │
│   • title 24 pt bold (Foundation pages 28 pt + icon)          │
│   • subtitle 13–14 pt — “Topic | CAPS Term 1”                 │
│   • accent stripe 6.2–7.1 pt in the pairing's second colour   │
├───────────────────────────────────────────────────────────────┤
│ RECORD ROW 11–13 pt bold                                      │
│   worksheets:    Name: ______  Date: ______  Term: ___        │
│   assessments:   Name: ______  Date: ______  Total: ___ / 30  │
├───────────────────────────────────────────────────────────────┤
│ SECTION BANDS 538.6 × 24.1 pt, 13 pt bold                     │
│   “SECTION A — Place Value (Hundreds, Tens, Units) [10 marks]”│
│ QUESTIONS 12 pt bold, body/options 11 pt, mark tags 10 pt     │
│   ruled answer lines 396.9 / 411.0 / 510.2 pt wide            │
│   marks tag “[2]” right-aligned at x ≈ 549                    │
├───────────────────────────────────────────────────────────────┤
│ SCORE BOX bottom-right: “SCORE” 10 pt + “___ / 30” 20 pt      │
│ SIGN-OFF   10 pt: Teacher / Comment (or Teacher / Moderator)  │
├───────────────────────────────────────────────────────────────┤
│ FOOTER 8–9 pt                                                 │
│   left:  “EduAI Companion | CAPS Aligned | eduai-companion….” │
│   right: “Grade 3 | South Africa”                             │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 The colour pairings actually used (measured from the content streams)

Every full-bleed band rectangle (`595.3 × 107.7 pt` on the A4 print sheets,
`595.3 × 99.2 pt` on the Foundation sheets) was paired with the `rg` fill
operator that precedes it:

| Template | Page tint | Banner band | Accent stripe |
| --- | --- | --- | --- |
| `gr3-mathematics-worksheet…` | `#e3f6fc` | `#118ab2` | `#48cae4` (6.2 pt) |
| `gr4-mathematics-assessment…` | `#e3f6fc` | `#118ab2` | `#48cae4` (6.2 pt) |
| `gr6-mathematics-assessment…` | `#f3e5f5` | `#9b5de5` | `#c77dff` (6.2 pt) |
| `gr3-life-skills-assessment…` | `#fff3e0` | `#f77f00` | `#ffb703` (6.2 pt) |
| `gr4-life-skills-worksheet…` | `#f1f8e9` | `#388e3c` | `#48cae4` (6.2 pt) |
| `gr7-life-orientation-worksheet…` | `#fff0f3` | `#ef476f` | `#ff6b9d` (6.2 pt) |
| `grR-phonics-tracing-letter-s` | `#fce4ec` | `#ef476f` | `#ff6b9d` (7.1 pt) |
| `gr1-phonics-blending-cvc-words` | `#e8f5e9` | `#06d6a0` | `#95d44a` (7.1 pt) |
| `grR-phonics-sound-chart-group1` | `#fffde7` | `#118ab2` | `#06d6a0` (7.1 pt) |
| `about_blank_1` (number-line capture) | `#f0fdfa` | `#14b8a6` | `#0d9488` |
| `Number Poster Gr3` (Tailwind-style web print) | `#ffffff` | `#2563eb` / `#0284c7` accents | — |
| `Multiplication for Grade 3 Learners` (study notes) | `#e1f5fe` | `#ff6f00` / `#00b0ff` accents | — |

Ink measured across the set: body `#1a1a2e` on white, muted `#888888`/`#cccccc`/`#dddddd`
for rules and blanks, and the accent family `#9b5de5` purple, `#f77f00` orange,
`#ffb703`/`#ffd166` gold, `#ff8c42` coral, `#06d6a0` green, `#95d44a` leaf,
`#388e3c` forest, `#ff6b9d` pink, `#ef476f` rose, `#48cae4` sky, `#118ab2` teal-blue,
`#4361ee` indigo, `#37474f` slate.

> The host banner keeps the same pairing philosophy but paints it as a **two-stop
> vertical gradient** per content family (`src/lib/bannerPalettes.ts`) — see
> `docs/banner-palettes-preview.html`. Each spec in `template-specs.ts` records
> the measured band colour, so a future palette revision can be checked against
> the artwork.

**Fonts.** The print sheets are set in Helvetica / Helvetica-Bold (with
ZapfDingbats for ticks and stars); the Foundation sheets use Helvetica-Bold for
the display sizes. The two browser-printed documents (`Multiplication …`,
`Number Poster Gr3`) use `Fredoka One` + `Nunito` — the same rounded face the
Foundation Phase renderer uses.

**Measured type scale** (character-size histogram per page): title 24 pt
(Foundation banner title 28 pt), subtitle / section heading 13–14 pt, question
text 12 pt, body and options 11 pt, marks tags 10 pt, score value 20 pt, footer
8–9 pt. Foundation display sizes: 38 pt letter tiles, 48 pt traced glyph, 52 pt
sound-chart letter, 32 pt letter pair. The study-notes sheet runs a 48 pt display
title with a 13.5 pt body.

### 1.3 The files, reverse-engineered

| File | Content type | What it proves |
| --- | --- | --- |
| `gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf` | Worksheet | 30-mark, three-section worksheet; Name/Date/Term row; score box; teacher comment |
| `gr3-life-skills-assessment-term1-healthy-living.pdf` | Formal Assessment Task | 10 + 10 + 10 marks; MCQ in four columns; T/F; short answer with `[n]` tags |
| `gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf` | Controlled Test | 15/20/15 weighting; working lines; teacher + moderator + date sign-off |
| `gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf` | Examination | 15/15/30 weighting; graph drawing area; moderator sign-off |
| `gr4-life-skills-worksheet-term2-emotions-relationships.pdf` | Worksheet | PART structure, vocabulary cards, matching rows, journal lines, affirmation band |
| `gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf` | Worksheet | Fact rows (496 × 25.5 pt), scenario blanks, structured note blocks |
| `grR-phonics-tracing-letter-s.pdf` | Worksheet (Foundation) | 48 pt dotted glyphs, 62 × 82 pt trace cells, write-it lines, star reward row |
| `gr1-phonics-blending-cvc-words.pdf` | Worksheet (Foundation) | 38 pt letter tiles → 28 pt blended word → write-it line; praise band |
| `grR-phonics-sound-chart-group1.pdf` | Alphabet Chart / Flashcards | 3 × 2 card grid (155.9 × 184.3 pt): 52 pt letter, 32 pt pair, icon, 13 pt word |
| `Number Poster Gr3.pdf` | Number Chart / Number Line | No extractable text: a picture-led display poster (246 white frames, blue/sky/green accents, no banner band). Evidence is geometric and chromatic only — it is the reason the *poster* family is artwork-first while every other family is type-first |
| `about_blank_1.pdf` | Number Chart / Number Line | Two pages; the only text is the glyph sequence `/0 /1 /2 /3 /4 /5 /1 /6 /0 /7 /8 /9 /10 /11` (a Type3 font with no `ToUnicode` map) — i.e. a 0–11 number line/counting strip. Teal `#14b8a6` band over a `#f0fdfa` tint, 612 × 741 pt artwork frames, coloured strips (`#99f6e4`, `#fbcfe8`, `#bbf7d0`) |
| `Multiplication for Grade 3 Learners.pdf` | Study Guide / Learning Notes | Display title 64 pt, concept sections, worked examples, times-table chart, tip callout |

---

## 2 · The merged banner (all template banner data, once)

`buildTemplateComplianceBannerHTML(meta)` now renders **one** `<section
class="eduai-compliance-banner">` containing, in order:

1. **Brand lockup** — logo + the page-header strapline
   (`EDUAI COMPANION 2026 | OFFICIAL EDUCATIONAL RESOURCE`) + `🇿🇦 South Africa`
   + the resource URL (`EDUAI-COMPANION.VERCEL.APP`). The page header stays as
   the compact app chrome, so a document is self-describing even when the header
   is cropped (print, PDF, html2canvas, copied fragment).
2. **Document title** (`h1.lesson-title`).
3. **Topic subtitle** — the templates' subtitle slot
   (`.eduai-doc-subtitle`).
4. **Metadata pills** — grade → subject → content type → phase → term → date →
   school → teacher → learner → total marks → duration → caller extras
   (deduplicated, in that order).
5. **Learner record strip** (`.eduai-record-strip`) — per content family:

   | Family | Fields |
   | --- | --- |
   | worksheet | `Name: ___` · `Date: ___` · `Term: ___` |
   | assessment | `Name: ___` · `Date: ___` · `Total: ___ / N` |
   | Foundation | `Name: ___` · `Date: ___` |
   | memo | `Total: ___ / N` |
   | admin | `Date: ___` · `Signature: ___` |
   | certificate | `Name: ___` · `Date: ___` |
   | intervention | `Name: ___` · `Date: ___` |
   | lesson / study notes | `Date: ___` · `Term: ___` |
   | poster · cards | *(no record strip — display items)* |

   Callers can override with `meta.recordFields` and hide it with `[]`.
6. **Sign-off line** (`.eduai-doc-signoff`) — `Teacher / Comment` on worksheets
   and Foundation pages, `Teacher / Moderator / Date` on assessments and memos,
   `Signed / Date / School stamp` on admin, `Teacher / Principal / Date` on
   certificates, `Teacher / SBST / Parent` on intervention plans. Override with
   `meta.signOff`, hide with `''`.
7. **CAPS code + CAPS/ATP reference + the 🇿🇦/CAPS/NPA/POPIA/SIAS/WP6 labels**.

New `ContentTemplateMeta` slots: `subtitle`, `phase`, `totalMarks`, `duration`,
`country`, `brandLine`, `sourceUrl`, `recordFields`, `signOff`, `showBrandLogo`.

DOCX exports use the plain-text editions (`buildBannerBrandPlainText`,
`buildBannerRecordPlainText`, `bannerSignOffFor`) so Word gets the same fields.
The Foundation Phase pack keeps its own `.fp-banner` + `.fp-learnerstrip` (the
record row is already a separate band there), and its banner now carries the
same merged data: the `.fp-brand` row (logo + strapline + `🇿🇦 South Africa` +
resource URL), the `Foundation Phase` pill, teacher/school pills when the Studio
supplies them, and an `.fp-signoff` line — `Teacher · Comment` on worksheets and
homework, `Teacher · Principal · Date` on awards, nothing on display sheets.
`public/templates/foundation-phase/` is regenerated from the renderer, so the
committed 28-page pack and the in-app Studio preview can never drift.

**Contract preserved:** one banner, one footer, every compliance label exactly
once, a two-stop 180° gradient, byte-stable re-wrapping — asserted by
`npm run verify:template` (191 checks) and `tests/content-template.test.ts`.

---

## 3 · The built-in prompts

`src/lib/prompts/content-type-prompts.ts` composes a system prompt for **every
content type** from three layers:

1. **The merged-banner contract** (`MERGED_BANNER_CONTRACT`) — lists every slot
   the host banner prints and forbids the model from emitting a header, banner,
   title block, record row, score box, compliance stamp, watermark or footer.
2. **Family craft rules** (`FAMILY_RULES`, 12 families) — the measured document
   shape: `worksheet`, `assessment`, `memo`, `lesson-plan`, `study-notes`,
   `poster`, `cards`, `certificate`, `admin`, `report`, `intervention`,
   `foundation`.
3. **The per-type blueprint** (`CONTENT_TYPE_BLUEPRINTS`) — purpose, required
   sections in order, answer/record shapes, marks behaviour, companion memo or
   rubric, visual guidance.

The system prompt is the composed text; `buildContentTypeUserPrompt()` adds the
grade/subject/topic/term/marks/language context, the "banner data — print none
of it" restatement, and the instructor brief (always last, always highest
priority). Both are returned together by `buildContentTypePromptPair()`.

### 3.1 Coverage

| Layer | Count |
| --- | --- |
| Content types in the Content Creator taxonomy (`contentTypes.ts`) | 73 |
| Built-in prompts (taxonomy + app/internal aliases) | 85 |
| Prompt families | 12 |
| Reference template files reverse-engineered | 12 |

`tests/content-type-prompts.test.ts` asserts that every taxonomy type resolves
to its own prompt (> 1 200 characters), that prompt family and banner palette
never disagree, that every prompt forbids the model banner and demands the CAPS ·
NPA · SIAS · WP6 · POPIA content law, and that every template file named in the
prompts exists in `assets/templates/`.

### 3.2 How a prompt reaches the model

```
ContentCreator (type picker)
  → generateCAPSContent({ contentType: 'Controlled Test', … })
      → EduAIPromptEngine.assemblePrompt({ rawContentType: 'Controlled Test', … })
          → getContentTypePrompt('Controlled Test')      ← built-in prompt
          → buildContentTypeUserPrompt(...)              ← context + brief
      → { system, user } → frozen provider registry (see AGENTS.md §1)
```

`rawContentType` is what makes the per-type prompt live: the services used to
collapse every type into `lesson-plan | worksheet | study-guide`, so a Controlled
Test was generated with the worksheet template. Now the real type drives the
prompt, while `selectTemplate()` still serves callers that only pass the three
engine slugs. `getSystemPrompt()` in `system-prompts.ts` resolves through the
same registry, so legacy slugs (`worksheet`, `poster`, `notice`, `permission-slip`,
`certificate`, …) keep working.

### 3.3 Extending

* **New content type** → add it to `contentTypes.ts`, add a blueprint entry in
  `content-type-prompts.ts` (or an alias mapping to an existing blueprint), and
  run `npx vitest run tests/content-type-prompts.test.ts`. The palette contract
  test in `tests/content-template.test.ts` reminds you if the new type has no
  named palette.
* **New reference template** → measure it (text + geometry + content-stream
  colours), add a `TemplateFileSpec` to `template-specs.ts`, then reference the
  file from the relevant blueprint's `sources`.
* **Prompt wording** → edit `FAMILY_RULES` or the blueprint; never hand-edit a
  composed prompt string (there isn't one — it is generated).

---

## 4 · Verification

```bash
npx vitest run tests/content-type-prompts.test.ts   # 22 assertions — prompt contract
npx vitest run tests/content-template.test.ts       # 46 assertions — banner contract
npm run verify:template                             # 191 checks — ONCE/GRADIENT/FOOTER
npm run render:template-demo                        # regenerate the committed demos
npm run ci -- --skip-build                          # everything, in CI order
```
