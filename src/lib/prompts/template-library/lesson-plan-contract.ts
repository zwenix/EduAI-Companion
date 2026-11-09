/**
 * THE LESSON PLAN CONTENT CONTRACT
 *
 * Reverse-engineered from `GFr3LPFull_Copy.pdf` — the reference Grade 3 Life
 * Skills lesson plan ("Personal and Social Well-being · Basic First Aid") that
 * was supplied as the house standard. Every lesson plan the app generates,
 * from every engine and every doctrine, must contain exactly these blocks, in
 * exactly this order, with exactly these headings.
 *
 *  1. Banner  — pills + topic + subtitle + date/duration/class-size row
 *  2. 🎯 Aim of the Lesson                  (4 measurable objectives)
 *  3. 🎒 Resources Needed                   (For the Teacher / For the Learners)
 *  4. 🧠 Prior Knowledge & Preparation      (+ 💡 CAPS Connection callout)
 *  5. 📑 Core Content & Key Concepts        (+ 🚨 Emergency Rule callout)
 *  6. ⏰ Lesson Procedure                   (5 timed phases)
 *  7. 💙 Inclusive Education & Differentiation (struggling / advanced)
 *  8. 📝 Teacher Reflection Notes (Year ____)
 *  9. Optional appended learner worksheet
 *       SCORE ___ / N · title · subtitle · LEARNER NAME / DATE
 *       Q1 Match-up [n] · Q2 True/False [n] · Q3 Short Answer / cloze [n]
 *       Q4 Drawing box [n] · copyright line
 *
 * The same constant feeds the Classic prompt, the LIGHT v5 prompt, the CAPS
 * lesson-plan system prompt and `assets/templates/instructions/lesson-plan.md`, so
 * the four can never drift apart.
 */

import { currentYear } from '../../saDates';

/** The five procedure phases the reference plan uses, with their minutes. */
export interface LessonPhaseSpec {
  /** Phase number, 1-based. */
  n: number;
  /** Exact heading the plan prints, without the numbering. */
  name: string;
  /** Minutes for the reference two-hour lesson. */
  minutes: number;
  /** What the phase must contain. */
  must: string;
}

/**
 * The reference plan's phase table. Minutes are for a 2-hour lesson
 * (15 + 30 + 25 + 35 + 15 = 120). `scaleLessonPhases()` keeps the same split
 * proportionally for a different duration, so a 1-hour lesson still carries all
 * five phases.
 */
export const LESSON_PROCEDURE_PHASES: readonly LessonPhaseSpec[] = [
  {
    n: 1,
    name: 'Introduction & Hook',
    minutes: 15,
    must:
      'Open with a concrete, physical hook the teacher acts out (the reference: the teacher pretends to bump an arm against the whiteboard and asks "Ouch! What should I do if this starts to bleed? Whom should I ask for help?"), give learners 2 minutes of pair talk, then name the topic and say how it connects to real life. Include the exact words the teacher says.',
  },
  {
    n: 2,
    name: 'Direct Instruction & Demonstration',
    minutes: 30,
    must:
      'Teach the core content with the whiteboard or chart, using the three or four key concepts from Core Content. Name the real physical objects the teacher holds up (the reference: a clean plaster, cotton wool and a bandage). Explain WHY each rule exists (the reference: why we do not tilt the head back for a nosebleed, why butter or oil on a burn is dangerous) and state the safety precaution out loud. Include one sentence describing the illustration the learners look at.',
  },
  {
    n: 3,
    name: 'Guided Practice',
    minutes: 25,
    must:
      'Give the exact pairing or grouping instruction (the reference: divide the class of 35 into pairs, one learner acting as the injured child and the other as the first helper) and two or three named, scripted scenarios with South African learner names (the reference: "Scenario 1: Zola has a nosebleed…", "Scenario 2: Liam scraped his knee…"). End with the teacher monitoring instruction.',
  },
  {
    n: 4,
    name: 'Independent Practice & Worksheet',
    minutes: 35,
    must:
      'Explain how the attached learner worksheet is distributed and completed individually, and restate the support the teacher gives while walking the room (reading slowly for learners who need phonetic guidance, assisting learners with barriers).',
  },
  {
    n: 5,
    name: 'Closure & Summary',
    minutes: 15,
    must:
      'Close with a named interactive game the whole class can play (the reference: "True or False First Aid" — learners cross their arms for False), give two or three exact questions with their answers, and end on the one fact learners must remember (the reference: emergency numbers 112 from a cell phone and 10111 from a landline).',
  },
] as const;

/** Total minutes the reference phase table assumes. */
export const LESSON_PROCEDURE_TOTAL_MINUTES = LESSON_PROCEDURE_PHASES.reduce(
  (sum, phase) => sum + phase.minutes,
  0,
);

