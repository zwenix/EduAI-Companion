/**
 * EduAI Companion - Dynamic Prompt Assembly System
 * Version 3.0 - SA-Compliant Enhanced Prompt Engineering
 * Integrated with CAPS · NPA · SIAS · WP6 · POPIA frameworks
 */

import { ENHANCED_MASTER_PROMPT } from './prompts/master-prompt';
import { 
  WORKSHEET_PROMPT_TEMPLATE, 
  VISUAL_AID_PROMPT_TEMPLATE, 
  STUDY_GUIDE_PROMPT_TEMPLATE,
  FOUNDATION_PHASE_TEMPLATE
} from './prompts/content-templates';
import {
  LESSON_PLAN_TEMPLATE,
  REPORT_COMMENT_TEMPLATE,
  CURRICULUM_MAP_TEMPLATE
} from './prompts/admin-templates';
import {
  RUBRIC_TEMPLATE,
  TEST_GENERATOR_TEMPLATE,
  PROGRESS_TRACKER_TEMPLATE
} from './prompts/assessment-templates';
import { buildInstructorPriority, EDUCATIONAL_IMAGE_STYLE } from './prompt-priority';

// SA Compliance imports — new from CAPS document
import {
  CAPS_PHASES,
  detectPhase,
  getPhaseConfig,
  validateCAPSCompliance,
  generateCAPSReference,
  NPA_RATING_CODES,
  SIAS_SUPPORT_LEVELS,
  SA_CONTEXT_GUIDELINES,
  POPIA_GUIDELINES,
  WP6_DIFFERENTIATION_STRATEGIES
} from './compliance/sa-frameworks';

export interface PromptContext {
  contentType: 'worksheet' | 'poster' | 'study-guide' | 'infographic' | 
               'lesson-plan' | 'report-comment' | 'curriculum-map' |
               'rubric' | 'test' | 'progress-tracker' |
               // Extended types from SA document
               'individual_support_plan' | 'annual_teaching_plan' | 'admin_document' | 'assessment' | 'diagram' | 'mind-map' | 'flashcard' | 'homework' | 'classroom-exercise' | 'revision-pack';
  grade: string;
  subject: string;
  topic: string;
  language: string;
  learnerProfile?: string;
  additionalInstructions?: string;
  visualStyle?: 'modern' | 'playful' | 'professional' | 'minimalist';
  colorScheme?: string;
  capsReference?: string;
  // Additional context for specific content types
  totalMarks?: number;
  duration?: string;
  term?: string;
  week?: number;
  studentName?: string;
  teacherName?: string;
  includeWorksheet?: boolean;
  isGroq?: boolean;
  // SA Compliance extensions
  assessmentType?: string;
  isFormal?: boolean;
  includeInclusiveSupport?: boolean;
  siasSupportLevel?: string;
  differentiationRequired?: boolean;
  barrierCategories?: string[];
  homeLanguage?: string;
  lolt?: string;
  questionCount?: number;
  containsLearnerData?: boolean;
}

export class EduAIPromptEngine {
  
  /**
   * Build a strict language override mandate for non-English outputs
   */
  public static buildLanguageMandate(language: string, subject?: string): string {
    const lang = (language || '').trim();
    if (!lang || lang === 'English') return '';

    const langUpper = lang.toUpperCase();
    return `
🚨🚨🚨 ABSOLUTE MANDATORY LANGUAGE OVERRIDE DIRECTIVE 🚨🚨🚨
THE USER HAS REQUESTED THIS ENTIRE MATERIAL TO BE GENERATED 100% ENTIRELY IN ${langUpper}.

CRITICAL MANDATORY INSTRUCTIONS FOR ${langUpper} OUTPUT:
1. 100% NATIVE ${langUpper} BODY CONTENT: Every single paragraph, sentence, heading, question, multiple-choice choice option, matching item, instruction, teacher script, solution step, memorandum answer, and rubric descriptor MUST BE WRITTEN IN ${langUpper}.
2. TRANSLATE ALL STRUCTURAL LABELS: Do NOT keep English template headers like "Lesson Plan", "Worksheet", "Grade", "Topic", "Subject", "Name", "Date", "Score", "Question 1", "Teacher Notes", "Objectives", "Memorandum", "Rubric", "Homework". Translate these structural labels natively into ${langUpper}.
3. ZERO ENGLISH IN OUTPUT: Do not revert or switch back to English at any point in the text. Translate all concepts, stories, instructions, and questions completely into ${langUpper}.
`;
  }

