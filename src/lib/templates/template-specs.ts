/**
 * REVERSE-ENGINEERED SPECIFICATIONS — `assets/templates/*`
 * ========================================================
 *
 * Every PDF in `assets/templates/` was produced by the SAME print layout: one
 * full-bleed banner band at the top of an A4 portrait page, a learner record
 * row underneath it, then numbered sections of questions / exercises, a score
 * box, a teacher sign-off row and a two-cell page footer. This module is the
 * machine-readable result of reverse-engineering those files — the exact
 * geometry, colour pairings, type sizes and data fields that were measured out
 * of the PDFs (pdfminer / pypdf: rectangle ops, text lines with their point
 * sizes and font names) so that:
 *
 *   1. the ONE host banner in `contentTemplate.ts` can carry **every** field
 *      those templates displayed (title, grade, subject, term, content type,
 *      date, marks, name/date/term blanks, teacher/moderator/comment lines,
 *      country and the resource URL) — nothing is lost when a teacher prints;
 *   2. the built-in content generation prompts in
 *      `src/lib/prompts/content-type-prompts.ts` can describe the *real*
 *      document each content type must produce (section layout, marks tags,
 *      answer lines, score box) instead of a generic "make a worksheet".
 *
 * Measured anatomy of the reference templates (A4 = 595.28 × 841.89 pt):
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ BANNER BAND   595.3 × 99.2–107.7 pt, full bleed, content-     │
 *   │               type colour pair, radius 0                      │
 *   │   • grade badge (circle/disc, ~85 pt) — “Grade 3” 11 pt bold  │
 *   │   • title 24–28 pt bold (white, left/centre)                  │
 *   │   • subtitle 13–14 pt (“Topic | CAPS Term 1”)                 │
 *   │   • accent stripe 595.3 × 6.2–7.1 pt in the pairing's second  │
 *   │     colour (the two-colour pairing the host paints as a       │
 *   │     vertical gradient)                                        │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ RECORD ROW  11–13 pt bold: “Name: ____ Date: ____ Term: ___”  │
 *   │             (worksheets) / “Total: ___ / 30” (assessments)    │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ SECTIONS    heading band 538.6 × 24.1 pt, 13 pt bold          │
 *   │             “SECTION A — … [10 marks]”                        │
 *   │ QUESTIONS   question 12 pt bold, body 11 pt, options 11 pt,   │
 *   │             ruled answer lines 396.9–510.2 pt wide, marks tag │
 *   │             “[2]” 10 pt bold right-aligned at x≈549           │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ SCORE BOX   bottom-right: “SCORE” 10 pt + “___ / 30” 20 pt    │
 *   │ SIGN-OFF    “Teacher: ______ Comment: _______” (10 pt)        │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ FOOTER      left  “EduAI Companion | CAPS Aligned | URL”      │
 *   │             right “Grade 3 | South Africa”   (8–9 pt)         │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * Type sizes are transcribed 1:1 from the PDFs; the host banner prints the
 * same fields but in the app's own web/print scale (see CONTENT_TEMPLATE.md).
 */
import type { BannerPaletteId } from '../bannerPalettes';

/** The document families the reference templates cover. */
export type TemplateFamily =
    | 'worksheet'
    | 'assessment'
    | 'memo'
    | 'study-notes'
    | 'poster'
    | 'cards'
    | 'foundation'
    | 'admin'
    | 'certificate';

/** A banner data field — the union of everything the PDFs printed up top. */
export type TemplateBannerField =
    | 'title'
    | 'subtitle'
    | 'grade'
    | 'subject'
    | 'contentType'
    | 'term'
    | 'date'
    | 'name'
    | 'marks'
    | 'duration'
    | 'teacher'
    | 'moderator'
    | 'comment'
    | 'signature'
    | 'school'
    | 'capsCode'
    | 'compliance'
    | 'country'
    | 'resourceUrl';

