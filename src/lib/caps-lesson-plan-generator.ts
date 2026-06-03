// src/lib/caps-lesson-plan-generator.ts

import { CAPS_LESSON_PLAN_SYSTEM_PROMPT, CAPS_LESSON_PLAN_USER_PROMPT } from './prompts/caps-lesson-plan-prompt';

export interface LessonPlanContext {
  subject: string;
  grade: string;
  term: number;
  week: number;
  topic: string;
  duration?: string;
  classSize?: number;
  resources?: string[];
  specialConsiderations?: string;
  includeWorksheet?: boolean;
}

export class CAPSLessonPlanGenerator {
  
  /**
   * Generate a CAPS-compliant lesson plan
   */
  static generateLessonPlanPrompt(context: LessonPlanContext): { system: string; user: string } {
    const systemPrompt = CAPS_LESSON_PLAN_SYSTEM_PROMPT;
    
    const userPrompt = CAPS_LESSON_PLAN_USER_PROMPT
      .replace('[SUBJECT_NAME]', context.subject)
      .replace('[GRADE_LEVEL]', context.grade)
      .replace('[TERM_NUMBER]', context.term.toString())
      .replace('[WEEK_NUMBER]', context.week.toString())
      .replace('[TOPIC_NAME]', context.topic)
      .replace('[DURATION]', context.duration || '1 hour')
      .replace('[NUMBER]', context.classSize?.toString() || '30')
      .replace('[LIST RESOURCES]', context.resources?.join(', ') || 'Standard classroom resources')
      .replace('[ANY BARRIERS OR NEEDS]', context.specialConsiderations || 'None specified')
      .replace('[INCLUDE_WORKSHEET_FLAG]', context.includeWorksheet ? 'YES' : 'NO');
    
    return {
      system: systemPrompt,
      user: userPrompt
    };
  }
  
  /**
   * Get subject-specific CAPS requirements
   */
  static getSubjectRequirements(subject: string): string {
    const requirements: Record<string, string> = {
      'Mathematics': `
        MATHEMATICS-SPECIFIC ELEMENTS:
        - Include mental math activities (5-10 min)
        - Provide worked examples for each concept
        - Include problem-solving strategies
        - Specify calculator policy (with/without)
        - Include mathematical vocabulary development
        - Reference specific CAPS page numbers
      `,
      'Agricultural Management Practices': `
        AGRICULTURAL MANAGEMENT PRACTICES-SPECIFIC ELEMENTS:
        - Include practical farming applications
        - Reference South African agricultural context
        - Include production factors (land, labour, capital, management)
        - Integrate sustainability concepts
        - Include farm planning activities
        - Reference current agricultural practices
      `,
      'Life Sciences': `
        LIFE SCIENCES-SPECIFIC ELEMENTS:
        - Include practical investigations where applicable
        - Specify safety requirements
        - Include scientific method application
        - Data collection and analysis activities
        - Scientific vocabulary development
        - Link to real-world biological applications
      `,
      'Physical Sciences': `
        PHYSICAL SCIENCES-SPECIFIC ELEMENTS:
        - Include experiments/demonstrations
        - Specify safety precautions
        - Mathematical problem-solving
        - Real-world physics/chemistry applications
        - Include formula derivations where relevant
      `,
      'English': `
        LANGUAGE-SPECIFIC ELEMENTS:
        - Integrate all four skills (listening, speaking, reading, writing)
        - Include text analysis activities
        - Vocabulary development strategies
        - Grammar in context
        - Include diverse text types
        - Reading comprehension strategies
      `
    };
    
    return requirements[subject] || '';
  }
}

export default CAPSLessonPlanGenerator;