  /**
   * Build SA Compliance mandate — NEW from CAPS document integration
   */
  public static buildSAComplianceMandate(context: PromptContext): string {
    try {
      const phaseConfig = getPhaseConfig(context.grade || "4");
      const capsRef = generateCAPSReference(context.subject, context.grade, parseInt((context.term || "Term 1").replace(/\D/g, "")) || 1, context.topic);
      const blooms = phaseConfig.bloomsDistribution;
      const npaWeight = phaseConfig.assessmentWeights;

      return `
🇿🇦 SA COMPLIANCE MANDATE — CAPS · NPA · SIAS · WP6 · POPIA (2026):

CAPS PHASE: ${phaseConfig.displayName} | Grade: ${context.grade} | Subject: ${context.subject} | Term: ${context.term || "Term 1"}
CAPS Reference: ${capsRef}
Time Allocation: ${phaseConfig.timeAllocation}
Cognitive Demand: ${phaseConfig.cognitiveDemand}
ATP Alignment: Week ${context.week || "current"} — ensure pacing matches DBE ATP
Language Policy: ${phaseConfig.languagePolicy}
LOLT: ${context.lolt || context.language || "English"}${context.homeLanguage ? ` | Home Language: ${context.homeLanguage}` : ""}

NPA COMPLIANCE (National Protocol for Assessment):
- SBA: ${npaWeight.schoolBasedAssessment}% | Exam: ${npaWeight.yearEndExam}%
- Assessment Type: ${context.assessmentType || "informal"} | Formal: ${context.isFormal ? "Yes (SBA counts)" : "No (formative/diagnostic)"}
- Rating Scale: 7-point NPA — ${NPA_RATING_CODES.map(r => `${r.code}=${r.percentage}`).join(", ")}
- Tag EVERY question with marks AND Bloom's level

BLOOM'S TAXONOMY for ${phaseConfig.displayName} (MANDATORY DISTRIBUTION):
- Remembering: ${blooms.remembering}% | Understanding: ${blooms.understanding}% | Applying: ${blooms.applying}%
- Analyzing: ${blooms.analyzing}% | Evaluating: ${blooms.evaluating}% | Creating: ${blooms.creating}%
- Distribute questions/activities according to this breakdown

SIAS — Inclusive Education:
- Support Level: ${context.siasSupportLevel || "level_1"} (${SIAS_SUPPORT_LEVELS.find(s => s.level === (context.siasSupportLevel || "level_1"))?.description || "Classroom teacher support"})
- Inclusive Support: ${context.includeInclusiveSupport ? "ENABLED — include accommodations, differentiated content, teacher notes" : "UDL principles — accessible, adaptable"}
- Barriers: ${context.barrierCategories?.join(", ") || "General — apply UDL"}
- Accommodations: ${SIAS_SUPPORT_LEVELS.find(s => s.level === (context.siasSupportLevel || "level_1"))?.accommodations.slice(0, 3).join("; ") || "Differentiated instruction, visual supports, additional time"}

WHITE PAPER 6 — Differentiation:
- ${context.differentiationRequired ? "MANDATORY — Provide Core (All), Extended (Advanced), Simplified (Support) versions" : "Apply UDL — multiple means of engagement, representation, action"}
- Strategies: Content: ${WP6_DIFFERENTIATION_STRATEGIES.content[0]} | Process: ${WP6_DIFFERENTIATION_STRATEGIES.process[0]} | Product: ${WP6_DIFFERENTIATION_STRATEGIES.product[0]}

POPIA — Protection of Personal Information Act (Act 4 of 2013):
- NO real learner data — use placeholders ONLY: ${POPIA_GUIDELINES.fictionalNames.slice(0, 6).join(", ")} (fictional)
- Include POPIA confidentiality notice in footer
- ${context.containsLearnerData ? "⚠️ Learner data flagged — anonymise!" : "No PII — compliant"}

SA CONTEXT:
- Currency: ${SA_CONTEXT_GUIDELINES.currency}
- Date: ${SA_CONTEXT_GUIDELINES.dateFormat} — Year MUST be 2026, NOT 2024
- Spelling: ${SA_CONTEXT_GUIDELINES.spelling} — colour, behaviour, organise, centre
- Places: ${SA_CONTEXT_GUIDELINES.places.slice(0, 3).join(", ")}
- Animals/Flora: ${SA_CONTEXT_GUIDELINES.animals.slice(0, 2).join(", ")}
- Values: ${SA_CONTEXT_GUIDELINES.values.join(", ")}
- Include IKS (Indigenous Knowledge Systems) where relevant
- Illustration: ${EDUCATIONAL_IMAGE_STYLE} — diverse SA learners, rainbow nation, local contexts
`;
    } catch (e) {
      // Fallback if grade parsing fails
      return `
🇿🇦 SA COMPLIANCE — CAPS Aligned | NPA Compliant | POPIA Compliant | SIAS Inclusive | WP6 Differentiated
- Year: 2026 (not 2024)
- Currency: Rand (R), Date: DD/MM/YYYY, SA English spelling
- Illustrations: ${EDUCATIONAL_IMAGE_STYLE}, diverse SA learners
- Include POPIA notice, compliance stamps, SA flag stripe
`;
    }
  }

