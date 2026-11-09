<!-- GENERATED FILE — do not edit by hand.
     Source of truth: src/lib/prompts/template-library/visual-system.ts and
     src/lib/prompts/template-library/lesson-plan-contract.ts
     Regenerate with: npm run build:prompts -->

# Reverse-engineered anatomy — the measurements behind every prompt

This file records what was actually measured from the reference files in
`assets/templates/`, so a prompt change can be checked against evidence rather
than taste.

---

## 1. Page geometry and type ramp

| Property | Measured value |
| :--- | :--- |
| Page | A4 portrait (210 × 297 mm) |
| Page padding | 14 mm |
| Banner height | 7–9% of the page |
| Section bar radius | 9999px (fully rounded pill) |
| Card radius | 1.5rem–2rem |
| Block gap | 20–28 px |
| Title | 28–34 px, 800–900 weight |
| Subtitle | 16–18 px, 500 weight |
| Section bar label | 15–17 px, 700 weight, white on the bar colour |
| Body | 14–15 px, 500 weight, line-height 1.6 |
| Marks | 12–13 px, 700 weight, right-aligned in [square brackets] |
| Footer | `EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io` |

---

## 2. Measured palettes (dominant-colour quantisation of the rendered pages)

| Palette | Source file | Header | Body | Section bars | Accent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mathematics-worksheet` | `gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf` | `#1189B1` | `#E2F6FB` | `#1189B1` `#05B79E` `#9A5DE4` | `#0F7A9E` |
| `mathematics-assessment` | `gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf` | `#1189B1` | `#E2F6FB` | `#1189B1` `#05B79E` `#9A5DE4` | `#0F7A9E` |
| `life-skills-assessment` | `gr3-life-skills-assessment-term1-healthy-living.pdf` | `#F67E00` | `#FFF2DF` | `#F6830C` `#1189B1` `#9A5DE4` | `#C25E00` |
| `life-skills-worksheet` | `gr4-life-skills-worksheet-term2-emotions-relationships.pdf` | `#388E3B` | `#F0F8E8` | `#F6830C` `#9A5DE4` `#1189B1` | `#2C6E2E` |
| `life-orientation-worksheet` | `gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf` | `#EF466E` | `#FFEFF2` | `#EF466E` `#9A5DE4` `#1189B1` | `#C22B50` |
| `phonics-chart` | `grR-phonics-sound-chart-group1.pdf` | `#1189B1` | `#FFFFFF` | `#EF466E` `#F6830C` `#05B79E` `#9A5DE4` `#EF466E` `#1189B1` | `#0F7A9E` |
| `phonics-blending` | `gr1-phonics-blending-cvc-words.pdf` | `#05D6A0` | `#FFFFFF` | `#A8E063` `#F6830C` | `#03A87E` |
| `weekly-planner` | `about_blank_1.pdf` | `#13B7A6` (gradient) | `#FFFFFF` | `#13B7A6` `#F59E0B` `#FDE68A` | `#1BA9B8` |
| `number-poster` | `Number Poster Gr3.pdf` | `#1E293B` | `#1E293B` | `#EF4444` `#F59E0B` `#22C55E` `#3B82F6` | `#F27650` |

**Note:** these are the palettes the *reference documents* print inside their own
header. The ONE host banner still takes its gradient from
`src/lib/bannerPalettes.ts`, which is unchanged and remains the single source of
truth for the banner.

---

## 3. The lesson plan contract (from `GFr3LPFull_Copy.pdf`)

The reference plan is a five-page Grade 3 Life Skills lesson on Basic First Aid.
Its structure is now the **mandatory** structure of every lesson plan the app
generates, in every doctrine.

### The eight blocks, in order

