# 🎨 CAPS Foundation Phase Template Studio (Grade R–3)

Bright, cartoon-styled, **ready-to-print** classroom documents for South African
Foundation Phase teachers:

| Family | Count | What it is |
| :--- | :--- | :--- |
| 🏆 **Awards for good academic achievement** | 6 | Certificates + praise slips with signature lines, medal art, CAPS rating-code ribbons and a learner goal/reflection strip |
| ✏️ **Worksheets** | 10 | Marked, memo'd practice sheets (letter sounds, number concepts, shapes, sight words, grammar, arrays, poetry comprehension, fractions & money) |
| 🎲 **Classroom exercises** | 6 | Oral / pair / group / station / movement activities on cut-out cards, with observation rubrics |
| 🎒 **Homework exercises** | 6 | Short home tasks with caregiver instructions, reading logs, choice menus, project briefs |
| | **28** | every one of them authored as data, rendered to A4 |

Everything is **offline-first**: no AI call is needed to produce these sheets, so a
teacher with no data, no login and no API key still gets a full week of Foundation
Phase printing.

---

## 1. Where the code lives

```
src/lib/templates/foundation/
├── types.ts        # the descriptor + block contracts (single source of truth)
├── caps.ts         # CAPS Foundation Phase framework data (time, strands, weightings, scales)
├── labels.ts       # bilingual label dictionary: EN + isiXhosa / isiZulu / Afrikaans
├── art.ts          # cartoon art registry + hand-built inline SVG doodle kit
├── blocks.ts       # 19 block renderers (trace, count, match, cut-paste, cards, rubric, memo …)
├── render.ts       # A4 page assembly, print stylesheet, standalone + bundle + pack index
├── shared.ts       # fill-in field sets (learner, school, marks, signatures …)
├── awards.ts       # 🏆 6 award templates
├── worksheets.ts     # ✏️ 10 worksheet templates
├── classroom.ts      # 🎲 6 classroom templates
├── homework.ts       # 🎒 6 homework templates
└── index.ts        # library + filters + stats + render helpers

src/components/FoundationPhaseTemplateStudio.tsx   # the in-app Studio (gallery, preview, print)
scripts/build-foundation-template-pack.ts          # regenerates the standalone printable pack
public/templates/foundation-phase/                 # 30 printable .html files + README.md (generated)
public/illustrations/foundation/                   # Elly mascot + cartoon spot art (original files)
```

## 2. Using it in the app

Three ways in, all reachable from the **Teacher's Toolbox**:

1. **Teacher's Toolbox → page menu → “CAPS Template Studio”** (the studio tab
   strip next to Content Studio / Visual Lab / Video Lab / Admin Lab /
   Foundation Hub). This is the main entrance — the Studio opens as a full page
   inside the Content Factory, on the app's dark neon canvas.
2. **Teacher's Toolbox landing cards** — “CAPS Template Studio” (with
   Awards / Worksheets / Homework quick pills) and “Printable Pack (R–3)”
   (opens the offline A4 gallery or the print-all-28 file), plus the
   “CAPS Template Studio” pill in the *Direct Tool Access* strip.
3. **Sidebar → Teacher's Toolbox (or Curriculum & Planning) →
   “CAPS Template Studio (R–3)”** for the same page without the studio chrome.

1. Filter by family, grade (R, 1, 2, 3), CAPS learning area, or free-text search
   (“arrays”, “phonics”, “money”, “Grade R”).
2. Pick a card. The live A4 preview shows exactly what the photocopier will show.
3. **Fill in** the learner, class, school, teacher, principal, date, term and marks —
   school defaults are read from Settings (`eduai_school_branding`), so it usually
   pre-fills itself.
4. Choose print options:
   * **Bilingual labels** — isiXhosa / isiZulu / Afrikaans short classroom verbs
     (`Read · Funda`, `Colour · Penda`, `Marks · Amanqaku`).
   * **Large print** — bigger type, wider line spacing (Grade R + dyslexia-friendly).
   * **Ink saver** — greyscale-friendly, for black-and-white photocopiers.
   * **Print memo** — switch off when you photocopy a marked class set.
5. **Print / Save as PDF** (prints only the sheet), **Download** (one portable HTML
   with the cartoon art embedded as data URIs), or **Print-pack this selection**
   (all filtered templates in one print job).

## 3. The standalone printable pack (no app required)

```bash
npm run build:fp-templates        # = npx tsx scripts/build-foundation-template-pack.ts
open public/templates/foundation-phase/index.html
```

`index.html` is a colourful gallery of all 28 sheets; each `<template-id>.html`
opens on its own with a Print button; `all-templates.html` prints the entire pack.
Artwork is referenced relatively (`../../illustrations/foundation/*.png`) so the
folder can be copied onto a school USB stick. **Never hand-edit the generated
HTML** — edit the data and rebuild.

### Print settings that always work (A4)

* A4 portrait, **100 % scale** (never “fit to page” — it clips the colour border).
* Tick **Background graphics** if you skip the Ink-saver toggle.
* Awards print best on 120–160 gsm paper; worksheets are designed for plain 80 gsm.