  /**
   * Assemble a complete, context-aware prompt for any content type
   * Enhanced with SA compliance from CAPS document
   */
  static assemblePrompt(context: PromptContext): { system: string; user: string } {
    const phase = this.getPhaseByGrade(context.grade);
    const subjectPalette = this.getSubjectPalette(context.subject);
    
    // Infer language if not explicitly set but present in subject name
    let effectiveLanguage = context.language || 'English';
    if (context.subject) {
      if (context.subject.includes('Afrikaans')) effectiveLanguage = 'Afrikaans';
      else if (context.subject.includes('isiXhosa') || context.subject.includes('Xhosa')) effectiveLanguage = 'isiXhosa';
      else if (context.subject.includes('Khoekhoegowab') || context.subject.includes('Traditional')) effectiveLanguage = 'Khoekhoegowab (First Traditional Language)';
      else if (context.subject.includes('isiZulu') || context.subject.includes('Zulu')) effectiveLanguage = 'isiZulu';
      else if (context.subject.includes('Sesotho')) effectiveLanguage = 'Sesotho';
      else if (context.subject.includes('Sepedi')) effectiveLanguage = 'Sepedi (Sesotho sa Leboa)';
      else if (context.subject.includes('Setswana')) effectiveLanguage = 'Setswana';
      else if (context.subject.includes('Sign Language') || context.subject.includes('SASL')) effectiveLanguage = 'South African Sign Language (SASL)';
    }

    const langMandate = this.buildLanguageMandate(effectiveLanguage, context.subject);
    const saMandate = this.buildSAComplianceMandate(context);
    
    // Enhance image prompt with context — now with SA compliance
    const enhancedImagePrompt = this.enhanceImagePrompt(
      context.topic, 
      context.grade, 
      context.subject,
      phase,
      subjectPalette,
      context
    );
    
    // Select base template based on content type
    let contentTemplate = this.selectTemplate(context.contentType, phase);
    
    // Handle new SA content types from document
    if (context.contentType === 'individual_support_plan' || context.contentType === 'annual_teaching_plan' || context.contentType === 'admin_document') {
      contentTemplate = this.getSAContentTypeTemplate(context.contentType, context);
    }
    
    if (context.contentType === 'lesson-plan' && context.includeWorksheet) {
      contentTemplate += `
      
⚠️ CRITICAL INTEGRATION FOR LESSON PLAN (WORK_SHEET):
Since the worksheet toggle / 'includeWorksheet' is TRUE, you MUST append a complete, beautifully designed South African CAPS-aligned Student Activity Worksheet directly at the end of the lesson plan content (rendered inside or immediately after the main lesson-plan article). Use a clear page breaker:
<div style="page-break-before: always;" class="my-12 border-t-4 border-dashed border-gray-300 pt-8 mt-12 print:mt-4"></div>
followed by the complete, fully formed Worksheet matching the CAPS worksheet aesthetic.

The integrated student activity worksheet MUST contain:
1. A prominent SCORE BOX styled card at the top right of the worksheet area (using clear borders, elegant thick margins, e.g. "SCORE: ____ / 15"). No absolute/fixed positioning to prevent overlap!
2. Creative thematic heading (e.g., "[Topic] Heroes Challenge Worksheet")
3. Standard "Learner Name" and "Date" write-on-the-line blanks.
4. At least 4 distinct, engaging diagnostic assessment questions customized for Grade \${grade} \${subject}:
   - Question 1: Matching / Column A and Column B associations layout (using structured, side-by-side cards or matching lists)
   - Question 2: Multiple Choice or True/False scenario pills (using beautiful Tailwind borders like green for True, red for False)
   - Question 3: Fill in the remaining blanks with word banks
   - Question 4: Creative Draw/Illustrate response box (styled with border-2 border-dashed border-gray-300, min-h-[140px], light grey background, and nice bold instructions)
5. Structured empty boxes, lines, and write-in areas for student answers. NO placeholder text ("etc.", "solutions go here") — write the complete real test questions and blanks!

You MUST ALSO generate:
- The full step-by-step ANSWER KEY / MEMORANDUM in the 'memo' field of the JSON output. The memorandum must look extremely neat and detailed, offering a complete expert guide for marking, highlighting correct answers and marking notes.
- The corresponding grading RUBRIC matrix table in the 'rubric' field of the JSON output. It must be styled using the Assessment Rubric Design style of the rubric templates, showing criteria, performance levels, marks, and feedback sections!
      `;
    }
    
    // Inject dynamic values into template. The instructor brief is deliberately
    // placed before and after the preset template so it cannot be lost inside a
    // long prompt or treated as an optional afterthought by a provider.
    const instructorPriority = buildInstructorPriority(context.additionalInstructions);
    let userPrompt = this.injectContext(contentTemplate, {
      ...context,
      language: effectiveLanguage,
      capsCode: context.capsReference || '',
      instructions: context.additionalInstructions || '',
      totalMarks: context.totalMarks || 30,
      title: context.topic || '',
      subtitle: context.additionalInstructions || `Comprehensive overview and exercises for ${context.topic}`,
      imagePrompt: enhancedImagePrompt,
      phase,
      term: context.term || 'Term 1',
      grade: context.grade,
      subject: context.subject,
      topic: context.topic,
      ...subjectPalette
    });
    
    // Add SA compliance context to user prompt
    userPrompt = `${saMandate}\n\n${userPrompt}`;

    if (instructorPriority) {
      userPrompt = `${instructorPriority}\n\n${userPrompt}\n\n${instructorPriority}`;
    }
    
    // Enhance system prompt with phase-specific guidance + SA compliance
    let systemPrompt = ENHANCED_MASTER_PROMPT
      .replace(/\$\{phase\}/g, phase)
      .replace(/\$\{gradeRange\}/g, this.getGradeRange(phase));
    
    // Add SA compliance to system prompt
    systemPrompt = `${saMandate}\n\n${systemPrompt}`;

    const antiSummaryMandate = `\n\n🚨 CRITICAL ANTI-TRUNCATION & ANTI-SUMMARY MANDATE:
1. ZERO PLACEHOLDERS OR SUMMARIES: You are STRICTLY FORBIDDEN from outputting summaries, placeholder comments, or sentences such as "Summarized HTML below for brevity", "Full HTML available upon request", "etc.", "more questions here", or "insert content here".
2. COMPLETE HTML OUTPUT: You MUST provide the complete HTML/text content of the worksheet including all questions, instructions, images, and data handling activities. Write out EVERY SINGLE section, paragraph, question, answer, rubric criteria, and HTML tag completely and fully from start to finish.
3. FULL TEACHING MATERIALS: If generating a lesson plan, include all 5 detailed teaching phases, scripts, and accommodations. If generating a worksheet, test, or memo, write out every single question and every single answer without short-cutting.
4. METADATA & CONTEXT: Add explicit CAPS-aligned metadata such as learning objectives, duration, and cognitive levels. Incorporate South African contexts, such as sorting local animals, indigenous fruits, or typical school items to align with cultural relevance requirements.
5. OPTIMIZED FOR SPEED: Keep the HTML clean, well-structured, and concise without excessive repetitive boilerplate text so that generation completes rapidly and within token boundaries.
6. SA COMPLIANCE VISUALS: Include SA flag stripe (6px gradient: black, gold, green, white, red, blue), school header with DBE branding, compliance stamps (CAPS Aligned, NPA Compliant, POPIA Compliant, SIAS Inclusive, WP6 Differentiated), differentiation boxes (Core/Extended/Simplified), SIAS support boxes, NPA 7-point table, Bloom's tags on every question, POPIA footer with 2026 date.
7. QWEN IMAGE INTEGRATION: All [Illustration: ...] placeholders will be replaced by Qwen-Image (NVIDIA NIM qwen/qwen-image) with SA context enhancement — ensure prompts are ultra-detailed, SA-specific, no text overlays, 300 DPI, Disney 3D style.
`;

    systemPrompt += antiSummaryMandate;
    userPrompt += antiSummaryMandate;

    if (langMandate) {
      systemPrompt = `${langMandate}\n\n${systemPrompt}`;
      userPrompt = `${langMandate}\n\n${userPrompt}\n\n${langMandate}`;
    }

    if (context.isGroq) {
      systemPrompt = this.compressWhitespace(systemPrompt);
      userPrompt = this.compressWhitespace(userPrompt);
    }
    
    return {
      system: systemPrompt,
      user: userPrompt
    };
  }

