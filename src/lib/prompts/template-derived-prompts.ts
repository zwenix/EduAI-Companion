/**
 * Built-in, type-specific generation prompts derived from the printable examples
 * in `assets/templates`.  The reference PDFs show a small set of repeatable
 * teaching patterns (worked visual explanation, learner worksheet, formal
 * assessment, SEL reflection sheet, Foundation Phase phonics chart and letter
 * tracing).  This catalog makes those patterns available to every generator,
 * while the type map below covers every choice in the Content Factory.
 *
 * Keep these prompts about pedagogy and information design.  The single
 * metadata/compliance banner is rendered by `contentTemplate.ts`, so the AI
 * never has to recreate metadata or guess the current date.
 */
import { ADMIN_TYPES, TEACHING_CATEGORIES, VISUAL_TYPES } from '../contentTypes';
import { currentSATerm, currentYear, saToday } from '../saDates';

export interface BuiltInContentPromptInput {
  contentType?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  term?: string;
  language?: string;
  duration?: string;
  totalMarks?: number | string;
  atpWeek?: number | string;
  capsReference?: string;
  school?: string;
  teacher?: string;
  learner?: string;
  generateImage?: boolean;
}

/**
 * One authoritative contract for classic and LIGHT v5 generation.  The host
 * merges the current title/header, document metadata, CAPS reference and
 * compliance labels into the one visible banner after generation.
 */
export const SINGLE_MERGED_BANNER_SYSTEM_PROMPT = `
SINGLE MERGED DOCUMENT BANNER (MANDATORY):
- EduAI's host renderer creates exactly ONE opening document banner. It merges the current content title/header with all available document data: grade, subject, content type, term, today's South African date (DD/MM/YYYY), supplied school/teacher/learner identity, marks/duration/phase when supplied, CAPS reference/code, and the 🇿🇦 / CAPS / NPA / POPIA / SIAS / WP6 compliance labels.
- Do NOT create a second page header, title banner, grade badge, metadata strip, CAPS/compliance strip or duplicate compliance/footer copy. Start the HTML fragment at the first substantive learning section. The banner title is the requested document title/topic; do not repeat that title as an opening body heading.
- Never invent metadata or legal/curriculum approval. The host supplies today's date and compliance labels; never add a different current date. A date that is lesson content remains valid.
- Learner-facing worksheets/tasks/assessments receive one canonical, empty Name / Grade / Date row immediately below the banner. Do not add another learner-identification row or pre-fill its fields. Put answer spaces and a marks/score box in the activity body only when useful.
- For a poster, chart or reference display, the banner is the title strip; do not repeat the title elsewhere. Keep the visual itself concise and teaching-focused.
`;

