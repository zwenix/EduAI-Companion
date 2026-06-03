// src/services/lessonPlanService.ts

import { generateCAPSContent } from './unifiedAiService';
import { CAPSLessonPlanGenerator, LessonPlanContext } from '../lib/caps-lesson-plan-generator';
import { EXAMPLE_LESSON_PLANS } from '../lib/example-lesson-plans';

export interface LessonPlanGenerationRequest {
  subject: string;
  grade: string;
  term: number;
  week: number;
  topic: string;
  duration?: string;
  classSize?: number;
  specificRequirements?: string;
  includeWorksheet?: boolean;
}

export class LessonPlanService {
  
  /**
   * Generate a CAPS-compliant lesson plan
   * This is the MAIN function to call when generating lesson plans
   */
  static async generateLessonPlan(request: LessonPlanGenerationRequest): Promise<string> {
    try {
      // Validate request
      this.validateRequest(request);
      
      // Create lesson plan context
      const context: LessonPlanContext = {
        subject: request.subject,
        grade: request.grade,
        term: request.term,
        week: request.week,
        topic: request.topic,
        duration: request.duration,
        classSize: request.classSize,
        resources: [],
        specialConsiderations: request.specificRequirements,
        includeWorksheet: request.includeWorksheet
      };
      
      // Get subject-specific requirements
      const subjectRequirements = CAPSLessonPlanGenerator.getSubjectRequirements(request.subject);
      
      // Generate the prompt
      const { system, user } = CAPSLessonPlanGenerator.generateLessonPlanPrompt(context);
      
      // Append subject-specific requirements
      const enhancedUserPrompt = user + '\n\n' + subjectRequirements;
      
      // Call AI service with lesson plan prompts
      const result = await generateCAPSContent({
        contentType: 'lesson-plan',
        systemPrompt: system,
        userPrompt: enhancedUserPrompt,
        grade: request.grade,
        subject: request.subject,
        topic: request.topic,
        language: 'en',
        includeWorksheet: request.includeWorksheet,
        additionalInstructions: `
          CRITICAL: This must be a comprehensive TEACHER'S LESSON PLAN.
          Include all sections: objectives, resources, detailed content, procedure with time allocations,
          assessment strategies, differentiation, and reflection space.
          ${request.includeWorksheet ? 'Also generate and append a student activity/worksheet at the end.' : 'Strictly do NOT append/include a student worksheet or exercises at the end — keep this purely as a structured teaching guide.'}
          ${request.specificRequirements || ''}
        `
      });
      
      return result.content || result;
      
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      throw new Error('Failed to generate CAPS-compliant lesson plan');
    }
  }
  
  /**
   * Get a pre-generated example lesson plan template
   */
  static getExampleTemplate(subject: string): string {
    const templates: Record<string, string> = {
      'Agricultural Management Practices': EXAMPLE_LESSON_PLANS.agriculturalManagement,
    };
    
    return templates[subject] || EXAMPLE_LESSON_PLANS.agriculturalManagement;
  }
  
  /**
   * Validate lesson plan request
   */
  private static validateRequest(request: LessonPlanGenerationRequest): void {
    const required = ['subject', 'grade', 'term', 'week', 'topic'];
    const missing = required.filter(field => !request[field as keyof LessonPlanGenerationRequest]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (request.term < 1 || request.term > 4) {
      throw new Error('Term must be between 1 and 4');
    }
    
    if (request.week < 1 || request.week > 10) {
      throw new Error('Week must be between 1 and 10');
    }
  }
  
  /**
   * Generate lesson plan variations for different learning styles
   */
  static async generateDifferentiatedLessonPlans(
    request: LessonPlanGenerationRequest
  ): Promise<{ visual: string; auditory: string; kinesthetic: string }> {
    const basePlan = await this.generateLessonPlan(request);
    
    // Generate variations (simplified example)
    const visualVariation = basePlan + '\n\nVISUAL LEARNING ENHANCEMENTS:\n- Add diagrams for all concepts\n- Use color-coded materials\n- Include infographics';
    const auditoryVariation = basePlan + '\n\nAUDITORY LEARNING ENHANCEMENTS:\n- Include group discussions\n- Add verbal explanations\n- Use podcasts or audio recordings';
    const kinestheticVariation = basePlan + '\n\nKINESTHETIC LEARNING ENHANCEMENTS:\n- Hands-on activities\n- Movement-based learning\n- Practical demonstrations';
    
    return {
      visual: visualVariation,
      auditory: auditoryVariation,
      kinesthetic: kinestheticVariation
    };
  }
}

export default LessonPlanService;