## 4. How each sheet is CAPS-compliant

Every template carries a machine-readable alignment strip (`CapsAlignment`) that is
printed on the page and shown in the Studio:

* **Learning area & content area** — e.g. *Mathematics → Numbers, Operations and
  Relationships*; *Home Language → Phonics and Print Awareness (Grade R)* /
  *Reading and Viewing (Gr 1–3)*; *Life Skills → Beginning Knowledge*.
* **ATP placement** — term and week range (10 teaching weeks per term).
* **Time on task** — matched to CAPS contact time: 23 h/week in Grades R–2, 25 h in
  Grade 3; Mathematics 7 h/week (≈1 h 24 min per day, Gr 1–3); Beginning Knowledge
  1 h (R–2) / 2 h (Gr 3); Creative Arts and Physical Education 2 h each.
* **Marks + memo** — mark allocations per item and a memorandum with step marks,
  honouring the Foundation Phase programme of assessment (weekly/daily informal
  checks plus one formal task per term, 25 % per term).
* **Number ranges** — Gr R 0–10 (→20), Gr 1 0–100, Gr 2 0–200, Gr 3 0–1 000 with
  common fractions, and money to R20 with 5c–R5 coins in Grade 1, per CAPS.
* **Bloom's levels** — Know → Evaluate, stated on the sheet.
* **Assessment recording** — 4-level criterion-related scale (Fully / Largely /
  Partially / Not yet competent) for Grade R, 7-point rating codes (Level 7
  Outstanding 80–100 % … Level 1 Nil 0–29 %) for Grades 1–3. Awards quote the
  correct scale for the grade they cover.
* **Inclusive education** — SIAS-style adaptations and barrier notes are built into
  the awards, games and projects (e.g. sand-tray writing for poor pencil control,
  buddy reading, a learner in a wheelchair choosing the movement pattern).
* **South African context** — rands and cents, spaza/shop prices, proteas, taxi
  ranks, local names, and multilingual labels.

References: CAPS Grades R–3 subject documents (DBE, 2011, as amended), the
Foundation Phase ADDENDUM, and WCED ePortal / Annual Teaching Plan conventions.

## 5. Adding a new template (recipe)

```ts
// src/lib/templates/foundation/worksheets.ts  → push into WORKSHEET_TEMPLATES
{
  id: 'ws-gr2-maths-time-3-past',              // becomes the pack filename
  kind: 'worksheet',
  title: 'O’Clock, Half Past and Quarter Past',
  subtitle: 'Mathematics Grade 2 · Measurement (time)',
  blurb: 'One friendly paragraph for the gallery card.',
  grades: ['2'],
  learningArea: 'Mathematics',
  theme: 'lagoon',                             // sunny | bubblegum | lagoon | meadow | grape | tangerine | rainbow
  art: 'elly-counting',
  fields: PRACTICE_FIELDS,
  caps: {
    contentArea: 'Measurement — time (analogue and, informally, digital)',
    skills: ['read o’clock, half-past, quarter-past/to', 'relate daily routines to clock times'],
    terms: ['Term 1 · Weeks 7–10'],
    asRef: 'CAPS Gr 2 Measurement 12 % of the programme',
    blooms: ['Know', 'Apply'],
    timeOnTask: '20 min',
    setting: 'Classroom',
    marks: 15,
    memo: [{ ref: 'A', answer: '07:30 = half past seven …', marks: 5 }],
    capsNote: 'Time is taught from the learners’ own daily routine first.',
  },
  blocks: [
    { kind: 'cards', title: 'Clock cards', perRow: 4, cards: [{ face: '🕰️', caption: 'half past 7' }] },
    { kind: 'task', title: 'A · Draw the hands', instruction: '…', items: [{ text: 'half past eight', lines: 1, marks: 2 }] },
    { kind: 'memo', title: 'Memo', items: [] },   // empty items → filled from caps.memo
  ],
}
```

Then `npm run build:fp-templates` and `npx tsc --noEmit`. New blocks go in
`blocks.ts` + `types.ts` (block union) so every family can reuse them.

## 6. Artwork & design rules

* Spot illustrations are the original generated files in
  `public/illustrations/foundation/` (Elly the mascot + props). They are **never**
  overwritten or re-generated in place — add new files instead (AGENTS.md §2).
* Borders, medals, tracing guides, confetti and cut lines are **inline SVG** so
  they stay crisp at any print DPI and survive if a PNG fails to load.
* Typography follows DESIGN.md: Fredoka for headings, Nunito for body, Patrick
  Hand / Comic Neue for handwriting tracers — exactly the Foundation Phase
  letterforms children are taught.
* The renderer never touches the frozen landing/menu-card designs (AGENTS.md §3b);
  it is its own, print-focused visual system.

## 7. Verification

```bash
npx tsc --noEmit                       # clean (except pre-existing optional deps)
npm run build:fp-templates             # 30 files, deterministic output
curl -s localhost:3000/templates/foundation-phase/index.html | head
```
