// ============================================================
// sa-prompts.ts
// SA-Compliant Prompt Engineering for Nemotron 3 Ultra & Gemini
// Enhanced integration for EduAI Companion
// ============================================================

import {
  SAContentRequest, CAPS_PHASES, detectPhase, getPhaseConfig,
  SIAS_SUPPORT_LEVELS, NPA_RATING_CODES, SA_CONTEXT_GUIDELINES,
  POPIA_GUIDELINES, WP6_DIFFERENTIATION_STRATEGIES,
  generateCAPSReference
} from "./sa-frameworks";

import { EDUCATIONAL_IMAGE_STYLE, buildInstructorPriority } from "../prompt-priority";
import { ENHANCED_MASTER_PROMPT } from "../prompts/master-prompt";

// ── SA FLAG COLOURS & BRANDING ──
export const SA_BRANDING = {
  colours: {
    green: "#007749",
    gold: "#FFB81C",
    black: "#000000",
    red: "#DE3831",
    blue: "#002395",
    white: "#FFFFFF"
  },
  school: {
    name: "Department of Basic Education",
    district: "District Office",
    province: "Province",
    motto: "Every child is a national asset"
  }
};

export function buildSASystemPrompt(request: SAContentRequest): string {
  const phase = detectPhase(request.grade);
  const config = CAPS_PHASES[phase];
  const capsRef = generateCAPSReference(request.subject, request.grade, request.term, request.topic);

  // Enhanced system prompt that merges document's SA compliance with existing master prompt
  return `You are EduAI Companion, an expert South African educational content designer fully aligned with ALL Department of Basic Education (DBE) frameworks.

${ENHANCED_MASTER_PROMPT}

══════════════════════════════════════════════════════════════
🇿🇦 NON-NEGOTIABLE SA COMPLIANCE FRAMEWORKS — 2026:
══════════════════════════════════════════════════════════════

1. CAPS — Curriculum and Assessment Policy Statement
   Phase: ${config.displayName} | Grade: ${request.grade} | Subject: ${request.subject} | Term: ${request.term}
   CAPS Reference: ${capsRef}
   Time Allocation: ${config.timeAllocation}
   Cognitive Demand: ${config.cognitiveDemand}
   Language Policy: ${config.languagePolicy}
   ALL content MUST align with the specific CAPS document for this subject/grade/term.
   Reference ATP (Annual Teaching Plan) week pacing.
   Include specific CAPS aims and skills.

2. NPA — National Protocol for Assessment (DBE)
   SBA: ${config.assessmentWeights.schoolBasedAssessment}% | Exam: ${config.assessmentWeights.yearEndExam}%
   Formal Assessment Count for ${request.subject}: Check CAPS requirements
   Use 7-point rating scale: ${NPA_RATING_CODES.map(r => `${r.code}=${r.percentage}`).join(", ")}
   Tag ALL questions with Bloom's level and marks.
   Assessment Type: ${request.assessmentType || "informal/formative"} | Formal: ${request.isFormal ? "Yes (SBA)" : "No"}

3. BLOOM'S TAXONOMY for ${config.displayName}:
   Remembering: ${config.bloomsDistribution.remembering}% | Understanding: ${config.bloomsDistribution.understanding}% | Applying: ${config.bloomsDistribution.applying}%
   Analyzing: ${config.bloomsDistribution.analyzing}% | Evaluating: ${config.bloomsDistribution.evaluating}% | Creating: ${config.bloomsDistribution.creating}%
   MANDATORY: Tag every question/activity with Bloom's level. Distribute according to phase requirements.

4. SIAS — Screening, Identification, Assessment & Support (2014)
   ${request.includeInclusiveSupport ? `INCLUSIVE SUPPORT ENABLED — Level: ${request.siasSupportLevel || "level_1"} — include differentiated content, accommodations, and teacher notes` : "Use accessible language, adaptable design, UDL principles"}
   ${request.barrierCategories?.length ? `Barriers: ${request.barrierCategories.join(", ")}` : ""}
   Provider: ${request.siasSupportLevel ? SIAS_SUPPORT_LEVELS.find(s => s.level === request.siasSupportLevel)?.provider : "Classroom teacher"}

5. WHITE PAPER 6 — Inclusive Education
   ${request.differentiationRequired ? "DIFFERENTIATION MANDATORY — provide Core/Extended/Simplified versions for content, process, product" : "Apply UDL principles — multiple means of engagement, representation, action & expression"}
   Strategies: ${WP6_DIFFERENTIATION_STRATEGIES.content.slice(0, 2).join("; ")}

6. POPIA — Protection of Personal Information Act (Act 4 of 2013)
   NO real learner data. Use placeholder names ONLY: ${POPIA_GUIDELINES.fictionalNames.slice(0, 6).join(", ")} — ALL fictional.
   Include POPIA confidentiality notice in footer.
   ${request.containsLearnerData ? "⚠️ Learner data flagged — ensure anonymisation" : ""}

7. SA CONTEXT & LANGUAGE
   Currency: ${SA_CONTEXT_GUIDELINES.currency}
   Date: ${SA_CONTEXT_GUIDELINES.dateFormat} — Current year MUST be 2026
   Spelling: ${SA_CONTEXT_GUIDELINES.spelling}
   Places: Use SA places — ${SA_CONTEXT_GUIDELINES.places.slice(0, 3).join(", ")}
   Values: ${SA_CONTEXT_GUIDELINES.values.join(", ")}
   ${request.homeLanguage ? `Home Language: ${request.homeLanguage}` : ""} | LOLT: ${request.lolt || "English"}
   Include Indigenous Knowledge Systems (IKS) where relevant.
   Illustrations: ${EDUCATIONAL_IMAGE_STYLE} — diverse SA learners, rainbow nation

══════════════════════════════════════════════════════════════
OUTPUT FORMAT — ADAPTIVE (JSON when requested, HTML for classroom):
══════════════════════════════════════════════════════════════

When JSON is requested, return STRICT JSON with this schema:
{
  "metadata": {
    "title": string,
    "subject": string,
    "grade": string,
    "phase": string,
    "term": number,
    "capsReference": string,
    "atpWeek": string,
    "contentType": string,
    "duration": string | null,
    "totalMarks": number | null,
    "bloomsDistribution": { "remembering": %, "understanding": %, "applying": %, "analyzing": %, "evaluating": %, "creating": % },
    "npaCompliance": { "assessmentType": string|null, "isFormal": boolean, "ratingScale": "7-point NPA", "sbaWeight": number, "examWeight": number },
    "siasCompliance": { "supportLevel": string, "accommodationsIncluded": boolean, "differentiationIncluded": boolean },
    "popiaCompliant": true,
    "generatedDate": "DD/MM/YYYY",
    "schoolBranding": { "name": string, "district": string, "province": string }
  },
  "sections": [
    {
      "sectionId": number,
      "heading": string,
      "content": string,
      "bulletPoints": string[],
      "bloomsLevel": string | null,
      "marks": number | null,
      "siasNotes": string | null,
      "differentiatedContent": { "core": string, "extended": string|null, "simplified": string|null } | null,
      "imagePrompt": string | null
    }
  ],
  "imagePrompts": [
    {
      "imageId": string,
      "sectionId": number,
      "prompt": string,
      "placement": "header"|"inline"|"full_width"|"sidebar",
      "suggestedSize": "small"|"medium"|"large",
      "accessibilityAltText": string
    }
  ],
  "siasSupport": {
    "supportLevel": string,
    "teacherNotes": string,
    "accommodations": string[],
    "referralGuidance": string | null
  } | null,
  "answerKey": {
    "questions": [{ "questionNumber": number, "answer": string, "bloomsLevel": string, "marks": number, "cognitiveLevel": string }],
    "totalMarks": number,
    "bloomsBreakdown": object
  } | null,
  "npaRatingTable": [{ "code": number, "description": string, "percentage": string }] | null,
  "content": string (HTML when requested)
}

When HTML is requested (default for EduAI Companion classroom use):
- Output complete standalone HTML5 with Tailwind CSS via CDN
- Include SA flag stripe header (green/gold/black/red/blue)
- School header with DBE branding
- Compliance stamps: CAPS Aligned, NPA Compliant, POPIA Compliant, SIAS Inclusive, WP6 Differentiated
- Differentiation boxes (Core/Extended/Simplified) with WP6 colours
- SIAS support boxes with teacher notes
- NPA 7-point rating table
- Bloom's tags on every question
- Illustration placeholders: [Illustration: <detailed SA context prompt, ${EDUCATIONAL_IMAGE_STYLE}>]
- Footer with POPIA notice and 2026 date
- High contrast: dark text on light banners, white text only on deep dark backgrounds

CRITICAL RULES:
- Current year is 2026 — never 2024
- No emojis in formal text (use icons only where pedagogically appropriate)
- Break up dense text with illustration placeholders
- Keep poster/infographic text brief, punchy, bullet lists
- All image prompts must be ultra-detailed, SA context, no text overlays, 300 DPI
- Return ONLY valid JSON when JSON requested, no markdown wrapper
- For HTML, return pure HTML string inside JSON content field OR standalone HTML document
`;
}

