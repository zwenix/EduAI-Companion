/**
 * Generates the built-in/system content-generation prompts for every content
 * type in `assets/templates/**` as standalone Markdown files.
 *
 * The prompts are NOT hand-written here: they are rendered from
 * `src/lib/prompts/template-library/`, which is the single source of truth that
 * the Express server, the on-device Gemini client and every alternative engine
 * already send. Editing the TypeScript keeps the runtime prompts and these
 * documents in lock-step; this script only formats them.
 *
 * Run:  npx tsx scripts/build-content-type-prompts.ts
 *   or: npm run build:prompts
 *
 * Output (committed, deterministic):
 *   assets/templates/instructions/README.md              ← index + reverse-engineering notes
 *   assets/templates/instructions/<content-type>.md      ← one built-in prompt per content type
 *   assets/templates/instructions/_anatomy.md            ← the measured visual system + lesson-plan contract
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    ALL_CONTENT_TYPE_TEMPLATES,
    LESSON_PLAN_BLOCKS,
    LESSON_PROCEDURE_PHASES,
    MEASURED_LAYOUT,
    MEASURED_PALETTES,
    lessonPhaseTable,
} from '../src/lib/prompts/template-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outDir = join(repoRoot, 'assets/templates/instructions');

mkdirSync(outDir, { recursive: true });

/* ────────────────────────────────────────────────────────────────────────────
 * One markdown file per content type
 * ──────────────────────────────────────────────────────────────────────────── */

const renderTemplate = (template: (typeof ALL_CONTENT_TYPE_TEMPLATES)[number]): string => {
    const sections = template.sections
        .map((section, index) => {
            const marks = section.marks !== undefined ? ` · **${section.marks} marks**` : '';
            const must = section.mustRender?.length
                ? `\n  - Must print: ${section.mustRender.map((token) => `\`${token}\``).join(', ')}`
                : '';
            const writing = section.learnerWriting ? '\n  - Learner writing space (keep blank)' : '';
            return `${index + 1}. **${section.heading}**${marks}\n  - ${section.content}${must}${writing}`;
        })
        .join('\n');

    const required = template.sections
        .filter((section) => section.marks !== undefined)
        .reduce((sum, section) => sum + (section.marks ?? 0), 0);

    return `<!-- GENERATED FILE — do not edit by hand.
     Source of truth: src/lib/prompts/template-library/${template.id}.ts
     Regenerate with: npm run build:prompts -->

# ${template.title}

> **Content type id:** \`${template.id}\`
> **Purpose:** ${template.purpose}
> **Reverse-engineered from:**
${template.sources.map((source) => `> - \`${source}\``).join('\n')}

---

## 1. What the reference documents contain

### Fixed page anatomy (in order)

${sections}
${required ? `\n**Marked sections total:** ${required} marks.\n` : ''}
### Visual system

| Property | Value |
| :--- | :--- |
| Banner gradient | ${template.visual.bannerGradient} |
| Palette | \`${template.visual.paletteId}\` (see \`src/lib/bannerPalettes.ts\`) |
| Grade badge | ${template.visual.gradeBadge} |
| Section bar | ${template.visual.sectionBar} |
| Score card | ${template.visual.scoreCard} |
| Typography | ${template.visual.typography} |
| Footer | ${template.visual.footer} |

### Fixed micro-copy (print exactly)

${template.fixedCopy.map((copy) => `- \`${copy}\``).join('\n')}

### Fields left blank for handwriting

${template.blankFields.length ? template.blankFields.map((field) => `- ${field}`).join('\n') : '_None — this document prints no fill-in fields._'}

### Guardrails

${template.guardrails.map((rule) => `- ${rule}`).join('\n')}

### UI labels that resolve to this template

${template.aliases.map((alias) => `\`${alias}\``).join(' · ')}

---

## 2. Built-in system prompt

\`\`\`text
${template.systemPrompt}
\`\`\`

---

## 3. Built-in user prompt (template)

The user prompt is generated at request time by \`buildUserPrompt(input)\`; only
the values the caller actually supplied are emitted. This is the exact text the
builder produces for a fully-populated request:

\`\`\`text
${template.buildUserPrompt({
    grade: '4',
    subject: 'Mathematics',
    topic: 'Fractions: halves and quarters',
    term: '2',
    week: 3,
    language: 'English',
    duration: '2 hours',
    totalMarks: 30,
    classSize: 35,
    learnerProfile: 'Mixed-ability class of 35, three learners on SIAS Level 2',
    generateImage: true,
    visualType: 'Educational Poster',
    documentType: 'Letter to Parents',
    schoolName: 'Mhlabeni Primary School',
    teacherName: 'Ms N. Dlamini',
    quantity: 6,
    dimensions: 'A4 portrait',
    illustrationStyle: 'semi-realistic digital painting in the style of an award-winning children’s non-fiction book',
    imageGoldenRule: 'ultra-detailed, vibrant, 300 DPI print quality, no text overlays, no borders, no watermarks',
})}
\`\`\`

---

## 4. How the app uses it

\`\`\`ts
import { buildContentTypePrompt, resolveTemplateContentType } from './src/lib/prompts/template-library';

const type = resolveTemplateContentType('${template.aliases[0]}');   // → '${template.id}'
const { system, user } = buildContentTypePrompt(type, {
  grade: '4',
  subject: 'Mathematics',
  topic: 'Fractions: halves and quarters',
  totalMarks: 30,
});
// → send { system, user } to /api/ai/:provider unchanged
\`\`\`

The same pair reaches every engine: \`server.ts\` (\`generate-caps\`,
\`generate-visual\`, \`generate-admin\`), the on-device \`geminiClient\`, and the
alternative-engine rescue in \`geminiService\` / \`unifiedAiService\`.
`;
};