  /**
   * Get SA content type template for new types from document
   */
  private static getSAContentTypeTemplate(contentType: string, context: PromptContext): string {
    const base = `
Generate a SA-compliant ${contentType} for:
Grade: \${grade} | Subject: \${subject} | Topic: \${topic} | Term: \${term}
Language: \${language} | Duration: \${duration} | Total Marks: \${totalMarks}

SA Requirements:
- CAPS Aligned: \${capsCode}
- NPA: 7-point scale, Bloom's tagged, SBA weighting
- SIAS: \${siasSupportLevel} accommodations
- POPIA: Placeholder names only, confidentiality notice
- SA Context: Rand, SA places, SA names, IKS, 2026 year
- Visuals: ${EDUCATIONAL_IMAGE_STYLE}, SA flag stripe, compliance stamps

Content must be complete, print-ready, Tailwind CSS, high contrast.
`;

    switch (contentType) {
      case 'individual_support_plan':
        return base + `
MANDATORY ISP SECTIONS (SIAS Policy 2014):
1. Learner Profile (placeholder: "Learner Name: ___")
2. Barriers Identified (checklist: ${context.barrierCategories?.join(", ") || "Intrinsic, Extrinsic, Pedagogical"})
3. Strengths and Interests
4. Support Strategies for \${subject} at \${grade}
5. Curriculum Adaptations (what CAPS content adapted)
6. Assessment Accommodations (extra time, reader, scribe, etc.)
7. Resources Required
8. Roles: Teacher / SBST / DBST / Parent
9. Review Date and Success Indicators
10. Referral Pathway (escalation to next SIAS level)
11. POPIA statement
Generate 1 image prompt for ISP header — inclusive, SA school.
`;
      case 'annual_teaching_plan':
        return base + `
ATP STRUCTURE (DBE Official):
For EACH week (1-10):
- Week number | CAPS topic | Content/concepts | Activities | Resources | Assessment (informal/formal)
- Formal tasks: specify SBA number, type, topic, marks
Include: Formal Assessment Programme, SIAS notes, cross-curricular links, IKS.
Generate 1 image for ATP header — DBE branded.
`;
      case 'admin_document':
        return base + `
ADMIN DOCUMENT STRUCTURE (SA Official):
- Official header with SA flag stripe, school info, EMIS, district, province (image prompt)
- REF number, Date DD Month YYYY (2026)
- Recipient, Subject, Salutation
- Body with headings, action items, contact placeholders
- Reply slip if applicable
- Signatures: Class Teacher, Principal, SGB placeholders
- Distribution list
- POPIA confidentiality notice, footer with 2026
Generate 1 image for official header — seal, coat of arms style.
`;
      default:
        return base;
    }
  }
  