const TYPE_BLUEPRINTS: Readonly<Record<string, string>> = {
  // Lesson plans & notes
  'lesson plan': 'Build a teacher-ready lesson sequence with measurable objectives, prior-knowledge hook, explicit teaching/modeling, guided and independent practice, formative checks, differentiation, resources, realistic timings and a brief reflection. Keep learner-facing activities distinct from teacher notes.',
  'daily lesson notes': 'Create concise, usable daily teaching notes: objectives, key vocabulary, explanation/model, worked example, anticipated misconceptions, guided practice, checks for understanding, resources and a short closure. Prioritise reference notes over a test.',
  'weekly lesson plan': 'Plan a coherent week of sequenced lessons. For each day include focus, objective, teaching/learning activity, resources, assessment evidence and differentiation; keep time and curriculum coverage realistic.',
  'unit plan': 'Map the unit from learning outcomes through sequenced subtopics, lesson progression, resources, assessment checkpoints, vocabulary, inclusion and review. Show how each stage builds on the previous one.',
  'learning activity': 'Create an active, learner-centred task with a clear purpose, short instructions, required materials, an achievable sequence, response space and an observable success check. Do not turn it into a formal test unless requested.',
  'study guide learning notes': 'Write explanatory, textbook-like learning notes: chunk concepts into clear sections, define key terms, teach with worked examples and useful diagrams, then end with brief retrieval practice and study tips. Notes must be the main content, not a quiz.',
  'revision pack': 'Make a self-contained revision sequence that revisits the supplied term/topic through a quick summary, key vocabulary/formulae, worked examples, progressively harder practice, self-check and a complete answer guide when requested.',

  // Classroom tasks & exercises
  worksheet: 'Create a complete learner worksheet with short instructions, well-spaced numbered tasks, age-appropriate progression, varied response modes and generous printable answer space. Keep every task tied to the stated topic and provide a coherent mark total only when marks are requested.',
  'homework task': 'Design an independent, safely doable homework task with clear family-friendly instructions, realistic duration, materials that do not require spending money or internet access, answer space and an optional extension.',
  'classroom exercise': 'Produce a short, focused in-class practice set that moves from a supported example to independent application. Include clear directions, enough working space and a fast formative check.',
  'group activity': 'Give groups a shared goal, roles, materials, sequenced steps, collaboration norms, an inclusive contribution option and a brief product/reflection. Avoid tasks that require learners to disclose private experiences.',
  'reading comprehension': 'Supply a grade-appropriate original passage followed by literal, inferential and vocabulary questions. Keep the passage culturally respectful, the questions answerable from the text and the response space proportional to the expected answer.',
  'writing task': 'Set an authentic writing purpose, audience, genre and length appropriate to the grade. Provide planning prompts, a simple success checklist and enough lined writing space; do not write the learner’s response for them.',
  'research task': 'Create a safe, bounded inquiry with a clear research question, age-appropriate source guidance, note-taking organiser, fact-check step, attribution reminder and presentation/reflection options. Do not require personal data or unsupervised web access.',

  // Assessments
  'controlled test': 'Create a fair, formal test with concise instructions, balanced CAPS-relevant coverage, progressive cognitive demand, visible marks per question and section subtotals. Reconcile every subtotal and the grand total; keep answers in a separate memo.',
  examination: 'Create an examination paper with clear sections, timing, permitted resources only when supplied, progressive question demand, marks per item and internally consistent subtotals. Do not invent official exam rules or claim moderation/approval.',
  'formal assessment task fat': 'Design a formal assessment task with a clear task brief, expected evidence/product, criteria, marks and a matching rubric or memo. Keep the scope, total and cognitive demand appropriate to the supplied grade and term.',
  investigation: 'Frame an inquiry question, safe method, materials, observation/data table, analysis prompts and conclusion. Do not fabricate results; provide blank recording space and age-appropriate risk guidance.',
  'project brief': 'State the project purpose, deliverable, manageable milestones, required evidence, resources, submission format and transparent criteria. Distinguish required facts from optional creative choices and include a fit-for-purpose rubric.',
  'case study': 'Present a concise, fictional, privacy-safe case with enough relevant evidence to reason from. Ask sequenced comprehension, application and evaluation questions; do not assume facts not stated in the case.',
  'oral speech task': 'Give a clear speaking purpose, audience, suggested structure, preparation checklist, accessible delivery choices and a rubric covering content, organisation and communication. Do not penalise accent or disability-related communication differences.',
  'practical task experiment': 'Create a safe practical activity with question, materials, ordered method, observation table, analysis and conclusion. Flag adult supervision where appropriate and never invent observations or outcomes.',
  'portfolio task': 'Specify the portfolio evidence to collect, a simple organisation/reflection structure, privacy-safe presentation expectations and criteria. Allow suitable accessible formats and avoid requiring identifiable personal information.',
  'diagnostic assessment': 'Use a brief, low-stakes set that reveals prerequisite understanding and likely misconceptions. Label it diagnostic, not a high-stakes grade; include a teacher interpretation guide and next-step suggestions.',

  // Memos & rubrics
  'marking memo': 'Provide a complete question-by-question answer memo with correct solutions, method marks, acceptable alternatives and a checked total. Never add answers that do not correspond to the learner paper.',
  'assessment rubric': 'Create a transparent rubric with criteria, observable descriptors across performance levels, mark allocation and a consistent total. Use learner-friendly, non-deficit language and avoid vague labels such as “good”.',
  'analytical rubric': 'Break the product/performance into distinct assessable criteria. Describe observable quality at each level, allocate marks per criterion, and ensure the level scores add exactly to the stated total.',
  'holistic rubric': 'Write one coherent performance descriptor per achievement level, covering the whole task. Make levels meaningfully distinct, evidence-based and aligned to one explicit score range.',
  'checklist self assessment': 'Make a short, observable success checklist in learner language, with clear tick/reflect options. Each item must assess one criterion; include a next-step prompt without scoring private traits or effort as ability.',

  // Classroom displays
  'educational poster': 'Design a single-page teaching poster with one central idea, a short explanation, 3–6 accurate facts or steps and a clear visual hierarchy. Keep text brief and legible; use an illustration only when it clarifies the concept, not as decoration.',
  'word wall': 'Create a scannable word-wall set: one term per card, accurate spelling, learner-friendly meaning and a concise example or picture cue where useful. Keep card sizes, labels and reading direction consistent.',
  'vocabulary display': 'Present a focused vocabulary set with term, plain-language meaning, pronunciation or word parts when relevant, and one contextual example. Limit density for the grade and avoid synonyms that change the meaning.',
  'alphabet chart': 'Build a Foundation Phase alphabet/sound chart with clear upper- and lower-case forms, one familiar cue word per sound and optional simple action. Use large, uncluttered letterforms and do not mix incompatible phonics schemes.',
  'number chart number line': 'Make a mathematically correct number reference: show the supplied range, scale, direction, labels and intervals consistently. Include only requested number facts; check every sequence, operation and place-value label.',
  'times tables chart': 'Create a readable multiplication reference with clearly labelled factors and products. Verify every product, use a consistent row/column pattern and add a compact skip-counting or inverse-operation cue when grade-appropriate.',
  'classroom rules poster': 'Show 4–7 positive, specific, observable classroom expectations in short learner-facing language. Make them inclusive and respectful; do not invent punishments or imply a school policy that was not supplied.',
  'topic anchor chart': 'Build an anchor chart that captures the key question, essential vocabulary, a worked or labelled example and a compact recap. Use a clear visual reading path and make the examples accurate and reusable during teaching.',

  // Learning cards
  'flashcards term definition': 'Create a consistent two-sided card set: one clear retrieval cue on the front and a concise answer/example on the reverse. Number matching fronts/backs consistently and keep each card independently understandable.',
  'vocabulary cards': 'Create one vocabulary card per requested term with a readable term, accurate child-friendly definition and a short use-in-context example. Keep a uniform card grid and avoid adding unsupported “fun facts”.',
  'formula reference cards': 'Give each card one formula, define every symbol, state units/conditions where relevant and show one verified worked example. Distinguish formulas that look similar and do not invent a formula for an unspecified topic.',
  'timeline cards': 'Create date/event cards in verified chronological order. Keep event, date and explanation distinct; if a date is uncertain or not supplied, omit it rather than guessing.',
  'matching cards': 'Create two balanced, unambiguous sets that pair one-to-one. Label sets separately, avoid duplicate clues or unintended alternate matches, and provide a teacher key outside the cut-out area when requested.',
  'cut out activity cards': 'Make self-contained cut-out prompts with consistent trim-safe borders, one action per card, readable type and a clear sorting/sequence/matching instruction. Keep card content distinct from the teacher key.',

  // Diagrams & maps
  'mind map concept map': 'Organise the central concept and accurate sub-concepts into clearly labelled branches or links. Show relationships with meaningful connectors, not colour alone; use concise labels and avoid unsupported extra branches.',
  'educational diagram': 'Create a correctly labelled diagram with a clear key, logical spatial layout and concise annotations. Arrows must show the actual direction/relationship; do not use decorative labels that could teach a false fact.',
  infographic: 'Turn the supplied information into a concise visual narrative with a clear reading order, small set of grouped facts, labelled data and a source note only when supplied. Check every number and do not invent statistics.',
  'process flow diagram': 'Show the process as a correctly ordered, numbered sequence with labelled arrows and clear start/end points. Branches must be logically labelled; use only supplied or well-established steps.',
  'comparison chart': 'Compare the requested items on the same explicit criteria and units. Use parallel wording, neutral labels and readable rows/columns; do not imply a ranking unless the evidence supports one.',

  // Labels & organisers
  'classroom labels signs': 'Create a print-ready set of concise, high-contrast signs with consistent wording, readable type and clear visual grouping. Use only the room names or instructions supplied; do not add invented school branding.',
  'book labels': 'Make functional book labels with clear blank fields for learner name, class and subject only where appropriate. Keep fields empty, cut-safe and legible; do not prefill learner identity.',
  'book cover design': 'Design an original subject/topic cover with a readable title area, age-appropriate motif and optional blank learner/class fields. Do not copy a publisher cover, official crest or copyrighted character.',
  'certificate template': 'Create an editable, ceremonial certificate with blank recipient, achievement, issuer and date fields. Keep all claims and signatories generic unless supplied; never imply accreditation or invent an award recipient.',
  'award sticker template': 'Create a small set of short, positive, non-comparative achievement stickers. Keep each phrase suitable for children, avoid public rankings and use simple shapes that will remain legible at print size.',

  // Parent communication and school administration
  'letter to parents': 'Write a concise, warm, professional letter with the supplied recipient, purpose, essential details, requested action and appropriate closing. Preserve exact supplied dates/times and omit missing contact details.',
  'general notice to parents': 'Create a brief, scannable family notice with the supplied event or issue, who it affects, exact date/time/place if given and the action required. Do not invent urgency, policy or contact information.',
  'permission slip': 'Make a functional consent form with event details, clear consent/do-not-consent choices and blank learner/guardian/signature/return fields. Include only supplied risks, costs, dates and contacts; never prefill personal data.',
  'meeting invitation': 'State the meeting purpose, exact supplied date/time/location, intended participants and preparation or RSVP action if provided. Keep the tone welcoming and the document to one page.',
  'progress update letter': 'Summarise only the supplied learning evidence in constructive, strengths-based language, followed by a specific next step. Keep learner details private and do not invent grades, diagnoses or progress claims.',
  'report comment template': 'Provide an editable comment structure with strengths, evidence, one growth target and a supportive next step. Use neutral blank fields rather than inventing learner performance.',
  'general school notice': 'Write a neutral, scannable notice with a clear subject, audience, supplied facts and required action. Omit unknown dates, contact details, consequences and approvals.',
  'timetable template': 'Create a reusable timetable grid with clear day/time headings and empty editable slots. Use a supplied schedule only; do not invent lesson periods, breaks or school hours.',
  'attendance register': 'Create a privacy-conscious register with only the requested date/session, class and learner rows. Use blank name cells or supplied authorised names; avoid unnecessary personal identifiers.',
  'subject improvement plan': 'Set out evidence-based focus areas, baseline supplied by the user, actions, responsible roles, time checkpoints and measurable review indicators. Do not fabricate school results or guaranteed outcomes.',
  'school calendar event notice': 'Make one event announcement with the exact supplied date, time, venue, audience and preparation/RSVP details. Do not extrapolate a full calendar or invent event logistics.',
  'academic achievement certificate': 'Create an editable recognition certificate with blank/supplied recipient, achievement and signatory fields. Keep praise specific to the supplied accomplishment and never imply official accreditation.',
  'participation certificate': 'Recognise participation in the supplied activity with editable recipient/date/issuer fields. Use inclusive language and do not invent an award, result or endorsement.',
  'custom seal emblem': 'Design an original, non-governmental school motif from supplied identity details. Do not imitate the South African coat of arms, DBE marks, official seals or another organisation’s logo.',
  'official school letterhead': 'Lay out only supplied school name and contact/registration details with a restrained, original mark. Leave unknown fields blank/omitted and never imitate government branding or fabricate contact information.',
  'disciplinary notice': 'Use confidential, neutral, fact-based wording; distinguish reported facts from allegations, avoid shaming or presumed guilt, and state only the supplied review/next step. Do not invent a sanction or policy.',
  'classroom rules': 'Write 5–7 positive, observable learner expectations in respectful language. Keep them practical, inclusive and supportive; do not add threats, shame or unprovided school policy.',
  'homework policy letter': 'Present only the supplied or explicitly proposed homework expectations, purpose, family guidance and response path. Label a draft for review and do not invent sanctions or adopted policy.',
  'detention notice': 'Use a confidential, factual, non-shaming notice with only supplied reasons, dates, arrangements and next steps. Do not presume guilt or fabricate a policy, incident or penalty.',
  'achievement certificate': 'Create a celebratory, editable certificate using only supplied achievement details. Leave missing recipient/date/issuer fields blank and avoid implying official accreditation.',
};

