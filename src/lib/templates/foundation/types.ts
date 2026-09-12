/**
 * Foundation Phase (Grade R–3) printable template library — type contracts.
 *
 * A template is a fully authored, CAPS-aligned printable document described as
 * plain data. The renderer (`./render.ts`) turns a descriptor into bright,
 * cartoon-styled A4 HTML for:
 *   • the in-app Foundation Phase Template Studio (`src/components/...`),
 *   • the standalone printable pack in `public/templates/foundation-phase/`,
 *   • PDF/DOCX assembly if a template is ever piped into the SA pipeline.
 *
 * Because everything is data, the same authored content can never drift
 * between screen preview, print and the exported pack.
 */

/** The four printable families the library ships. */
export type TemplateKind = 'award' | 'worksheet' | 'classroom' | 'homework';

/** CAPS Foundation Phase grades supported by the library. */
export type FoundationGrade = 'R' | '1' | '2' | '3';

/** Extra composite ranges a template may target (rendered as a chip). */
export type GradeScope = FoundationGrade | 'R-1' | '2-3' | '1-3' | 'R-3';

/** Supported classroom languages for the bilingual instruction labels. */
export type LabelLanguage = 'en' | 'xh' | 'zu' | 'af';

/** CAPS Foundation Phase learning areas / subjects used by the library. */
export type LearningArea =
    | 'Home Language'
    | 'First Additional Language'
    | 'Mathematics'
    | 'Life Skills — Beginning Knowledge'
    | 'Life Skills — Creative Arts'
    | 'Life Skills — Physical Education'
    | 'Life Skills — Personal & Social Well-being'
    | 'General';

/** Bloom's / CAPS cognitive levels used for the alignment strip. */
export type CognitiveLevel = 'Know' | 'Understand' | 'Apply' | 'Analyse' | 'Evaluate';

/** CAPS Foundation Phase content areas (subject-specific strands). */
export interface CapsAlignment {
    /** CAPS content area / strand, e.g. "Numbers, Operations and Relationships". */
    contentArea: string;
    /** CAPS specific focus item(s) quoted from the subject CAPS document. */
    skills: string[];
    /** ATP weeks this resource slots into, e.g. ["Term 1 · Weeks 2–3"]. */
    terms: string[];
    /** Assessment standard / activity reference, e.g. "AS 2 — Reading and Viewing". */
    asRef?: string;
    /** Cognitive level(s) exercised. */
    blooms: CognitiveLevel[];
    /** Suggested working time, e.g. "20 min". */
    timeOnTask: string;
    /** Learning & teaching / assessment space: "Classroom", "Home", "Assessment". */
    setting: 'Guided reading / group table' | 'Classroom' | 'Homework' | 'Assessment' | 'Assembly / award' | 'Mixed';
    /** Total marks when the resource is scored (awards/activities may omit it). */
    marks?: number;
    /** Answer memo entries, kept in data so they never print out of sync. */
    memo?: MemoItem[];
    /** One-line CAPS justification shown in the alignment strip. */
    capsNote: string;
}

export interface MemoItem {
    /** Label of the question/item the answer belongs to, e.g. "A.2". */
    ref: string;
    answer: string;
    marks?: number;
    /** Optional teaching tip for the marker. */
    note?: string;
}

/** Per-question / per-activity mark chip. */
export interface Markable {
    marks?: number;
}

/* ───────────────────────────── Blocks ───────────────────────────── */

export interface BlockBase {
    /** Stable id used for anchors + memo cross-references. */
    id?: string;
    /** Marks allocated to this activity (printed as a chip in the header). */
    marks?: number;
    /** Bold activity title, e.g. "Count and write". */
    title: string;
    /** Optional isiXhosa/isiZulu/Afrikaans pair for the title label. */
    titleXi?: string;
    /** Instruction line printed under the title (teacher-friendly, simple wording). */
    instruction?: string;
    /** Bilingual instruction label (short functional verb, e.g. "Bhala"). */
    instructionLabel?: string;
    /** Optional cartoon spot art shown beside the block. */
    art?: ArtKey;
}

export interface TaskItem extends Markable {
    /** Question text. */
    text: string;
    /** Optional sub-lines (e.g. a, b, c). */
    parts?: string[];
    /** Multiple-choice / tick options. */
    options?: string[];
    /** Number of dotted answer lines provided. */
    lines?: number;
    /** Word(s) to be copied into handwriting boxes. */
    copyWords?: string[];
    /** Small icon shown with the item (emoji-safe symbol). */
    symbol?: string;
    /** Print a circled number badge before the item (default true). */
    numbered?: boolean;
}

export interface TaskBlock extends BlockBase, Markable {
    kind: 'task';
    items: TaskItem[];
    /** Render numbers as big circled numerals (default) or plain. */
    numbered?: boolean;
}

export interface TraceItem {
    /** Model text the learner traces over (letters, words, numerals, sums). */
    model: string;
    /** Repeat count for the dotted practice rows. */
    repeats?: number;
}