  private static getCompressedSystemPrompt(phase: string): string {
    const gradeRange = this.getGradeRange(phase);
    return `You are EduAI Pro, the world's most sophisticated educational content designer for South African schools (${gradeRange}, ${phase}). Generate high-quality CAPS-aligned lesson plans/worksheets in raw HTML/Tailwind inside JSON values. No markdown.
Visual Hierarchy:
- HERO: 25-30% top space for illustration placeholder.
- BANNER: Gradient banner with subject color coding (Math: #2563eb->#60a5fa blue, Languages: #7c3aed->#a78bfa purple, Life Skills: #f97316->#fbbf24 orange, Science: #059669->#34d399 green) + SA flag stripe (6px black/gold/green/white/red/blue).
- METADATA/BADGE: Circular Grade badge. Underlined Name, Date, and Score cards. Compliance stamps: CAPS Aligned, NPA Compliant, POPIA Compliant, SIAS Inclusive, WP6 Differentiated.
- QUESTIONS: Bold questions, numbered circle headers, Bloom's tags (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating), marks visible. Pill-shaped answer containers matching subject color.
- DIFFERENTIATION: Core (green #007749), Extended (blue #002395), Simplified (gold #FFB81C) boxes with WP6 strategies.
- SIAS: Yellow #FFB81C boxes with teacher notes, accommodations, referral guidance.
- NPA: 7-point rating table (Code 1-7, 0-100%).
- FOOTER: POPIA notice, 2026 date, school branding.
Phase Rules:
- Foundation Phase (R-3): Use Patrick's Hand or similar child-friendly handwritten font (font-hand class, 'Patrick Hand' font-family), increased font sizes (min 18pt or text-lg/xl), high-contrast, simple icons, generous padding (min 1.5rem).
- Intermediate Phase (4-6): Sans-serif (min 14pt), bold key terms, simple labeled diagrams, "Challenge Corner".
- Senior Phase (7-9): Professional sans-serif (min 12pt), multi-column layout, formulas, "Think Deeper" boxes.
- FET Phase (10-12): Academic layout, visible marks, margin notes area, formula boxes.
Image: "Professional educational illustration for South African Grade [X] [Subject]: [Topic]. Style: Semi-realistic digital painting. 300 DPI, sharp, no text." — will be generated by Qwen-Image (qwen/qwen-image) via NVIDIA NIM with SA context enhancement.
Layout Guardrails: No fixed heights on containers (use h-auto, py-4/py-6). No absolute text positioning. Use rounded-xl/2xl (not rounded-full) for choice pills to prevent clipping on wrap. Pair text-2xl+ headings with leading-tight/leading-snug.
Output format: raw JSON (no markdown block wrapper). Escaped double quotes.
SA Context: Rand (R), SA places (Table Mountain, Kruger, Drakensberg), SA names (Thabo, Amina, Sipho, Lerato), SA English spelling (colour, behaviour, organise), DD/MM/YYYY, IKS integration, ubuntu values, 2026 year.
`;
  }