/** All selectable Content Factory types must have a dedicated built-in brief. */
const ALL_SELECTABLE_TYPES = [...new Set([
  ...Object.values(TEACHING_CATEGORIES).flat(),
  ...Object.values(VISUAL_TYPES).flat(),
  ...Object.values(ADMIN_TYPES).flat(),
])];

const normalizeType = (value: string): string => String(value || '')
  .toLocaleLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[&/()+–—-]+/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const NORMALIZED_BLUEPRINTS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(TYPE_BLUEPRINTS).map(([type, prompt]) => [normalizeType(type), prompt]),
);

/**
 * Type-level reverse engineering of the reference PDFs. These instructions
 * adapt the PDF's structure to the request instead of copying its fixed grade,
 * examples, marks or potentially stale factual claims.
 */
export const REFERENCE_TEMPLATE_PROMPTS = {
  illustratedMultiplicationExplainer: {
    source: 'assets/templates/Multiplication for Grade 3 Learners.pdf',
    prompt: 'Use the reference’s brief concept-first sequence: multiplication as equal groups/repeated addition, a concrete visual model, a labelled array, one fully checked worked example, a compact times-table/skip-counting cue, and a short real-world link. Keep it an explanatory visual aid, not a worksheet; adapt numbers and language to the requested grade and topic.',
  },
  gradeThreeNumberPoster: {
    source: 'assets/templates/Number Poster Gr3.pdf',
    prompt: 'Use the reference as a number-literacy display: one central number idea, a readable number line or quantity model, place-value/number-word cues only when they match the requested topic, and a few checked examples. Keep the sequence and scale mathematically exact; do not guess the poster’s missing/unclear labels.',
  },
  gradeOneCvcBlendingWorksheet: {
    source: 'assets/templates/gr1-phonics-blending-cvc-words.pdf',
    prompt: 'Follow the CVC blending routine: show one phoneme per tile in left-to-right order, cue the learner to say/segment then blend, display the resulting simple word, and provide a separate write-it line. Use decodable words and the selected language/phonics progression; do not introduce consonant clusters or spellings not yet taught.',
  },
  gradeThreeLifeSkillsAssessment: {
    source: 'assets/templates/gr3-life-skills-assessment-term1-healthy-living.pdf',
    prompt: 'Use the sample’s accessible 30-mark assessment pattern only when the caller requests that total: 10 marks selected response, 10 marks true/false, and 10 marks short response, with checked subtotals. Keep healthy-living and personal-safety questions concrete, non-shaming, age-appropriate and answerable from taught content; include a separate accurate memo.',
  },
  gradeThreeMathematicsWorksheet: {
    source: 'assets/templates/gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf',
    prompt: 'Use three short, clearly separated practice sections when relevant: place value (hundreds/tens/units), familiar multiplication facts and fraction models. Provide enough working/drawing space, use South African decimal/currency conventions only when relevant, and check every answer and any stated total.',
  },
  gradeFourLifeSkillsReflection: {
    source: 'assets/templates/gr4-life-skills-worksheet-term2-emotions-relationships.pdf',
    prompt: 'Use a supportive sequence: identify a small set of emotions, match each with a safe coping strategy, then offer an optional private reflection sentence frame. Validate feelings, avoid forced disclosure, and direct a learner who feels unsafe to a trusted adult without asking them to describe sensitive experiences publicly.',
  },
  gradeFourSixMathematicsAssessment: {
    source: 'assets/templates/gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf and assets/templates/gr6-mathematics-assessment-term3-numbers-algebra-geometry-data.pdf',
    prompt: 'Use balanced assessment sections across the supplied strands (for example number/operations, fractions or algebra, geometry/measurement and data). Match the named grade’s methods, notation and cognitive demand; allocate visible marks, verify the exact total, and give a separate worked memo. Never mix grade-level content from another phase.',
  },
  gradeSevenLifeOrientationWorksheet: {
    source: 'assets/templates/gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf',
    prompt: 'Use a learning sequence of concise rights concepts, fictional scenarios that ask which right applies and why, then accurate health-prevention knowledge. Respect dignity and non-discrimination; use current, medically sound, non-stigmatising language, and recommend a trusted adult/health professional for personal concerns. Do not copy outdated or oversimplified health claims.',
  },
  gradeRPhonicsSoundChart: {
    source: 'assets/templates/grR-phonics-sound-chart-group1.pdf',
    prompt: 'For a Foundation Phase sound chart, pair each requested uppercase/lowercase grapheme with one familiar cue word and a simple optional movement/action. Use very large uncluttered cells, one sound per cell, and only the requested phonics sequence; verify letter-sound and cue-word matches.',
  },
  gradeRLetterTracing: {
    source: 'assets/templates/grR-phonics-tracing-letter-s.pdf',
    prompt: 'For Foundation Phase handwriting, show the target letter in a clear trace-to-copy progression: large dotted/outlined forms on handwriting guides, then independent writing space, followed by one familiar matching word/picture cue. Use correct stroke direction, generous spacing and no dense instructions.',
  },
} as const;