/**
 * Scale the reference phase split to a requested duration.
 *
 * `"2 hours"` / `"120 min"` / `"2 x 60 min periods"` all resolve to 120 minutes
 * and therefore return the reference minutes unchanged. An unparseable duration
 * falls back to the two-hour reference plan rather than inventing a split.
 */
export const scaleLessonPhases = (duration?: string): LessonPhaseSpec[] => {
  const text = String(duration ?? '');
  let minutes = LESSON_PROCEDURE_TOTAL_MINUTES;

  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*(?:hours?|uur|hrs?)\b/i);
  const periods = text.match(/(\d+)\s*x\s*(\d+)\s*(?:min|minutes?)/i);
  const plainMinutes = text.match(/(\d+)\s*(?:min|minutes?)\b/i);

  if (periods) minutes = Number(periods[1]) * Number(periods[2]);
  else if (hours) minutes = Math.round(Number(hours[1].replace(',', '.')) * 60);
  else if (plainMinutes) minutes = Number(plainMinutes[1]);

  if (!Number.isFinite(minutes) || minutes <= 0) minutes = LESSON_PROCEDURE_TOTAL_MINUTES;

  // Keep the reference integers exactly when the duration is the reference one.
  if (minutes === LESSON_PROCEDURE_TOTAL_MINUTES) return [...LESSON_PROCEDURE_PHASES];

  const exact = LESSON_PROCEDURE_PHASES.map((phase) => (phase.minutes / LESSON_PROCEDURE_TOTAL_MINUTES) * minutes);
  const rounded = exact.map((value) => Math.max(1, Math.round(value)));
  // Push the rounding drift onto the largest phase so the total still adds up.
  const drift = minutes - rounded.reduce((sum, value) => sum + value, 0);
  const largest = exact.indexOf(Math.max(...exact));
  rounded[largest] = Math.max(1, rounded[largest] + drift);

  return LESSON_PROCEDURE_PHASES.map((phase, index) => ({ ...phase, minutes: rounded[index] }));
};

/** Render the phase table for a prompt, scaled to the requested duration. */
export const lessonPhaseTable = (duration?: string): string =>
  scaleLessonPhases(duration)
    .map((phase) => `  Phase ${phase.n}: ${phase.name} (${phase.minutes} Minutes)\n    ${phase.must}`)
    .join('\n');

/* ────────────────────────────────────────────────────────────────────────────
 * The blocks, verbatim
 * ──────────────────────────────────────────────────────────────────────────── */

/** The eight mandatory blocks of every lesson plan, in printed order. */
export const LESSON_PLAN_BLOCKS: readonly string[] = [
  '1. Banner — three pills, the topic as the H1, "Topic: …" as the subtitle, and the Date · Duration · Class Size row',
  '2. 🎯 Aim of the Lesson — "At the end of this lesson, learners will be able to:" and four ✓ objectives',
  '3. 🎒 Resources Needed — "For the Teacher:" and "For the Learners:" bullet lists',
  '4. 🧠 Prior Knowledge & Preparation — one preparation paragraph plus the 💡 "CAPS Connection:" callout',
  '5. 📑 Core Content & Key Concepts — numbered concept cards ("1. …" + "Action: …") plus the 🚨 "Emergency Rule:" callout',
  '6. ⏰ Lesson Procedure — the five timed phases below',
  '7. 💙 Inclusive Education & Differentiation — "For Struggling Learners:" and "For Advanced Learners:" cards',
  '8. 📝 Teacher Reflection Notes (Year ____) — the prompt sentence and a dashed writing box',
];

/**
 * The block-by-block contract, ready to paste into any prompt.
 *
 * This is what makes "every lesson plan contains the same content as the
 * attached plan" true regardless of which engine generated it.
 */