export interface TraceBlock extends BlockBase {
    kind: 'trace';
    /** Handwriting style: 'font' (Patrick Hand) or 'manuscript' (print letters). */
    style?: 'font' | 'manuscript';
    items: TraceItem[];
    /** Optional sentence frames under the tracers. */
    frames?: string[];
}

export interface CountItem {
    /** Emoji/symbol repeated for the learner to count. */
    symbol: string;
    count: number;
    /** Optional extra prompt, e.g. "Circle the group with MORE." */
    prompt?: string;
}

export interface CountBlock extends BlockBase {
    kind: 'count';
    items: CountItem[];
    /** Also ask the learner to ring the largest/smallest group. */
    compare?: 'largest-smallest' | 'none';
}

export interface MatchBlock extends BlockBase {
    kind: 'match';
    /** Left-hand column. */
    left: string[];
    /** Right-hand column (deliberately shuffled in the renderer). */
    right: string[];
    /** Pairs (1-based indexes) used for the memo and for line-drawn answers. */
    pairs?: Array<[number, number]>;
    /** Draw dotted connector guides between the columns. */
    guides?: boolean;
}

export interface ColourCircleItem {
    /** Text or symbol the learner acts on. */
    text: string;
    /** Action verbs to print as chips, e.g. "circle", "colour", "tick". */
    actions?: string[];
    /** Extra caption. */
    caption?: string;
}

export interface ColourCircleBlock extends BlockBase {
    kind: 'colour-circle';
    /** Instruction verb(s) applied to every item when the item has none. */
    actions: string[];
    /** Colour palette chips printed above the items: [name, hex]. */
    palette?: Array<[string, string]>;
    items: ColourCircleItem[];
    layout?: 'chips' | 'grid';
}

export interface GridCellBlock extends BlockBase {
    kind: 'grid';
    /** Column headers. */
    columns: string[];
    /** Row labels (left-most cell). */
    rows: string[];
    /** Pre-filled cell text keyed "r,c" (0-based); empty cells become answer boxes. */
    filled?: Record<string, string>;
    /** Cell side length hint in mm. */
    cellSize?: number;
    /** 'table' prints a ruled grid, 'boxes' prints standalone answer squares. */
    variant?: 'table' | 'boxes';
}

export interface CutPasteBlock extends BlockBase {
    kind: 'cut-paste';
    /** Labels on the strip to be cut out (words, numerals, pictures-as-emoji). */
    pieces: string[];
    /** Target slots; use "_" for a gap the learner fills from the strip. */
    slots: string[];
    /** Sentence/label context printed above each slot when provided. */
    contexts?: string[];
}

export interface WordBankBlock extends BlockBase {
    kind: 'word-bank';
    words: string[];
    /** Sentences with a numbered gap. */
    sentences: string[];
}

export interface ComprehensionBlock extends BlockBase {
    kind: 'comprehension';
    /** Passage title. */
    passageTitle: string;
    /** Passage body — one entry per paragraph/line. */
    passage: string[];
    /** Optional inline illustration. */
    passageArt?: ArtKey;
    questions: TaskItem[];
    /** Vocabulary work printed under the passage. */
    vocabulary?: Array<{ word: string; ask: string }>;
}

export interface ChecklistBlock extends BlockBase {
    kind: 'checklist';
    items: string[];
    /** Tick-box style. */
    style?: 'box' | 'star' | 'heart';
    /** Free-text footer, e.g. "How long did we read? ______ minutes". */
    footer?: string;
}

export interface RewardBlock extends BlockBase {
    kind: 'reward';
    /** Number of sticker slots. */
    slots?: number;
    /** Praise sentence(s) printed above the slots. */
    praise: string[];
}

export interface CalloutBlock extends BlockBase {
    kind: 'callout';
    tone: 'tip' | 'parent' | 'teacher' | 'inclusion' | 'safety';
    /** Bulleted or paragraph lines. */
    lines: string[];
}

export interface CertBlock extends BlockBase {
    kind: 'certificate';
    /** Award title, e.g. "Outstanding Academic Achievement". */
    awardTitle: string;
    /** Citation body sentence with {learner} token. */
    citation: string;
    /** Reason/subject line with tokens resolved from document fields. */
    reason: string;
    /** Achievement level ribbon text. */
    levelRibbon?: string;
    /** Fields requiring a signature line. */
    signatures: Array<'teacher' | 'principal' | 'chairperson' | 'parent'>;
    /** Sticker/praise strip printed under the citation. */
    stickers?: number;
    /** Encouragement line printed above the signature block. */
    message?: string;
}

export interface CardsBlock extends BlockBase {
    kind: 'cards';
    /** Cut-out card content, one entry per card. */
    cards: Array<{
        /** Big text on the card (letter, word, number, prompt). */
        face: string;
        /** Small caption. */
        caption?: string;
        symbol?: string;
        /** Answer/teacher note on the card back-strip. */
        note?: string;
    }>;
    /** Cards per row (print layout). */
    perRow?: number;
    /** Cut style around cards. */
    cut?: 'dashed' | 'scalloped';
    /** Extra ruled fill-in lines printed inside each card (praise slips, role cards). */
    cardFields?: Array<{ label: string; dotted?: boolean }>;
}