interface ReferencePromptRule {
  key: keyof typeof REFERENCE_TEMPLATE_PROMPTS;
  matches: (input: BuiltInContentPromptInput, values: string, grade: string) => boolean;
}

const REFERENCE_RULES: ReferencePromptRule[] = [
  {
    key: 'illustratedMultiplicationExplainer',
    matches: (input, values, grade) => /poster|visual aid|study guide|learning notes/.test(values)
      && /math|multipli/.test(values) && /multipli|equal groups|array/.test(values)
      && (!grade || grade === '3'),
  },
  {
    key: 'gradeThreeNumberPoster',
    matches: (input, values, grade) => /number chart|number line|number poster/.test(values)
      || (/poster|visual aid/.test(values) && /number/.test(values) && (!grade || grade === '3')),
  },
  {
    key: 'gradeOneCvcBlendingWorksheet',
    matches: (input, values, grade) => /worksheet|phonics|blending|cvc/.test(values)
      && /phonics|blending|cvc/.test(values) && (!grade || grade === '1' || grade === 'r'),
  },
  {
    key: 'gradeThreeLifeSkillsAssessment',
    matches: (input, values, grade) => /assessment|controlled test|examination|fat/.test(values)
      && /life skills|healthy living|personal safety/.test(values) && (!grade || grade === '3'),
  },
  {
    key: 'gradeThreeMathematicsWorksheet',
    matches: (input, values, grade) => /worksheet|homework|classroom exercise/.test(values)
      && /math|place value|multipli|fraction/.test(values) && (!grade || grade === '3'),
  },
  {
    key: 'gradeFourLifeSkillsReflection',
    matches: (input, values, grade) => /worksheet|learning activity|group activity/.test(values)
      && /life skills|emotion|relationship|feelings/.test(values) && (!grade || grade === '4'),
  },
  {
    key: 'gradeFourSixMathematicsAssessment',
    matches: (input, values, grade) => /assessment|controlled test|examination|fat/.test(values)
      && /math|number|algebra|geometry|data/.test(values) && ['4', '6'].includes(grade),
  },
  {
    key: 'gradeSevenLifeOrientationWorksheet',
    matches: (input, values, grade) => /worksheet|learning activity|classroom exercise/.test(values)
      && /life orientation|constitution|human rights|health/.test(values) && (!grade || grade === '7'),
  },
  {
    key: 'gradeRPhonicsSoundChart',
    matches: (input, values, grade) => /sound chart|alphabet chart|phonics chart|jolly phonics/.test(values)
      || (/phonics|alphabet chart/.test(values) && (!grade || grade === 'r')),
  },
  {
    key: 'gradeRLetterTracing',
    matches: (input, values, grade) => /letter tracing|handwriting practice|trace the letter|tracing sheet/.test(values)
      || (/worksheet|phonics/.test(values) && /trac|handwriting/.test(values) && (!grade || grade === 'r')),
  },
];

