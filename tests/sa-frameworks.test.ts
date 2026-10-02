/**
 * South African compliance frameworks (CAPS / NPA / SIAS / WP6 / POPIA).
 *
 * These rules are embedded in every generation prompt, so a regression here
 * silently produces non-compliant classroom material. `SA_INTEGRATION_SUMMARY.md`
 * is the human-readable source these assertions mirror.
 */
import { describe, expect, it } from 'vitest';
import {
  CAPS_PHASES,
  NPA_RATING_CODES,
  SIAS_SUPPORT_LEVELS,
  detectPhase,
  generateCAPSReference,
  getBloomsDistributionForPhase,
  getNPAWeighting,
  getPhaseConfig,
  validateCAPSCompliance,
  validateSubjectForPhase,
} from '../src/lib/compliance/sa-frameworks';

describe('phase detection (CAPS)', () => {
  it.each([
    ['R', 'foundation'],
    ['Grade R', 'foundation'],
    ['1', 'foundation'],
    ['Grade 3', 'foundation'],
    ['4', 'intermediate'],
    ['Grade 6', 'intermediate'],
    ['7', 'senior'],
    ['Grade 9', 'senior'],
    ['10', 'fet'],
    ['Grade 12', 'fet'],
    ['Matric', 'fet'],
  ])('maps %s to the %s phase', (grade, phase) => {
    expect(detectPhase(grade)).toBe(phase);
  });

  it('rejects an empty grade instead of guessing', () => {
    expect(() => detectPhase('')).toThrow(/grade/i);
  });
});

describe('assessment weighting (NPA)', () => {
  it('uses the official SBA / exam split per phase', () => {
    expect(getNPAWeighting('Grade 2')).toMatchObject({
      schoolBasedAssessment: 100,
      yearEndExam: 0,
    });
    expect(getNPAWeighting('Grade 5')).toMatchObject({
      schoolBasedAssessment: 75,
      yearEndExam: 25,
    });
    expect(getNPAWeighting('Grade 8')).toMatchObject({
      schoolBasedAssessment: 60,
      yearEndExam: 40,
    });
    expect(getNPAWeighting('Grade 11')).toMatchObject({
      schoolBasedAssessment: 25,
      yearEndExam: 75,
    });
  });

  it('keeps the 7-point rating scale with correct ranges', () => {
    expect(NPA_RATING_CODES).toHaveLength(7);
    expect(NPA_RATING_CODES[0]).toMatchObject({ code: 7, percentage: '80–100%' });
    expect(NPA_RATING_CODES[6]).toMatchObject({ code: 1, percentage: '0–29%' });
    // Codes descend 7 → 1 with no gaps or duplicates.
    expect(NPA_RATING_CODES.map((c) => c.code)).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });
});

describe("Bloom's distribution", () => {
  it('always sums to 100% for every phase', () => {
    for (const grade of ['R', '3', '6', '9', '12']) {
      const distribution = getBloomsDistributionForPhase(grade);
      const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
      expect(total, `Bloom's distribution for grade ${grade}`).toBe(100);
    }
  });

  it('weights lower-order thinking more heavily in the Foundation Phase', () => {
    const foundation = getBloomsDistributionForPhase('Grade 2');
    const fet = getBloomsDistributionForPhase('Grade 11');
    expect(foundation.remembering).toBeGreaterThan(fet.remembering);
  });
});

describe('subjects per phase', () => {
  it('recognises valid subjects and flags invalid ones', () => {
    expect(validateSubjectForPhase('Mathematics', 'Grade 2')).toBe(true);
    expect(validateSubjectForPhase('Life Skills', 'Grade 1')).toBe(true);
    expect(validateSubjectForPhase('Accounting', 'Grade 3')).toBe(false);
    expect(validateSubjectForPhase('', 'Grade 5')).toBe(false);
  });

  it('declares a subject list for every phase', () => {
    for (const [phase, config] of Object.entries(CAPS_PHASES)) {
      expect(config.subjects.length, `subjects for ${phase}`).toBeGreaterThan(0);
      expect(config.displayName).toBeTruthy();
    }
  });
});

describe('SIAS support levels', () => {
  it('exposes the three school-based levels with providers', () => {
    expect(SIAS_SUPPORT_LEVELS.length).toBeGreaterThanOrEqual(3);
    for (const level of SIAS_SUPPORT_LEVELS) {
      expect(level.level).toMatch(/^level_[1-4]$/);
      expect(level.provider).toBeTruthy();
      expect(level.description).toBeTruthy();
    }
  });
});

describe('validateCAPSCompliance', () => {
  it('passes a well-formed request and reports no failures', () => {
    const report = validateCAPSCompliance('Grade 5', 'Mathematics', 'Worksheet', 2);
    expect(report.isCompliant).toBe(true);
    expect(report.checks.every((c) => c.status !== 'fail')).toBe(true);
    expect(report.framework).toContain('CAPS');
    expect(report.summary).toMatch(/\d+\/\d+ checks passed/);
  });

  it('warns (but does not fail) when the subject does not match the phase', () => {
    const report = validateCAPSCompliance('Grade 2', 'Accounting', 'Worksheet', 1);
    const subjectCheck = report.checks.find((c) => c.rule === 'CAPS Subject-Phase Alignment');
    expect(subjectCheck?.status).toBe('warning');
    expect(report.isCompliant).toBe(true);
  });

  it('fails cleanly on an invalid grade instead of throwing', () => {
    const report = validateCAPSCompliance('', 'Mathematics', 'Worksheet');
    expect(report.isCompliant).toBe(false);
    expect(report.checks.some((c) => c.status === 'fail')).toBe(true);
  });

  it('runs the full framework checklist', () => {
    const report = validateCAPSCompliance('Grade 8', 'Natural Sciences', 'Test', 3);
    const rules = report.checks.map((c) => c.rule);
    for (const expected of [
      'CAPS Subject-Phase Alignment',
      'NPA Assessment Weighting',
      "Bloom's Cognitive Distribution",
      'ATP Term Alignment',
      'POPIA Data Protection',
      'SIAS Inclusive Education',
      'White Paper 6 Differentiation',
      'South African Context',
    ]) {
      expect(rules, `missing check: ${expected}`).toContain(expected);
    }
    expect(report.checks.every((c) => c.framework)).toBe(true);
  });
});

describe('CAPS reference line', () => {
  it('names the subject, grade and term', () => {
    const reference = generateCAPSReference('Mathematics', 'Grade 2', 3, 'Data Handling');
    expect(reference).toContain('Mathematics');
    expect(reference).toContain('Grade 2');
    expect(reference).toContain('Term 3');
    expect(reference).toContain('Data Handling');
    expect(reference).toContain('CAPS Aligned');
  });

  it('stays well-formed when no topic is supplied', () => {
    const reference = generateCAPSReference('English', 'Grade 9', 1);
    expect(reference).toContain('Term 1');
    expect(reference).not.toContain('undefined');
    // No trailing topic segment after the term.
    expect(reference).toMatch(/Term 1 \| CAPS Aligned/);
  });
});

describe('phase configuration sanity', () => {
  it('matches the documented phase set', () => {
    expect(Object.keys(CAPS_PHASES).sort()).toEqual(
      ['fet', 'foundation', 'intermediate', 'senior'].sort(),
    );
  });

  it('exposes the phase config through getPhaseConfig', () => {
    expect(getPhaseConfig('Grade R')).toBe(CAPS_PHASES.foundation);
    expect(getPhaseConfig('12')).toBe(CAPS_PHASES.fet);
  });
});