/* ────────────────────────────────────────────────────────────────────────────
 * The anatomy reference document
 * ──────────────────────────────────────────────────────────────────────────── */

const renderAnatomy = (): string => `<!-- GENERATED FILE — do not edit by hand.
     Source of truth: src/lib/prompts/template-library/visual-system.ts and
     src/lib/prompts/template-library/lesson-plan-contract.ts
     Regenerate with: npm run build:prompts -->

# Reverse-engineered anatomy — the measurements behind every prompt

This file records what was actually measured from the reference files in
\`assets/templates/\`, so a prompt change can be checked against evidence rather
than taste.

---

## 1. Page geometry and type ramp

| Property | Measured value |
| :--- | :--- |
| Page | ${MEASURED_LAYOUT.page} |
| Page padding | ${MEASURED_LAYOUT.pagePadding} |
| Banner height | ${MEASURED_LAYOUT.bannerHeight} |
| Section bar radius | ${MEASURED_LAYOUT.sectionBarRadius} |
| Card radius | ${MEASURED_LAYOUT.cardRadius} |
| Block gap | ${MEASURED_LAYOUT.blockGap} |
| Title | ${MEASURED_LAYOUT.typography.title} |
| Subtitle | ${MEASURED_LAYOUT.typography.subtitle} |
| Section bar label | ${MEASURED_LAYOUT.typography.sectionBar} |
| Body | ${MEASURED_LAYOUT.typography.body} |
| Marks | ${MEASURED_LAYOUT.typography.marks} |
| Footer | \`${MEASURED_LAYOUT.footer}\` |

---

## 2. Measured palettes (dominant-colour quantisation of the rendered pages)

| Palette | Source file | Header | Body | Section bars | Accent |
| :--- | :--- | :--- | :--- | :--- | :--- |
${Object.entries(MEASURED_PALETTES)
    .map(([key, palette]) => `| \`${key}\` | \`${palette.source.split('/').pop()}\` | \`${palette.header}\`${palette.gradient ? ' (gradient)' : ''} | \`${palette.body}\` | ${palette.sectionBars.map((bar) => `\`${bar}\``).join(' ')} | \`${palette.accent}\` |`)
    .join('\n')}

**Note:** these are the palettes the *reference documents* print inside their own
header. The ONE host banner still takes its gradient from
\`src/lib/bannerPalettes.ts\`, which is unchanged and remains the single source of
truth for the banner.

---

## 3. The lesson plan contract (from \`GFr3LPFull_Copy.pdf\`)

The reference plan is a five-page Grade 3 Life Skills lesson on Basic First Aid.
Its structure is now the **mandatory** structure of every lesson plan the app
generates, in every doctrine.

### The eight blocks, in order

${LESSON_PLAN_BLOCKS.map((block) => `- ${block}`).join('\n')}

### The five procedure phases and their minutes

| Phase | Name | Minutes (2-hour reference) |
| :--- | :--- | ---: |
${LESSON_PROCEDURE_PHASES.map((phase) => `| ${phase.n} | ${phase.name} | ${phase.minutes} |`).join('\n')}
| | **Total** | **${LESSON_PROCEDURE_PHASES.reduce((sum, phase) => sum + phase.minutes, 0)}** |

\`scaleLessonPhases(duration)\` keeps this split proportionally for any other
duration, so a 1-hour lesson still carries all five phases.

### What each phase must contain

${lessonPhaseTable()}

### The appended learner worksheet

Only when the teacher asks for it. Four questions totalling 15 marks: a
match-up, true/false, a cloze short-answer and a drawing box, under a
\`SCORE ____ / 15\` capsule and a copyright line.

---

## 4. Where these measurements are enforced

| Measurement | Enforced in |
| :--- | :--- |
| Lesson-plan blocks | \`src/lib/prompts/template-library/lesson-plan-contract.ts\` (imported by the classic, LIGHT v5, CAPS-service and system-prompt paths) |
| Per-content-type anatomy | \`src/lib/prompts/template-library/<type>.ts\` → \`buildContentTypePrompt()\` |
| Anatomy appended to the shared pipeline | \`contentTypeAnatomyBrief()\` in \`src/lib/prompt-engine.ts → assemblePrompt()\` |
| Banner gradients | \`src/lib/bannerPalettes.ts\` (unchanged) |
| Dates | \`src/lib/saDates.ts\` (\`dateMandate()\`) |
| Contract tests | \`tests/template-library.test.ts\` |
`;