const normalizedGrade = (value: string): string => {
  const match = String(value || '').match(/(?:grade\s*)?([rR]|\d{1,2})/i);
  return match?.[1]?.toLowerCase() || '';
};

/** Return the reference-PDF prompt whose content/type best matches a request. */
export const referencePromptForContent = (
  input: BuiltInContentPromptInput = {},
): { key: keyof typeof REFERENCE_TEMPLATE_PROMPTS; source: string; prompt: string } | undefined => {
  const values = [input.contentType, input.subject, input.topic].filter(Boolean).join(' ').toLowerCase();
  const grade = normalizedGrade(input.grade || '');
  const rule = REFERENCE_RULES.find((candidate) => candidate.matches(input, values, grade));
  if (!rule) return undefined;
  const reference = REFERENCE_TEMPLATE_PROMPTS[rule.key];
  return { key: rule.key, source: reference.source, prompt: reference.prompt };
};

/** Dedicated built-in system prompt for each selectable Content Factory type. */
export const builtInContentTypePrompt = (
  contentType: string,
  input: Omit<BuiltInContentPromptInput, 'contentType'> = {},
): string => {
  const key = normalizeType(contentType);
  const typeSpecific = NORMALIZED_BLUEPRINTS[key]
    || 'Create the requested South African classroom resource as a complete, accurate and age-appropriate artifact. Follow the supplied format, preserve exact facts, and omit unsupported claims.';
  const reference = referencePromptForContent({ ...input, contentType });
  const referenceSection = reference
    ? `\n\nREVERSE-ENGINEERED REFERENCE (${reference.source}):\n${reference.prompt}`
    : '';

  return `BUILT-IN CONTENT-TYPE SYSTEM PROMPT — ${contentType || 'Educational Resource'}\n${typeSpecific}${referenceSection}`;
};