  private static compressWhitespace(text: string): string {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }
  
  /**
   * Select appropriate template based on content type
   */
  private static selectTemplate(contentType: PromptContext['contentType'], phase: string): string {
    if (contentType === 'worksheet' && phase === 'Foundation Phase') {
      return FOUNDATION_PHASE_TEMPLATE;
    }
    const templates: Record<string, string> = {
      'worksheet': WORKSHEET_PROMPT_TEMPLATE,
      'poster': VISUAL_AID_PROMPT_TEMPLATE,
      'infographic': VISUAL_AID_PROMPT_TEMPLATE,
      'study-guide': STUDY_GUIDE_PROMPT_TEMPLATE,
      'lesson-plan': LESSON_PLAN_TEMPLATE,
      'report-comment': REPORT_COMMENT_TEMPLATE,
      'curriculum-map': CURRICULUM_MAP_TEMPLATE,
      'rubric': RUBRIC_TEMPLATE,
      'test': TEST_GENERATOR_TEMPLATE,
      'progress-tracker': PROGRESS_TRACKER_TEMPLATE,
      // Extended mappings
      'assessment': TEST_GENERATOR_TEMPLATE,
      'diagram': VISUAL_AID_PROMPT_TEMPLATE,
      'mind-map': VISUAL_AID_PROMPT_TEMPLATE,
      'mind_map': VISUAL_AID_PROMPT_TEMPLATE,
      'flashcard': WORKSHEET_PROMPT_TEMPLATE,
      'homework': WORKSHEET_PROMPT_TEMPLATE,
      'classroom-exercise': WORKSHEET_PROMPT_TEMPLATE,
      'revision-pack': STUDY_GUIDE_PROMPT_TEMPLATE
    };
    
    return templates[contentType] || WORKSHEET_PROMPT_TEMPLATE;
  }
  
  /**
   * Inject context variables into template
   */
  private static injectContext(template: string, context: any): string {
    let result = template;
    
    // Replace all ${variable} patterns with actual values
    Object.keys(context).forEach(key => {
      const value = context[key];
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        result = result.replace(regex, String(value));
      }
    });
    
