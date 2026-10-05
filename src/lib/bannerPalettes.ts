/**
 * Bright two-colour VERTICAL gradient palettes for the ONE document banner.
 *
 * Every generated document opens with exactly one banner (see
 * `CONTENT_TEMPLATE.md`). That banner is always a TWO-COLOUR vertical gradient
 * — never a solid fill — and the colours are chosen for the *kind of content*
 * being generated: a worksheet gets a warm orange → magenta sunrise, a marking
 * memo gets green → teal, a certificate gets violet → gold, a poster gets
 * fuchsia → burnt orange, and so on. The old navy → blue pairing survives only
 * as the `brand` fallback for content whose type cannot be recognised.
 *
 * Two guarantees hold for every palette in this module, and both are asserted
 * by `tests/content-template.test.ts` and `scripts/verify-content-template.ts`:
 *
 *   1. `gradient` is exactly `linear-gradient(180deg, <from> 0%, <to> 100%)`
 *      — two stops, hex colours, straight down the page.
 *   2. Both stops keep white banner text legible (contrast ≥ 4.5:1), because
 *      the title, the metadata pills and the compliance labels are white.
 */
export type BannerPaletteId =
    | 'brand'
    | 'lesson'
    | 'worksheet'
    | 'assessment'
    | 'memo'
    | 'poster'
    | 'cards'
    | 'admin'
    | 'certificate'
    | 'intervention'
    | 'foundation';

export interface BannerPalette {
    /** Stable identity — also the value callers may pass as `meta.palette`. */
    id: BannerPaletteId;
    /** Human name of the colour pairing, for docs and previews. */
    label: string;
    /** What the pairing says visually / where it is used. */
    blurb: string;
    /** Top gradient stop (hex). */
    from: string;
    /** Bottom gradient stop (hex). */
    to: string;
    /** `linear-gradient(180deg, from 0%, to 100%)` — the exact CSS value. */
    gradient: string;
    /** Representative content types this palette is drawn for. */
    types: string[];
}

/** The one and only shape a banner gradient may take. */
export const buildBannerGradient = (from: string, to: string): string =>
    `linear-gradient(180deg, ${from} 0%, ${to} 100%)`;

const palette = (
    id: BannerPaletteId,
    label: string,
    blurb: string,
    from: string,
    to: string,
    types: string[],
): BannerPalette => ({ id, label, blurb, from, to, gradient: buildBannerGradient(from, to), types });

/**
 * The palette set. Bright, saturated pairings — chosen so that no two content
 * families look alike at a glance, and so every gradient still carries white
 * text (all stops ≥ 4.5:1 against #ffffff).
 */
