import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_CONTENT_TYPES,
  REFERENCE_TEMPLATE_PROMPTS,
  SINGLE_MERGED_BANNER_SYSTEM_PROMPT,
  buildDocumentBannerData,
  buildDocumentBannerPromptData,
  builtInContentTypePrompt,
  hasBuiltInContentTypePrompt,
  referencePromptForContent,
} from '../src/lib/prompts/template-derived-prompts';
import { currentSATerm, saToday } from '../src/lib/saDates';

describe('built-in content-type prompt catalog', () => {
  it('provides a dedicated prompt for every unique Content Creator selection', () => {
    expect(BUILT_IN_CONTENT_TYPES.length).toBeGreaterThan(60);
    expect(new Set(BUILT_IN_CONTENT_TYPES).size).toBe(BUILT_IN_CONTENT_TYPES.length);
    for (const contentType of BUILT_IN_CONTENT_TYPES) {
      expect(hasBuiltInContentTypePrompt(contentType), contentType).toBe(true);
      expect(builtInContentTypePrompt(contentType)).toContain(`BUILT-IN CONTENT-TYPE SYSTEM PROMPT — ${contentType}`);
    }
  });

  it('uses template-derived patterns only when the type, topic and grade fit', () => {
    const multiplication = referencePromptForContent({
      contentType: 'Educational Poster',
      grade: 'Grade 3',
      subject: 'Mathematics',
      topic: 'Multiplication as equal groups',
    });
    expect(multiplication?.key).toBe('illustratedMultiplicationExplainer');
    expect(multiplication?.source).toContain('Multiplication for Grade 3 Learners.pdf');

    const worksheet = referencePromptForContent({
      contentType: 'Worksheet',
      grade: 'Grade 4',
      subject: 'Life Skills',
      topic: 'Emotions and relationships',
    });
    expect(worksheet?.key).toBe('gradeFourLifeSkillsReflection');

    expect(referencePromptForContent({ contentType: 'Worksheet', grade: 'Grade 8', topic: 'Fractions' })).toBeUndefined();
    expect(Object.keys(REFERENCE_TEMPLATE_PROMPTS)).toHaveLength(10);
  });
});

describe('shared merged-banner contract and data', () => {
  it('instructs all models to leave exactly one banner to the host', () => {
    expect(SINGLE_MERGED_BANNER_SYSTEM_PROMPT).toContain('exactly ONE opening document banner');
    expect(SINGLE_MERGED_BANNER_SYSTEM_PROMPT).toContain('current content title/header');
    expect(SINGLE_MERGED_BANNER_SYSTEM_PROMPT).toContain('grade, subject, content type, term');
    expect(SINGLE_MERGED_BANNER_SYSTEM_PROMPT).toContain("today's South African date");
    expect(SINGLE_MERGED_BANNER_SYSTEM_PROMPT).toContain('CAPS / NPA / POPIA / SIAS / WP6');
  });

  it('provides runtime term/date plus supplied document and compliance details as data', () => {
    const data = buildDocumentBannerData({
      contentType: 'Worksheet',
      topic: 'Fractions',
      grade: '4',
      subject: 'Mathematics',
      duration: '45 minutes',
      totalMarks: 30,
      capsReference: 'Number Fractions',
      school: 'Mhlabeni Primary',
      teacher: 'Ms Ndlovu',
    });

    expect(data).toMatchObject({
      title: 'Fractions',
      contentType: 'Worksheet',
      grade: '4',
      subject: 'Mathematics',
      term: currentSATerm(),
      date: saToday(),
      duration: '45 minutes',
      totalMarks: 30,
      capsReference: 'Number Fractions',
      school: 'Mhlabeni Primary',
      teacher: 'Ms Ndlovu',
      compliance: expect.arrayContaining(['South African CAPS aligned', 'NPA compliant', 'SIAS inclusive', 'WP6 differentiated']),
    });

    const promptData = buildDocumentBannerPromptData({ contentType: 'Worksheet', topic: 'Fractions' });
    expect(promptData).toContain('HOST BANNER SOURCE DATA');
    expect(promptData).toContain('"contentType": "Worksheet"');
    expect(promptData).toContain('"date"');
    expect(promptData).toContain('POPIA compliant');
  });
});
