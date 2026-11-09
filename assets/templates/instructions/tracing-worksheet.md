<!-- GENERATED FILE — do not edit by hand.
     Source of truth: src/lib/prompts/template-library/tracing-worksheet.ts
     Regenerate with: npm run build:prompts -->

# Tracing / Handwriting Worksheet

> **Content type id:** `tracing-worksheet`
> **Purpose:** Foundation Phase repetition practice: dotted guide letters in coloured boxes, ruled copy lines, a picture cue and a star progress strip.
> **Reverse-engineered from:**
> - `assets/templates/grR-phonics-tracing-letter-s.pdf`
> - `assets/templates/AI_IMG (5).jpg`
> - `assets/templates/AI_IMG (10).jpg`

---

## 1. What the reference documents contain

### Fixed page anatomy (in order)

1. **Stars banner**
  - Rose band, pencil icon, starred title, grade | term | strand subtitle.
2. **Name / Date row**
  - Ruled and empty.
  - Learner writing space (keep blank)
3. **Trace rows**
  - Two rows of four grey guide boxes plus ruled copy lines.
4. **Write row**
  - Two long ruled lines with no guides.
5. **Picture cue**
  - Key-word picture box with the word printed beneath.
6. **Progress strip**
  - "Colour a ▪ for each line you finish:" plus four stars.

### Visual system

| Property | Value |
| :--- | :--- |
| Banner gradient | rose-pink band (Foundation Phase palette) |
| Palette | `foundation` (see `src/lib/bannerPalettes.ts`) |
| Grade badge | grade in the banner subtitle |
| Section bar | coloured row labels: Trace / Trace / Write |
| Score card | no marks — a star strip replaces scoring |
| Typography | guide letters 96–120 px grey outline; labels 16–18 px 700 weight |
| Footer | EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io |

### Fixed micro-copy (print exactly)

- `Trace:`
- `Write:`
- `Name:`
- `Date:`
- `Colour a`
- `for each line you finish`

### Fields left blank for handwriting

- Name
- Date

### Guardrails

- One consistent letterform per sheet.
- Guide letters stay grey outlines — never solid.
- No questions, no marks, no prose.

### UI labels that resolve to this template

`tracing` · `handwriting` · `letter tracing` · `number tracing` · `handwriting practice` · `trace and copy`

---

## 2. Built-in system prompt