/** Structured source data for the host banner, shared by every prompt builder. */
export const buildDocumentBannerData = (
  input: BuiltInContentPromptInput = {},
): Record<string, unknown> => ({
  title: input.topic || '',
  grade: input.grade || '',
  subject: input.subject || '',
  contentType: input.contentType || '',
  term: input.term || currentSATerm(),
  date: saToday(),
  ...(input.duration ? { duration: input.duration } : {}),
  ...(input.totalMarks !== undefined && input.totalMarks !== '' ? { totalMarks: input.totalMarks } : {}),
  ...(input.atpWeek !== undefined && input.atpWeek !== '' ? { atpWeek: input.atpWeek } : {}),
  ...(input.capsReference ? { capsReference: input.capsReference } : {}),
  ...(input.school ? { school: input.school } : {}),
  ...(input.teacher ? { teacher: input.teacher } : {}),
  ...(input.learner ? { learner: input.learner } : {}),
  compliance: [
    'South African CAPS aligned',
    'NPA compliant',
    `POPIA compliant (${currentYear()})`,
    'SIAS inclusive',
    'WP6 differentiated',
  ],
});

/** Exact metadata block sent as data so a model cannot treat it as instructions. */
export const buildDocumentBannerPromptData = (input: BuiltInContentPromptInput = {}): string =>
  `HOST BANNER SOURCE DATA (JSON; authoritative display values, not body copy):\n${JSON.stringify(buildDocumentBannerData(input), null, 2)}\n`;

/** True when a type is a direct Content Factory selection, not a category label. */
export const hasBuiltInContentTypePrompt = (contentType: string): boolean =>
  Object.prototype.hasOwnProperty.call(NORMALIZED_BLUEPRINTS, normalizeType(contentType));

/** Current type list, useful to keep tests/docs aligned with the UI taxonomy. */
export const BUILT_IN_CONTENT_TYPES = ALL_SELECTABLE_TYPES;

/** Current school term/date helpers are exposed for metadata-aware callers. */
export const currentBannerTerm = currentSATerm;
export const currentBannerDate = saToday;