/** Print tokens sampled out of the reference PDFs. */
export const TEMPLATE_PRINT_TOKENS = {
    /** Page geometry, measured in PDF points. */
    page: { widthPt: 595.28, heightPt: 841.89, marginPt: 28.35, columns: 1, orientation: 'portrait' as const },
    banner: {
        /** Band heights actually used (Foundation Phase packs run slightly shorter). */
        heightPt: [99.2, 107.7] as const,
        heightMm: 35.0,
        radius: 0,
        accentStripePt: [6.2, 7.1] as const,
        badgePt: 85,
    },
    section: { headingPt: 13, bandHeightPt: 24.1, bandWidthPt: 538.6, questionPt: 12, bodyPt: 11, marksTagPt: 10, answerRuleWidthPt: [396.9, 411, 510.2] as const },
    title: { pt: [24, 28] as const, subtitlePt: [13, 14] as const },
    recordRow: { pt: [11, 13] as const },
    scoreBox: { labelPt: 10, valuePt: 20 },
    signOffPt: 10,
    footerPt: [8, 9] as const,
    /** System Helvetica/Helvetica-Bold (+ ZapfDingbats marks) in the print PDFs. */
    fonts: { body: 'Helvetica, Arial, sans-serif', display: "Fredoka, 'Helvetica-Bold', sans-serif" },
    /** Ink and accent colours sampled from every template. */
    palette: {
        ink: '#1a1a2e',
        slate: '#37474f',
        teal: '#118ab2',
        sky: '#48cae4',
        purple: '#9b5de5',
        orange: '#f77f00',
        gold: '#ffb703',
        amber: '#ffd166',
        coral: '#ff8c42',
        green: '#06d6a0',
        leaf: '#95d44a',
        forest: '#388e3c',
        pink: '#ff6b9d',
        rose: '#ef476f',
        red: '#ef476f',
        teal2: '#14b8a6',
        paper: '#ffffff',
    },
    /** Page tints the templates wash behind the content, per subject family. */
    pageTint: {
        mathematics: '#e3f6fc',
        lifeSkills: '#fff3e0',
        lifeSkillsGreen: '#f1f8e9',
        lifeOrientation: '#fff0f3',
        foundationPink: '#fce4ec',
        foundationGreen: '#e8f5e9',
        foundationCream: '#fffde7',
        mathematicsPurple: '#f3e5f5',
    },
} as const;

/** One reverse-engineered template file. */
export interface TemplateFileSpec {
    /** File name inside `assets/templates/`. */
    file: string;
    /** Best-fitting Content Creator content type (see `contentTypes.ts`). */
    contentType: string;
    /** Document family. */
    family: TemplateFamily;
    /** Palette the host banner uses for this family (see `bannerPalettes.ts`). */
    palette: BannerPaletteId;
    /** Extra content types this template is evidence for. */
    alsoCovers?: string[];
    /** Banner band colour measured in the PDF. */
    bandColour: string;
    /** Accent stripe colour measured in the PDF (the band's second stop). */
    accentColour: string;
    /** Page wash behind the content. */
    pageTint: string;
    /** Title / subtitle exactly as printed (placeholders in UPPER CASE). */
    title: string;
    subtitle: string;
    /** Every data field the banner + record row displayed. */
    bannerFields: TemplateBannerField[];
    /** Record-row wording, transcribed. */
    recordRow: string;
    /** Section headings, transcribed. */
    sections: string[];
    /** Question / activity shapes found in the body. */
    questionShapes: string[];
    /** Closing elements (score box, sign-off, footer). */
    closing: string[];
    /** Footer cells, transcribed. */
    footer: { left: string; right: string };
    /** One-line summary of what the file proves. */
    evidence: string;
}

/**
 * The files, newest first, exactly as measured. Colours are the RECT fill
 * values from each PDF's content stream; point sizes come from the text
 * operators.
 */
