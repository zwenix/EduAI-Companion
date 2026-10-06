import { describe, expect, it } from 'vitest';
import { EduAIPromptEngine } from '../src/lib/prompt-engine';
import { CAPS_LESSON_PLAN_SYSTEM_PROMPT, CAPS_LESSON_PLAN_USER_PROMPT } from '../src/lib/prompts/caps-lesson-plan-prompt';
import { EDUAI_HOST_CHROME_RULE } from '../src/lib/prompts/host-chrome';

const baseContext = {
  grade: '5',
  subject: 'Mathematics',
  topic: 'Fractions',
  language: 'English',
};

describe('restored engineered prompts and current document chrome', () => {
  it('keeps the detailed worksheet prompt while delegating page chrome to the host', () => {
    const { system, user } = EduAIPromptEngine.assemblePrompt({
      ...baseContext,
      contentType: 'worksheet',
      includeWorksheet: true,
    });

    expect(system).toContain('EduAI Visual Hierarchy System');
    expect(system).toContain(EDUAI_HOST_CHROME_RULE);
    expect(user).toContain('WORK_SHEET BODY STRUCTURE');
    expect(user).toContain('QUESTIONS BLOCK');
    expect(user).toContain(EDUAI_HOST_CHROME_RULE);

    const lessonWithWorksheet = EduAIPromptEngine.assemblePrompt({
      ...baseContext,
      contentType: 'lesson-plan',
      includeWorksheet: true,
    });
    expect(lessonWithWorksheet.user).toContain('CRITICAL INTEGRATION FOR LESSON PLAN');
    expect(lessonWithWorksheet.user).toContain('At least 4 distinct');
    expect(user).not.toContain('<!DOCTYPE html>');
    expect(user).not.toMatch(/<script\s+src=["']https:\/\/cdn\.tailwindcss\.com/i);
  });

  it.each([
    ['poster', 'LAYOUT GRID'],
    ['study-guide', 'TABLE OF CONTENTS'],
    ['lesson-plan', 'LESSON PLAN BODY STRUCTURE'],
    ['rubric', 'ASSESSMENT RUBRIC BODY TEMPLATE'],
    ['test', 'TEST PAPER BODY TEMPLATE'],
    ['progress-tracker', 'PROGRESS TRACKER BODY TEMPLATE'],
  ] as const)('applies the host shell rule to the %s template', (contentType, bodyMarker) => {
    const { user } = EduAIPromptEngine.assemblePrompt({
      ...baseContext,
      contentType,
    });

    expect(user).toContain(bodyMarker);
    expect(user).toContain(EDUAI_HOST_CHROME_RULE);
    expect(user).not.toContain('<!DOCTYPE html>');
  });

  it('adapts the dedicated CAPS lesson-plan prompt without dropping its engineered structure', () => {
    expect(CAPS_LESSON_PLAN_SYSTEM_PROMPT).toContain('A lesson plan is a comprehensive teaching guide');
    expect(CAPS_LESSON_PLAN_SYSTEM_PROMPT).toContain('LESSON CONTEXT');
    expect(CAPS_LESSON_PLAN_SYSTEM_PROMPT).toContain(EDUAI_HOST_CHROME_RULE);
    expect(CAPS_LESSON_PLAN_USER_PROMPT).toContain('Step-by-step lesson procedure');
    expect(CAPS_LESSON_PLAN_USER_PROMPT).toContain('semantic HTML body fragment');
    expect(CAPS_LESSON_PLAN_USER_PROMPT).toContain(EDUAI_HOST_CHROME_RULE);
  });
});