    return result;
  }
  
  /**
   * Get educational phase from grade
   */
  public static getPhaseByGrade(grade: string): string {
    try {
      const phase = detectPhase(grade);
      const config = CAPS_PHASES[phase];
      return config.displayName;
    } catch {
      const numGrade = parseInt(grade);
      if (grade === 'R' || numGrade <= 3) return 'Foundation Phase';
      if (numGrade <= 6) return 'Intermediate Phase';
      if (numGrade <= 9) return 'Senior Phase';
      return 'FET Phase';
    }
  }
  
  private static getGradeRange(phase: string): string {
    const ranges: Record<string, string> = {
      'Foundation Phase': 'Grade R-3',
      'Intermediate Phase': 'Grade 4-6', 
      'Senior Phase': 'Grade 7-9',
      'FET Phase': 'Grade 10-12'
    };
    return ranges[phase] || 'Grade R-12';
  }
  
  /**
   * Get subject-aligned color palette
   */
  private static getSubjectPalette(subject: string): {
    primary: string; dark: string; light: string; accent: string;
    start?: string; mid?: string; end?: string;
  } {
    const palettes: Record<string, any> = {
      'Mathematics': { 
        primary: '#2563eb', dark: '#1e40af', light: '#dbeafe', accent: '#60a5fa',
        start: '#2563eb', end: '#60a5fa'
      },
      'Mathematical Literacy': { 
        primary: '#2563eb', dark: '#1e40af', light: '#dbeafe', accent: '#60a5fa',
        start: '#2563eb', end: '#60a5fa'
      },
      'English': { 
        primary: '#7c3aed', dark: '#5b21b6', light: '#ede9fe', accent: '#a78bfa',
        start: '#7c3aed', end: '#a78bfa'
      },
      'Home Language': { 
        primary: '#7c3aed', dark: '#5b21b6', light: '#ede9fe', accent: '#a78bfa',
        start: '#7c3aed', end: '#a78bfa'
      },
      'First Additional Language': { 
        primary: '#7c3aed', dark: '#5b21b6', light: '#ede9fe', accent: '#a78bfa',
        start: '#7c3aed', end: '#a78bfa'
      },
      'Life Skills': { 
        primary: '#f97316', dark: '#c2410c', light: '#ffedd5', accent: '#fbbf24',
        start: '#f97316', end: '#fbbf24'
      },
      'Life Orientation': { 
        primary: '#f97316', dark: '#c2410c', light: '#ffedd5', accent: '#fbbf24',
        start: '#f97316', end: '#fbbf24'
      },
      'Natural Sciences': { 
        primary: '#059669', dark: '#047857', light: '#d1fae5', accent: '#34d399',
        start: '#059669', end: '#34d399'
      },
      'Natural Sciences and Technology': { 
        primary: '#059669', dark: '#047857', light: '#d1fae5', accent: '#34d399',
        start: '#059669', end: '#34d399'
      },
      'Technology': { 
        primary: '#0891b2', dark: '#0e7490', light: '#cffafe', accent: '#22d3ee',
        start: '#0891b2', end: '#22d3ee'
      },
      'Social Sciences': { 
        primary: '#8b5cf6', dark: '#6d28d9', light: '#ede9fe', accent: '#a78bfa',
        start: '#8b5cf6', end: '#a78bfa'
      },
      'History': { 
        primary: '#8b5cf6', dark: '#6d28d9', light: '#ede9fe', accent: '#a78bfa',
        start: '#8b5cf6', end: '#a78bfa'
      },
      'Geography': { 
        primary: '#059669', dark: '#047857', light: '#d1fae5', accent: '#34d399',
        start: '#059669', end: '#34d399'
      },
      'Economic Management Sciences': { 
        primary: '#f59e0b', dark: '#b45309', light: '#fef3c7', accent: '#fbbf24',
        start: '#f59e0b', end: '#fbbf24'
      },
      'Economic and Management Sciences': { 
        primary: '#f59e0b', dark: '#b45309', light: '#fef3c7', accent: '#fbbf24',
        start: '#f59e0b', end: '#fbbf24'
      },
      'Creative Arts': { 
        primary: '#ec4899', dark: '#be185d', light: '#fce7f3', accent: '#f472b6',
        start: '#ec4899', end: '#f472b6'
      },
      'Accounting': { 
        primary: '#14b8a6', dark: '#0f766e', light: '#ccfbf1', accent: '#2dd4bf',
        start: '#14b8a6', end: '#2dd4bf'
      },
      'Business Studies': { 
        primary: '#14b8a6', dark: '#0f766e', light: '#ccfbf1', accent: '#2dd4bf',
        start: '#14b8a6', end: '#2dd4bf'
      },
      'Physical Sciences': { 
        primary: '#6366f1', dark: '#4338ca', light: '#e0e7ff', accent: '#818cf8',
        start: '#6366f1', end: '#818cf8'
      },
      'Life Sciences': { 
        primary: '#059669', dark: '#047857', light: '#d1fae5', accent: '#34d399',
        start: '#059669', end: '#34d399'
      },
      'Consumer Studies': { 
        primary: '#f97316', dark: '#c2410c', light: '#ffedd5', accent: '#fbbf24',
        start: '#f97316', end: '#fbbf24'
      },
    };
    
    // Fallback to professional blue if subject not found
    return palettes[subject] || { 
      primary: '#3b82f6', dark: '#1d4ed8', light: '#dbeafe', accent: '#60a5fa',
      start: '#3b82f6', end: '#60a5fa'
    };
  }
  
  /**
   * Enhance image prompt with cultural & pedagogical context — SA enhanced
   */
  private static enhanceImagePrompt(
    topic: string,
    grade: string,
    subject: string,
    phase: string,
    palette: any,
    context?: PromptContext
  ): string {
    const phaseGuidance: Record<string, string> = {
      'Foundation Phase': 'Simple composition, friendly characters, clear focal point, high contrast, large friendly Disney 3D characters',
      'Intermediate Phase': 'Balanced detail, relatable SA scenarios, subtle educational symbolism, engaging',
      'Senior Phase': 'Conceptual depth, realistic SA contexts, sophisticated visual metaphors, professional',
      'FET Phase': 'Academic rigor, professional aesthetic, exam-relevant visual clarity, sophisticated'
    };
    
    const saContextExamples: Record<string, string[]> = {
      'Mathematics': ['South African currency (Rand)', 'local market scenes', 'sports statistics', 'township spaza shop with prices in Rand'],
      'Languages': ['diverse SA names', 'township & suburban settings', 'multilingual signage', 'rainbow nation classroom'],
      'Life Skills': ['community helpers', 'local plants/animals', 'cultural celebrations', 'ubuntu values'],
      'Natural Sciences': ['Table Mountain flora', 'Kruger wildlife', 'SA coastal ecosystems', 'fynbos and protea'],
      'Natural Sciences and Technology': ['Table Mountain', 'Kruger National Park', 'Drakensberg mountains', 'Karoo landscape'],
      'History': ['Robben Island', 'Freedom Park', 'local heritage sites', 'Soweto and Constitution Hill'],
      'Geography': ['Drakensberg', 'Karoo landscape', 'Indian/Atlantic ocean convergence', 'Garden Route']
    };
    
    const saElements = saContextExamples[subject] || ['South African landscapes', 'diverse communities', 'local wildlife', 'rainbow nation'];
    const randomElement = saElements[Math.floor(Math.random() * saElements.length)];

    // Try to get CAPS config for Bloom's and NPA info
    let capsInfo = "";
    try {
      const config = getPhaseConfig(grade);
      capsInfo = `CAPS: ${config.displayName}, SBA ${config.assessmentWeights.schoolBasedAssessment}%/Exam ${config.assessmentWeights.yearEndExam}%, Bloom's: Remembering ${config.bloomsDistribution.remembering}% etc.`;
    } catch {}

    // Include Qwen optimization note
    const qwenNote = `Optimized for Qwen-Image (qwen/qwen-image) via NVIDIA NIM — clean flat vector, educational poster design, SA context, no text overlays, 300 DPI, white/light background, professional quality, legible text if any, diverse SA learners.`;
    
    return `Professional educational illustration for South African ${phase} (Grade ${grade}) ${subject}: ${topic}. 
Style: ${EDUCATIONAL_IMAGE_STYLE}, children's non-fiction book aesthetic, ${qwenNote}
Composition: Hero layout with ${phaseGuidance[phase] || 'balanced details'}, 25-30% hero if header. 
Cultural context: Include recognizable South African elements like ${randomElement}, diverse SA children representing rainbow nation. 
Color palette: ${palette.primary} primary with ${palette.accent} accents, SA flag colours (green #007749, gold #FFB81C) accents, harmonious and accessible, high contrast. 
Technical: 300 DPI, sharp focus, no text overlays, no borders, no watermarks, museum-quality detail, suitable for classroom poster printing and digital projection. Mood: Engaging, curiosity-sparking, empowering, inclusive.
${capsInfo}
${context?.additionalInstructions ? `Instructor brief: ${context.additionalInstructions.slice(0, 200)}` : ""}
`;
  }
}

export default EduAIPromptEngine;