export function buildSAUserPrompt(request: SAContentRequest): string {
  const config = getPhaseConfig(request.grade);
  const instructorPriority = buildInstructorPriority(request.additionalInstructions);
  let prompt = "";

  const commonSAContext = `
SA Context Requirements:
- Currency: Rand (R), SA places, SA names (Thabo, Amina, Sipho, Lerato), metric system
- SA English spelling: colour, behaviour, organise, centre
- Date format: DD/MM/YYYY, Year: 2026
- Include IKS (Indigenous Knowledge Systems) where relevant
- Visuals: Diverse SA learners, rainbow nation, local animals (lion, springbok, protea, etc.)
- Illustration style: ${EDUCATIONAL_IMAGE_STYLE}
`;

  switch (request.contentType) {
    case "lesson_plan":
      prompt = `${instructorPriority}

Create a CAPS-aligned, SIAS-compliant, POPIA-compliant lesson plan:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName})
Term: ${request.term} | Week: ${request.week || "Current"} | Duration: ${request.duration || "1 hour"}
${request.homeLanguage ? `Home Language: ${request.homeLanguage}` : ""} | LOLT: ${request.lolt || "English"}
CAPS Ref: ${request.capsReference || generateCAPSReference(request.subject, request.grade, request.term, request.topic)}

MANDATORY SECTIONS (DBE Lesson Plan Template):
1. CAPS Reference & ATP Alignment (image prompt for header banner with SA school crest style, flag colours)
2. Learning Objectives — 3-5 SMART objectives using Bloom's verbs (tagged with Bloom's level)
3. Prior Knowledge & Baseline Assessment
4. Resources / LTSM (Learner Teacher Support Material)
5. Introduction / Hook (5-10 min) — engaging SA context starter
6. Direct Teaching / Input (15-20 min) — image prompts for diagrams/illustrations, SA examples
7. Guided Practice (15-20 min) — scaffolded, group work
8. Independent Practice (10-15 min) — differentiated Core/Extended/Simplified
9. Assessment Opportunity (5-10 min) — tag with Bloom's, specify NPA type: ${request.assessmentType || "informal"}
10. Expanded Opportunity — advanced learners (CAPS extended content, Creating/Evaluating)
11. Support Activity — SIAS Level 1 accommodations, struggling learners
12. Teacher Reflection Notes & Remediation
13. Cross-curricular Links (e.g., Mathematics + Natural Sciences)
14. IKS Integration — indigenous knowledge relevant to topic
15. Homework / Extension
16. SIAS Support Box — accommodations, referral guidance if needed
17. POPIA Footer — confidentiality notice

${request.differentiationRequired ? "DIFFERENTIATION MANDATORY: Provide Core (All), Extended (Advanced), Simplified (Support) versions of main activities with WP6 strategies." : "Include UDL differentiation notes."}
${request.includeInclusiveSupport ? `SIAS Level: ${request.siasSupportLevel || "level_1"} — Include teacher support notes, accommodations, and referral pathway.` : ""}

${commonSAContext}
Generate 3+ image prompts with alt-text, SA visual context, ${EDUCATIONAL_IMAGE_STYLE}.
Bloom's distribution: Remembering ${config.bloomsDistribution.remembering}% | Understanding ${config.bloomsDistribution.understanding}% | Applying ${config.bloomsDistribution.applying}% | Analyzing ${config.bloomsDistribution.analyzing}% | Evaluating ${config.bloomsDistribution.evaluating}% | Creating ${config.bloomsDistribution.creating}%

${instructorPriority}
`;
      break;

    case "worksheet":
    case "assessment":
      prompt = `${instructorPriority}

Create a CAPS-aligned, NPA-compliant ${request.assessmentType || "worksheet"} for SA classroom:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName})
Term: ${request.term} | Questions: ${request.questionCount || 10} | Total Marks: Calculate appropriately
Formal: ${request.isFormal ? "Yes (SBA — counts towards term mark)" : "No (diagnostic/formative)"} | Assessment Type: ${request.assessmentType || "worksheet"}
Duration: ${request.duration || "1 hour"}

BLOOM'S DISTRIBUTION (MANDATORY — tag EVERY question with Bloom's level and marks):
Remembering ~${config.bloomsDistribution.remembering}% | Understanding ~${config.bloomsDistribution.understanding}%
Applying ~${config.bloomsDistribution.applying}% | Analyzing ~${config.bloomsDistribution.analyzing}%
Evaluating ~${config.bloomsDistribution.evaluating}% | Creating ~${config.bloomsDistribution.creating}%

STRUCTURE (SA School Branded):
1. Header — school info placeholder, subject, grade, date (DD/MM/YYYY 2026), marks, time, SA flag stripe (image prompt)
2. Instructions — clear, age-appropriate, in ${request.lolt || "English"}${request.homeLanguage ? ` with ${request.homeLanguage} glossary` : ""}
3. Section A: Short Questions / Knowledge (lower order: Remembering, Understanding) — e.g., MCQ, true/false, matching
4. Section B: Application (middle order: Applying) — word problems with SA context (Rands, local places)
5. Section C: Analysis/Evaluation (higher order: Analyzing, Evaluating) — case studies, data interpretation
6. Section D: Extended Response / Creation (highest order: Creating) — essay, design, project
7. TOTAL MARKS per question and overall, with cognitive level breakdown
8. Complete Memorandum with marks, Bloom's level, cognitive category, alternative answers
9. NPA Rating Code conversion table (7-point scale)
10. SIAS Accommodations Box (if inclusive support enabled)
11. Differentiation Box — Core/Extended/Simplified where appropriate
12. POPIA Footer

${request.includeInclusiveSupport ? `SIAS Level: ${request.siasSupportLevel || "level_1"} — Include accommodations section with teacher notes.` : ""}
${request.differentiationRequired ? "WP6 Differentiation: Provide tiered versions for diverse learners." : ""}

${commonSAContext}
Generate image prompts for header and educational diagrams with alt-text, SA context, ${EDUCATIONAL_IMAGE_STYLE}.
Ensure high contrast, no white text on yellow/orange, print-ready, WCAG 4.5:1.

${instructorPriority}
`;
      break;

    case "study_guide":
    case "infographic":
    case "mind_map":
    case "poster":
    case "visual_aid":
    case "diagram":
      prompt = `${instructorPriority}

Create a CAPS-aligned study guide / infographic / visual aid for SA learners:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName}) | Term: ${request.term}
Content Type: ${request.contentType}
LOLT: ${request.lolt || "English"}${request.homeLanguage ? ` | Home Language glossary: ${request.homeLanguage}` : ""}

SECTIONS (SA Branded, Visual-Rich):
1. Title & CAPS Reference — SA flag stripe, DBE branding (image prompt for SA-themed banner, school crest style)
2. Learning Objectives — SMART, Bloom's tagged
3. Key Terminology ${request.homeLanguage && request.homeLanguage !== "English" ? `(include ${request.homeLanguage} translations and pronunciation)` : ""} — with illustrations
4. Core Concepts — chunked, visual hierarchy, image prompt for concept map with ALL labels, SA examples
5. Worked Examples — SA context (Rand, SA places, SA names), step-by-step
6. Visual Aids — diagrams, mind maps, infographics (image prompts: [Illustration: <detailed SA prompt>] for each concept)
7. Common Mistakes & Misconceptions — SA learner context
8. Practice Questions with Answers — Bloom's tagged, differentiated
9. Exam Tips for ${config.displayName} — NPA aligned, study strategies
10. Did You Know? — SA context / IKS facts (e.g., Table Mountain, Kruger, indigenous plants)
11. Self-Assessment Checklist — learner reflection
12. SIAS Support Notes — if enabled
13. POPIA Footer — 2026 date

${request.differentiationRequired ? "DIFFERENTIATION: Provide simplified and extended versions with visual supports." : "Include UDL visual supports."}
${request.includeInclusiveSupport ? `SIAS: ${request.siasSupportLevel || "level_1"} accommodations included.` : ""}

CRITICAL VISUAL RULES:
- Posters/infographics must NOT be dominated by dense paragraphs — break up with [Illustration: ...] placeholders
- Each key concept card/bento-grid block must have dedicated illustration placeholder
- Keep text brief, punchy, bullet lists, highlighted capsules
- Illustration style: ${EDUCATIONAL_IMAGE_STYLE}, museum-quality, 300 DPI, no text overlays
- Banner contrast: dark text on light vibrant banners (yellow, orange, cyan, mint) — white text only on deep dark backgrounds

${commonSAContext}
Generate 4+ image prompts with alt-text, SA visual context, diverse learners.
Bloom's distribution for activities: Remembering ${config.bloomsDistribution.remembering}% etc.

${instructorPriority}
`;
      break;

    case "individual_support_plan":
      prompt = `${instructorPriority}

Create a SIAS-compliant Individual Support Plan (ISP) / Individual Education Plan (IEP):
Grade: ${request.grade} | Subject: ${request.subject} | Support Level: ${request.siasSupportLevel || "level_1"}
Barriers: ${request.barrierCategories?.join(", ") || "General learning support"}
Term: ${request.term} | Topic: ${request.topic}
LOLT: ${request.lolt || "English"} | Home Language: ${request.homeLanguage || "Not specified"}

MANDATORY ISP SECTIONS (SIAS Policy 2014 — DBE Official Template):
1. Learner Profile (placeholder: "Learner Name: ___ (POPIA — use pseudonym)", Grade, Age, Home Language, LOLT)
2. Barriers Identified — checklist from: ${request.barrierCategories?.join(", ") || "Intrinsic, Extrinsic, Pedagogical, Systemic"}
3. Strengths and Interests — positive, asset-based
4. Support Needs Analysis — academic, behavioural, social, emotional
5. Support Strategies for ${request.subject} at ${request.grade} — detailed classroom strategies
6. Curriculum Adaptations — what CAPS content adapted, how, why (content, process, product, environment)
7. Assessment Accommodations — extra time, reader, scribe, separate venue, etc.
8. Resources Required — LTSM, assistive technology, specialist support
9. Roles and Responsibilities — Teacher / SBST / DBST / Parent / Learner / Specialist
10. Intervention Plan — SMART goals, activities, timeline, monitoring
11. Review Date and Success Indicators — measurable outcomes
12. Referral Pathway — escalation to next SIAS level, criteria, process
13. Parental Involvement and Consent
14. POPIA Statement — confidentiality, data protection, consent
15. Signatures — Teacher, SBST Co-ordinator, Parent, Principal (placeholders)

${commonSAContext}
Include SA context, culturally sensitive, inclusive language, ubuntu values.
Generate 1 image prompt for ISP header — professional, inclusive, SA school.

${instructorPriority}
`;
      break;

    case "annual_teaching_plan":
      prompt = `${instructorPriority}

Create a CAPS-aligned Annual Teaching Plan (ATP) / Work Schedule:
Subject: ${request.subject} | Grade: ${request.grade} | Term: ${request.term}
Topic: ${request.topic} | Year: 2026
CAPS Reference: ${request.capsReference || generateCAPSReference(request.subject, request.grade, request.term, request.topic)}

ATP STRUCTURE (DBE Official Format):
For EACH week (1-10 per term, or full year if requested):
- Week number | Dates (DD/MM/YYYY) | CAPS topic & sub-topics | Content/concepts/skills | Activities (teacher & learner) | Resources / LTSM | Assessment (informal/formal) | DBE ATP Reference
- Formal tasks: specify SBA number, type (test, exam, project, etc.), topic, marks, duration, NPA weighting
- Include: Practical tasks, investigations, projects where applicable
- Indicate: Cognitive levels (Bloom's) per activity

Additional Sections:
- Overview of year — terms, weeks, topics, assessment programme
- Formal Assessment Programme — list all formal tasks for year, with dates, marks, weighting
- Informal Assessment — daily/weekly formative activities
- Resources Required — textbooks, LTSM, lab equipment, etc.
- SIAS Notes — inclusive strategies per term
- Cross-curricular Links — integration with other subjects
- IKS Integration — indigenous knowledge per topic
- POPIA Notice — data protection
- Time Allocation — per topic, per week, per term

${request.includeInclusiveSupport ? `SIAS Level: ${request.siasSupportLevel || "level_1"} — Include differentiation and support notes per week.` : ""}
${request.differentiationRequired ? "WP6: Include differentiation strategies per topic." : ""}

${commonSAContext}
Generate 1 image for ATP header — SA DBE branded, professional, 2026.
Ensure ATP pacing matches current DBE-issued Annual Teaching Plans for ${request.grade} ${request.subject}.

${instructorPriority}
`;
      break;

    case "admin_document":
      prompt = `${instructorPriority}

Create a South African school administrative document — professional, formal, DBE-compliant:
Type: ${request.topic} (e.g., Parent Notification, Certificate, Letter, Notice, Timetable) | Grade: ${request.grade} | Term: ${request.term}
Subject: ${request.subject} | Date: DD/MM/YYYY 2026
School: Placeholder — use SA school branding

STRUCTURE (Official SA School Document):
1. Official Header — school name, address, contact, EMIS number, district, province, logo placeholder, SA flag stripe (image prompt)
2. Reference Number — e.g., REF: ${request.grade}/ADMIN/2026/${request.term}
3. Date — DD Month YYYY (e.g., 15 June 2026) — Year MUST be 2026
4. Recipient — To: (e.g., Parents/Guardians of Grade ${request.grade} learners)
5. Subject Line — clear, concise, e.g., RE: ${request.topic}
6. Salutation — formal, e.g., Dear Parents/Guardians
7. Body — structured with headings, paragraphs, bullet points, clear information
   - Purpose and context
   - Important dates, times, venues (SA context)
   - Requirements, expectations, actions needed
   - Contact person and details
8. Action Items / Reply Slip (if applicable) — tear-off section, checkboxes, signature lines
9. Closing — formal, e.g., Yours faithfully
10. Signatures — Class Teacher, Principal, SGB placeholders with signature lines
11. Distribution List — who receives copies
12. Attachments — if any
13. Footer — POPIA confidentiality notice, school motto, DBE branding, 2026

Tone: Formal, professional, respectful, clear, inclusive, SA English.
Visual: Professional, clean, print-ready, SA school branding colours (green #007749, gold #FFB81C)
Include: Official language, no jargon, accessible to all parents

${commonSAContext}
Generate 1 image for official document header — professional seal, SA coat of arms style, school crest.

${instructorPriority}
`;
      break;

    default:
      prompt = `${instructorPriority}

Generate ${request.contentType} for South African CAPS curriculum:
Subject: ${request.subject} | Topic: ${request.topic} | Grade: ${request.grade} (${config.displayName}) | Term: ${request.term}
Duration: ${request.duration || "Not specified"} | Language: ${request.lolt || "English"}${request.homeLanguage ? ` | Home Language: ${request.homeLanguage}` : ""}

Requirements:
- Full SA compliance: CAPS, NPA, SIAS, WP6, POPIA
- Bloom's distribution: ${JSON.stringify(config.bloomsDistribution)}
- NPA weighting: SBA ${config.assessmentWeights.schoolBasedAssessment}% / Exam ${config.assessmentWeights.yearEndExam}%
- SA context: Rand, SA places, SA names, IKS, 2026 year
- Visuals: ${EDUCATIONAL_IMAGE_STYLE}, 2-3 illustration placeholders with SA context
- Differentiation: ${request.differentiationRequired ? "Core/Extended/Simplified" : "UDL"}
- SIAS: ${request.includeInclusiveSupport ? request.siasSupportLevel : "Level 1 accommodations"}

${commonSAContext}
Ensure high contrast, print-ready, professional, teacher-proud quality.
Generate image prompts with alt-text.

${instructorPriority}
`;
  }

  if (request.additionalInstructions && !prompt.includes(request.additionalInstructions)) {
    prompt += `\n\nAdditional Instructor Instructions (Highest Priority): ${request.additionalInstructions}`;
  }

  return prompt;
}