export const REVERSE_ENGINEERED_TEMPLATES: TemplateFileSpec[] = [
    {
        file: 'gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf',
        contentType: 'Worksheet',
        family: 'worksheet',
        palette: 'worksheet',
        alsoCovers: ['Mathematics Worksheet', 'Classroom Exercise', 'Homework Task'],
        bandColour: '#118ab2',
        accentColour: '#48cae4',
        pageTint: '#e3f6fc',
        title: 'GRADE + SUBJECT WORKSHEET',
        subtitle: 'TOPIC LINE  |  GRADE  |  TERM',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'marks', 'teacher', 'comment', 'capsCode', 'compliance', 'country', 'resourceUrl'],
        recordRow: 'Name: ________________________________  Date: ______________  Term: ___',
        sections: [
            'SECTION A — Place Value (Hundreds, Tens, Units)',
            'SECTION B — Multiplication Tables (2, 3, 5, 10)',
            'SECTION C — Fractions',
        ],
        questionShapes: [
            'numbered question text (12 pt bold) with the working inline',
            'fill-in blanks of increasing width (____ → ______________)',
            'ruled answer lines 396.9 pt wide under each question',
            'four-column equation grid (3 × 4 =, 5 × 6 = …) at 14 pt bold',
            'draw / colour instruction with shape outlines',
        ],
        closing: [
            'SCORE box bottom-right — “SCORE” 10 pt above “___ / 30” 20 pt',
            'Teacher: _____________________  Comment: _______________________________',
        ],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 3  |  South Africa' },
        evidence: 'The canonical 30-mark, three-section primary worksheet: teal → sky band, Name/Date/Term record row, marked sections, score box, teacher comment line.',
    },
    {
        file: 'gr3-life-skills-assessment-term1-healthy-living.pdf',
        contentType: 'Formal Assessment Task (FAT)',
        family: 'assessment',
        palette: 'assessment',
        alsoCovers: ['Diagnostic Assessment', 'Controlled Test'],
        bandColour: '#f77f00',
        accentColour: '#ffb703',
        pageTint: '#fff3e0',
        title: 'GRADE + SUBJECT + ASSESSMENT',
        subtitle: 'TOPIC  |  CAPS TERM N',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'marks', 'teacher', 'comment', 'capsCode', 'compliance', 'country', 'resourceUrl'],
        recordRow: 'Name: ________________________________  Date: ______________  Total: ___ / 30',
        sections: [
            'SECTION A — Circle the correct answer  [10 marks]',
            'SECTION B — True or False  [10 marks]',
            'SECTION C — Short Answer  [10 marks]',
        ],
        questionShapes: [
            'multiple choice: a) b) c) d) laid out in four columns at 11 pt',
            'true / false: “T / F” circles',
            'short answer: numbered prompt with inline mark tag [2] … [4]',
            'ruled answer lines 411 pt wide, right-aligned totals ([1]–[6])',
        ],
        closing: [
            'SCORE box bottom-right — “SCORE” above “___ / 30” (20 pt)',
            'Teacher: _____________________  Comment: _______________________________',
        ],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 3  |  South Africa' },
        evidence: 'A balanced formal/informal assessment: exactly ten marks per section (MCQ, True/False, short answer), per-question mark tags and a 30-mark total.',
    },
    {
        file: 'gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf',
        contentType: 'Controlled Test',
        family: 'assessment',
        palette: 'assessment',
        alsoCovers: ['Examination', 'Assessment'],
        bandColour: '#118ab2',
        accentColour: '#48cae4',
        pageTint: '#e3f6fc',
        title: 'GRADE + SUBJECT + ASSESSMENT',
        subtitle: 'CAPS TERM N  |  CONTENT STRANDS',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'marks', 'teacher', 'moderator', 'capsCode', 'compliance', 'country', 'resourceUrl'],
        recordRow: 'Name: ________________________________  Date: ______________  Total: ___ / 50',
        sections: [
            'SECTION A — Number Sentences & Patterns  [15 marks]',
            'SECTION B — Operations  [20 marks]',
            'SECTION C — Fractions, Data & Measurement  [15 marks]',
        ],
        questionShapes: [
            'numbered questions with inline mark tags [1] … [4]',
            'equation and “show working” prompts with ruled lines',
            'diagram / draw-to-scale instruction (“draw a 6 cm line”)',
            'comparison blanks (>, <, =)',
        ],
        closing: [
            'SCORE box — “___ / 50”',
            'Teacher: ________  Moderator: __________  Date: ________',
        ],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 4  |  South Africa' },
        evidence: 'The moderated 50-mark controlled test: weighted sections (15/20/15), per-question marks, teacher + moderator + date sign-off.',
    },
    {
        file: 'gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf',
        contentType: 'Examination',
        family: 'assessment',
        palette: 'assessment',
        alsoCovers: ['Formal Assessment Task (FAT)'],
        bandColour: '#9b5de5',
        accentColour: '#c77dff',
        pageTint: '#f3e5f5',
        title: 'GRADE + SUBJECT + ASSESSMENT',
        subtitle: 'CAPS TERM N  |  CONTENT STRANDS',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'marks', 'teacher', 'moderator', 'capsCode', 'compliance', 'country', 'resourceUrl'],
        recordRow: 'Name: ________________________________  Date: ______________  Total: ___ / 60',
        sections: [
            'SECTION A — Whole Numbers & Integers  [15 marks]',
            'SECTION B — Fractions, Decimals & Percentages  [15 marks]',
            'SECTION C — Algebra, Geometry & Data  [30 marks]',
        ],
        questionShapes: [
            'calculation drills with working lines',
            'multi-step word problems in South African contexts (R, litres, % increase)',
            'sketch/graph instruction with a large framed drawing area',
            'mark tags [1]–[6] right-aligned',
        ],
        closing: [
            'SCORE box — “___ / 60”',
            'Teacher: ________  Moderator: __________  Date: ________',
        ],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 6  |  South Africa' },
        evidence: 'Senior-primary paper with a 30-mark capstone section, graph/drawing space and moderator sign-off — the “higher-order weighting” shape.',
    },
    {
        file: 'gr4-life-skills-worksheet-term2-emotions-relationships.pdf',
        contentType: 'Worksheet',
        family: 'worksheet',
        palette: 'worksheet',
        alsoCovers: ['Life Skills Worksheet', 'Learning Activity'],
        bandColour: '#388e3c',
        accentColour: '#48cae4',
        pageTint: '#f1f8e9',
        title: 'GRADE + SUBJECT TOPIC',
        subtitle: 'TOPIC  |  GRADE  |  TERM',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'capsCode', 'compliance', 'country', 'resourceUrl'],
        recordRow: 'Name: ________________________________  Date: ______________',
        sections: ['PART 1 — Emotion Wheel', 'PART 2 — Handling My Feelings', 'PART 3 — My Feelings Journal'],
        questionShapes: [
            'labelled word/emotion cards in a grid (Happy, Sad, Angry, Scared, Calm, Excited)',
            'matching rows “I feel angry → Take deep breaths and count to 10”',
            'journal sentence starters with long ruled lines',
            'closing affirmation band “All feelings are valid…”',
        ],
        closing: ['Affirmation band with the topic takeaway', 'Teacher: _____________________  Comment: _______________________________'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 4  |  South Africa' },
        evidence: 'A non-marked life-skills worksheet: three PARTs, vocabulary cards, matching rows, journal lines and an affirmation closer.',
    },
    {
        file: 'gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf',
        contentType: 'Worksheet',
        family: 'worksheet',
        palette: 'worksheet',
        alsoCovers: ['Case Study', 'Oral/Speech Task'],
        bandColour: '#ef476f',
        accentColour: '#ff6b9d',
        pageTint: '#fff0f3',
        title: 'GRADE + SUBJECT',
        subtitle: 'TOPIC  |  GRADE  |  TERM',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date', 'name', 'capsCode', 'compliance', 'country', 'resourceUrl'],
        recordRow: 'Name: ________________________________  Date: ______________',
        sections: ['PART 1 — The South African Constitution & Bill of Rights', 'PART 2 — Human Rights Scenarios', 'PART 3 — Health: Diseases & Prevention'],
        questionShapes: [
            'numbered fact cards “Right to Equality: No one may discriminate…” (496 × 25.5 pt rows)',
            'scenario prompts with “Right violated: ________ Why: ________” blanks',
            'structured note blocks (HIV/AIDS, TB, COVID-19) with “How it spreads / Prevention”',
            'closing call-to-action band',
        ],
        closing: ['Call-to-action band (“Know your rights…”)', 'Teacher: _____________________  Comment: _______________________________'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 7  |  South Africa' },
        evidence: 'Senior-phase values work: bill-of-rights fact rows, scenario analysis with justified answers, health note blocks.',
    },
    {
        file: 'grR-phonics-tracing-letter-s.pdf',
        contentType: 'Worksheet',
        family: 'foundation',
        palette: 'foundation',
        alsoCovers: ['Foundation Phase Activity', 'Interactive Foundation Learning Pack', 'Classroom Exercise'],
        bandColour: '#ef476f',
        accentColour: '#ff6b9d',
        pageTint: '#fce4ec',
        title: "LET'S TRACE THE LETTER S!",
        subtitle: 'GRADE R  |  TERM 1  |  HANDWRITING PRACTICE',
        bannerFields: ['title', 'subtitle', 'grade', 'term', 'contentType', 'date', 'name', 'capsCode', 'compliance', 'resourceUrl'],
        recordRow: 'Name: _________________________________    Date: ________________',
        sections: ['Trace: S S S S (two rows of dotted letters)', 'Write: (two ruled lines)', 'Vocabulary picture + word (“snake”)'],
        questionShapes: [
            'dotted tracing glyphs at 48 pt with a ruled baseline every 62.4 × 82.2 pt cell',
            'write-your-own ruled lines',
            'one picture/word card (label 13 pt bold)',
            'reward row “Colour a ★ for each line you finish”',
        ],
        closing: ['Reward row — colour a star per completed line', 'Teacher observation (no marks box on Foundation handwriting)'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  Foundation Phase', right: 'Grade R  |  Term 1' },
        evidence: 'Foundation handwriting: 48 pt dotted glyphs, ruled trace/write rows, picture vocabulary and a star reward row — never a marks box.',
    },
    {
        file: 'gr1-phonics-blending-cvc-words.pdf',
        contentType: 'Worksheet',
        family: 'foundation',
        palette: 'foundation',
        alsoCovers: ['Foundation Phase Activity', 'Learning Activity'],
        bandColour: '#06d6a0',
        accentColour: '#95d44a',
        pageTint: '#e8f5e9',
        title: 'LETS BLEND SOUNDS!',
        subtitle: 'GRADE R/1  |  CVC WORD BUILDING',
        bannerFields: ['title', 'subtitle', 'grade', 'term', 'contentType', 'date', 'name', 'capsCode', 'compliance', 'resourceUrl'],
        recordRow: 'Name: _________________________________    Date: ________________',
        sections: ['Say each sound, then blend them together to make a word! (5 word cards)', 'Write it: (lined practice per word)', 'Praise band “Great blending! You are a STAR reader!”'],
        questionShapes: [
            'three letter tiles per word at 38 pt',
            'blended word shown at 28 pt with a ✓/star glyph',
            'write-it ruled line per card',
            'praise/reward band at the foot of the page',
        ],
        closing: ['Praise band (34 pt tall, centred, 14 pt bold)', 'Teacher observation checklist'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  Foundation Phase', right: 'Grade R/1  |  CVC Words' },
        evidence: 'Foundation phonics: 5 × (letter tiles → blended word → write-it line) plus a praise band; large glyphs, no small print.',
    },
    {
        file: 'grR-phonics-sound-chart-group1.pdf',
        contentType: 'Alphabet Chart',
        family: 'poster',
        palette: 'poster',
        alsoCovers: ['Word Wall', 'Vocabulary Display', 'Educational Poster'],
        bandColour: '#118ab2',
        accentColour: '#06d6a0',
        pageTint: '#fffde7',
        title: 'JOLLY PHONICS — GROUP 1 SOUNDS',
        subtitle: 'GRADE R  |  TERM 1  |  SOUND CHART',
        bannerFields: ['title', 'subtitle', 'grade', 'term', 'contentType', 'compliance', 'resourceUrl'],
        recordRow: '— (display chart: no learner record row)',
        sections: ['Six sound cards in a 3 × 2 grid (S/a, A/a, T/t, I/i, P/p, N/n)', 'Action Time! footer band'],
        questionShapes: [
            'card 155.9 × 184.3 pt: letter 52 pt bold, lowercase 32 pt, picture 28 pt, word 13 pt bold',
            'coloured card fills per sound (orange, teal, rose, gold, green, pink)',
            'action instruction band',
        ],
        closing: ['“Action Time!” band — do the action while you say each sound'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  Foundation Phase', right: 'Grade R  |  Term 1' },
        evidence: 'Wall chart: 3 × 2 large sound cards, big letters + picture + word, one colour per card, action instruction — read from across the classroom.',
    },
    {
        file: 'grR-phonics-sound-chart-group1.pdf',
        contentType: 'Flashcards (Term + Definition)',
        family: 'cards',
        palette: 'cards',
        alsoCovers: ['Cut-out Activity Cards', 'Matching Cards', 'Vocabulary Cards'],
        // Same PDF as the alphabet-chart spec above: the whole sheet is printed
        // from one document, so it shares its band, stripe and page wash.
        bandColour: '#118ab2',
        accentColour: '#06d6a0',
        pageTint: '#fffde7',
        title: 'SOUND / WORD CARDS',
        subtitle: 'CUT ALONG THE DOTTED LINES',
        bannerFields: ['title', 'subtitle', 'grade', 'term', 'contentType', 'compliance'],
        recordRow: '— (cut-out set: no learner record row)',
        sections: ['Card grid — one concept per card', 'Cut lines between cards'],
        questionShapes: [
            'identical card size and gutters, dotted cut guides',
            'front: large glyph/term; back or lower half: picture + word/definition',
            'colour per card family, high contrast, readable at arm’s length',
        ],
        closing: ['Storage label (“Group 1 — keep in the phonics box”)'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  Foundation Phase', right: 'Grade R  |  Term 1' },
        evidence: 'The card-set shape shared by flashcards, vocabulary, formula, timeline and matching cards: uniform cut-out cards, one concept each.',
    },
    {
        file: 'Number Poster Gr3.pdf',
        contentType: 'Number Chart / Number Line',
        family: 'poster',
        palette: 'poster',
        alsoCovers: ['Educational Poster', 'Times Tables Chart'],
        bandColour: '#2563eb',
        accentColour: '#16a34a',
        pageTint: '#ffffff',
        title: 'NUMBERS 0–10 / NUMBER LINE',
        subtitle: 'GRADE 3  |  DISPLAY',
        bannerFields: ['title', 'grade', 'contentType', 'compliance'],
        recordRow: '— (display chart: no learner record row)',
        sections: ['Full-page numeral / number-line artwork', 'Legend or counting strip'],
        questionShapes: ['image-dominant page (single embedded artwork), no question text'],
        closing: ['None — the artwork is the resource'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 3  |  South Africa' },
        evidence: 'Display posters are picture-led: one large embedded artwork, minimal typography, no marks or record row.',
    },
    {
        file: 'about_blank_1.pdf',
        contentType: 'Number Chart / Number Line',
        family: 'poster',
        palette: 'poster',
        alsoCovers: ['Classroom Labels / Signs'],
        bandColour: '#14b8a6',
        accentColour: '#0d9488',
        pageTint: '#f0fdfa',
        title: 'NUMBER LINE 0–10 (TWO PAGES)',
        subtitle: 'PAGE 1 / PAGE 2',
        bannerFields: ['contentType', 'compliance'],
        recordRow: '— (two-page artwork capture, no record row)',
        sections: ['Page 1 — number line /0 … /11', 'Page 2 — number line /0 … /9'],
        questionShapes: ['repeated numbered tokens along a line (vector, print-scaled)'],
        closing: ['None'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'South Africa' },
        evidence: 'Multi-page artwork prints keep the same banner treatment on every page; content scales to the page, not to a marks grid.',
    },
    {
        file: 'Multiplication for Grade 3 Learners.pdf',
        contentType: 'Study Guide / Learning Notes',
        family: 'study-notes',
        palette: 'lesson',
        alsoCovers: ['Daily Lesson Notes', 'Topic Anchor Chart', 'Infographic'],
        bandColour: '#ff6f00',
        accentColour: '#00b0ff',
        pageTint: '#e1f5fe',
        title: "LET'S MULTIPLY!",
        subtitle: 'MATH FOR GRADE 3',
        bannerFields: ['title', 'subtitle', 'grade', 'subject', 'contentType', 'compliance'],
        recordRow: '— (reference notes: no learner record row)',
        sections: ['What is Multiplication?', 'Using Arrays', 'Times Table Chart', 'Tip: Practice skip counting'],
        questionShapes: [
            'display title 64 pt (Fredoka One) + section headings 32/24 pt',
            'worked example “3 groups of 2 = 3 × 2 = 6” with group boxes',
            'labelled array diagram (rows × columns)',
            'reference table/chart',
            'tip callout box',
        ],
        closing: ['Tip callout — practice hint, no marks'],
        footer: { left: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io', right: 'Grade 3  |  South Africa' },
        evidence: 'Concept notes: display title, three teaching sections, worked examples, a reference chart and a tip callout — no marks, no blanks.',
    },
];

/** The banner fields every reference template displayed, in banner order. */
export const TEMPLATE_BANNER_FIELD_ORDER: TemplateBannerField[] = [
    'title', 'subtitle', 'grade', 'subject', 'contentType', 'term', 'date',
    'name', 'marks', 'duration', 'teacher', 'moderator', 'comment', 'signature',
    'school', 'capsCode', 'compliance', 'country', 'resourceUrl',
];

/** Human labels for the merged banner's data slots (used by prompt text). */
export const TEMPLATE_BANNER_FIELD_LABELS: Record<TemplateBannerField, string> = {
    title: 'document title',
    subtitle: 'topic / focus line',
    grade: 'grade',
    subject: 'subject (learning area)',
    contentType: 'content type',
    term: 'term',
    date: 'date (DD/MM/YYYY)',
    name: 'learner name field',
    marks: 'total marks / score',
    duration: 'duration',
    teacher: 'teacher',
    moderator: 'moderator',
    comment: 'teacher comment',
    signature: 'signature',
    school: 'school',
    capsCode: 'CAPS code + CAPS/ATP reference',
    compliance: 'CAPS · NPA · POPIA · SIAS · WP6 compliance labels',
    country: 'country (South Africa)',
    resourceUrl: 'resource URL',
};

/** Template families keyed by host banner palette (palette ⇄ family are 1:1). */
export const TEMPLATE_FAMILY_BY_PALETTE: Record<BannerPaletteId, TemplateFamily> = {
    brand: 'worksheet',
    lesson: 'study-notes',
    worksheet: 'worksheet',
    assessment: 'assessment',
    memo: 'memo',
    poster: 'poster',
    cards: 'cards',
    admin: 'admin',
    certificate: 'certificate',
    intervention: 'admin',
    foundation: 'foundation',
};

/** Every template that documents a content type (case-insensitive contains). */
export const templatesForContentType = (contentType: string): TemplateFileSpec[] => {
    const wanted = String(contentType || '').trim().toLowerCase();
    if (!wanted) return [];
    return REVERSE_ENGINEERED_TEMPLATES.filter((spec) =>
        [spec.contentType, ...(spec.alsoCovers || [])]
            .some((candidate) => candidate.toLowerCase() === wanted)
        // Fall back to a loose contains match so decorated names still resolve
        // (e.g. "Worksheet (Foundation Phase)").
        || spec.contentType.toLowerCase().split(/[\s/]+/).some((word) => word.length > 3 && wanted.includes(word)),
    );
};

/** Source-file evidence list for a content type, for prompt footers. */
export const templateSourcesForContentType = (contentType: string): string[] =>
    templatesForContentType(contentType).map((spec) => spec.file.replace(/#.*$/, ''));

export default {
    REVERSE_ENGINEERED_TEMPLATES,
    TEMPLATE_PRINT_TOKENS,
    TEMPLATE_BANNER_FIELD_ORDER,
    TEMPLATE_BANNER_FIELD_LABELS,
    TEMPLATE_FAMILY_BY_PALETTE,
    templatesForContentType,
    templateSourcesForContentType,
};