export const BANNER_PALETTES: Record<BannerPaletteId, BannerPalette> = {
    brand: palette(
        'brand', 'Brand navy → azure', 'Neutral fallback when the content type is unknown.',
        '#1e3a5f', '#2563eb', ['Educational Resource', 'Untitled Generation'],
    ),
    lesson: palette(
        'lesson', 'Indigo → violet', 'Lesson plans, daily/weekly notes, study guides, packs.',
        '#4338ca', '#7c3aed',
        ['Lesson Plan', 'Daily Lesson Notes', 'Weekly Lesson Plan', 'Unit Plan', 'Study Guide / Learning Notes', 'Revision Pack'],
    ),
    worksheet: palette(
        'worksheet', 'Burnt orange → magenta', 'Worksheets, homework, class exercises, written tasks.',
        '#c2410c', '#be185d',
        ['Worksheet', 'Homework Task', 'Classroom Exercise', 'Group Activity', 'Reading Comprehension', 'Writing Task', 'Research Task', 'Learning Activity'],
    ),
    assessment: palette(
        'assessment', 'Crimson → purple', 'Tests, examinations, FATs, investigations, projects, marking runs.',
        '#be123c', '#9333ea',
        ['Controlled Test', 'Examination', 'Formal Assessment Task (FAT)', 'Investigation', 'Project Brief', 'Case Study', 'Oral/Speech Task', 'Practical Task / Experiment', 'Portfolio Task', 'Diagnostic Assessment', 'Grading', 'OCR Scan'],
    ),
    memo: palette(
        'memo', 'Forest green → teal', 'Memos, rubrics, checklists, model answers — the marking pack.',
        '#15803d', '#0e7490',
        ['Marking Memo', 'Assessment Rubric', 'Analytical Rubric', 'Holistic Rubric', 'Checklist / Self-Assessment', 'Memorandum Key'],
    ),
    poster: palette(
        'poster', 'Fuchsia → burnt orange', 'Posters, charts, word walls, diagrams, displays, labels.',
        '#c026d3', '#c2410c',
        ['Educational Poster', 'Word Wall', 'Vocabulary Display', 'Alphabet Chart', 'Number Chart / Number Line', 'Times Tables Chart', 'Classroom Rules Poster', 'Topic Anchor Chart', 'Mind Map / Concept Map', 'Educational Diagram', 'Infographic', 'Process Flow Diagram', 'Comparison Chart', 'Classroom Labels / Signs', 'Book Labels', 'Book Cover Design', 'Visual Aid'],
    ),
    cards: palette(
        'cards', 'Teal → royal blue', 'Flashcards, vocabulary cards, formula cards, cut-outs, matching sets.',
        '#0f766e', '#1d4ed8',
        ['Flashcards (Term + Definition)', 'Vocabulary Cards', 'Formula Reference Cards', 'Timeline Cards', 'Matching Cards', 'Cut-out Activity Cards'],
    ),
    admin: palette(
        'admin', 'Royal blue → sky', 'Notices, letters, permission slips, registers — school administration.',
        '#1d4ed8', '#0369a1',
        ['Letter to Parents', 'General Notice to Parents', 'Permission Slip', 'Meeting Invitation', 'Progress Update Letter', 'Report Comment Template', 'General School Notice', 'Timetable Template', 'Attendance Register', 'Subject Improvement Plan', 'School Calendar Event Notice', 'Official School Letterhead', 'Disciplinary Notice', 'Classroom Rules', 'Homework Policy Letter', 'Detention Notice', 'Notice'],
    ),
    certificate: palette(
        'certificate', 'Violet → gold', 'Certificates, awards, stickers, seals and emblems.',
        '#6d28d9', '#b45309',
        ['Certificate Template', 'Award / Sticker Template', 'Academic Achievement Certificate', 'Participation Certificate', 'Custom Seal / Emblem', 'Achievement Certificate'],
    ),
    intervention: palette(
        'intervention', 'Deep violet → emerald', 'SIAS support, individualised learning plans, intervention packs.',
        '#5b21b6', '#047857',
        ['SIAS Individualized Learning Plan', 'Individual Development Plan', 'Intervention Pack', 'Remedial Support'],
    ),
    foundation: palette(
        'foundation', 'Pink → azure', 'Foundation Phase learning packs and playful Grade R–3 activities.',
        '#db2777', '#2563eb',
        ['Interactive Foundation Learning Pack', 'Foundation Phase Activity'],
    ),
};

/** Every palette id, in display order. */
export const BANNER_PALETTE_IDS = Object.keys(BANNER_PALETTES) as BannerPaletteId[];

/** Used whenever the content type cannot be recognised. */
export const DEFAULT_BANNER_PALETTE_ID: BannerPaletteId = 'brand';