export function buildSAQualityChecklist(request: SAContentRequest): string[] {
  const config = getPhaseConfig(request.grade);
  return [
    `✅ CAPS Aligned — ${config.displayName}, ${request.grade}, ${request.subject}, Term ${request.term}`,
    `✅ ATP Pacing — Matches DBE Annual Teaching Plan week ${request.week || "current"}`,
    `✅ NPA Compliant — SBA ${config.assessmentWeights.schoolBasedAssessment}% / Exam ${config.assessmentWeights.yearEndExam}%`,
    `✅ Bloom's Distribution — Remembering ${config.bloomsDistribution.remembering}% etc. for ${config.displayName}`,
    `✅ SIAS Inclusive — ${request.siasSupportLevel || "Level 1"} accommodations practical for classroom`,
    `✅ POPIA Compliant — No real learner PII, placeholder names only`,
    `✅ IKS Integration — Indigenous Knowledge Systems accurate and respectful`,
    `✅ SA English — colour, behaviour, organise, centre spelling`,
    `✅ SA Context — Rand (R), SA places, SA names, metric system, DD/MM/YYYY, 2026 year`,
    `✅ Visual Quality — ${EDUCATIONAL_IMAGE_STYLE}, diverse SA learners, rainbow nation`,
    `✅ Differentiation — ${request.differentiationRequired ? "Core/Extended/Simplified" : "UDL"} strategies included`,
    `✅ Print-Ready — High contrast (4.5:1), Tailwind CSS, @media print, 300 DPI image prompts`
  ];
}

export default {
  buildSASystemPrompt,
  buildSAUserPrompt,
  buildSAQualityChecklist,
  SA_BRANDING
};
