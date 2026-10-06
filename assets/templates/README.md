# `assets/templates/` — reference print templates (read-only source artwork)

> **These files are the source of truth for the EduAI print layout. They are
> immutable** — never replace, re-encode, crop or delete them (see `AGENTS.md`
> §2). The reverse-engineering result lives in code and documentation instead.

The 12 PDFs in this folder are the reference documents the app's generated
content must match. They were measured (text, geometry, point sizes, fonts and
content-stream colours) and turned into:

| Artefact | What it holds |
| --- | --- |
| `src/lib/templates/template-specs.ts` | machine-readable specifications: banner anatomy, band/accent colours, page tints, point sizes, record fields, section layouts and question shapes for every file |
| `src/lib/prompts/content-type-prompts.ts` | the built-in (system) generation prompt for every content type, composed from the measured family rules + per-type blueprints + the merged-banner contract |
| `src/lib/contentTemplate.ts` | the ONE document banner that now carries every field these templates printed (brand lockup, title, subtitle, pills, learner record strip, sign-off, CAPS code, compliance labels, country and URL) |
| `docs/TEMPLATE_PROMPTS.md` | the full reverse-engineering report, per-file evidence table and the merged-banner field map |

## What the set covers

| File | Content type |
| --- | --- |
| `gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf` | Worksheet (30 marks, 3 sections, score box, teacher comment) |
| `gr3-life-skills-assessment-term1-healthy-living.pdf` | Formal Assessment Task (10 + 10 + 10 marks) |
| `gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf` | Controlled Test (15/20/15 marks, moderator sign-off) |
| `gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf` | Examination (15/15/30 marks, drawing space) |
| `gr4-life-skills-worksheet-term2-emotions-relationships.pdf` | Worksheet (PARTs, vocabulary cards, journal lines) |
| `gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf` | Worksheet (fact rows, scenario blanks) |
| `grR-phonics-tracing-letter-s.pdf` | Foundation Phase handwriting (48 pt dotted glyphs, reward row) |
| `gr1-phonics-blending-cvc-words.pdf` | Foundation Phase phonics (letter tiles → word → write-it) |
| `grR-phonics-sound-chart-group1.pdf` | Alphabet chart + flashcard grid (3 × 2 cards) |
| `Number Poster Gr3.pdf` | Number chart / poster (picture-led display) |
| `about_blank_1.pdf` | Number line artwork capture (multi-page) |
| `Multiplication for Grade 3 Learners.pdf` | Study guide / learning notes (concept + worked example + chart) |

`AI_IMG*.jpg` / `AI_IMG.png` are the illustration references for the same
visual language; they are not part of the template geometry.

## Changing anything here

If a new reference template is added, measure it and extend
`REVERSE_ENGINEERED_TEMPLATES` in `src/lib/templates/template-specs.ts`, then
point the matching blueprint in `src/lib/prompts/content-type-prompts.ts` at the
file. `tests/content-type-prompts.test.ts` fails if a spec names a file that does
not exist here.