/** The exact shape every banner gradient must have: two hex stops, 180deg. */
export const BANNER_GRADIENT_PATTERN =
    /^linear-gradient\(\s*180deg\s*,\s*#[0-9a-f]{6}\s+0%\s*,\s*#[0-9a-f]{6}\s+100%\s*\)$/i;

/** True when a gradient is a well-formed two-colour vertical banner gradient. */
export const isBannerGradient = (value: unknown): boolean =>
    BANNER_GRADIENT_PATTERN.test(String(value ?? '').trim());

/** True when the gradient is one of the shipped palettes (not to be tampered with). */
export const isKnownBannerGradient = (value: unknown): boolean =>
    BANNER_PALETTE_IDS.some((id) => BANNER_PALETTES[id].gradient === String(value ?? '').trim());

export const isBannerPaletteId = (value: unknown): value is BannerPaletteId =>
    typeof value === 'string' && (BANNER_PALETTE_IDS as string[]).includes(value);

/**
 * Ordered content-type rules — FIRST MATCH WINS, so the more specific families
 * (certificates before admin, memos/rubrics before assessments, posters before
 * admin letters, Foundation Phase packs before generic worksheets) are matched
 * before the broader ones.
 */
const PALETTE_RULES: ReadonlyArray<{ id: BannerPaletteId; match: RegExp }> = [
    { id: 'certificate', match: /\b(?:certificate|award|awards|sticker|seal|emblem|medal|rosette|badge|achievement)\b/ },
    { id: 'memo', match: /\b(?:memo|memorandum|rubric|rubrics|marking|checklist|self assessment|answers?|model answer|solutions?|score sheet)\b/ },
    { id: 'intervention', match: /\b(?:sias|ilp|idp|individuali[sz]ed|intervention|remedial|inclusive|barrier|support plan|development plan)\b/ },
    { id: 'foundation', match: /\b(?:foundation|grade r|reception|phonics|play based|fine motor|pre writing|sensory|kindergarten|preschool)\b/ },
    { id: 'cards', match: /\b(?:flash ?cards?|cards?|cut out|matching|vocabulary cards?|formula|dominoes|puppet|puppets)\b/ },
    { id: 'poster', match: /\b(?:poster|infographic|chart|charts|display|wall|diagram|mind map|concept map|anchor|labels?|signs?|book cover|cover design|illustration|comparison|visual|banner|map|maps)\b/ },
    { id: 'admin', match: /\b(?:notice|letter|letters|slip|invitation|invite|timetable|register|policy|calendar|disciplinary|detention|comment|update|admin|administration|letterhead|permission|meeting|improvement|bulletin|rules)\b/ },
    { id: 'assessment', match: /\b(?:assessment|test|tests|exam|exams|examination|formal|fat|investigation|project|case study|oral|speech|practical|experiment|experiments|portfolio|diagnostic|grading|ocr|scan|quiz|paper|question paper)\b/ },
    { id: 'worksheet', match: /\b(?:worksheet|worksheets|homework|home work|exercise|exercises|activity|activities|comprehension|writing|research|task|tasks|practice|drill|puzzle|puzzles|assignments?)\b/ },
    { id: 'lesson', match: /\b(?:lesson|lessons|unit|units|plan|plans|study|notes?|guide|guides|revision|resource|resources|pack|packs|document|documents|summary|summaries|curriculum|syllabus|module|modules|teaching|learning|programme|program)\b/ },
];

/** Lower-case, punctuation-free text used for content-type matching. */
const normaliseTypeText = (value: unknown): string =>
    String(value ?? '')
        .toLowerCase()
        .replace(/[_/\\|.,;:()[\]{}'"“”’!?*#+&@-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Resolve the banner palette for a content type.
 *
 * @param contentType Free-form content type ("Worksheet", "Marking Memo",
 *                    "SIAS Individualized Learning Plan", …).
 * @param explicit    Optional palette id override (`meta.palette`); wins when
 *                    it names one of the shipped palettes.
 */
export const bannerPaletteFor = (
    contentType?: string,
    explicit?: string,
): BannerPalette => {
    if (isBannerPaletteId(explicit)) return BANNER_PALETTES[explicit];
    const text = normaliseTypeText(contentType);
    if (text) {
        for (const rule of PALETTE_RULES) {
            if (rule.match.test(text)) return BANNER_PALETTES[rule.id];
        }
    }
    return BANNER_PALETTES[DEFAULT_BANNER_PALETTE_ID];
};

/** Convenience: just the CSS gradient for a content type. */
export const bannerGradientFor = (contentType?: string, explicit?: string): string =>
    bannerPaletteFor(contentType, explicit).gradient;

/** Relative luminance of a `#rrggbb` colour (WCAG 2.x). */
const relativeLuminance = (hex: string): number => {
    const channels = [1, 3, 5]
        .map((index) => parseInt(String(hex).slice(index, index + 2), 16) / 255)
        .map((value) => (value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)));
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

/** WCAG contrast ratio between a colour and white — used to guard legibility. */
export const contrastWithWhite = (hex: string): number => 1.05 / (relativeLuminance(hex) + 0.05);
