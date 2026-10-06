/**
 * BUILT-IN / SYSTEM CONTENT GENERATION PROMPTS — one per content type
 * ==================================================================
 *
 * Reverse-engineered from the reference print templates in `assets/templates/`
 * (see `src/lib/templates/template-specs.ts` for the measured geometry, colour
 * pairings, point sizes and data fields) and from the host template contract in
 * `src/lib/contentTemplate.ts` / `docs/CONTENT_TEMPLATE.md`.
 *
 * Every content type the Content Creator offers (`src/lib/contentTypes.ts`) has
 * a built-in system prompt here. A prompt is composed from three layers:
 *
 *   1. **Family craft rules** (`FAMILY_RULES`) — the document shape that family
 *      prints: a worksheet is sections + marks + answer lines, an assessment is
 *      weighted sections + mark tags + moderator sign-off, a poster is one
 *      picture-led artwork with no record row, a Foundation page is 38–48 pt
 *      glyphs with a reward row, and so on. Taken 1:1 from the templates.
 *   2. **Per-type blueprint** (`CONTENT_TYPE_BLUEPRINTS`) — what *this* type
 *      must contain: required sections, marks behaviour, memo/rubric companion,
 *      visuals. "Controlled Test" and "Examination" share a family but not a
 *      blueprint.
 *   3. **The merged banner contract** (`MERGED_BANNER_CONTRACT`) — the host owns
 *      the ONE banner that now carries every field the reference templates
 *      printed up top (title, topic line, grade, subject, content type, term,
 *      date, learner name, total marks, duration, teacher, moderator, comment,
 *      CAPS code + reference, the 🇿🇦/CAPS/NPA/POPIA/SIAS/WP6 compliance labels,
 *      country and the resource URL) together with the brand lockup from the
 *      page header. The model must never build a banner, header band, title
 *      block, record row, compliance stamp or footer of its own.
 *
 * The composed prompt is the `system` message; the caller adds grade / subject
 * / topic / term / marks / language context with `buildContentTypeUserPrompt()`.
 *
 * Usage:
 *   import { getContentTypePrompt, buildContentTypePromptPair } from
 *     './content-type-prompts';
 *   const { system, user } = buildContentTypePromptPair('Controlled Test', {...});
 */
import { ADMIN_TYPES, TEACHING_CATEGORIES, VISUAL_TYPES } from '../contentTypes';
import { bannerPaletteFor, type BannerPaletteId } from '../bannerPalettes';
import {
    TEMPLATE_PRINT_TOKENS,
    templateSourcesForContentType,
    type TemplateFamily,
} from '../templates/template-specs';

/** Prompt families = the document shapes the reference templates cover. */
export type PromptFamily =
    | 'worksheet'
    | 'assessment'
    | 'memo'
    | 'lesson-plan'
    | 'study-notes'
    | 'poster'
    | 'cards'
    | 'certificate'
    | 'admin'
    | 'report'
    | 'intervention'
    | 'foundation';

/** What a content type must contain, over and above its family rules. */
export interface ContentTypeBlueprint {
    /** One-line purpose, used in the prompt's opening paragraph. */
    purpose: string;
    /** Required sections, in order, exactly as the prompt should demand them. */
    sections: string[];
    /** Learner record / answer-space shapes the body must provide. */
    responseShapes: string[];
    /** Marks behaviour — omitted for unmarked types. */
    marks?: string;
    /** Companion artefacts (memo, rubric, checklist …) generated alongside. */
    companion?: string;
    /** Visual guidance (illustration placeholders, diagrams, card fills …). */
    visuals?: string[];
    /** Anything that makes this type different from its family. */
    extras?: string[];
    /** Where the reference templates for this type live. */
    sources?: string[];
}

