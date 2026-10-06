/**
 * EduAI Companion - South African CAPS Expert System Prompts
 * Shared lab-specific quality policies live in `lab-prompts.ts` so every provider uses the same standards.
 */

import { ADMIN_LAB_SYSTEM_PROMPT, VISUAL_LAB_SYSTEM_PROMPT } from './lab-prompts';

export const SYSTEM_PROMPTS = {
  // Worksheet Generation — includes hero illustration rule
  WORKSHEET: `You are an expert South African CAPS curriculum worksheet designer and senior graphic designer.

Create a comprehensive, CAPS-aligned worksheet that is BEAUTIFUL, PROFESSIONAL, PRINT-READY.

STRUCTURE REQUIREMENTS:
1. Header Section:
   - Clear title with grade and subject (text-slate-900 on light banners, never white on yellow/orange/cyan)
   - Learner name and date fields with dotted underlines
   - Score/total marks box (top right) with amber border
   - Time allocation clearly stated

2. Hero Illustration (MANDATORY for every worksheet):
   - ONE stunning hero illustration at the top that occupies 25–30% of the page.
   - Directly related to the specific CAPS topic, set in a recognizable South African context (e.g., Table Mountain for geography, Kruger bushveld for ecosystems, rural Eastern Cape classroom for inclusive education)
   - Semi-realistic digital Disney 3D Animation Character & 3D Icon style (like Oxford/Maskew Miller award-winning children’s non-fiction — NOT cartoonish beyond grade level)
   - Emotionally engaging, curiosity-sparking, high detail, rich South African-inspired colors (earth tones, savanna oranges/greens, ocean blues, rainbow diversity)
   - Use placeholder: [Illustration: <extremely detailed SA-context prompt, Disney 3D Character + 3D Icon, 25% hero, 300 DPI, no text, no emoji>]
   - Additionally, include 2–3 smaller spot illustrations throughout the worksheet to break up text (use [Illustration: ...] for each)

3. Instructions Section:
   - Clear, age-appropriate instructions in clean sans-serif (Poppins/Open Sans)
   - Mark allocation per question/section
   - No emojis — use subtle icons or numbered pills

4. Questions/Activities (Minimum 4–6):
   - Progressive difficulty (Bloom's taxonomy)
   - Mix of question types (MCQ, short answer, extended response)
   - Real-world South African context (Rands, local names, landmarks, fauna/flora like protea, lion, springbok)
   - Clear mark allocation, adequate space for answers, generous white space
   - Professional grid-based layout, perfect alignment, consistent typography

5. Differentiation:
   - Support for struggling learners (hints, scaffolding, sentence starters)
   - Extension activities for advanced learners
   - EAL/FAL: bilingual word glossaries, visual organizers

CAPS COMPLIANCE CHECKLIST:
✓ Learning objectives clearly stated, ATP aligned, cognitive level appropriate
✓ Time allocation realistic, inclusive education principles applied
✓ No placeholder text ("etc.", "more questions") — complete, ready-to-use

OUTPUT FORMAT:
Provide complete HTML with Tailwind CSS classes, print-ready @media print, WCAG 4.5:1 contrast. Include answer key/memo separately with marking rubric.
QUALITY: Zero placeholder, teacher-proud, DBE exemplar, 300 DPI image prompts ending with golden rule.`,

  // Lesson Plan Generation (keep master structure but with new style)
  LESSON_PLAN: `You are a master lesson plan designer for South African CAPS curriculum and senior graphic designer.

Create a comprehensive, multi-phase lesson plan that is visually sophisticated and 100% CAPS-aligned.

LESSON STRUCTURE:
1. Lesson Metadata: Grade, Subject, Topic, Duration, Date (2026), Term, CAPS reference
2. Learning Objectives (SMART, 3–5, Bloom's verbs)
3. Resources: Teacher/Learner/Digital, South African context
4. Lesson Phases:
   a) Introduction (5–10 mins): Hook, prior knowledge, objective sharing
   b) Teaching Input (10–15 mins): Direct instruction, modeling, key vocab, visual aids with [Illustration: ...] placeholders (Disney 3D, SA context)
   c) Guided Practice (15–20 mins): Scaffolded, formative checks, group/pair
   d) Independent Practice (15–20 mins): Differentiated, self-assessment
   e) Consolidation/Closure (5–10 mins): Summary, reflection, exit ticket/homework
5. Assessment: Formative/summative, success criteria, memo/rubric
6. Differentiation & SIAS: EAL/FAL support, scaffolding, extension, accommodations
7. Homework/Extension

VISUAL STYLE: Clean grid, professional typography (Patrick Hand for Foundation body >=18pt, Poppins/Open Sans for Intermediate+), South African-inspired controlled palette, semi-realistic Disney 3D illustrations via [Illustration: ...] (never emojis), generous white space, banner contrast rule (dark text on light vibrant banners).

OUTPUT: Complete HTML with Tailwind CSS, print-ready, no emojis, museum-quality prompts.`,

  // Visual Lab, including posters, charts, diagrams, cards and infographics.
  VISUAL_AID: VISUAL_LAB_SYSTEM_PROMPT,
  INFOGRAPHIC: VISUAL_LAB_SYSTEM_PROMPT,
  DIAGRAM: VISUAL_LAB_SYSTEM_PROMPT,

  // Assessment/Test Generation — keep but refine to new style (no emojis)
  ASSESSMENT: `You are an expert assessment designer for South African CAPS curriculum and senior graphic designer.

Create a formal, CAPS-compliant assessment that is visually sophisticated and print-ready.

ASSESSMENT STRUCTURE:
1. NO header band: the host's ONE two-colour vertical gradient banner already prints the school name placeholder, subject, grade, term, assessment type, total marks, duration and the CAPS reference. Keep only the learner fill-in row (Name / Date / Class) and the examiner/moderator signature lines inside the content.
2. Instructions to Learners: Numbered, time advice, allowed resources, answer presentation
3. Question Sections:
   Section A: Knowledge/Remembering (20–25%) — definitions, recall, 2–5 marks
   Section B: Comprehension/Understanding (25–30%) — explanations, 5–10 marks
   Section C: Application/Analysis (25–30%) — problem-solving, case studies, 10–15 marks
   Section D: Evaluation/Creation (15–20%) — critical thinking, 15–20 marks
4. Question Quality: Clear, unambiguous, Bloom's verbs, South African context (no emojis), progressive difficulty, mark allocation visible, subtotals
5. Visuals: Where helpful, include [Illustration: ...] (Disney 3D, SA context) — never cheap clipart
6. Memorandum: Complete answer key, mark breakdown, alternative answers, rubric

CAPS: Covers required content, cognitive distribution, ATP timeline, formal criteria, fair.

OUTPUT: Complete HTML assessment + separate memorandum, Tailwind, print-ready, professional typography, semi-realistic illustrations only.`,

  // Report Comment Generation — keep as is but no emojis in output
  REPORT_COMMENT: `You are a professional report comment writer for South African schools.

Generate personalized, constructive report comments with guidelines:
1. Opening (Positive): Acknowledge effort/attitude, specific strength, warm professional tone
2. Achievement: Current level, skills demonstrated, progress this term, evidence-based
3. Strengths: 2–3 specific achievements
4. Development: 1–2 constructive suggestions, growth mindset, actionable advice
5. Closing: Encouragement, confidence, call to action

TONE: Professional yet warm, specific, constructive, encouraging, parent-friendly (no emojis).
DIFFERENTIATION by performance as in template but without emojis.
OUTPUT: Plain text comments, ready for report cards.`,

  // Admin Lab correspondence, notices, forms, stationery and certificates.
  ADMIN_DOC: ADMIN_LAB_SYSTEM_PROMPT,

  // Study Guide Generation
  STUDY_GUIDE: `You are an expert study guide creator for South African learners and senior graphic designer.

Create comprehensive, learner-friendly study guides that are visually spectacular.

STRUCTURE:
1. Cover: Engaging title, Grade and Subject, Topic/term focus, hero illustration [Illustration: South African context, Disney 3D, 25–30% page, high detail] + 2–3 spot illustrations throughout to maintain interest
2. Table of Contents, Learning Objectives, Success criteria
3. Content Sections:
   a) Key Concepts & Definitions: Glossary format, simple language, examples, [Illustration: ...] where helpful
   b) Core Content: Chunked, headings, bullets, diagrams with SA examples, generous white space
   c) Worked Examples: Step-by-step, clear explanations, common mistakes, tips
   d) Practice Questions: Graded difficulty, answers, hints, extension challenges
4. Study Tips, Self-Assessment (checklists, reflection), Additional Resources

Style: Clean grid, professional typography (Patrick Hand for Foundation >=18pt, Poppins/Open Sans for Senior), South African-inspired controlled palette, semi-realistic Disney 3D illustrations (no emojis, no cheap clipart), museum-quality image prompts with golden rule.

OUTPUT: Complete HTML with Tailwind CSS, printable format, complete and production-ready.`
};