export const LESSON_PLAN_CONTENT_CONTRACT = `LESSON PLAN CONTENT CONTRACT (reverse-engineered from the EduAI house lesson plan — mandatory, in this order):

${LESSON_PLAN_BLOCKS.join('\n')}

BANNER (the plan opens on this band — one mode applies, never both):
- MODE A (host banner, the LIGHT v5 doctrine): the host app already renders the ONE two-colour vertical gradient banner carrying the title, the grade/subject/term/content-type/date pills and the CAPS reference. Then do NOT emit a header of your own — start at "🎯 Aim of the Lesson". The three pills and the "Topic: …" subtitle are already printed for you.
- MODE B (you build the page, the Classic doctrine): build exactly one full-width gradient band:
  • Three pill badges across the top: "CAPS ALIGNED", "<SUBJECT>: GRADE <n>", "TERM <t> • WEEK <w>".
  • The topic in large white display type as the page H1 (e.g. "Personal and Social Well-being").
  • A subtitle line reading exactly "Topic: <specific topic>" (e.g. "Topic: Basic First Aid (Cuts, Burns & Nosebleeds)").
  • One metadata row: "📅 Date: <today's date, or blank>", "⏱ Duration: <duration>", "👥 Class Size: <n> Learners".
  • Never add a second header, school crest band or CAPS reference bar.

AIM OF THE LESSON:
- Lead-in sentence exactly: "At the end of this lesson, learners will be able to:"
- Exactly four objectives, each a green ✓ bullet, each one sentence and observable (identify / recall / demonstrate / differentiate).

RESOURCES NEEDED:
- "For the Teacher:" — the CAPS-approved textbook with page numbers, the physical demonstration kit, and any chart used.
- "For the Learners:" — exercise book and writing materials, plus the worksheet handout.

PRIOR KNOWLEDGE & PREPARATION:
- One paragraph: what learners already know from the previous grade, how the room is arranged for the lesson (the reference arranges desks in a semi-circle around a demonstration area), and the safety check the teacher performs first.
- A highlighted callout with the heading "CAPS Connection:" naming the CAPS sub-field and the life skill the lesson builds.

CORE CONTENT & KEY CONCEPTS:
- Three to five numbered concept cards. Each prints a numbered bold heading and a paragraph beginning "Action:" that gives the exact steps a learner must take.
- One 🚨 "Emergency Rule:" callout in red (or the subject's equivalent "Golden Rule" callout) stating the three-step rule in one line, separated by • bullets.

LESSON PROCEDURE (five phases, each an amber pill label "Phase N: <Name> (<n> Minutes)" followed by prose):
${lessonPhaseTable()}

INCLUSIVE EDUCATION & DIFFERENTIATION:
- Two equal cards side by side: "For Struggling Learners:" (2–3 bullets: symbol cards instead of long reading, paired verbal explanations, reduced writing) and "For Advanced Learners:" (2–3 bullets: a written/described extension, a home-or-classroom design task, a multi-step scenario).

TEACHER REFLECTION NOTES:
- Heading "📝 Teacher Reflection Notes (Year ${currentYear()})".
- The sentence "Use this space to reflect on the success of the lesson:".
- A dashed writing box containing two italic guiding questions specific to this lesson (the reference: "Did the hands-on roleplay keep the Grade 3 learners engaged? Were there any misunderstandings regarding blood safety? Note down adjustments for next week's physical safety class.").

QUALITY RULES THAT APPLY TO EVERY BLOCK:
- Rich prose, never headings-only: every objective, resource, activity and strategy is a full, teachable sentence (3–4 sentences per concept card).
- Word-for-word teacher scripts where the teacher speaks, written as Teacher Spoken Script (Say this): "[…]".
- Named South African learners and complete dialogues in the scenarios (Zola, Liam, Thabo, Amina…).
- Zero placeholders: no "etc.", no "[insert]", no "details here".
- Dates are blank for handwriting except the banner date; never invent a date.`;

/**
 * The appended learner worksheet contract — the reference plan carries a
 * four-question, 15-mark worksheet after the reflection block.
 */
export const LESSON_PLAN_WORKSHEET_CONTRACT = `APPENDED LEARNER WORKSHEET (only when the teacher asks for one) — reverse-engineered from the same reference plan:

1. SCORE card: a pale amber rounded box reading "SCORE" and "______ / <total>" (the reference uses 15 marks). No absolute positioning.
2. A pill line: "🇿🇦 EduAI Companion • <Subject> Grade <n> • Term <t>".
3. A creative worksheet title themed on the lesson (e.g. "First Aid Heroes Worksheet") and one playful subtitle line ("Let's learn how to keep ourselves and our friends safe! ✨").
4. A LEARNER NAME / DATE row, both blank, the date ending in the current year only.
5. Question 1 — Quick Connections (Match-up) [5 Marks]: instruction "Draw a straight line to connect the <left> on the left with the correct <right> on the right."; five lettered A–E options in pale capsules on the left and five numbered 1–5 options in pale capsules on the right.
6. Question 2 — True or False [4 Marks]: instruction "Circle the correct answer (T or F) for each <noun>."; four statements a) – d), each with a green T circle and a red F circle at the right edge.
7. Question 3 — Short Answer [3 Marks]: a one-sentence scenario with a named learner, then three numbered cloze sentences with long ruled blanks.
8. Question 4 — <Topic> Hero (Drawing) [3 Marks]: an instruction listing what to draw, and a dashed rectangle with centred pale text "[Draw your pictures here]".
9. Closing line: "Copyright © ${currentYear()} EduAI Companion. All Rights Reserved."

Mark totals must add up exactly to the stated total. Every question is a real, answerable question — never "question here".`;

export default LESSON_PLAN_CONTENT_CONTRACT;