/** A fully-resolved built-in prompt for one content type. */
export interface ContentTypePrompt {
    /** Canonical content-type name (matches `contentTypes.ts`). */
    contentType: string;
    /** URL/attribute-safe slug. */
    slug: string;
    family: PromptFamily;
    /** Banner palette the host paints for this type. */
    palette: BannerPaletteId;
    blueprint: ContentTypeBlueprint;
    /** The composed system prompt (banner contract + family rules + blueprint). */
    systemPrompt: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * 1 · THE MERGED BANNER CONTRACT
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The ONE banner's merged data slots — everything the reference templates in
 * `assets/templates/` printed in their top band, plus the brand lockup the app
 * page header used to carry on its own. Exported so prompts, tests and the
 * renderer can never drift apart.
 */
export const MERGED_BANNER_SLOTS = [
    'brand lockup (logo + “EDUAI COMPANION 2026 · OFFICIAL EDUCATIONAL RESOURCE”)',
    'resource URL (EDUAI-COMPANION.VERCEL.APP) and country (🇿🇦 South Africa)',
    'document title',
    'topic / focus subtitle line',
    'grade · subject · content type · term · date pills',
    'school · teacher · learner pills when supplied',
    'learner record strip (Name / Date / Term / Total ___ / N)',
    'sign-off strip (Teacher / Moderator / Comment / Signature)',
    'CAPS code + CAPS/ATP reference line',
    'compliance labels — CAPS Aligned · NPA Compliant · POPIA Compliant (2026) · SIAS Level 1 Inclusive · WP6 Differentiated',
] as const;

/** The shared banner contract paragraph injected into every prompt. */
export const MERGED_BANNER_CONTRACT = `
⛔ THE HOST OWNS THE ONLY BANNER — NEVER BUILD YOUR OWN (NON-NEGOTIABLE):
The app wraps your output in the official EduAI print template. That template opens the document with exactly ONE two-colour VERTICAL gradient banner, and it now carries EVERY field the reference EduAI templates printed in their top band, merged with the brand lockup from the page header:
${MERGED_BANNER_SLOTS.map((slot, index) => `   ${index + 1}. ${slot}`).join('\n')}

Because the host banner already prints all of that:
• Do NOT emit <header>, <h1> page titles, hero/cover bands, banner, masthead, letterhead, school/DBE header, CAPS reference bar, “formal assessment header”, name/date/term/total record row, score box, teacher/moderator/comment signature line, compliance stamp row, watermark, page numbers or a footer. Every one of those is deleted before rendering and only wastes the space a learner needs.
• Do NOT repeat the grade, subject, content type, term, date, marks or CAPS code anywhere in the body — not in a heading, not in a pill row, not in running text. Reference the topic in prose instead.
• Do NOT write the compliance labels (CAPS Aligned / NPA Compliant / POPIA Compliant / SIAS / WP6) or the canonical footer — the host adds each exactly once.
• Start straight into real content: the first element you emit is the first teaching/answerable element of the document (a section heading, an instruction, a question).`.trim();

/* ────────────────────────────────────────────────────────────────────────────
 * 2 · FAMILY CRAFT RULES — measured from the reference PDFs
 * ──────────────────────────────────────────────────────────────────────────── */

const PRINT_SCALE = `The reference templates are A4 portrait (${TEMPLATE_PRINT_TOKENS.page.widthPt} × ${TEMPLATE_PRINT_TOKENS.page.heightPt} pt) with 15 mm live margins. Transcribe that scale into web/print CSS: section headings 13 pt, question text 12 pt, body/options 11 pt, marks tags 10 pt, footer 8–9 pt. Never go below 10 pt in body content and never use fixed pixel heights that can clip on print.`;

const INK_RULES = `Use the template ink palette: body text #1a1a2e on white; one accent colour per section for rules, badges and answer lines (template accents: teal #118ab2, sky #48cae4, purple #9b5de5, orange #f77f00, gold #ffb703, coral #ff8c42, green #06d6a0, leaf #95d44a, forest #388e3c, pink #ff6b9d, rose #ef476f). High contrast only (WCAG ≥ 4.5:1). The banner gradient is the host's; body accents must not fight it.`;

const ANSWER_SPACE_RULES = `Answer space is the product. Every question must be answerable on the page without extra paper: ruled lines 396–510 pt wide for written answers, dotted underlines for one-word blanks, framed boxes (border-2 border-dashed) for drawings/graphs, and 24 pt+ line spacing on Foundation pages. Never squeeze two questions onto one line, never leave a question without answer space, and never place answer lines inside a coloured band.`;

const PRINT_RULES = `Print fidelity: inline styles for every colour, border and spacing that matters (survives iframe preview, window.print(), html2canvas and PDF export); @media print rules to avoid breaking questions across pages (page-break-inside: avoid on question cards); no fixed heights on containers (h-auto, py-4/py-6); no absolute positioning of text; rounded-xl/2xl (never rounded-full) for wrapping pills; no external CSS or JavaScript.`;

const CONTENT_LAW = `Content law (CAPS · NPA · SIAS · WP6 · POPIA):
• CAPS: grade-appropriate content for the stated subject, term and topic, paced to the DBE ATP; tag each section with the cognitive demand it exercises.
• NPA: per-question mark allocation, a visible total, and a 7-point rating expectation for formal tasks (Code 1–7, 0–100 %).
• Bloom's: distribute thinking levels across the task (remembering → understanding → applying → analysing → evaluating → creating) and label the higher-order questions in the section instruction.
• SIAS & White Paper 6: include one differentiated support element (scaffold, hint, word bank, sentence starter, extension) and, on assessed work, an inclusion note for the teacher.
• POPIA: never write a real learner's name or personal data; where a name is needed inside example sentences use clearly fictional, diverse South African names (Thabo, Amina, Zola, Priya, Sipho, Lerato, Sarah, Liam).
• South African context: Rand and cents, DD/MM/YYYY dates, SA English spelling (colour, behaviour, organise, centre), local places, flora/fauna and Indigenous Knowledge Systems where they fit naturally.
• Completeness: zero placeholders. Never write “etc.”, “more questions here”, “insert content”, “summarised for brevity” or any stub. Write every instruction, every question, every blank, every model answer in full.`;

const OUTPUT_RULES = `Output format:
• Return the document BODY as clean HTML (a fragment — no <!doctype>, <html>, <head>, <body>, <header> or <footer>).
• Respond with ONE raw JSON object (no markdown fence, escaped double quotes) using exactly these keys:
   content  — the complete document body HTML (all sections, questions, blanks and answer space)
   memo     — the memorandum / answer key HTML when this type needs one, else ""
   rubric   — the rubric or checklist HTML when this type needs one, else ""
   assessmentCriteria — a short string list of what is being assessed, else ""
   successIndicators  — an array of strings: what success looks like for the learner
   imagePrompt        — one hero illustration prompt for this document, else ""
   title              — the document title the banner should print (no grade/term/marks in it)
   marks              — the total marks as a number when the document is marked, else 0
• None of those fields may contain a banner, header band, title block, record row, compliance label or footer — the host owns them all.
• Prefer Tailwind utility classes; add inline style for anything that must survive print/rasterisation.
• Images: insert [Illustration: <detailed South African, grade-appropriate, no-text prompt>] placeholders inside the body where a diagram or picture genuinely helps; the host replaces them with generated art. Never emit emoji as artwork and never invent an image URL.`;

/** Family-level craft rules. */
export const FAMILY_RULES: Record<PromptFamily, string> = {
    worksheet: `DOCUMENT FAMILY — WORKSHEET (reverse-engineered from gr3-mathematics-worksheet / gr4-life-skills-worksheet / gr7-life-orientation-worksheet):
• Opens with a short “How to do this” instruction line, then 2–4 SECTION headings in the template style: “SECTION A — <strand> [N marks]” (parts, not sections, for Life Skills/Orientation: “PART 1 — …”).
• Each section holds 3–6 numbered questions of a consistent type (fill-in, calculation, matching, short answer, draw/colour, scenario response).
• Every question carries its mark tag in square brackets right-aligned or immediately after the prompt ([1] … [4]); section tags add up to the section total and section totals add up to the banner total.
• Questions progress from recall to application; include at least one worked example or model the first item (template shows “300 + ___ + ___” style scaffolds and labelled examples).
• Include a short “Challenge” or extension item at the end for early finishers, and a one-line success criterion in learner-friendly language.
• End with the takeaway/affirmation band where the template has one (e.g. “All feelings are valid — what matters is how we ACT on them!”), then hand over to the host banner's record/sign-off strip.
${INK_RULES}
${ANSWER_SPACE_RULES}
${PRINT_RULES}`,

    assessment: `DOCUMENT FAMILY — FORMAL ASSESSMENT (reverse-engineered from gr3-life-skills-assessment / gr4- and gr6-mathematics-assessments):
• Sections are weighted: Section A recall/knowledge, Section B understanding/application, Section C analysis/problem-solving, with the template's markers-to-total arithmetic (e.g. 15 + 20 + 15 = 50; 15 + 15 + 30 = 60; 10 + 10 + 10 = 30).
• Instructions to candidates come first: number of questions, marks per section, time suggestion, allowed resources, and “show all working” where calculation is assessed.
• Question types must vary: multiple choice laid out a) b) c) d) in four columns, true/false “T / F”, matching Column A ↔ Column B, calculations with working lines, data handling, sketch/draw prompts with a framed area, and at least one multi-step South African word problem.
• Every question has an explicit mark tag; every sub-part is numbered (1.1, 1.2 …) where a question is multi-step; totals per section are printed in the section band.
• The last section carries the higher-order weighting and an extended response (6+ marks) with generous writing space.
• No answers anywhere in the document body — the memo is returned separately.
${INK_RULES}
${ANSWER_SPACE_RULES}
${PRINT_RULES}`,

    memo: `DOCUMENT FAMILY — MEMO / RUBRIC / CHECKLIST (marking pack):
• The memo mirrors the assessment exactly: same numbering, same sections, same totals, so a marker can work down one column.
• Each item gives the accepted answer(s), the mark allocation (including part marks, e.g. “2 × 1 mark”), the cognitive level (Bloom's) and one line of marking guidance or the common error to watch for.
• Alternative correct phrasing is listed, never penalised; language is terse and unambiguous (this is a working document, not a lesson).
• Rubrics are tables: criteria rows × performance levels (e.g. 4 = Excellent → 1 = Not achieved), each cell containing an observable descriptor, with a marks/points column and a total row.
• Checklists are tick-box rows with observable criteria and space for evidence/date; self-assessment versions use learner-friendly “I can …” statements and a smiley/tick scale, never marks.
• Every rubric/checklist ends with a feedback block (teacher comment lines) and a recording note (SBA mark, SIAS support note).
${INK_RULES}
${PRINT_RULES}`,

    'lesson-plan': `DOCUMENT FAMILY — LESSON PLAN / NOTES (teaching document):
• Metadata first, in prose or a compact table: topic, CAPS/ATP reference, duration, resources, prior knowledge, learning objectives (“By the end of the lesson learners will be able to …”, 3–5 SMART objectives with Bloom's verbs).
• Then the five teaching phases as headed, teacher-facing sections: Introduction/Hook, Direct Teaching (key vocabulary + explanation), Guided Practice, Independent Practice (differentiated), Consolidation/Closure — each with minutes, teacher actions, expected learner responses and a spoken script/example where the teacher needs words.
• Include the assessment evidence for the lesson (informal checks, exit ticket, observation checklist), the differentiated support (Core / Extended / Simplified with WP6 strategies), SIAS accommodations, and a homework/extension activity.
• Where the plan integrates a worksheet, append it after a clear page break, complete with its own questions, blanks, marks and memo — never a stub reference.
${INK_RULES}
${PRINT_RULES}`,

    'study-notes': `DOCUMENT FAMILY — STUDY GUIDE / LEARNING NOTES (reverse-engineered from “Multiplication for Grade 3 Learners”):
• Picture-led and explanation-first: the host banner carries the display title, so the body opens with a short “What we are learning” paragraph in plain language.
• Each concept becomes a section with: a plain-language definition, a worked example (step by step, with the template's “3 groups of 2 = 3 × 2 = 6” style labelling), a labelled diagram or array, and one “try it yourself” item with the answer upside-down or in the memo.
• Include a reference chart/table the learner can reuse (times tables, formulas, glossary, timeline) and at least one “Tip:” callout with a memory hook (“Practice skip counting: 2, 4, 6, 8!”).
• Bilingual/multilingual support: key terms with a home-language gloss or picture cue for EAL/FAL learners.
• End with self-check questions (with answers in the companion memo) and a 4–6 item revision checklist.
${INK_RULES}
${PRINT_RULES}`,

    poster: `DOCUMENT FAMILY — DISPLAY POSTER / CHART / DIAGRAM (reverse-engineered from the Jolly Phonics sound chart and Number Poster):
• One idea per page, readable across the classroom: hero artwork or diagram dominating the page, minimal text, lettering at display size.
• Grid discipline: the template uses a 3 × 2 card grid with uniform gutters (155.9 × 184.3 pt cards); keep gutters and card sizes identical across the grid, and give every cell the same internal rhythm (big glyph → picture → label).
• Each card/segment gets one colour from the accent palette; letters/numbers are maximum-weight type (52 pt+ for the featured glyph, 32 pt for the paired case, 13 pt+ labels).
• Every poster carries an action/instruction band at the foot (template: “Action Time! Do the action while you say each sound — make it fun!”) so it is usable in a lesson, not just decorative.
• Diagrams/flow charts: labelled parts, arrows with verbs on them, a legend, and no orphan text outside the drawing frame. No marks, no blanks, no learner record row.
${INK_RULES}
${PRINT_RULES}`,

    cards: `DOCUMENT FAMILY — CARD SETS (flashcards, vocabulary, formula, timeline, matching, cut-outs, labels):
• Uniform cards: identical width and height, identical gutters, dotted cut guides between cards, 4–8 mm safe margin inside every card so nothing is trimmed off.
• One concept per card: front side = term/glyph/number at large type; back side = definition/example/picture + one-line memory hook. For matching sets, produce two visually distinct card families (term cards vs definition cards) that pair up without ambiguity.
• Keep sets to a printable count per page (6–9 cards, A4) and state the set name/index on every card so mixed-up cards can be reunited.
• Cut-out activity cards must work as a hands-on task: instruction panel, card pieces, and a “when you are done” sorting/storage line.
• Never add marks, totalling boxes or a learner record row to a card set.
${INK_RULES}
${PRINT_RULES}`,

    certificate: `DOCUMENT FAMILY — CERTIFICATE / AWARD / STICKER / SEAL:
• Ceremonial but print-safe: the host banner paints the certificate palette, the body is the award itself with a generous border motif, an emblem/seal placeholder, the award wording, the recipient line, the achievement line, the date line and two signature lines (teacher/principal).
• Award wording is warm, specific and complete (“For …” describing the achievement), with the school name as a fill-in blank if the caller did not supply one — never invented.
• Sticker/award sheets: uniform cut-out cells, each with the award name, a placeholder motif and a short praise line; include the sheet title and cut guides.
• Seals/emblems: circular or shield composition with a motto band, no personal data, no marks.
• Never pre-fill a learner name, date or school; every personal field is a blank the teacher completes.
${INK_RULES}
${PRINT_RULES}`,

    admin: `DOCUMENT FAMILY — SCHOOL ADMINISTRATION / PARENT COMMUNICATION:
• Formal South African letter/document architecture: reference line (school/REF placeholders), date line, recipient block, subject line in bold, salutation, body in short numbered paragraphs (one instruction per paragraph), action items with a deadline, contact block, signature block (class teacher, principal, SGB where relevant), and a reply slip when a response is required.
• Notices state WHO / WHAT / WHEN / WHERE / WHAT TO BRING / WHO TO CONTACT in that order; the first sentence must be understandable to a parent who reads only that sentence.
• Registers/timetables/plans are tables with consistent column widths, blank cells for handwriting, a totals row where relevant, and a header row repeated on every page.
• Tone: professional, warm, plain language (no jargon), respectful of parents and learners; never include learner marks or medical/personal detail in a general notice (POPIA).
• Every admin document closes with the canonical footer supplied by the host — never write your own.
${INK_RULES}
${PRINT_RULES}`,

    report: `DOCUMENT FAMILY — REPORT COMMENTS:
• Five-move structure per learner: opening positive acknowledgement → measured achievement statement against CAPS expectations → 2–3 specific strengths with evidence → 1–2 actionable growth areas with how-to advice → encouraging close that names the next step.
• Language is professional, warm, concrete and jargon-free; never label the child (“lazy”, “naughty”); describe the work and the next action.
• Provide differentiated versions for stronger / developing / needing-support achievement bands, all using the same structure so a teacher can pick and adapt.
• Leave learner names, dates and marks as blanks/placeholders — never real personal data (POPIA); where an example is needed use a clearly fictional SA name.
• Include a short “comment builder” reference for the teacher: sentence starters per achievement band and per subject attitude descriptor.
${PRINT_RULES}`,

    intervention: `DOCUMENT FAMILY — SIAS SUPPORT / INDIVIDUALISED PLAN:
• SIAS 2014 structure: learner profile (placeholders only), barrier categories (intrinsic / extrinsic / pedagogical) with evidence, strengths and interests, support strategies for the subject at this grade, curriculum adaptations, assessment accommodations, resources, roles (teacher / SBST / DBST / parent), review date, success indicators, referral pathway to the next SIAS level.
• Every strategy must be observable and measurable (“extra 10 minutes and a scribe for written tasks”, not “give support”), and must note who delivers it.
• Include a WP6 differentiation table (Core / Extended / Simplified) and the accommodation list for formal tasks.
• End with a POPIA statement and a review/sign-off block.
• Never write a real learner name, diagnosis or ID number — placeholders only.
${INK_RULES}
${PRINT_RULES}`,

    foundation: `DOCUMENT FAMILY — FOUNDATION PHASE (Grade R–3) ACTIVITY (reverse-engineered from grR-phonics-tracing and gr1-phonics-blending):
• Maximum-size, minimum-clutter: headed instruction line at 12–14 pt with an icon marker, then 3–6 large activity blocks per page.
• Letter/number glyphs at 38–52 pt on ruled baselines inside 62 × 82 pt cells; trace rows use dotted glyphs and every trace row is followed by a “Write:” row on a plain ruled line.
• Picture + word support for every sound/word (“snake” beside the letter S); word cards show the blended word at 28 pt with a tick/star glyph.
• Reward and encouragement bands instead of marks: praise line, “Colour a ⭐ for each line you finish”, observation checklist for the teacher. Never a marks box, never a total, never small print.
• Child-friendly, high-contrast, generous white space; hand-drawn style headings; instructions written as a spoken invitation (“Let's blend!”); the activity must be doable by a child without reading a long paragraph — use pictures and one-sentence instructions.
${INK_RULES}
${PRINT_RULES}`,
};

/* ────────────────────────────────────────────────────────────────────────────
 * 3 · PER-TYPE BLUEPRINTS
 * ──────────────────────────────────────────────────────────────────────────── */

type BlueprintSeed = Omit<ContentTypeBlueprint, 'sources'> & { sources?: string[] };

/** Blueprints for every type in the Content Creator taxonomy, plus app aliases. */
export const CONTENT_TYPE_BLUEPRINTS: Record<string, BlueprintSeed> = {
    /* ── Teaching: lesson planning & notes ─────────────────────────────────── */
    'Lesson Plan': {
        purpose: 'a complete CAPS lesson plan a teacher can teach from without further preparation',
        sections: [
            'Lesson metadata table: topic • CAPS/ATP reference • duration • resources • prior knowledge',
            'Learning objectives (3–5 SMART, Bloom\'s verbs) and success criteria in learner language',
            'Phase 1 — Introduction / hook (5–10 min): teacher script, question prompts, prior-knowledge check',
            'Phase 2 — Direct teaching (10–15 min): key vocabulary, explanation, worked example, visual aid',
            'Phase 3 — Guided practice (15–20 min): scaffolded activity, formative check, expected answers',
            'Phase 4 — Independent practice (15–20 min): differentiated task (Core / Extended / Simplified)',
            'Phase 5 — Consolidation & closure (5–10 min): summary, exit ticket, homework/extension',
            'Assessment evidence & SIAS accommodations table',
        ],
        responseShapes: [
            'teacher-script lines in italics (“Say: …”, “Ask: …”)',
            'worked example on the board, copied exactly',
            'exit-ticket slips (4 to a page) with the 3 reflection questions',
        ],
        marks: 'Marks only where the lesson feeds a formal task; state the informal check separately',
        companion: 'answer key for the practice task and a short observation checklist',
        visuals: ['one [Illustration: …] hook picture', 'one labelled diagram for the concept', 'one vocabulary strip with 4–6 words + picture cues'],
    },
    'Daily Lesson Notes': {
        purpose: 'teacher notes for one lesson that can be taught tomorrow morning',
        sections: [
            'Today\'s focus: topic, CAPS/ATP reference, one-sentence aim',
            'Vocabulary and prior knowledge to activate (3–6 items)',
            'Teaching sequence in numbered steps with the board work written out',
            'Learner activities (grouping, timing, materials) and expected responses',
            'Formative checks (the three questions to ask at the end)',
            'Differentiation, SIAS notes and homework/next step',
        ],
        responseShapes: ['board-work blocks in monospaced boxes', 'quick-check tick list for the teacher', 'homework line with instructions'],
        companion: 'answer key for the activity plus a brief SIAS observation note',
        visuals: ['one [Illustration: …] vocabulary cue per teaching step (max 3)'],
    },
    'Weekly Lesson Plan': {
        purpose: 'a five-day CAPS week plan that keeps ATP pacing visible',
        sections: [
            'Week overview: grade, term, week number, topic, CAPS/ATP reference, formal task due this week',
            'Five day blocks: each with topic, objective, teacher activity, learner activity, resources, informal assessment',
            'Weekly assessment plan: formal/informal tasks, SBA number, marks and date',
            'Differentiation & SIAS: support and extension per day',
            'Reflection questions for the teacher at the end of the week',
        ],
        responseShapes: ['five uniform day cards', 'a week-at-a-glance table (topic / activity / assessment)', 'tick column for “done”'],
        marks: 'List the week\'s formal task marks in the assessment row (host banner prints the total)',
        companion: 'answers to the week\'s informal checks and the homework for each day',
        visuals: ['one [Illustration: …] for the week\'s topic, one small icon per day'],
    },
    'Unit Plan': {
        purpose: 'a 2–4 week CAPS unit overview with progression across lessons',
        sections: [
            'Unit summary: topic, duration, CAPS reference, big idea (one paragraph)',
            'Objectives and the end-of-unit success criteria',
            'Lesson sequence: lesson number → focus → key concepts → activities → resources → assessment',
            'Formal assessment plan and SBA weighting, with the question-type blueprint',
            'Resources, vocabulary list, cross-curricular and IKS links',
            'SIAS/WP6 differentiation map for the whole unit',
        ],
        responseShapes: ['unit-at-a-glance table with one row per lesson', 'success-criteria checklist learners can tick', 'revision checklist'],
        marks: 'State per-task marks and the unit total; the host banner prints the total',
        companion: 'sample answers and rubric descriptors for the unit\'s formal task',
        visuals: ['one [Illustration: …] big-idea picture', 'a small unit mind map'],
    },
    'Learning Activity': {
        purpose: 'a hands-on CAPS activity that teaches one concept through doing',
        sections: [
            'What you need (materials list a teacher can gather in 5 minutes)',
            'What to do — numbered steps in learner language, with how-to-use notes for the teacher',
            'Activity worksheet: the items to complete, cut out, sort or build',
            'Talk about it — 3 discussion questions with expected answers',
            'Challenge yourself — one extension item',
            'What I learned — two reflection sentence starters',
        ],
        responseShapes: ['instruction card', 'cut-out/manipulative pieces with cut guides', 'sorting/recording table', 'reflection lines'],
        companion: 'teacher answer/observation guide',
        visuals: ['step pictures (2–3 small) plus one [Illustration: …] showing the finished activity'],
    },
    'Study Guide / Learning Notes': {
        purpose: 'learner-friendly study notes that explain one topic completely and let a learner revise alone',
        sections: [
            'What we are learning (plain-language overview, 3–4 sentences)',
            'Key vocabulary: term → definition → picture/example (6–10 items)',
            'Core content in 2–4 concept sections: definition → worked example → labelled diagram → common mistake',
            'Reference chart or table to reuse (formula/times table/summary/glossary)',
            'Worked exam-style example with every step shown',
            'Practise: 6–10 graded questions (with answers returned in the memo)',
            'Tip callout with a memory hook, and a revision checklist',
        ],
        responseShapes: ['glossary grid', 'worked-example boxes', 'practice blanks/dotted lines with space for full answers'],
        marks: 'Mark the practice section and print the total in the host banner; never scatter standalone totals',
        companion: 'memo with worked solutions and marking notes',
        visuals: ['one labelled diagram per concept section', 'one [Illustration: …] per major section (max 3)'],
    },
    'Revision Pack': {
        purpose: 'a complete revision pack that covers the term\'s or topic\'s assessed content',
        sections: [
            'How to use this pack (study plan: 4 × 30-minute sessions)',
            'Summary sheets per topic/strand (content → must-know points → worked example)',
            'Formula/fact sheet the learner can detach and memorise',
            'Practise questions per strand, graded easy → exam-level, with mark tags',
            'Exam technique: how to read the paper, how to budget marks, the 3 most common mistakes',
            'Self-check: checklist per topic (“I can …”) and a reflection block',
        ],
        responseShapes: ['summary boxes', 'detachable fact strip', 'question sets with ruled answer space', 'checklist rows'],
        marks: 'Mark every practice set and total the pack; the host banner prints the total',
        companion: 'full memorandum with solutions and mark allocation; a rubric for extended answers',
        visuals: ['one [Illustration: …] per strand summary', 'diagrams for any process/geometry content'],
    },

    /* ── Teaching: worksheets & exercises ──────────────────────────────────── */
    'Worksheet': {
        purpose: 'a print-ready CAPS worksheet with real questions, marks and answer space',
        sections: [
            'Overview: one-line “how to do this” instruction for the learner',
            'SECTION A — recall/fill-in (easiest, 3–5 items)',
            'SECTION B — apply/calculate (core skill, 3–5 items)',
            'SECTION C — apply/solve in context (SA word problem or scenario, 2–3 items)',
            'Challenge corner — one extension item for early finishers',
            'What I learned — one success-criterion line the learner can tick',
        ],
        responseShapes: ['numbered questions with inline mark tags', 'dotted underlines for single blanks', 'ruled lines 396–510 pt for written answers', 'a framed dashed box for drawings/labelling/diagrams'],
        marks: 'Every question carries [1]–[4] marks; section tags sum to the total the host banner prints (typically 20, 30 or 40)',
        companion: 'memorandum with the full worked answers and a one-line marking note per item',
        visuals: ['one labelled diagram, table or illustration placeholder per section — never decoration without purpose'],
    },
    'Homework Task': {
        purpose: 'a short, parent-friendly consolidation task for home',
        sections: [
            'What we practised in class today (one sentence)',
            'Task 1 — fluency: 4–6 quick items',
            'Task 2 — application: 2–3 items using a South African everyday context (shop, kitchen, taxi, sport)',
            'Help at home — one line explaining what a parent may do (and what they must not do for the child)',
            'Parent signature line and estimated time on task',
        ],
        responseShapes: ['numbered items with answer space', 'parent note strip', 'signature/date line'],
        marks: 'Mark the task (10–15 marks) and print the total in the host banner',
        companion: 'answer sheet the parent can use to check, plus a common-error note',
        visuals: ['no artwork-heavy pages — one small picture or diagram maximum (home printing)'],
    },
    'Classroom Exercise': {
        purpose: 'a fast in-class practice set that fits a single lesson phase',
        sections: [
            'Instruction line with a time box (“Complete all 8 in 15 minutes”)',
            'Warm-up: 2 quick recall items',
            'Main set: 5–6 items practising one skill, graded difficulty',
            'Fast-finisher item',
        ],
        responseShapes: ['numbered items with tight answer space', 'a quick self-check tick row'],
        marks: 'Marks optional — when marks are used, tag every item and keep the total under 20',
        companion: 'answers on a single teacher line (or the memo field) so marking is immediate',
        visuals: ['none required; one small diagram only where the skill needs it'],
    },
    'Group Activity': {
        purpose: 'a cooperative task with roles, shared product and individual accountability',
        sections: [
            'Challenge statement (one paragraph, real SA context)',
            'Group roles (recorder, presenter, timekeeper, materials manager, checker)',
            'Step-by-step instructions with timings',
            'Group recording sheet (table with rows per group member)',
            'Present: what each group reports back',
            'Peer feedback (two stars and a wish) and the teacher\'s assessment criteria',
        ],
        responseShapes: ['role cards', 'group recording table', 'feedback blocks', 'presentation planning lines'],
        marks: 'Assess the group product and the individual contribution; print both totals in the host banner',
        companion: 'rubric with criteria (collaboration, accuracy, presentation) and the teacher observation checklist',
        visuals: ['one [Illustration: …] of the group task in action'],
    },
    'Reading Comprehension': {
        purpose: 'a comprehension task built on one complete, grade-appropriate South African text',
        sections: [
            'Pre-reading: 2 prediction/prior-knowledge questions',
            'The text (250–500 words by grade) with a title, paragraphs and enough contextual detail to answer from the passage alone',
            'Vocabulary in context: 4–6 words with the sentence they appear in',
            'Literal questions (find/state) — 3 items',
            'Inferential questions (why/how/what would happen) — 3 items',
            'Evaluation/opinion question with reason — 1–2 items',
            'Language-in-context: one grammar/punctuation/figurative-language item',
        ],
        responseShapes: ['the passage in a readable typeface (11–12 pt, 1.5 line height)', 'numbered questions with full-sentence answer lines', 'a vocabulary table'],
        marks: 'Tag every question; use 15–25 marks total and print it in the host banner',
        companion: 'memo with model answers, acceptable alternatives and mark allocation per point',
        visuals: ['one [Illustration: …] related to the passage — no spoilers for inferential questions'],
    },
    'Writing Task': {
        purpose: 'a scaffolded writing task that teaches the genre being assessed',
        sections: [
            'The task: text type, audience, purpose, length (e.g. “Write a 120-word letter to …”)',
            'Planning block: mind map / bullet planner with the 4–5 required content points',
            'Model text: a short annotated example showing the structure and one technique per paragraph',
            'Word bank and sentence starters (differentiated for support)',
            'Draft space: ruled lines with the required margin/paragraph marks',
            'Editing checklist (learner self-check) and the marking criteria in learner language',
        ],
        responseShapes: ['planning mind map', 'annotated model text', 'ruled draft lines', 'editing checklist with tick boxes'],
        marks: 'Use a marking grid: content / structure / language / presentation (20–30 marks) and print the total in the host banner',
        companion: 'rubric with level descriptors per criterion plus a comment bank for feedback',
        visuals: ['one small planning example, no decorative art that competes with the model text'],
    },
    'Research Task': {
        purpose: 'a structured research assignment with sources, process evidence and a rubric',
        sections: [
            'Research question(s) and what a good answer looks like',
            'What to find out: 4–6 guiding questions grouped by sub-topic',
            'Where to look: named, accessible SA sources (textbook pages, library, safe websites, community members)',
            'Process evidence: note-taking template, source table (source → what it says → how it is used)',
            'Presentation format (poster/report/oral) and length',
            'Plagiarism and referencing note in learner language, plus the assessment rubric',
        ],
        responseShapes: ['guiding-question pages', 'note-taking frames', 'source/reference table', 'planning timeline'],
        marks: 'Rubric marks (research, content, organisation, presentation/referencing) totalling 20–40',
        companion: 'rubric with level descriptors and a teacher marking note',
        visuals: ['one [Illustration: …] research-context picture'],
    },

    /* ── Teaching: assessments ─────────────────────────────────────────────── */
    'Controlled Test': {
        purpose: 'a moderated CAPS controlled test paper',
        sections: [
            'Instructions to candidates: time, marks, resources allowed, “show all working”, answer presentation',
            'SECTION A — knowledge & recall [~20–25 % of marks]',
            'SECTION B — understanding & routine application [~30 %]',
            'SECTION C — problem-solving & analysis [~30–35 %]',
            'SECTION D (senior/FET) — evaluation/creation extended response with generous space',
        ],
        responseShapes: ['MCQ four-column layout with a) b) c) d)', 'true/false T / F', 'matching Column A ↔ Column B', 'calculation lines with working space', 'framed drawing/graph area for the extended item'],
        marks: 'Every question tagged; section totals printed in the section heading; paper total (30/40/50/60) printed once',
        companion: 'full memorandum with mark allocation per point, acceptable alternatives and the analysis grid',
        visuals: ['a labelled diagram or data source (table/graph) that questions refer to — no decorative art'],
    },
    'Examination': {
        purpose: 'a full examination paper with a structured mark distribution and a formal memo',
        sections: [
            'Cover instructions: time, total marks, question count, resource list, rules (no phones, etc.)',
            'SECTION A — objective/knowledge items (short, many)',
            'SECTION B — structured questions per content strand',
            'SECTION C — extended/essay/practical problem with choice where the curriculum allows',
            'Mark distribution table per question and cognitive level (teacher copy)',
        ],
        responseShapes: ['answer lines and blocks sized to the mark weight', 'graph/diagram frames', 'essay/planning pages with margin', 'formula sheet where allowed'],
        marks: 'Marks per question, section subtotals, and the grand total; each question states its cognitive level in the memo',
        companion: 'memorandum, analysis grid (topic × cognitive level × marks), and the marking rubric for extended answers',
        visuals: ['stimulus material: source text, table, graph or diagram that questions rely on'],
    },
    'Formal Assessment Task (FAT)': {
        purpose: 'an SBA-registered formal assessment task with an official mark record',
        sections: [
            'Task cover: task type, SBA number and the content it assesses (write the CAPS reference in the body, not the banner)',
            'Learner instructions and the time allowed',
            'Questions organised by cognitive level, weighted to the phase',
            'Mark record: question → marks → learner mark table for the teacher',
            'SIAS accommodations panel and the modification/support note',
        ],
        responseShapes: ['question pages with full answer space', 'teacher mark capture grid', 'support accommodation tick list'],
        marks: 'Total marks stated once (host banner) with the NPA 7-point rating row for recording percentages',
        companion: 'memorandum with the mark allocation and a rubric for any extended response',
        visuals: ['stimulus material relevant to the assessed content'],
    },
    'Investigation': {
        purpose: 'a scaffolded investigation where learners plan, collect and interpret evidence',
        sections: [
            'The investigative question and the hypothesis/prediction space',
            'Apparatus/materials and safety notes',
            'Method: numbered steps the learner completes (with blanks for the variables they control)',
            'Observation/results recording table and graph frame',
            'Analysis: pattern questions, calculation of averages/percentages where appropriate',
            'Conclusion and evaluation of the method (two prompts)',
        ],
        responseShapes: ['hypothesis lines', 'variables box (independent/dependent/controlled)', 'results table', 'graph grid with labelled axes', 'conclusion lines'],
        marks: 'Criterion marks (planning, conducting, recording, analysis, conclusion) totalling 20–30',
        companion: 'rubric plus expected observations/results and a marking note per criterion',
        visuals: ['labelled apparatus diagram and an example of the completed graph frame'],
    },
    'Project Brief': {
        purpose: 'a complete project brief with milestones, deliverables and an assessment rubric',
        sections: [
            'Project description and the real-world South African problem or product',
            'Deliverables list (what is handed in, in what format, how long)',
            'Milestone plan with dates and what must be ready at each milestone',
            'Research/planning pages the learner completes',
            'Build/make or write-up space, plus the presentation requirements',
            'Assessment rubric (criteria × levels) and the self/peer assessment block',
        ],
        responseShapes: ['milestone planner', 'research/planning frames', 'checklist per deliverable', 'rubric table', 'reflection block'],
        marks: 'Rubric totalling 30–50 with criteria weights; print the total once in the host banner',
        companion: 'rubric with descriptors, moderator note and a checklist version for the teacher',
        visuals: ['example project images/thumbnails and a planning sketch frame'],
    },
    'Case Study': {
        purpose: 'a real-context case study with layered questions from comprehension to evaluation',
        sections: [
            'The case (300–600 words, South African context, complete enough to answer from)',
            'Facts first: 3 literal questions',
            'Interpretation: 2–3 analytical questions (“Why did …?”, “What would happen if …?”)',
            'Application: one question where the learner applies the concept to a new situation',
            'Evaluation: one extended opinion question with justification (5–8 marks)',
            'Suggested answer frame (PEEL: point, evidence, explanation, link)',
        ],
        responseShapes: ['case text in a bordered box', 'question list with lines scaled to marks', 'extended-response page'],
        marks: 'Tag every question; total 20–30; state the cognitive level per question in the memo',
        companion: 'model answers with mark breakdowns and acceptable alternative reasoning',
        visuals: ['one contextual image or data table used by the questions'],
    },
    'Oral/Speech Task': {
        purpose: 'a complete oral task: brief, planning space, rubric and audience feedback sheet',
        sections: [
            'The task: topic choices, audience, purpose, time limit (e.g. 2–3 minutes)',
            'Planning frame: opening hook, 3 main points with evidence, closing call to action',
            'Language support: useful phrases, connectives, pronunciation/vocabulary glossary',
            'Presentation checklist (eye contact, pace, volume, visual aid)',
            'Peer feedback sheet (two stars and a wish)',
            'Teacher assessment rubric with level descriptors',
        ],
        responseShapes: ['cue-card template', 'planning columns', 'checklist rows', 'rubric table', 'peer feedback block'],
        marks: 'Rubric marks 20–30 (content, structure, language, delivery, visual aid)',
        companion: 'rubric with descriptors and sentence-starter feedback bank',
        visuals: ['one [Illustration: …] of a learner presenting, plus a cue-card layout example'],
    },
    'Practical Task / Experiment': {
        purpose: 'a hands-on practical with method, results, safety and observation mark sheet',
        sections: [
            'Aim and the scientific/inquiry question',
            'Materials and safety rules (plain, specific, SA-available equipment)',
            'Method: numbered, reproducible steps with the variables identified',
            'Recording sheets: observation table, measurement table with units, graph frame',
            'Results and analysis questions (pattern, cause, error)',
            'Conclusion and the teacher observation mark sheet',
        ],
        responseShapes: ['labelled apparatus diagram', 'recording tables with unit columns', 'graph grid', 'conclusion lines', 'teacher tick sheet for practical skills'],
        marks: 'Practical skills marks (apparatus, technique, safety, recording) plus the written analysis marks — one total',
        companion: 'expected results table, marking notes and the skills rubric',
        visuals: ['apparatus diagram with labels and an arrow key for the method'],
    },
    'Portfolio Task': {
        purpose: 'a portfolio piece with process evidence, self-assessment and teacher judgement',
        sections: [
            'Task description and where it fits in the portfolio (piece number)',
            'Planning and process evidence pages (draft, notes, feedback received)',
            'Final product space (with the presentation requirements)',
            'Self-assessment against the criteria',
            'Peer/teacher feedback block',
            'Reflection: what I did well, what I would change, what I learned',
        ],
        responseShapes: ['process log', 'draft space', 'final presentation space', 'self-assessment rating rows', 'reflection lines'],
        marks: 'Rubric marks totalling 20–40 with criteria matching the task',
        companion: 'rubric, moderation note and portfolio filing instruction',
        visuals: ['one planning mind map and one example presentation layout'],
    },
    'Diagnostic Assessment': {
        purpose: 'a short diagnostic that reveals exactly which sub-skills are secure before teaching',
        sections: [
            'Sub-skill breakdown: one row per discrete skill being diagnosed',
            'Section per sub-skill with 2–4 quick items of graded difficulty',
            'Error-analysis view for the teacher (what each wrong answer reveals)',
            'Nothing is taught here — only evidence gathered',
        ],
        responseShapes: ['quick items with minimal answer space', 'teacher tick-sheet per sub-skill', 'individual learner profile row'],
        marks: 'Marks are for diagnosis, not grading — record as ticks/levels; the host banner prints any total you set',
        companion: 'diagnostic guide: what each item tests, what an incorrect answer means, and the follow-up activity',
        visuals: ['only functional diagrams the items depend on'],
    },

    /* ── Teaching: memos & rubrics ─────────────────────────────────────────── */
    'Marking Memo': {
        purpose: 'a marker-ready memorandum for the matching assessment',
        sections: [
            'Memorandum header line: task name, total marks (host banner prints the total)',
            'Section-by-section answers, numbered exactly as the paper',
            'Mark allocation per answer point (e.g. “✓ calculation 1, ✓ answer 1, ✓ unit 1”)',
            'Acceptable alternatives, part marks and the common errors to watch',
            'Question → cognitive level → marks analysis table',
            'Feedback bank: ready-made comments per performance band',
        ],
        responseShapes: ['answer table with a marks column', 'analysis grid', 'comment bank rows'],
        marks: 'Per-point marks totalling the paper total; print the total once in the host banner',
        companion: 'the rubric for extended answers if the paper has any',
        visuals: ['worked diagrams/solutions exactly as the learner should draw them'],
    },
    'Assessment Rubric': {
        purpose: 'a criterion-referenced rubric with observable level descriptors',
        sections: [
            'Task name and criteria list (4–6 criteria)',
            'Level descriptors per criterion (4–5 levels, observable language)',
            'Marks/points per cell and the weighting row',
            'Total row and the NPA 7-point conversion note',
            'Feedback block (strengths / next steps) and the moderator line',
        ],
        responseShapes: ['rubric table', 'feedback lines', 'moderator signature row'],
        marks: 'Total marks/points printed once in the host banner',
        companion: 'a learner-friendly “I can …” version of the same criteria',
        visuals: ['none required — tables only'],
    },
    'Analytical Rubric': {
        purpose: 'an analytic rubric that breaks the task into separately scored criteria',
        sections: [
            'Criteria table: criterion → weight → level descriptors → score',
            'Descriptor language: what the learner produces at each level',
            'Score summary row and a comments column',
            'Moderation note and the date lines',
        ],
        responseShapes: ['multi-row analytic table', 'score cells', 'comments column'],
        marks: 'Weighted totals; each criterion states its maximum; total printed once in the host banner',
        companion: 'worked example of a mid-level piece annotated against the descriptors',
        visuals: ['none — the rubric is the document'],
    },
    'Holistic Rubric': {
        purpose: 'a single-scale holistic rubric with banded descriptors',
        sections: [
            'Overall judgement bands (e.g. 7-point NPA or 4-band) with a paragraph descriptor each',
            'Indicators that move a piece between bands',
            'Score box and the comments block',
        ],
        responseShapes: ['band table', 'score box', 'comment lines'],
        marks: 'One total per learner; print the band scale and total once in the host banner',
        companion: 'quick-marking guide with anchor examples per band',
        visuals: ['none'],
    },
    'Checklist / Self-Assessment': {
        purpose: 'a tick-box checklist a learner can complete and a teacher can verify',
        sections: [
            '“I can …” statement rows (8–12) written in learner language',
            'Three-column tick scale (Not yet / Almost / Yes I can)',
            'Evidence column (“where you showed it”)',
            'Goal row: one thing to practise next',
            'Teacher verification and comment rows',
        ],
        responseShapes: ['statement rows with tick cells', 'evidence lines', 'goal box', 'teacher comment lines'],
        companion: 'teacher version with the observable evidence for each statement',
        visuals: ['small icons per statement row (max 1 per row)'],
    },

    /* ── Visual: classroom displays ────────────────────────────────────────── */
    'Educational Poster': {
        purpose: 'a classroom display poster that teaches one concept at a glance',
        sections: ['Headline in display type', 'Central diagram/artwork', '3–6 labelled key points', 'Footer action/instruction band'],
        responseShapes: ['no record row, no blanks, no marks'],
        visuals: ['one dominant [Illustration: …] or diagram filling 55–70 % of the page', 'labels with leader lines', 'one colour-coded key'],
    },
    'Word Wall': {
        purpose: 'a wall set of the topic\'s vocabulary for daily reference',
        sections: ['Title strip', 'Word cards grouped alphabetically or by meaning', 'Picture cue per word', 'Cut guides and storage label'],
        responseShapes: ['uniform cut-out word cards (6–9 per page)'],
        visuals: ['word card template: word 28 pt+, picture cue, one-line definition'],
    },
    'Vocabulary Display': {
        purpose: 'a display of the term\'s key words with meaning, example and picture',
        sections: ['Topic header strip', 'Word cards: word → meaning → example sentence → picture', 'Colour coding per word family', 'Storage/rotation label'],
        responseShapes: ['uniform cards with the four-part structure'],
        visuals: ['picture cue per card; keep illustrations consistent in style'],
    },
    'Alphabet Chart': {
        purpose: 'a phonics/alphabet wall chart in the template\'s card-grid style',
        sections: ['Title strip', 'Sound/letter cards in a uniform grid (letter 52 pt, paired case 32 pt, picture, word)', 'Action/instruction band'],
        responseShapes: ['3 × 2 or 4 × 2 card grid, no record row'],
        visuals: ['one picture per letter/sound; colour per card family (template: orange, teal, rose, gold, green, pink)'],
        sources: ['grR-phonics-sound-chart-group1.pdf'],
    },
    'Number Chart / Number Line': {
        purpose: 'a number reference display for counting, place value or operations',
        sections: ['Title strip', 'Number grid/line artwork', 'Legend or counting strip'],
        responseShapes: ['no record row; artwork-led page'],
        visuals: ['large legible numerals (display size), clear spacing, no clutter; embed the artwork as the page focus'],
        sources: ['Number Poster Gr3.pdf', 'about_blank_1.pdf'],
    },
    'Times Tables Chart': {
        purpose: 'a multiplication tables reference chart',
        sections: ['Title strip', '12 × 12 grid or the specified table set', 'Highlighted diagonal/squares', 'Tip band with a study strategy'],
        responseShapes: ['no record row'],
        visuals: ['grid with consistent cell sizes and alternating row shading; numbers at display size'],
    },
    'Classroom Rules Poster': {
        purpose: 'a positively worded classroom agreement display',
        sections: ['Title strip', '5–8 “We …” rules with icons', 'Consequence/positive reinforcement note', 'Signature strip for the class agreement'],
        responseShapes: ['icon + rule rows', 'class signature strip'],
        visuals: ['one friendly icon per rule; positive, non-threatening imagery'],
    },
    'Topic Anchor Chart': {
        purpose: 'a summary chart of the topic\'s key learning, built to stay on the wall all term',
        sections: ['Topic strip', 'Key vocabulary', 'One worked example', 'Diagram/process', '“Remember!” box'],
        responseShapes: ['no record row; the answer/example is printed in full (it is a teaching chart, not a task)'],
        visuals: ['one labelled diagram + one worked example block'],
    },

    /* ── Visual: cards ─────────────────────────────────────────────────────── */
    'Flashcards (Term + Definition)': {
        purpose: 'a cut-out flashcard set of terms and definitions',
        sections: ['Set title strip and cut guide', 'Cards: term card (front) + definition card (back/facing)', 'Storage/rotation label'],
        responseShapes: ['uniform cards, one concept each, matching pairs'],
        visuals: ['large term type; picture cue per pair; two visually distinct card families for matching'],
        sources: ['grR-phonics-sound-chart-group1.pdf'],
    },
    'Vocabulary Cards': {
        purpose: 'a vocabulary card set with meaning, example and picture',
        sections: ['Set strip', 'Word cards: word → meaning → example → picture cue', 'Self-check card (“Can I use this word?”)'],
        responseShapes: ['uniform cards with a four-part layout'],
        visuals: ['one picture cue per card'],
    },
    'Formula Reference Cards': {
        purpose: 'a pocket card set of the grade\'s formulas',
        sections: ['Set strip', 'One formula per card: name → formula → what each symbol means → worked example', 'Units and conversion card'],
        responseShapes: ['uniform cards; formula printed in large centred type'],
        visuals: ['small labelled shapes for geometry formulas'],
    },
    'Timeline Cards': {
        purpose: 'a sequencing card set that builds a timeline',
        sections: ['Set strip', 'Event cards: date/period → event → why it mattered', 'Blank cards for the learner to add events', 'Assembly instruction'],
        responseShapes: ['uniform cards designed to be laid out in order', 'blank insertion cards'],
        visuals: ['one small icon or map per event; consistent date placement on every card'],
    },
    'Matching Cards': {
        purpose: 'a matching game set (term ↔ definition, question ↔ answer, number ↔ representation)',
        sections: ['Set strip', 'Family A cards', 'Family B cards', 'Answer key card for self-checking', 'Cut guides'],
        responseShapes: ['two distinguishable card families; one match each, no ambiguity'],
        visuals: ['colour/shape coding to separate the two families without giving away the match'],
    },
    'Cut-out Activity Cards': {
        purpose: 'hands-on manipulative pieces for one activity',
        sections: ['Activity instruction card', 'Piece sheets with cut guides', 'Sorting/recording mat', 'Storage label', '“When you are done” reflection line'],
        responseShapes: ['cut-out pieces sized for small hands (min 25 mm), sorting mat with labelled columns'],
        visuals: ['pieces must be visually distinct and match the sorting criteria'],
    },
    'Classroom Labels / Signs': {
        purpose: 'print-and-stick classroom labels and signs',
        sections: ['Sign sets by area (reading corner, maths wall, art shelf, cubbies)', 'Label cells with the word + picture cue', 'Blank label sheet', 'Cut guides'],
        responseShapes: ['uniform label cells; no marks or record rows'],
        visuals: ['one clear icon per label; text large enough to read from 1 m'],
    },
    'Book Labels': {
        purpose: 'book/name label sheets',
        sections: ['Label sheet with the placeholder name line and the subject/book line', 'Blank variants for the whole class', 'Cut guides'],
        responseShapes: ['uniform label cells with write-on blanks (no pre-filled names)'],
        visuals: ['small decorative motif per label, printer-friendly (light ink coverage)'],
    },
    'Book Cover Design': {
        purpose: 'a printable book cover / workbook cover for the subject or topic',
        sections: ['Title and subtitle block', 'Illustration panel', 'Learner name / subject / year blanks', 'Spine strip'],
        responseShapes: ['write-on name/subject/year lines (blanks only)'],
        visuals: ['one large [Illustration: …] cover artwork plus a decorative border; avoid dense text'],
    },
    'Certificate Template': {
        purpose: 'a blank certificate the school can complete for any achievement',
        sections: ['Certificate heading', 'Presented to (blank line)', 'For (achievement line, blank or editable)', 'Date line', 'Two signature lines with role labels', 'Emblem/seal space'],
        responseShapes: ['all personal fields blank; generous writing space'],
        visuals: ['decorative border and seal/emblem artwork in the certificate palette'],
    },
    'Award / Sticker Template': {
        purpose: 'printable award stickers / praise slips',
        sections: ['Sheet title and cut guides', 'Uniform award cells: award name, praise line, small motif', 'A set of praise phrases across the sheet'],
        responseShapes: ['uniform cut-out cells; no marks, no record row'],
        visuals: ['one motif per cell; light ink coverage so sheets print cheaply'],
    },

    /* ── Visual: diagrams & maps ───────────────────────────────────────────── */
    'Mind Map / Concept Map': {
        purpose: 'a concept map of the topic that shows how the ideas connect',
        sections: ['Central concept', 'First-level branches (4–6)', 'Second-level detail nodes', 'Cross-links labelled with the relationship', 'Legend/colour key'],
        responseShapes: ['a partly-completed map plus blank branches the learner fills in (if it is a task)', 'no record row'],
        visuals: ['node shapes and connector styles must be consistent; labels legible at print size'],
    },
    'Educational Diagram': {
        purpose: 'a labelled teaching diagram of the concept',
        sections: ['Diagram title', 'The labelled drawing', 'Parts list (label → function)', 'Process arrows with verbs', '“Look for” observation prompts'],
        responseShapes: ['labels and leader lines; optional blank label slots for learners'],
        visuals: ['accurate proportions, invented-but-plausible detail labelled clearly, no decorative clutter'],
    },
    'Infographic': {
        purpose: 'a one-page visual summary of the topic\'s key facts',
        sections: ['Headline statistic or big idea', '3–5 fact blocks with icons', 'Data visual (bar/pie/proportion)', 'Timeline or process strip (if relevant)', 'Source/how-to-use note'],
        responseShapes: ['no record row; data blocks with short text (max 25 words each)'],
        visuals: ['consistent icon set and one colour per fact block; numbers at display size'],
    },
    'Process Flow Diagram': {
        purpose: 'a step-by-step flow of a process with decision points',
        sections: ['Title strip', 'Numbered step boxes (start → … → end)', 'Decision diamonds with yes/no branches', 'Notes/key at the foot'],
        responseShapes: ['optional blank boxes for the learner to complete one step'],
        visuals: ['arrows labelled with the action; consistent box shapes and spacing'],
    },
    'Comparison Chart': {
        purpose: 'a side-by-side comparison that reveals the differences',
        sections: ['Title strip', 'Criteria rows', 'Comparison columns (2–3 items)', 'Summary row with the key difference', '“Which is better for …?” prompt'],
        responseShapes: ['table with equal column widths; optional blank row for the learner'],
        visuals: ['one small picture per compared item in the header row'],
    },

    /* ── Admin: parent communication ───────────────────────────────────────── */
    'Letter to Parents': {
        purpose: 'a formal but warm letter to parents/caregivers',
        sections: ['Reference line and date', 'Recipient block (parents/caregivers of Grade …)', 'Subject line in bold', 'Salutation', 'Body: 2–5 short numbered paragraphs (one message each)', 'Action requested with a deadline', 'Contact block', 'Signature block (teacher / principal)', 'Reply slip where a response is needed'],
        responseShapes: ['reply slip with learner name, parent name/signature and date lines'],
    },
    'General Notice to Parents': {
        purpose: 'a school notice that a parent can act on after one read',
        sections: ['Notice heading', 'WHO / WHAT / WHEN / WHERE / WHAT TO BRING in the first block', 'Details in short bullets', 'What parents must do and by when', 'Contact person and number', 'Signature block'],
        responseShapes: ['optional tear-off acknowledgement strip'],
    },
    'Permission Slip': {
        purpose: 'a consent form for an excursion or activity',
        sections: ['Event details (date, destination, times, transport, cost, supervision)', 'What to bring / wear', 'Risk and emergency arrangements', 'Consent statement in plain language', 'Parent/guardian signature block and emergency-contact fields'],
        responseShapes: ['tear-off slip: learner name, parent name, contact number, medical/allergy note, signature, date'],
    },
    'Meeting Invitation': {
        purpose: 'an invitation to a parent-teacher or SGB meeting',
        sections: ['Invitation heading', 'Purpose and agenda (numbered items with times)', 'Date, time and venue', 'Who should attend', 'What to bring', 'RSVP details and deadline', 'Signature block'],
        responseShapes: ['RSVP slip: name, number attending, contact number, alternative time'],
    },
    'Progress Update Letter': {
        purpose: 'a term progress update to a parent about their child\'s learning',
        sections: ['Reference line, date and recipient', 'Opening positive statement about the learner', 'Achievement summary: subject → level/percentage → comment (table)', 'Areas for development with two specific actions', 'How the school will support and how the parent can help at home', 'Invitation to discuss, contact details', 'Signature block'],
        responseShapes: ['subject progress table with blank cells for the teacher to complete', 'parent acknowledgement line'],
    },
    'Report Comment Template': {
        purpose: 'a reusable report-comment frame with differentiated sentence banks',
        sections: ['Comment structure guide (five moves)', 'Sentence banks per achievement band (strength/attitude/participation/homework)', 'Differentiated full example comments (strong / developing / support)', 'Class-list columns for drafting', 'Teacher checklist before submission'],
        responseShapes: ['drafting table (learner → comment)', 'tick checklist'],
    },

    /* ── Admin: school administration ──────────────────────────────────────── */
    'General School Notice': {
        purpose: 'an official school notice for staff, learners or parents',
        sections: ['Notice heading and reference', 'Date and audience', 'Purpose in one sentence', 'Details in numbered short paragraphs', 'Action and deadline', 'Contact and signature block'],
        responseShapes: ['acknowledgement strip when a response is required'],
    },
    'Timetable Template': {
        purpose: 'a printable timetable with blank cells for the school to complete',
        sections: ['Header block (class/grade/teacher blanks)', 'Period × day grid with break rows shaded', 'Subject/venue columns', 'Legend and notes block'],
        responseShapes: ['empty timetable cells sized for handwriting; blanks for names/dates'],
    },
    'Attendance Register': {
        purpose: 'a monthly/term attendance register',
        sections: ['Header block (class, grade, month, teacher blanks)', 'Learner rows × day columns with tick/absent/late codes', 'Weekly totals columns', 'Legend (✓ present, A absent, L late, E excused)', 'Summary and signature block'],
        responseShapes: ['large register grid; rows per learner with a blank name column; totals and signature lines'],
    },
    'Subject Improvement Plan': {
        purpose: 'a formal subject improvement plan with diagnosis, targets and actions',
        sections: ['Subject/phase context table', 'Diagnosis: results analysis, strengths, concerns (based on the data placeholders)', 'Targets: measurable improvement goals with a timeframe', 'Actions: strategy → responsibility → resources → timeline → evidence of success', 'Monitoring schedule and review date', 'Sign-off block (HoD / principal)'],
        responseShapes: ['analysis tables with blank mark columns', 'action plan table', 'monitoring calendar'],
    },
    'School Calendar Event Notice': {
        purpose: 'a calendar notice for school events',
        sections: ['Month/term heading', 'Event rows: date → event → audience → venue → time', 'Notes for parents (money, clothes, transport)', 'Contact block'],
        responseShapes: ['calendar grid with event notes; optional reminder strip'],
    },
    'Academic Achievement Certificate': {
        purpose: 'an academic excellence certificate that schools can complete',
        sections: ['Certificate heading', 'Presented to (blank)', 'For outstanding academic achievement in (blank subject)', 'Date and year lines', 'Signature lines (teacher / principal)', 'Seal/emblem space'],
        responseShapes: ['all personal fields blank with generous writing space'],
    },
    'Participation Certificate': {
        purpose: 'a participation certificate for an event, club or programme',
        sections: ['Certificate heading', 'Presented to (blank)', 'For participating in (blank event) on (blank date)', 'Signature lines', 'Seal space'],
        responseShapes: ['blank recipient/event/date fields'],
    },
    'Achievement Certificate': {
        purpose: 'a general achievement certificate with the school\'s own wording space',
        sections: ['Certificate heading', 'Presented to (blank)', 'Achievement statement (blank/editable line)', 'Date and signature lines', 'Seal space'],
        responseShapes: ['blank recipient/achievement/date fields'],
    },
    'Custom Seal / Emblem': {
        purpose: 'a printable seal/emblem the school can adopt',
        sections: ['Emblem artwork cells (2–4 size variants)', 'Motto band', 'Usage notes (where it may be used)'],
        responseShapes: ['circular/shield shapes with cut guides'],
    },
    'Official School Letterhead': {
        purpose: 'a letterhead the school can print its own correspondence on',
        sections: ['Header: logo placeholder, school name, address, EMIS/district/province, contact details (all blanks)', 'Body space', 'Footer strip (identification + page marker)'],
        responseShapes: ['blanks for every school-specific field; large empty writing area'],
    },
    'Disciplinary Notice': {
        purpose: 'a formal, procedurally fair disciplinary notice to a parent',
        sections: ['Reference and date', 'Recipient', 'Subject line', 'Incident summary (factual, dated, witnessed-by blanks)', 'Policy/reference line and the learner\'s right to be heard', 'Meeting/hearing details and required adult attendance', 'Signature block', 'Acknowledgement slip'],
        responseShapes: ['acknowledgement slip with parent signature and date'],
    },
    'Classroom Rules': {
        purpose: 'a written classroom-rules document (also printed as the agreement)',
        sections: ['Purpose statement in positive language', '5–8 “We …” rules with examples of what it looks like', 'Rewards and consequences stated fairly', 'Class agreement signature strip'],
        responseShapes: ['signature strip; blank row for a class-specific rule'],
    },
    'Homework Policy Letter': {
        purpose: 'a policy letter explaining the homework approach to parents',
        sections: ['Policy overview and purpose', 'How much homework per grade/phase and why', 'What parents should and should not do', 'How homework is marked and recorded', 'Absence/extension arrangements', 'Contact block and signature'],
        responseShapes: ['parent acknowledgement strip'],
    },
    'Detention Notice': {
        purpose: 'a short formal notice of a detention',
        sections: ['Reference and date', 'Learner and parent details (blanks)', 'Reason stated factually', 'Date, time, venue and supervising teacher', 'What the learner must bring', 'Signature block and acknowledgement slip'],
        responseShapes: ['acknowledgement slip (parent signature + date)'],
    },

    /* ── Foundation Phase & intervention (app aliases) ─────────────────────── */
    'Interactive Foundation Learning Pack': {
        purpose: 'a playful Grade R–3 pack that teaches through trace → blend → write → reward',
        sections: [
            'Instruction line in a spoken invitation (“Let\'s …!”) with an icon marker',
            'Warm-up: sound/letter or number recognition block',
            'Core activity: trace or build the target item (dotted glyphs, letter tiles)',
            'Write-it rows on plain ruled lines',
            'Mini game (matching, bingo, sorting) with simple rules',
            'Reward band and the teacher observation checklist',
        ],
        responseShapes: ['trace cells 62 × 82 pt with 48 pt dotted glyphs', 'write-it ruled lines', 'picture + word cards at 28 pt', 'star-colouring reward row'],
        companion: 'teacher observation checklist and a short assessment note (no marks)',
        visuals: ['one picture per sound/word; friendly characters; consistent colour per activity'],
    },
    'SIAS Individualized Learning Plan': {
        purpose: 'an SIAS-aligned individualised support plan for one learner (placeholders only)',
        sections: ['Learner profile (all placeholders)', 'Barriers identified with evidence', 'Strengths and interests', 'Support strategies for the subject and grade', 'Curriculum adaptations', 'Assessment accommodations', 'Resources required', 'Roles and responsibilities (teacher/SBST/DBST/parent)', 'Review date and success indicators', 'Referral pathway'],
        responseShapes: ['profile table with blank fields', 'strategy table (strategy → who → when → evidence)', 'accommodation checklist', 'review/sign-off block'],
    },
    'Individual Development Plan': {
        purpose: 'a development plan for one learner with measurable goals',
        sections: ['Current level of performance (baseline)', 'Goal 1–3, each with a measurable target and a date', 'Strategies and resources per goal', 'Weekly support schedule', 'Progress evidence log', 'Review and sign-off'],
        responseShapes: ['goal table', 'evidence log rows', 'review block'],
    },
    'Intervention Pack': {
        purpose: 'a remediation pack for a small group or one learner below the expected level',
        sections: ['Diagnostic start: 5-minute check of the prerequisite skills', 'Micro-lesson: re-teach the concept in small steps with worked examples', 'Guided practice: 6–8 scaffolded items', 'Independent practice: 4–6 items at the new level', 'Progress check with a success criterion', 'Teacher notes: what to do if the learner is still not secure'],
        responseShapes: ['scaffolded items with hints', 'worked example boxes', 'progress-check strip'],
    },
    'Remedial Support': {
        purpose: 'targeted remedial practice for a specific gap',
        sections: ['The gap in one sentence (what the learner cannot yet do)', 'Prerequisite check', 'Re-teach explanation in the simplest possible language', 'Scaffolded practice with faded hints', 'Independent practice', 'Exit check and the next step'],
        responseShapes: ['hint boxes that fade out', 'small-step practice items'],
    },
    'Memorandum Key': {
        purpose: 'the key/memo of the matching task, ready for marking and filing',
        sections: ['Answer list numbered exactly as the task', 'Mark allocation per point', 'Acceptable alternatives and common errors', 'Cognitive level per question', 'Feedback/summary lines for the mark record'],
        responseShapes: ['answer table with a marks column and a teacher tick column'],
    },
    'Progress Tracker': {
        purpose: 'a tracking sheet of learner progress against the assessed skills',
        sections: ['Class list column and skill columns', 'Assessment opportunities rows (task 1, task 2 …)', 'Level/percentage capture cells', 'Support flag column and notes', 'Summary row and signature'],
        responseShapes: ['large tracking grid with blank learner rows and level codes'],
    },
    'Curriculum Map': {
        purpose: 'a term/year curriculum map showing coverage and pacing',
        sections: ['Term/week rows', 'Topic and CAPS content columns', 'Assessment column (formal/informal, marks)', 'Resources and integration notes', 'Coverage checklist'],
        responseShapes: ['mapping table with blank completion columns'],
    },
    'Test': {
        purpose: 'a shorter class test with a memo',
        sections: ['Instruction block (time, marks)', 'SECTION A — short objective items', 'SECTION B — structured questions', 'SECTION C — one problem-solving item'],
        responseShapes: ['numbered items with marked answer space'],
    },
    'Exam': {
        purpose: 'an examination paper with a full memo and analysis grid',
        sections: ['Cover instructions', 'Weighted sections by strand', 'Extended response item', 'Mark distribution table'],
        responseShapes: ['answer lines scaled to marks', 'drawing/diagram frames'],
    },
    'Homework': {
        purpose: 'a short home consolidation task',
        sections: ['What we did in class', 'Task 1 fluency', 'Task 2 application in an SA context', 'Parent help line and signature'],
        responseShapes: ['answer space', 'parent signature strip'],
    },
    'Report Comment': {
        purpose: 'a report comment for one learner',
        sections: ['Positive opening', 'Achievement statement', 'Strengths with evidence', 'Growth areas with actions', 'Encouraging close'],
        responseShapes: ['comment lines only — the report card owns the table'],
    },
};

/* ────────────────────────────────────────────────────────────────────────────
 * 4 · COMPOSITION
 * ──────────────────────────────────────────────────────────────────────────── */

/** Normalise a content type to a lookup key: "Number Chart / Number Line" → "number-chart-number-line". */
export const contentTypeKey = (contentType: string): string =>
    String(contentType || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/\+/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/** Alias table: app slugs, legacy names and palette types → canonical type. */
export const CONTENT_TYPE_ALIASES: Record<string, string> = {
    'worksheet': 'Worksheet',
    'worksheets': 'Worksheet',
    'homework-task': 'Homework Task',
    'classroom-exercise': 'Classroom Exercise',
    'group-activity': 'Group Activity',
    'reading-comprehension': 'Reading Comprehension',
    'writing-task': 'Writing Task',
    'research-task': 'Research Task',
    'lesson-plan': 'Lesson Plan',
    'daily-lesson-notes': 'Daily Lesson Notes',
    'weekly-lesson-plan': 'Weekly Lesson Plan',
    'unit-plan': 'Unit Plan',
    'learning-activity': 'Learning Activity',
    'study-guide': 'Study Guide / Learning Notes',
    'study-guide-learning-notes': 'Study Guide / Learning Notes',
    'study-notes': 'Study Guide / Learning Notes',
    'revision-pack': 'Revision Pack',
    'revision-guide': 'Revision Pack',
    'test': 'Controlled Test',
    'controlled-test': 'Controlled Test',
    'exam': 'Examination',
    'examination': 'Examination',
    'assessment': 'Formal Assessment Task (FAT)',
    'formal-assessment-task-fat': 'Formal Assessment Task (FAT)',
    'fat': 'Formal Assessment Task (FAT)',
    'investigation': 'Investigation',
    'project-brief': 'Project Brief',
    'case-study': 'Case Study',
    'oral-speech-task': 'Oral/Speech Task',
    'practical-task-experiment': 'Practical Task / Experiment',
    'portfolio-task': 'Portfolio Task',
    'diagnostic-assessment': 'Diagnostic Assessment',
    'memo': 'Marking Memo',
    'marking-memo': 'Marking Memo',
    'memorandum': 'Marking Memo',
    'memorandum-key': 'Memorandum Key',
    'rubric': 'Assessment Rubric',
    'assessment-rubric': 'Assessment Rubric',
    'analytical-rubric': 'Analytical Rubric',
    'holistic-rubric': 'Holistic Rubric',
    'checklist-self-assessment': 'Checklist / Self-Assessment',
    'poster': 'Educational Poster',
    'educational-poster': 'Educational Poster',
    'word-wall': 'Word Wall',
    'vocabulary-display': 'Vocabulary Display',
    'alphabet-chart': 'Alphabet Chart',
    'number-chart-number-line': 'Number Chart / Number Line',
    'times-tables-chart': 'Times Tables Chart',
    'classroom-rules-poster': 'Classroom Rules Poster',
    'topic-anchor-chart': 'Topic Anchor Chart',
    'flashcards': 'Flashcards (Term + Definition)',
    'flashcards-term-definition': 'Flashcards (Term + Definition)',
    'vocabulary-cards': 'Vocabulary Cards',
    'formula-reference-cards': 'Formula Reference Cards',
    'timeline-cards': 'Timeline Cards',
    'matching-cards': 'Matching Cards',
    'cut-out-activity-cards': 'Cut-out Activity Cards',
    'mind-map': 'Mind Map / Concept Map',
    'mind-map-concept-map': 'Mind Map / Concept Map',
    'concept-map': 'Mind Map / Concept Map',
    'diagram': 'Educational Diagram',
    'educational-diagram': 'Educational Diagram',
    'infographic': 'Infographic',
    'process-flow-diagram': 'Process Flow Diagram',
    'process-diagram': 'Process Flow Diagram',
    'comparison-chart': 'Comparison Chart',
    'classroom-labels-signs': 'Classroom Labels / Signs',
    'book-labels': 'Book Labels',
    'book-cover-design': 'Book Cover Design',
    'certificate-template': 'Certificate Template',
    'award-sticker-template': 'Award / Sticker Template',
    'letter-to-parents': 'Letter to Parents',
    'letter': 'Letter to Parents',
    'general-notice-to-parents': 'General Notice to Parents',
    'general-notice': 'General Notice to Parents',
    'permission-slip': 'Permission Slip',
    'meeting-invitation': 'Meeting Invitation',
    'progress-update-letter': 'Progress Update Letter',
    'report-comment-template': 'Report Comment Template',
    'report-comment': 'Report Comment',
    'general-school-notice': 'General School Notice',
    'notice': 'General School Notice',
    'timetable-template': 'Timetable Template',
    'attendance-register': 'Attendance Register',
    'register': 'Attendance Register',
    'subject-improvement-plan': 'Subject Improvement Plan',
    'school-calendar-event-notice': 'School Calendar Event Notice',
    'academic-achievement-certificate': 'Academic Achievement Certificate',
    'participation-certificate': 'Participation Certificate',
    'achievement-certificate': 'Achievement Certificate',
    'certificate': 'Achievement Certificate',
    'custom-seal-emblem': 'Custom Seal / Emblem',
    'official-school-letterhead': 'Official School Letterhead',
    'letterhead': 'Official School Letterhead',
    'disciplinary-notice': 'Disciplinary Notice',
    'classroom-rules': 'Classroom Rules',
    'homework-policy-letter': 'Homework Policy Letter',
    'detention-notice': 'Detention Notice',
    'interactive-foundation-learning-pack': 'Interactive Foundation Learning Pack',
    'foundation-phase-activity': 'Interactive Foundation Learning Pack',
    'sias-individualized-learning-plan': 'SIAS Individualized Learning Plan',
    'sias-individualised-learning-plan': 'SIAS Individualized Learning Plan',
    'individual-support-plan': 'SIAS Individualized Learning Plan',
    'individual-development-plan': 'Individual Development Plan',
    'annual-teaching-plan': 'Curriculum Map',
    'admin-document': 'General School Notice',
    'intervention-pack': 'Intervention Pack',
    'remedial-support': 'Remedial Support',
    'progress-tracker': 'Progress Tracker',
    'curriculum-map': 'Curriculum Map',
    'educational-resource': 'Worksheet',
};

/**
 * Family for a content type — derived from the SAME rules the host banner uses
 * to pick its palette (`bannerPalettes.ts`), so a prompt can never describe one
 * document shape while the banner paints another. Only the finer splits the
 * palette cannot express (report comments, progress trackers, study notes vs
 * lesson plans) are decided locally.
 */
const familyFor = (contentType: string, palette: BannerPaletteId): PromptFamily => {
    const key = contentTypeKey(contentType);
    if (/report-comment/.test(key)) return 'report';
    if (/progress-tracker|curriculum-map|annual-teaching-plan/.test(key)) return 'admin';

    switch (palette) {
        case 'certificate':
            return 'certificate';
        case 'memo':
            return 'memo';
        case 'intervention':
            return 'intervention';
        case 'foundation':
            return 'foundation';
        case 'cards':
            return 'cards';
        case 'poster':
            return 'poster';
        case 'admin':
            return 'admin';
        case 'assessment':
            return 'assessment';
        case 'lesson':
            return /study-guide|study-notes|revision/.test(key) ? 'study-notes' : 'lesson-plan';
        case 'worksheet':
            return 'worksheet';
        default:
            return 'worksheet';
    }
};

/** Compose the full system prompt for one content type. */
const composeSystemPrompt = (
    contentType: string,
    family: PromptFamily,
    blueprint: BlueprintSeed,
): string => {
    const sources = blueprint.sources?.length
        ? blueprint.sources
        : templateSourcesForContentType(contentType);
    const evidence = sources.length
        ? `\nREFERENCE EVIDENCE (reverse-engineered, measured and transcribed from these EduAI print templates in assets/templates/):\n${sources.map((file) => `   • assets/templates/${file}`).join('\n')}`
        : '';

    const parts = [
        `You are EduAI's senior South African curriculum designer, typesetter and print-production specialist. You are generating a ${contentType}: ${blueprint.purpose}.`,
        MERGED_BANNER_CONTRACT,
        evidence,
        FAMILY_RULES[family],
        `BLUEPRINT — WHAT A ${contentType.toUpperCase()} MUST CONTAIN (in this order):
${blueprint.sections.map((section, index) => `   ${index + 1}. ${section}`).join('\n')}`,
        blueprint.responseShapes.length
            ? `ANSWER / RECORD SHAPES THE BODY MUST PROVIDE:\n${blueprint.responseShapes.map((shape) => `   • ${shape}`).join('\n')}`
            : '',
        blueprint.marks ? `MARKS: ${blueprint.marks}` : '',
        blueprint.companion ? `COMPANION OUTPUT (returned in its own JSON field, never mixed into the main body): ${blueprint.companion}.` : '',
        blueprint.visuals?.length ? `VISUALS:\n${blueprint.visuals.map((visual) => `   • ${visual}`).join('\n')}` : '',
        blueprint.extras?.length ? `SPECIFIC RULES:\n${blueprint.extras.map((extra) => `   • ${extra}`).join('\n')}` : '',
        CONTENT_LAW,
        OUTPUT_RULES,
    ];

    return parts.filter(Boolean).join('\n\n');
};

/** Build a resolved prompt entry for a content type + blueprint. */
const buildPrompt = (contentType: string, blueprint: BlueprintSeed): ContentTypePrompt => {
    const palette = bannerPaletteFor(contentType).id as BannerPaletteId;
    const family = familyFor(contentType, palette);
    return {
        contentType,
        slug: contentTypeKey(contentType),
        family,
        palette,
        blueprint: { ...blueprint, sources: blueprint.sources || templateSourcesForContentType(contentType) },
        systemPrompt: composeSystemPrompt(contentType, family, blueprint),
    };
};

/**
 * The built-in prompt registry. It contains every type in
 * `src/lib/contentTypes.ts` (asserted by `tests/content-type-prompts.test.ts`)
 * plus the app's internal/alias types — 80+ entries, one per content type.
 */
export const CONTENT_TYPE_PROMPTS: Record<string, ContentTypePrompt> = (() => {
    const registry: Record<string, ContentTypePrompt> = {};
    for (const [type, blueprint] of Object.entries(CONTENT_TYPE_BLUEPRINTS)) {
        registry[contentTypeKey(type)] = buildPrompt(type, blueprint);
    }
    return registry;
})();

/** Every canonical content type covered by the built-in prompts. */
export const CONTENT_TYPE_PROMPT_NAMES: string[] = Object.values(CONTENT_TYPE_PROMPTS).map((entry) => entry.contentType);

/** Every content type the Content Creator offers (the 70+ type taxonomy). */
export const TAXONOMY_CONTENT_TYPES: string[] = [
    ...Object.values(TEACHING_CATEGORIES).flat(),
    ...Object.values(VISUAL_TYPES).flat(),
    ...Object.values(ADMIN_TYPES).flat(),
];

/**
 * Resolve the built-in prompt for a free-form content type.
 *
 * Resolution order: exact canonical name → alias table → normalised key →
 * keyword family (via the banner palette rules) → generic worksheet prompt.
 * Never returns undefined: every type the app offers has a prompt.
 */
export const getContentTypePrompt = (contentType?: string): ContentTypePrompt => {
    const raw = String(contentType || '').trim();
    const key = contentTypeKey(raw);

    if (key && CONTENT_TYPE_PROMPTS[key]) return CONTENT_TYPE_PROMPTS[key];

    const alias = CONTENT_TYPE_ALIASES[key];
    if (alias && CONTENT_TYPE_PROMPTS[contentTypeKey(alias)]) return CONTENT_TYPE_PROMPTS[contentTypeKey(alias)];

    // Case/punctuation-insensitive exact match against canonical names.
    const lower = raw.toLowerCase();
    const exact = Object.values(CONTENT_TYPE_PROMPTS).find((entry) => entry.contentType.toLowerCase() === lower);
    if (exact) return exact;

    // The palette rules know the content-type families; reuse them, then pick a
    // representative prompt from that family (first-match-wins, same order).
    const wanted = familyFor(raw, bannerPaletteFor(raw).id);
    const representative = Object.values(CONTENT_TYPE_PROMPTS).find((entry) => entry.family === wanted);
    return representative || CONTENT_TYPE_PROMPTS[contentTypeKey('Worksheet')];
};

/** Look up a prompt by its slug (used by tests and the UI's type picker). */
export const getContentTypePromptBySlug = (slug: string): ContentTypePrompt | undefined =>
    CONTENT_TYPE_PROMPTS[contentTypeKey(slug)];

/* ────────────────────────────────────────────────────────────────────────────
 * 5 · CONTEXT + USER PROMPT
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ContentPromptContext {
    grade?: string;
    subject?: string;
    topic?: string;
    term?: string;
    language?: string;
    /** Total marks for the task — the host banner prints this once. */
    totalMarks?: number | string;
    duration?: string;
    /** Learning-support context (SIAS level, barriers) — appended when supplied. */
    supportLevel?: string;
    differentiation?: string;
    /** Free-text instructor brief. Always highest priority. */
    additionalInstructions?: string;
    /** Extra CAPS/ATP reference text for the model (never repeated in the body). */
    capsReference?: string;
    /** Learner-facing phase override (Foundation Phase, Intermediate Phase …). */
    phase?: string;
}

/** The phase label used in prompts (mirrors `EduAIPromptEngine.getPhaseByGrade`). */
export const phaseForGrade = (grade?: string): string => {
    const raw = String(grade ?? '').trim().toUpperCase();
    const num = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (raw === 'R' || raw.startsWith('GR R') || raw === 'RECEPTION') return 'Foundation Phase';
    if (!Number.isNaN(num)) {
        if (num <= 3) return 'Foundation Phase';
        if (num <= 6) return 'Intermediate Phase';
        if (num <= 9) return 'Senior Phase';
        return 'FET Phase';
    }
    return 'Foundation Phase';
};


/**
 * The reverse-engineered blueprint of a content type as plain text — the same
 * sections / answer shapes / marks / companion rules the built-in system prompt
 * contains, without the banner contract or the output-JSON envelope. Lab flows
 * (Visual Lab, Admin Lab) already own their own banner + output rules, so they
 * append this block to their per-artifact blueprint instead of swapping prompts.
 */
export const describeContentTypeBlueprint = (contentType: string): string => {
    const prompt = getContentTypePrompt(contentType);
    const b = prompt.blueprint;
    const parts = [
        `${prompt.contentType} — ${b.purpose} (document family: ${prompt.family}; reference templates: ${b.sources?.map((file) => `assets/templates/${file}`).join(', ') || 'family defaults'})`,
        b.sections.length ? `Required sections, in order:\n${b.sections.map((section, index) => `   ${index + 1}. ${section}`).join('\n')}` : '',
        b.responseShapes.length ? `Answer / record shapes to provide:\n${b.responseShapes.map((shape) => `   • ${shape}`).join('\n')}` : '',
        b.marks ? `Marks: ${b.marks}` : '',
        b.companion ? `Companion output (own JSON field): ${b.companion}` : '',
        b.visuals?.length ? `Visuals:\n${b.visuals.map((visual) => `   • ${visual}`).join('\n')}` : '',
        b.extras?.length ? `Type-specific rules:\n${b.extras.map((extra) => `   • ${extra}`).join('\n')}` : '',
    ];
    return parts.filter(Boolean).join('\n');
};

/** The user-message half of the prompt pair. */
export const buildContentTypeUserPrompt = (
    contentType: string,
    context: ContentPromptContext = {},
): string => {
    const prompt = getContentTypePrompt(contentType);
    const phase = context.phase || phaseForGrade(context.grade);
    const lines = [
        `Generate a complete ${prompt.contentType} for the South African CAPS curriculum.`,
        '',
        'CONTEXT (use it; never re-print it as a metadata block):',
        `• Phase: ${phase}`,
        `• Grade: ${context.grade || 'not specified'}`,
        `• Subject / learning area: ${context.subject || 'not specified'}`,
        `• Topic: ${context.topic || 'not specified'}`,
        `• Term: ${context.term || 'not specified'}`,
        `• Language of learning and teaching: ${context.language || 'English'}`,
        `• Total marks: ${context.totalMarks ?? 'follow the blueprint default'}`,
        `• Duration: ${context.duration || 'not specified'}`,
    ];
    if (context.capsReference) lines.push(`• CAPS reference to align to (do not print it as a band): ${context.capsReference}`);
    if (context.supportLevel) lines.push(`• SIAS support level: ${context.supportLevel}`);
    if (context.differentiation) lines.push(`• Differentiation required: ${context.differentiation}`);
    lines.push(
        '',
        `BANNER DATA (already supplied by the host — print NONE of it, in any form): grade ${context.grade || '—'}, subject ${context.subject || '—'}, content type ${prompt.contentType}, term ${context.term || '—'}, date (set by the host), total marks ${context.totalMarks ?? '—'}, CAPS code (generated by the host), the compliance labels and the canonical footer. The body starts with the first section of the blueprint.`,
        '',
        'Deliver the document body only. Return the full, print-ready HTML (and the companion memo/rubric in its own JSON field when the blueprint requires one).',
    );
    if (context.additionalInstructions) {
        lines.push(
            '',
            '════════ INSTRUCTOR BRIEF — HIGHEST PRIORITY (overrides style defaults, never the banner or compliance rules) ════════',
            context.additionalInstructions.trim(),
            '════════ END INSTRUCTOR BRIEF ════════',
        );
    }
    return lines.join('\n');
};

/** The system + user prompt pair, ready for any of the frozen AI providers. */
export const buildContentTypePromptPair = (
    contentType: string,
    context: ContentPromptContext = {},
): { system: string; user: string; prompt: ContentTypePrompt } => {
    const prompt = getContentTypePrompt(contentType);
    return {
        system: prompt.systemPrompt,
        user: buildContentTypeUserPrompt(contentType, context),
        prompt,
    };
};

export default {
    CONTENT_TYPE_PROMPTS,
    CONTENT_TYPE_BLUEPRINTS,
    CONTENT_TYPE_PROMPT_NAMES,
    TAXONOMY_CONTENT_TYPES,
    MERGED_BANNER_SLOTS,
    MERGED_BANNER_CONTRACT,
    FAMILY_RULES,
    getContentTypePrompt,
    getContentTypePromptBySlug,
    describeContentTypeBlueprint,
    buildContentTypeUserPrompt,
    buildContentTypePromptPair,
    phaseForGrade,
    contentTypeKey,
    CONTENT_TYPE_ALIASES,
};
