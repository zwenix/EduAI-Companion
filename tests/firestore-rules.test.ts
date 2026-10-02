/**
 * Firestore security-rules regression guard (static analysis).
 *
 * The rules in `firestore.rules` are the ONLY authorisation layer for learner,
 * parent and school data, and a single careless edit can expose every document.
 * These assertions parse the deployed rules file and fail if a known-critical
 * invariant disappears.
 *
 * They deliberately do NOT execute rules: the authoritative behavioural suite is
 * the "Dirty Dozen" payload catalogue in `security_spec.md`, which needs the
 * Firestore emulator + `@firebase/rules-unit-testing` (see the roadmap in
 * `TECHNICAL_SPECIFICATION.md` §15). This file is the always-on tripwire.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rulesPath = resolve(__dirname, '..', 'firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

/** The collections the client actually reads/writes (see the spec §8.2). */
const EXPECTED_COLLECTIONS = [
  'users',
  'students',
  'classes',
  'study_groups',
  'collaborative_projects',
  'collaborative_cursors',
  'communicator_messages',
  'direct_messages',
  'messages',
  'messenger_messages',
  'ai_tutor_sessions',
  'ai_floating_sessions',
  'created_content',
  'lessons',
  'illustrations',
  'assignments',
  'submissions',
  'auto_grading_reports',
  'published_reports',
  'learner_interventions',
  'portfolio_items',
  'student_records',
  'omnihuman_videos',
  'notifications',
  'activity_logs',
  'planner_events',
];

describe('firestore.rules — file integrity', () => {
  it('is present and non-trivial', () => {
    expect(rules.length).toBeGreaterThan(1000);
    expect(rules).toMatch(/service\s+cloud\.firestore\s*\{/);
  });

  it('declares a match block for every application collection', () => {
    for (const collection of EXPECTED_COLLECTIONS) {
      expect(rules, `missing rules for /${collection}`).toMatch(
        new RegExp(`match\\s+/${collection}/`),
      );
    }
  });

  it('keeps balanced braces', () => {
    const open = (rules.match(/\{/g) || []).length;
    const close = (rules.match(/\}/g) || []).length;
    expect(open).toBe(close);
  });
});

describe('firestore.rules — deny-by-default posture', () => {
  it('starts from a global deny', () => {
    expect(rules).toMatch(
      /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/,
    );
  });

  it('grants NO allowance to unauthenticated callers', () => {
    // Hardened 2026-10-02: /planner_events and /illustrations previously had
    // `if true` rules. Nothing may regress to unauthenticated access.
    const allowances = rules.match(/allow[^;]*;\s*/g) || [];
    for (const allowance of allowances) {
      expect(allowance, `unauthenticated allowance: ${allowance}`).not.toMatch(/if\s+true/);
    }
  });

  it('protects planner events (teacher diary) behind authentication', () => {
    const block = rules.slice(
      rules.indexOf('match /planner_events/{eventId}'),
      rules.indexOf('match /planner_events/{eventId}') + 500,
    );
    expect(block).toMatch(/isSignedIn\(\)/);
  });

  it('protects the illustration library behind authentication', () => {
    const block = rules.slice(
      rules.indexOf('match /illustrations/{illustrationId}'),
      rules.indexOf('match /assignments/{assignmentId}'),
    );
    expect(block).toMatch(/allow read: if isSignedIn\(\)/);
  });

  it('has no catch-all allowance at the database level', () => {
    expect(rules).not.toMatch(/allow\s+read,\s*write:\s*if\s+request\.auth\s*!=\s*null\s*;\s*\}/);
  });

  it('requires an authenticated user for every collection match block', () => {
    // Every application match block must be guarded by isSignedIn() or an
    // explicit request.auth check somewhere in its body.
    const blocks = rules
      .split(/match\s+\//)
      .slice(1)
      .filter((block) => !/^\{document=\*\*\}|^\{database\}|^databases\//.test(block));
    expect(blocks.length).toBeGreaterThan(20);
    for (const block of blocks) {
      expect(
        /isSignedIn\(\)|request\.auth/.test(block),
        `match block without an auth guard: ${block.slice(0, 60)}`,
      ).toBe(true);
    }
  });
});

describe('firestore.rules — critical invariants', () => {
  it('defines the shared authorisation helpers', () => {
    for (const helper of ['isSignedIn', 'isValidId', 'incoming', 'existing']) {
      expect(rules, `missing helper ${helper}()`).toMatch(new RegExp(`function\\s+${helper}\\s*\\(`));
    }
  });

  it('blocks self-assigned role escalation to admin', () => {
    const userRules = rules.slice(rules.indexOf('match /users/{userId}'));
    // The role field must be constrained rather than freely writable.
    expect(userRules).toMatch(/role/);
    expect(userRules).toMatch(/==\s*existing\(\)\.role|!in|in\s*\[/);
  });

  it('pins the user profile to the authenticated uid', () => {
    const userRules = rules.slice(
      rules.indexOf('match /users/{userId}'),
      rules.indexOf('match /students/{studentId}'),
    );
    expect(userRules).toMatch(/request\.auth\.uid\s*==\s*userId/);
  });

  it('requires messages to be sent by the authenticated user', () => {
    const messageRules = rules.slice(
      rules.indexOf('match /communicator_messages/{messageId}'),
      rules.indexOf('match /ai_tutor_sessions/{userId}'),
    );
    expect(messageRules).toMatch(/senderId\s*==\s*request\.auth\.uid/);
    expect(messageRules).toMatch(/isValidMessage\(incoming\(\)\)/);
  });

  it('keeps AI tutor sessions private to their owner', () => {
    const tutorRules = rules.slice(
      rules.indexOf('match /ai_tutor_sessions/{userId}'),
      rules.indexOf('match /created_content/{contentId}'),
    );
    expect(tutorRules).toMatch(/(request\.auth\.uid\s*==\s*userId|userId\s*==\s*request\.auth\.uid)/);
  });

  it('validates every write payload with a schema helper', () => {
    for (const helper of [
      'isValidUser',
      'isValidStudentCreate',
      'isValidStudentUpdate',
      'isValidClass',
      'isValidNotification',
      'isValidMessage',
      'isValidCreatedContent',
      'isValidLesson',
      'isValidIllustration',
      'isValidGeneratedVideo',
    ]) {
      expect(rules, `missing validator ${helper}()`).toMatch(
        new RegExp(`function\\s+${helper}\\s*\\(`),
      );
    }
  });

  it('caps identifier and string sizes (anti state-poisoning)', () => {
    expect(rules).toMatch(/id\.size\(\)\s*<=\s*\d+/);
    expect(rules).toMatch(/is\s+string\s*&&[^;]*\.size\(\)\s*<=\s*\d+/);
  });
});