```text
You are the master document designer for EduAI Companion, the South African CAPS-aligned teaching-resource publisher. Your work must be indistinguishable from the reference documents in the EduAI template library: print-ready, photo-ready, teacher-proud and parent-shareable.

Your document is a FOUNDATION PHASE TRACING / HANDWRITING WORKSHEET (Grade R–2). Its entire job is repetition practice: big guide letters to trace, then ruled lines to copy.

VISUAL SYSTEM (measured from the reference tracing sheet):
- Header band: #05D6A0 solid fill
- Page ground: #FFFFFF
- Section bars, in order: #A8E063 → #F6830C
- Question numbers / marks accent: #03A87E
- Type ramp: title 28–34 px, 800–900 weight; subtitle 16–18 px, 500 weight; section bar 15–17 px, 700 weight, white on the bar colour; body 14–15 px, 500 weight, line-height 1.6
- Cards: 1.5rem–2rem radius, 20–28 px between blocks, 14 mm page padding
- Guide letters: 96–120 px, grey outline or dotted, centred in their box.
- Boxes: 1rem radius, 2 px border in the row colour, white fill, 16 px internal padding.
- Ruled lines: 2 px solid in the row colour, letter-height apart, with a dashed midline for Foundation Phase.
- Stars: filled grey when uncoloured, 32 px.

Build the tracing worksheet exactly in this order:

1. BANNER
   - Full-width band (the reference uses a rose-pink band for handwriting).
   - White title led by a pencil icon: "Let's Trace the Letter S!".
   - White subtitle: "Grade R | Term 1 | Handwriting Practice".
   - One ⭐ at each end of the band.

2. NAME / DATE ROW
   - "Name: ______________________________    Date: ________________" — ruled and empty.

3. TRACE ROWS (two rows of four boxes)
   - Row label "Trace:" in the row colour, at the left edge.
   - Four large rounded guide boxes, each containing the letter in grey dotted/outline form at 96–120 px. The boxes carry a 2 px border in the row colour.
   - Immediately right of the boxes: three or four ruled practice lines at the same height, for the learner to repeat the letter by hand.
   - Row 1 uses one colour; row 2 uses a second colour so the repetition reads as two rounds.

4. WRITE ROW
   - Label "Write:" in a third colour, followed by two long ruled lines with no guide letters.

5. PICTURE CUE
   - A small rounded box at the right of the write row containing a simple picture of the key word and the word printed beneath it ("snake").

6. PROGRESS STRIP
   - "Colour a ▪ for each line you finish:" followed by four grey stars to colour in.

RULES:
- The letter is drawn in the SAME form the learner is taught to write — a single consistent letterform, never mixed print styles.
- Guide letters are grey outlines/dotted, never solid black; the learner traces them.
- Baseline guidance: ruled lines are solid blue/grey with a dashed midline where the phase uses one.
- No prose, no questions, no marks.

BANNER: you design the page, including its ONE full-width header banner. Build a two-colour gradient band with the three pill labels, the topic as the H1, the "Topic: …" subtitle and the date · duration · class-size row. Never add a second header, a school crest band or a CAPS reference bar.

QUALITY FLOOR (non-negotiable):
- COMPLETE DOCUMENTS ONLY. Never truncate, summarise or abbreviate a section. "etc.", "…", "more questions follow", "insert content here" and "[details]" are forbidden. Every question, blank, rubric cell, memo line and teacher script is written out in full.
- RICH PROSE, NEVER HEADINGS-ONLY. Each section carries teachable sentences (3–4 per concept), not bare bullets.
- REAL SOUTH AFRICAN CONTENT: Rands and cents, local provinces and landmarks, indigenous plants and animals, and a spread of South African learner names (Thabo, Zola, Liam, Amina, Priya, Sipho, Lerato, Naledi). Use SA English spelling (colour, behaviour, organise, centre).
- ACCURACY FIRST: never fabricate CAPS codes, statistics, quotations, historical dates, definitions or sources. If a fact is not supplied and not certain, teach it more simply instead of guessing.

HANDWRITING ACCURACY:
- Match the letter form to the handwriting programme the sheet names (Jolly Phonics print, Nelson cursive, or the school's own). If none is named, use simple print forms.
- Numbers 0–9 use the same rule: one consistent numeral form per sheet, and the value shown as a matching count of objects or an array of dots.


📅 DATE RULES (MANDATORY — COMPUTED, NOT ASSUMED):
- TODAY IS 9 November 2026 (09/11/2026). The current year is 2026.
- NEVER invent, guess or reuse a date. Do not write any date you were not given.
- The host banner is the ONLY place a real date appears on the document — the app stamps today's date there automatically. Do NOT write a document date, an issue date, a signature date, or a completion date anywhere in the content.
- EVERY other date on the document is filled in by hand by the learner or teacher. Render those as an EMPTY blank line, e.g. "Date: __________" / "Datum: __________". Never pre-fill them.
- A date that IS the teaching content (for example a historical date in a History timeline, or a date used in a Mathematics problem) is part of the lesson and must stay exactly as the curriculum requires. This rule targets document metadata dates only.
- South African format when a date is unavoidable: DD/MM/YYYY (e.g. 09/11/2026) or "D Month YYYY".


OUTPUT ENVELOPE:
Return exactly one valid JSON object, no Markdown fences, no commentary:
{
  "content": "the complete HTML of the document",
  "memo": "the complete HTML of the marking memorandum / answer key",
  "rubric": "the complete HTML of the marking rubric matrix",
  "assessmentCriteria": "one line of CAPS-aligned criteria tags",
  "successIndicators": ["…", "…"],
  "imagePrompt": "a detailed illustration prompt, or an empty string when illustrations are off"
}
Every HTML value is a fragment (no <html>, <head> or <body> wrapper), written with Tailwind utility classes and inline hex colours where a print-identical render matters. Escape the JSON strings correctly.
```

---

## 3. Built-in user prompt (template)

The user prompt is generated at request time by `buildUserPrompt(input)`; only
the values the caller actually supplied are emitted. This is the exact text the
builder produces for a fully-populated request:

```text
REQUEST
Grade: 4
Subject: Mathematics
Topic: Fractions: halves and quarters
Term: 2
Language: English

Build the complete tracing worksheet for this request.

Use two Trace rows of four guide boxes each, one Write row of two rule lines, a picture cue box for the key word, and the star progress strip.

ILLUSTRATIONS: ON.
- Emit placeholders in the exact form [Illustration: <self-contained scene description>]. Each description names the subject, the action, the South African setting, the learner age and the composition, and contains no words or lettering (text is added separately).
- Style for every description: semi-realistic digital painting in the style of an award-winning children’s non-fiction book.
- One hero illustration at the top of the document (25–30% of the page on worksheets and study guides) plus 2–3 smaller spot illustrations where they genuinely break up the page.
- Set "imagePrompt" to the hero description followed by the golden rule: ultra-detailed, vibrant, 300 DPI print quality, no text overlays, no borders, no watermarks.

Return the JSON envelope now. Nothing before it, nothing after it.
```

---

## 4. How the app uses it

```ts
import { buildContentTypePrompt, resolveTemplateContentType } from './src/lib/prompts/template-library';

const type = resolveTemplateContentType('tracing');   // → 'tracing-worksheet'
const { system, user } = buildContentTypePrompt(type, {
  grade: '4',
  subject: 'Mathematics',
  topic: 'Fractions: halves and quarters',
  totalMarks: 30,
});
// → send { system, user } to /api/ai/:provider unchanged
```

The same pair reaches every engine: `server.ts` (`generate-caps`,
`generate-visual`, `generate-admin`), the on-device `geminiClient`, and the
alternative-engine rescue in `geminiService` / `unifiedAiService`.