- 1. Banner — three pills, the topic as the H1, "Topic: …" as the subtitle, and the Date · Duration · Class Size row
- 2. 🎯 Aim of the Lesson — "At the end of this lesson, learners will be able to:" and four ✓ objectives
- 3. 🎒 Resources Needed — "For the Teacher:" and "For the Learners:" bullet lists
- 4. 🧠 Prior Knowledge & Preparation — one preparation paragraph plus the 💡 "CAPS Connection:" callout
- 5. 📑 Core Content & Key Concepts — numbered concept cards ("1. …" + "Action: …") plus the 🚨 "Emergency Rule:" callout
- 6. ⏰ Lesson Procedure — the five timed phases below
- 7. 💙 Inclusive Education & Differentiation — "For Struggling Learners:" and "For Advanced Learners:" cards
- 8. 📝 Teacher Reflection Notes (Year ____) — the prompt sentence and a dashed writing box

### The five procedure phases and their minutes

| Phase | Name | Minutes (2-hour reference) |
| :--- | :--- | ---: |
| 1 | Introduction & Hook | 15 |
| 2 | Direct Instruction & Demonstration | 30 |
| 3 | Guided Practice | 25 |
| 4 | Independent Practice & Worksheet | 35 |
| 5 | Closure & Summary | 15 |
| | **Total** | **120** |

`scaleLessonPhases(duration)` keeps this split proportionally for any other
duration, so a 1-hour lesson still carries all five phases.

### What each phase must contain

  Phase 1: Introduction & Hook (15 Minutes)
    Open with a concrete, physical hook the teacher acts out (the reference: the teacher pretends to bump an arm against the whiteboard and asks "Ouch! What should I do if this starts to bleed? Whom should I ask for help?"), give learners 2 minutes of pair talk, then name the topic and say how it connects to real life. Include the exact words the teacher says.
  Phase 2: Direct Instruction & Demonstration (30 Minutes)
    Teach the core content with the whiteboard or chart, using the three or four key concepts from Core Content. Name the real physical objects the teacher holds up (the reference: a clean plaster, cotton wool and a bandage). Explain WHY each rule exists (the reference: why we do not tilt the head back for a nosebleed, why butter or oil on a burn is dangerous) and state the safety precaution out loud. Include one sentence describing the illustration the learners look at.
  Phase 3: Guided Practice (25 Minutes)
    Give the exact pairing or grouping instruction (the reference: divide the class of 35 into pairs, one learner acting as the injured child and the other as the first helper) and two or three named, scripted scenarios with South African learner names (the reference: "Scenario 1: Zola has a nosebleed…", "Scenario 2: Liam scraped his knee…"). End with the teacher monitoring instruction.
  Phase 4: Independent Practice & Worksheet (35 Minutes)
    Explain how the attached learner worksheet is distributed and completed individually, and restate the support the teacher gives while walking the room (reading slowly for learners who need phonetic guidance, assisting learners with barriers).
  Phase 5: Closure & Summary (15 Minutes)
    Close with a named interactive game the whole class can play (the reference: "True or False First Aid" — learners cross their arms for False), give two or three exact questions with their answers, and end on the one fact learners must remember (the reference: emergency numbers 112 from a cell phone and 10111 from a landline).

### The appended learner worksheet

Only when the teacher asks for it. Four questions totalling 15 marks: a
match-up, true/false, a cloze short-answer and a drawing box, under a
`SCORE ____ / 15` capsule and a copyright line.

---

## 4. Where these measurements are enforced

| Measurement | Enforced in |
| :--- | :--- |
| Lesson-plan blocks | `src/lib/prompts/template-library/lesson-plan-contract.ts` (imported by the classic, LIGHT v5, CAPS-service and system-prompt paths) |
| Per-content-type anatomy | `src/lib/prompts/template-library/<type>.ts` → `buildContentTypePrompt()` |
| Anatomy appended to the shared pipeline | `contentTypeAnatomyBrief()` in `src/lib/prompt-engine.ts → assemblePrompt()` |
| Banner gradients | `src/lib/bannerPalettes.ts` (unchanged) |
| Dates | `src/lib/saDates.ts` (`dateMandate()`) |
| Contract tests | `tests/template-library.test.ts` |
