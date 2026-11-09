<!-- GENERATED FILE — do not edit by hand.
     Source of truth: src/lib/prompts/template-library/
     Regenerate with: npm run build:prompts -->

# Built-in content-generation prompts

Every content type the app can generate has **one** built-in system prompt and
**one** user-prompt builder, reverse-engineered from the finished documents in
`assets/templates/`. This folder is the human-readable copy of that library; the
TypeScript in `src/lib/prompts/template-library/` is the single source of truth
and is what the app actually sends to Gemini, Qwen and the Nemotron models.

**Do not hand-edit these files.** Change the source and run `npm run build:prompts`.

---

## How the reverse engineering was done

| Step | What was extracted |
| :--- | :--- |
| 1. Read the source | Every PDF was rendered at 110–150 DPI and read page by page; every JPG/PNG reference was inspected at thumbnail and crop level. |
| 2. Text extraction | The text layer of each PDF was extracted (`pymupdf`) to capture the exact micro-copy, mark allocations and question wording. |
| 3. Colour measurement | Each rendered page was quantised to 16 colours; the dominant header, body, section-bar and accent colours were recorded per document. |
| 4. Structural deconstruction | Each page was decomposed into its fixed blocks, in reading order, with the marks and blanks each block carries. |
| 5. Prompt reconstruction | The blocks became the prompt anatomy; the measured colours became the visual system; the micro-copy became the fixed-copy list. |
| 6. Cross-doctrine enforcement | The lesson-plan contract is imported by every lesson-plan prompt path (Classic, LIGHT v5, CAPS service, system prompts) so the four cannot drift. |

The full measurement record lives in [_anatomy.md](./_anatomy.md).

---

## The content types

| # | Content type | Prompt file | Reference files | Sections |
| -: | :--- | :--- | -: | -: |
| 1 | **CAPS Worksheet** | [`worksheet.md`](./worksheet.md) | 4 | 6 |
| 2 | **Formal Assessment Paper** | [`formal-assessment.md`](./formal-assessment.md) | 3 | 6 |
| 3 | **CAPS Lesson Plan** | [`lesson-plan.md`](./lesson-plan.md) | 1 | 9 |
| 4 | **Study Guide / Learning Notes** | [`study-guide.md`](./study-guide.md) | 2 | 5 |
| 5 | **Classroom Poster** | [`poster.md`](./poster.md) | 8 | 4 |
| 6 | **Phonics / Sound Chart** | [`phonics-chart.md`](./phonics-chart.md) | 2 | 4 |
| 7 | **Tracing / Handwriting Worksheet** | [`tracing-worksheet.md`](./tracing-worksheet.md) | 3 | 6 |
| 8 | **Flashcards / Learning Cards** | [`flashcards.md`](./flashcards.md) | 7 | 4 |
| 9 | **Infographic** | [`infographic.md`](./infographic.md) | 3 | 4 |
| 10 | **Educational Diagram / Mind Map** | [`diagram.md`](./diagram.md) | 3 | 4 |
| 11 | **Visual Aid (general)** | [`visual-lab.md`](./visual-lab.md) | 4 | 4 |
| 12 | **School Administration Document** | [`admin-document.md`](./admin-document.md) | 3 | 6 |
| 13 | **Timetable / Weekly Planner** | [`timetable-planner.md`](./timetable-planner.md) | 1 | 4 |
| 14 | **Marking Memorandum** | [`marking-memo.md`](./marking-memo.md) | 3 | 5 |
| 15 | **Marking Rubric** | [`rubric.md`](./rubric.md) | 3 | 4 |

---

## Using a prompt directly

```ts
import { buildContentTypePrompt, resolveTemplateContentType } from '../../src/lib/prompts/template-library';

const { system, user } = buildContentTypePrompt('Worksheet', {
  grade: '3',
  subject: 'Mathematics',
  topic: 'Place value, multiplication and fractions',
  totalMarks: 30,
});

// POST to /api/ai/:provider
```

`resolveTemplateContentType()` accepts every UI label the Content Creator offers
("`Worksheet`", "`Weekly Lesson Plan`", "`Marking Memo`", "`Classroom Rules Poster`" …)
and resolves it to one of the 15 templates above.

### The shared output envelope

Every prompt asks for the same JSON object, so any provider can answer any
content type without a new parser:

```json
{
  "content": "the complete HTML of the document",
  "memo": "the complete HTML of the marking memorandum",
  "rubric": "the complete HTML of the marking rubric",
  "assessmentCriteria": "one line of CAPS-aligned criteria tags",
  "successIndicators": ["…"],
  "imagePrompt": "a detailed illustration prompt, or an empty string"
}
```

### Rules baked into every prompt

- **One banner.** Either the host renders it (LIGHT v5) or the model builds it (Classic) — never both.
- **Today's date is computed**, never hardcoded (`dateMandate()` from `saDates.ts`). Every other date is a blank for handwriting.
- **No invented data** — no fabricated CAPS codes, statistics, quotes, dates or names.
- **No truncation** — "etc.", "…", "insert content here" are forbidden; the full document is written out.
- **Language override** — a non-English request translates every structural label, not just the body.
- **South African context** — Rands, SA places, SA names, SA English spelling, IKS where relevant.
