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
    
    // Inject dynamic values into template
    const userPrompt = this.injectContext(contentTemplate, {
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
    const systemPrompt = ENHANCED_MASTER_PROMPT
      .replace(/\$\{phase\}/g, phase)
      .replace(/\$\{gradeRange\}/g, this.getGradeRange(phase));
    
    return {
      system: systemPrompt,
      user: userPrompt
    };
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