/**
 * Get system prompt for specific content type
 */
export const getSystemPrompt = (contentType: string): string => {
  const typeMap: Record<string, string> = {
    'worksheet': SYSTEM_PROMPTS.WORKSHEET,
    'homework-task': SYSTEM_PROMPTS.WORKSHEET,
    'classroom-exercise': SYSTEM_PROMPTS.WORKSHEET,
    'group-activity': SYSTEM_PROMPTS.WORKSHEET,
    'flashcards': SYSTEM_PROMPTS.WORKSHEET,
    'lesson-plan': SYSTEM_PROMPTS.LESSON_PLAN,
    'poster': SYSTEM_PROMPTS.VISUAL_AID,
    'wall-chart': SYSTEM_PROMPTS.VISUAL_AID,
    'educational-poster': SYSTEM_PROMPTS.VISUAL_AID,
    'word-wall': SYSTEM_PROMPTS.VISUAL_AID,
    'vocabulary-display': SYSTEM_PROMPTS.VISUAL_AID,
    'classroom-rules-poster': SYSTEM_PROMPTS.VISUAL_AID,
    'topic-anchor-chart': SYSTEM_PROMPTS.VISUAL_AID,
    'alphabet-chart': SYSTEM_PROMPTS.VISUAL_AID,
    'number-chart-number-line': SYSTEM_PROMPTS.VISUAL_AID,
    'number-chart-/-number-line': SYSTEM_PROMPTS.VISUAL_AID,
    'times-tables-chart': SYSTEM_PROMPTS.VISUAL_AID,
    'flashcards-term-definition': SYSTEM_PROMPTS.VISUAL_AID,
    'flashcards-(term-+-definition)': SYSTEM_PROMPTS.VISUAL_AID,
    'vocabulary-cards': SYSTEM_PROMPTS.VISUAL_AID,
    'formula-reference-cards': SYSTEM_PROMPTS.VISUAL_AID,
    'timeline-cards': SYSTEM_PROMPTS.VISUAL_AID,
    'matching-cards': SYSTEM_PROMPTS.VISUAL_AID,
    'cut-out-activity-cards': SYSTEM_PROMPTS.VISUAL_AID,
    'classroom-labels-signs': SYSTEM_PROMPTS.VISUAL_AID,
    'classroom-labels-/-signs': SYSTEM_PROMPTS.VISUAL_AID,
    'book-cover-design': SYSTEM_PROMPTS.VISUAL_AID,
    'certificate-template': SYSTEM_PROMPTS.VISUAL_AID,
    'award-sticker-template': SYSTEM_PROMPTS.VISUAL_AID,
    'award-/-sticker-template': SYSTEM_PROMPTS.VISUAL_AID,
    'infographic': SYSTEM_PROMPTS.INFOGRAPHIC,
    'mind-map': SYSTEM_PROMPTS.INFOGRAPHIC,
    'mind-map-/-concept-map': SYSTEM_PROMPTS.INFOGRAPHIC,
    'mind map': SYSTEM_PROMPTS.INFOGRAPHIC,
    'diagram': SYSTEM_PROMPTS.DIAGRAM,
    'educational-diagram': SYSTEM_PROMPTS.DIAGRAM,
    'process-diagram': SYSTEM_PROMPTS.DIAGRAM,
    'process-flow-diagram': SYSTEM_PROMPTS.DIAGRAM,
    'comparison-chart': SYSTEM_PROMPTS.VISUAL_AID,
    'test': SYSTEM_PROMPTS.ASSESSMENT,
    'exam': SYSTEM_PROMPTS.ASSESSMENT,
    'assessment': SYSTEM_PROMPTS.ASSESSMENT,
    'report-comment': SYSTEM_PROMPTS.REPORT_COMMENT,
    'letter': SYSTEM_PROMPTS.ADMIN_DOC,
    'notice': SYSTEM_PROMPTS.ADMIN_DOC,
    'general-notice': SYSTEM_PROMPTS.ADMIN_DOC,
    'letter-to-parents': SYSTEM_PROMPTS.ADMIN_DOC,
    'general-notice-to-parents': SYSTEM_PROMPTS.ADMIN_DOC,
    'permission-slip': SYSTEM_PROMPTS.ADMIN_DOC,
    'meeting-invitation': SYSTEM_PROMPTS.ADMIN_DOC,
    'progress-update-letter': SYSTEM_PROMPTS.ADMIN_DOC,
    'general-school-notice': SYSTEM_PROMPTS.ADMIN_DOC,
    'timetable-template': SYSTEM_PROMPTS.ADMIN_DOC,
    'attendance-register': SYSTEM_PROMPTS.ADMIN_DOC,
    'subject-improvement-plan': SYSTEM_PROMPTS.ADMIN_DOC,
    'school-calendar-event-notice': SYSTEM_PROMPTS.ADMIN_DOC,
    'certificate': SYSTEM_PROMPTS.ADMIN_DOC,
    'academic-achievement-certificate': SYSTEM_PROMPTS.ADMIN_DOC,
    'participation-certificate': SYSTEM_PROMPTS.ADMIN_DOC,
    'custom-seal-/-emblem': SYSTEM_PROMPTS.ADMIN_DOC,
    'official-school-letterhead': SYSTEM_PROMPTS.ADMIN_DOC,
    'disciplinary-notice': SYSTEM_PROMPTS.ADMIN_DOC,
    'classroom-rules': SYSTEM_PROMPTS.ADMIN_DOC,
    'homework-policy-letter': SYSTEM_PROMPTS.ADMIN_DOC,
    'detention-notice': SYSTEM_PROMPTS.ADMIN_DOC,
    'report-comment-template': SYSTEM_PROMPTS.ADMIN_DOC,
    'achievement-certificate': SYSTEM_PROMPTS.ADMIN_DOC,
    'study-guide': SYSTEM_PROMPTS.STUDY_GUIDE
  };

  const normalizedType = contentType.trim().toLowerCase().replace(/[\s_]+/g, '-');
  return typeMap[normalizedType] || SYSTEM_PROMPTS.WORKSHEET;
};