/* ────────────────────────────────────────────────────────────────────────────
 * The index
 * ──────────────────────────────────────────────────────────────────────────── */

const renderIndex = (): string => `<!-- GENERATED FILE — do not edit by hand.
     Source of truth: src/lib/prompts/template-library/
     Regenerate with: npm run build:prompts -->

# Built-in content-generation prompts

Every content type the app can generate has **one** built-in system prompt and
**one** user-prompt builder, reverse-engineered from the finished documents in
\`assets/templates/\`. This folder is the human-readable copy of that library; the
TypeScript in \`src/lib/prompts/template-library/\` is the single source of truth
and is what the app actually sends to Gemini, Qwen and the Nemotron models.

**Do not hand-edit these files.** Change the source and run \`npm run build:prompts\`.

---

## How the reverse engineering was done

| Step | What was extracted |
| :--- | :--- |
| 1. Read the source | Every PDF was rendered at 110–150 DPI and read page by page; every JPG/PNG reference was inspected at thumbnail and crop level. |
| 2. Text extraction | The text layer of each PDF was extracted (\`pymupdf\`) to capture the exact micro-copy, mark allocations and question wording. |
| 3. Colour measurement | Each rendered page was quantised to 16 colours; the dominant header, body, section-bar and accent colours were recorded per document. |
| 4. Structural deconstruction | Each page was decomposed into its fixed blocks, in reading order, with the marks and blanks each block carries. |
| 5. Prompt reconstruction | The blocks became the prompt anatomy; the measured colours became the visual system; the micro-copy became the fixed-copy list. |
| 6. Cross-doctrine enforcement | The lesson-plan contract is imported by every lesson-plan prompt path (Classic, LIGHT v5, CAPS service, system prompts) so the four cannot drift. |

The full measurement record lives in [\_anatomy.md](./_anatomy.md).

---

## The content types

| # | Content type | Prompt file | Reference files | Sections |
| -: | :--- | :--- | -: | -: |
${ALL_CONTENT_TYPE_TEMPLATES
    .map(
        (template, index) =>
            `| ${index + 1} | **${template.title}** | [\`${template.id}.md\`](./${template.id}.md) | ${template.sources.length} | ${template.sections.length} |`,
    )
    .join('\n')}

---

## Using a prompt directly

\`\`\`ts
import { buildContentTypePrompt, resolveTemplateContentType } from '../../src/lib/prompts/template-library';

const { system, user } = buildContentTypePrompt('Worksheet', {
  grade: '3',
  subject: 'Mathematics',
  topic: 'Place value, multiplication and fractions',
  totalMarks: 30,
});

// POST to /api/ai/:provider
\`\`\`

\`resolveTemplateContentType()\` accepts every UI label the Content Creator offers
("\`Worksheet\`", "\`Weekly Lesson Plan\`", "\`Marking Memo\`", "\`Classroom Rules Poster\`" …)
and resolves it to one of the ${ALL_CONTENT_TYPE_TEMPLATES.length} templates above.

### The shared output envelope

Every prompt asks for the same JSON object, so any provider can answer any
content type without a new parser:

\`\`\`json
{
  "content": "the complete HTML of the document",
  "memo": "the complete HTML of the marking memorandum",
  "rubric": "the complete HTML of the marking rubric",
  "assessmentCriteria": "one line of CAPS-aligned criteria tags",
  "successIndicators": ["…"],
  "imagePrompt": "a detailed illustration prompt, or an empty string"
}
\`\`\`

### Rules baked into every prompt

- **One banner.** Either the host renders it (LIGHT v5) or the model builds it (Classic) — never both.
- **Today's date is computed**, never hardcoded (\`dateMandate()\` from \`saDates.ts\`). Every other date is a blank for handwriting.
- **No invented data** — no fabricated CAPS codes, statistics, quotes, dates or names.
- **No truncation** — "etc.", "…", "insert content here" are forbidden; the full document is written out.
- **Language override** — a non-English request translates every structural label, not just the body.
- **South African context** — Rands, SA places, SA names, SA English spelling, IKS where relevant.
`;

/* ────────────────────────────────────────────────────────────────────────────
 * Write
 * ──────────────────────────────────────────────────────────────────────────── */

const written: string[] = [];

for (const template of ALL_CONTENT_TYPE_TEMPLATES) {
    const file = join(outDir, `${template.id}.md`);
    writeFileSync(file, renderTemplate(template), 'utf8');
    written.push(file);
}

writeFileSync(join(outDir, '_anatomy.md'), renderAnatomy(), 'utf8');
writeFileSync(join(outDir, 'README.md'), renderIndex(), 'utf8');

console.log(`✓ ${ALL_CONTENT_TYPE_TEMPLATES.length} built-in content-type prompts written to assets/templates/instructions/`);
console.log(`  + _anatomy.md (measurements + lesson-plan contract)`);
console.log(`  + README.md (index)`);