export interface MovementBlock extends BlockBase {
    kind: 'movement';
    steps: Array<{ text: string; reps?: string; symbol?: string }>;
    /** Space required, e.g. "Open classroom floor". */
    space?: string;
}

export interface OralPairBlock extends BlockBase {
    kind: 'oral-pairs';
    /** Talk frames shown in speech bubbles. */
    frames: string[];
    /** Question prompts for the partner. */
    prompts: string[];
    /** Listening task for the partner. */
    listenFor?: string;
}

export interface DataTableBlock extends BlockBase {
    kind: 'data-table';
    headers: string[];
    rows: string[][];
    /** Pictogram symbol when the table is a picture graph. */
    pictogram?: string;
    /** Questions read from the table. */
    questions?: TaskItem[];
}

export interface RubricBlock extends BlockBase {
    kind: 'rubric';
    criteria: string[];
    /** Column headings, e.g. Level 4 → Level 1 descriptors. */
    levels: string[];
    /** cells[level][criterion] descriptor text. */
    cells: string[][];
}

export interface MemoBlock extends BlockBase {
    kind: 'memo';
    items: MemoItem[];
    /** Total marks printed in the memo header. */
    total?: number;
}

export type Block =
    | TaskBlock
    | TraceBlock
    | CountBlock
    | MatchBlock
    | ColourCircleBlock
    | GridCellBlock
    | CutPasteBlock
    | WordBankBlock
    | ComprehensionBlock
    | ChecklistBlock
    | RewardBlock
    | CalloutBlock
    | CertBlock
    | CardsBlock
    | MovementBlock
    | OralPairBlock
    | DataTableBlock
    | RubricBlock
    | MemoBlock;

/* ─────────────────────────── Template ─────────────────────────── */

export type ArtKey =
    | 'elly-trophy'
    | 'elly-reading'
    | 'elly-counting'
    | 'elly-nature'
    | 'medal-star'
    | 'doodle-supplies'
    | 'kids-classroom'
    | 'homework-bag'
    | 'rainbow-banner'
    | 'sticker-sheet';

/** Colour family per learning area — keeps every sheet instantly identifiable. */
export type TemplateTheme = 'sunny' | 'bubblegum' | 'lagoon' | 'meadow' | 'grape' | 'tangerine' | 'rainbow';

export interface TemplateFieldSpec {
    key: 'learner' | 'class' | 'school' | 'teacher' | 'principal' | 'date' | 'term' | 'marks' | 'awardReason' | 'message';
    label: string;
    /** Bilingual short label. */
    labelXi?: string;
    placeholder: string;
    /** Multi-line textarea instead of a single input. */
    multiline?: boolean;
    /** Field is required for this template (Studio highlights it). */
    required?: boolean;
}

export interface FoundationTemplate {
    /** kebab-case unique id, also the standalone filename. */
    id: string;
    kind: TemplateKind;
    /** Document title printed in the page banner. */
    title: string;
    /** Subtitle / topic line. */
    subtitle: string;
    /** Small line printed above the title (defaults to the EduAI CAPS kicker). */
    titleKicker?: string;
    /** One-teacher-sentence description shown in the gallery card. */
    blurb: string;
    grades: GradeScope[];
    learningArea: LearningArea;
    theme: TemplateTheme;
    /** Hero cartoon. */
    art?: ArtKey;
    /** Corner doodles around the border kit. */
    doodles?: ArtKey[];
    caps: CapsAlignment;
    /** Fill-in fields this template needs. */
    fields?: TemplateFieldSpec[];
    /** Body of the document. */
    blocks: Block[];
    /** Number of A4 pages this template is designed for. */
    pages?: 1 | 2;
    /** Extra print options honoured by the renderer. */
    options?: {
        /** Omit the memo page (Studio toggle overrides). */
        hideMemo?: boolean;
        /** Black-ink-friendly variant. */
        inkSaver?: boolean;
        /** Extra large print / dyslexia-friendly spacing. */
        largePrint?: boolean;
        /** Show bilingual instruction labels. */
        bilingual?: boolean;
    };
    /** Tags used by the Studio filter row + the standalone index page. */
    tags?: string[];
}

/** Values typed by the teacher in the Studio (or defaults in the pack). */
export interface TemplateFieldValues {
    learner?: string;
    class?: string;
    school?: string;
    teacher?: string;
    principal?: string;
    date?: string;
    term?: string;
    marks?: string;
    awardReason?: string;
    message?: string;
}

/** Render options shared by the Studio, print pipeline and pack builder. */
export interface RenderOptions {
    /** Where image URLs point: app root (`/illustrations/...`) or pack folder. */
    assetMode?: 'app' | 'standalone';
    /** Bilingual instruction labels language (other than English). */
    labelLanguage?: LabelLanguage;
    bilingual?: boolean;
    largePrint?: boolean;
    inkSaver?: boolean;
    showMemo?: boolean;
    /** Page titles for multi-page docs. */
    fields?: TemplateFieldValues;
    /** Print footer brand line. */
    brand?: string;
}
