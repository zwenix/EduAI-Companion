/**
 * EduAI Companion - Dynamic Prompt Assembly System
 * Version 2.0 - Battle-Tested Prompt Engineering
 */

import { ENHANCED_MASTER_PROMPT } from './prompts/master-prompt';
import { 
  WORKSHEET_PROMPT_TEMPLATE, 
  VISUAL_AID_PROMPT_TEMPLATE, 
  STUDY_GUIDE_PROMPT_TEMPLATE 
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

export interface PromptContext {
  contentType: 'worksheet' | 'poster' | 'study-guide' | 'infographic' | 
               'lesson-plan' | 'report-comment' | 'curriculum-map' |
               'rubric' | 'test' | 'progress-tracker';
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
}

export class EduAIPromptEngine {
  
  /**
   * Assemble a complete, context-aware prompt for any content type
   */
  static assemblePrompt(context: PromptContext): { system: string; user: string } {
    const phase = this.getPhaseByGrade(context.grade);
    const subjectPalette = this.getSubjectPalette(context.subject);
    
    // Enhance image prompt with context
    const enhancedImagePrompt = this.enhanceImagePrompt(
      context.topic, 
      context.grade, 
      context.subject,
      phase,
      subjectPalette
    );
    
    // Select base template based on content type
    let contentTemplate = this.selectTemplate(context.contentType);
    
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
    
    // Inject dynamic values into template
    let userPrompt = this.injectContext(contentTemplate, {
      ...context,
      capsCode: context.capsReference || '',
      instructions: context.additionalInstructions || '',
      totalMarks: context.totalMarks || 30,
      title: context.topic || '',
      subtitle: context.additionalInstructions || `Comprehensive overview and exercises for ${context.topic}`,
      imagePrompt: enhancedImagePrompt,
      phase,
      ...subjectPalette
    });
    
    // Enhance system prompt with phase-specific guidance
    let systemPrompt = ENHANCED_MASTER_PROMPT
      .replace(/\$\{phase\}/g, phase)
      .replace(/\$\{gradeRange\}/g, this.getGradeRange(phase));
    
    if (context.isGroq) {
      systemPrompt = this.compressWhitespace(systemPrompt);
      userPrompt = this.compressWhitespace(userPrompt);
    }
    
    return {
      system: systemPrompt,
      user: userPrompt
    };
  }
  
  private static getCompressedSystemPrompt(phase: string): string {
    const gradeRange = this.getGradeRange(phase);
    return `You are EduAI Pro, the world's most sophisticated educational content designer for South African schools (${gradeRange}, ${phase}). Generate high-quality CAPS-aligned lesson plans/worksheets in raw HTML/Tailwind inside JSON values. No markdown.
Visual Hierarchy:
- HERO: 25-30% top space for illustration placeholder.
- BANNER: Gradient banner with subject color coding (Math: #2563eb->#60a5fa blue, Languages: #7c3aed->#a78bfa purple, Life Skills: #f97316->#fbbf24 orange, Science: #059669->#34d399 green).
- METADATA/BADGE: Circular Grade badge. Underlined Name, Date, and Score cards.
- QUESTIONS: Bold questions, numbered circle headers. Pill-shaped answer containers matching subject color.
Phase Rules:
- Foundation Phase (R-3): Use Patrick's Hand or similar child-friendly handwritten font (font-hand class, 'Patrick Hand' font-family), increased font sizes (min 18pt or text-lg/xl), high-contrast, simple icons, generous padding (min 1.5rem).
- Intermediate Phase (4-6): Sans-serif (min 14pt), bold key terms, simple labeled diagrams, "Challenge Corner".
- Senior Phase (7-9): Professional sans-serif (min 12pt), multi-column layout, formulas, "Think Deeper" boxes.
- FET Phase (10-12): Academic layout, visible marks, margin notes area, formula boxes.
Image: "Professional educational illustration for South African Grade [X] [Subject]: [Topic]. Style: Semi-realistic digital painting. 300 DPI, sharp, no text."
Layout Guardrails: No fixed heights on containers (use h-auto, py-4/py-6). No absolute text positioning. Use rounded-xl/2xl (not rounded-full) for choice pills to prevent clipping on wrap. Pair text-2xl+ headings with leading-tight/leading-snug.
Output format: raw JSON (no markdown block wrapper). Escaped double quotes.`;
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
  private static selectTemplate(contentType: PromptContext['contentType']): string {
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
      'progress-tracker': PROGRESS_TRACKER_TEMPLATE
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
  private static getPhaseByGrade(grade: string): string {
    const numGrade = parseInt(grade);
    if (grade === 'R' || numGrade <= 3) return 'Foundation Phase';
    if (numGrade <= 6) return 'Intermediate Phase';
    if (numGrade <= 9) return 'Senior Phase';
    return 'FET Phase';
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
   * Enhance image prompt with cultural & pedagogical context
   */
  private static enhanceImagePrompt(
    topic: string,
    grade: string,
    subject: string,
    phase: string,
    palette: any
  ): string {
    const phaseGuidance: Record<string, string> = {
      'Foundation Phase': 'Simple composition, friendly characters, clear focal point, high contrast',
      'Intermediate Phase': 'Balanced detail, relatable scenarios, subtle educational symbolism',
      'Senior Phase': 'Conceptual depth, realistic contexts, sophisticated visual metaphors',
      'FET Phase': 'Academic rigor, professional aesthetic, exam-relevant visual clarity'
    };
    
    const saContextExamples: Record<string, string[]> = {
      'Mathematics': ['South African currency (Rand)', 'local market scenes', 'sports statistics'],
      'Languages': ['diverse SA names', 'township & suburban settings', 'multilingual signage'],
      'Life Skills': ['community helpers', 'local plants/animals', 'cultural celebrations'],
      'Natural Sciences': ['Table Mountain flora', 'Kruger wildlife', 'SA coastal ecosystems'],
      'History': ['Robben Island', 'Freedom Park', 'local heritage sites'],
      'Geography': ['Drakensberg', 'Karoo landscape', 'Indian/Atlantic ocean convergence']
    };
    
    const saElements = saContextExamples[subject] || ['South African landscapes', 'diverse communities', 'local wildlife'];
    const randomElement = saElements[Math.floor(Math.random() * saElements.length)];
    
    return `Professional educational illustration for South African ${phase} (Grade ${grade}) ${subject}: ${topic}. 
Style: Semi-realistic digital painting, children's non-fiction book aesthetic. 
Composition: Hero layout with ${phaseGuidance[phase] || 'balanced details'}. 
Cultural context: Include recognizable South African elements like ${randomElement}. 
Color palette: ${palette.primary} primary with ${palette.accent} accents, harmonious and accessible. 
Technical: 300 DPI, sharp focus, no text overlays, no borders, no watermarks, museum-quality detail, 
suitable for classroom poster printing and digital projection. Mood: Engaging, curiosity-sparking, empowering.`;
  }
}

export default EduAIPromptEngine;