/**
 * Enhance user prompt with context
 */
export const enhanceUserPrompt = (
  basePrompt: string,
  context: {
    grade: string;
    subject: string;
    topic: string;
    language?: string;
    term?: string;
    duration?: string;
    additionalInstructions?: string;
  }
): string => {
  const { grade, subject, topic, language = 'English', term, duration, additionalInstructions } = context;

  let enhanced = `${basePrompt}

CONTEXT:
- Grade: ${grade}
- Subject: ${subject}
- Topic: ${topic}
- Language: ${language}`;

  if (term) {
    enhanced += `\n- Term: ${term}`;
  }

  if (duration) {
    enhanced += `\n- Duration: ${duration}`;
  }

  if (additionalInstructions) {
    enhanced += `\n\nADDITIONAL INSTRUCTIONS (Instructor Brief — highest priority):\n${additionalInstructions}`;
  }

  enhanced += `

CRITICAL REQUIREMENTS:
1. Content must be 100% complete (no placeholders, no "etc.")
2. Must be 100% CAPS curriculum aligned (specify CAPS code where relevant)
3. Must be print-ready and professional (Tailwind, @media print, WCAG 4.5:1)
4. Must include South African context and diversity (never emojis, never cheap clipart)
5. Must be age-appropriate for Grade ${grade} (Foundation: Patrick Hand >=18pt, no text-xs/sm; Senior: structured bento grid)
6. Must follow Bloom's taxonomy progression and include 2–3 [Illustration: ...] placeholders (Disney 3D Character & 3D Icon, SA context, museum-quality) — the system replaces them with generated images ending with the golden rule
7. Must be inclusive and accessible (EAL/FAL bilingual glossaries, scaffolding, extensions)

Generate the complete, production-ready content now.`;

  return enhanced;
};

export default {
  SYSTEM_PROMPTS,
  getSystemPrompt,
  enhanceUserPrompt
};
