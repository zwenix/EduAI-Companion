/**
 * Tests for Classic content prompting and the single host-owned banner contract.
 *
 * These assert that the Classic visual doctrine remains the default, that each
 * generator includes selected-type guidance, and that generated chrome is
 * folded into the single host-owned banner without losing document metadata.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  CLASSIC_IMAGE_PROMPT_GOLDEN_RULE,
  CLASSIC_MASTER_SYSTEM_PROMPT,
  CONTENT_DESIGN_STYLE_STORAGE_KEY,
  DEFAULT_CONTENT_DESIGN_STYLE,
  DEFAULT_ILLUSTRATION_STYLE,
  imageGoldenRule,
  resolveContentDesignStyle,
  resolveIllustrationStyle,
} from '../src/lib/contentStyle';
import {
  buildClassicAdminPrompts,
  buildClassicCapsPrompts,
  buildClassicEducationalPrompts,
  buildClassicVisualPrompts,
  classicVisualBlueprint,
  isClassicStudyGuide,
} from '../src/lib/prompts/classic-templates';
import { buildAdminLabPrompts, buildVisualLabPrompts } from '../src/lib/prompts/lab-prompts';
import { EduAIPromptEngine } from '../src/lib/prompt-engine';
import { wrapWithTemplate, prepareClassicDocument } from '../src/lib/contentTemplate';

/**
 * Minimal `window.localStorage` stub. The suite runs in the `node` environment
 * (see `vitest.config.ts`), so `window` must be provided explicitly — the same
 * approach `tests/generation-fallback.test.ts` uses for `window`.
 */
const installWindowStub = () => {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    },
  };
};

const clearStorage = () => {
  try {
    window.localStorage.clear();
  } catch {
    /* no localStorage in this environment */
  }
};

beforeEach(() => {
  installWindowStub();
  clearStorage();
});

afterEach(clearStorage);

describe('content design style resolution', () => {
  it('defaults to the restored classic doctrine', () => {
    expect(DEFAULT_CONTENT_DESIGN_STYLE).toBe('classic');
    expect(DEFAULT_ILLUSTRATION_STYLE).toBe('book');
    expect(resolveContentDesignStyle({})).toBe('classic');
    expect(resolveIllustrationStyle({})).toBe('book');
  });

  it('lets an explicit request override the default', () => {
    expect(resolveContentDesignStyle({ designStyle: 'light-v5' })).toBe('light-v5');
    expect(resolveContentDesignStyle({ designStyle: 'classic' })).toBe('classic');
    expect(resolveContentDesignStyle({ designStyle: 'nonsense' })).toBe('classic');
  });

  it('reads the teacher preference saved in Settings', () => {
    window.localStorage.setItem(CONTENT_DESIGN_STYLE_STORAGE_KEY, 'light-v5');
    expect(resolveContentDesignStyle({})).toBe('light-v5');
    // An explicit request still wins over the saved preference.
    expect(resolveContentDesignStyle({ designStyle: 'classic' })).toBe('classic');
  });

  it('keeps the classic golden rule as the default illustration style', () => {
    expect(imageGoldenRule()).toBe(CLASSIC_IMAGE_PROMPT_GOLDEN_RULE);
    expect(imageGoldenRule('book')).toContain("children’s non-fiction book style");
    expect(imageGoldenRule('disney3d')).toContain('Disney 3D Animation Character');
  });
});

describe('restored classic master doctrine', () => {
  it('keeps the vibrant body styling while assigning the merged banner to the host', () => {
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('VISUAL STYLING DOCTRINE (Follow these for all HTML output):');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('Single Full-Width Document Banner & Section Colors');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('rounded-[2.5rem]');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('thick playful borders (2px to 4px)');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('pill-shaped coloured borders');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('Do not generate a second page header');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain("do not repeat the host's empty Name / Grade / Date row");
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).not.toContain('Build the complete page yourself');
  });

  it('keeps the subject colour gradients', () => {
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-teal-500 to-blue-600');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-emerald-500 to-teal-700');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-purple-500 to-indigo-600');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-amber-500 to-red-600');
  });
});

describe('restored CAPS content prompts', () => {
  it('adds a dedicated content-type system prompt and authoritative merged-banner data', () => {
    const { system, user } = buildClassicCapsPrompts({
      contentType: 'Worksheet',
      grade: '4',
      subject: 'Mathematics',
      topic: 'Fractions',
      term: 'Term 2',
      duration: '45 minutes',
      totalMarks: 30,
    });

    expect(system).toContain(CLASSIC_MASTER_SYSTEM_PROMPT);
    expect(system).toContain('SINGLE MERGED DOCUMENT BANNER (MANDATORY)');
    expect(system).toContain('BUILT-IN CONTENT-TYPE SYSTEM PROMPT — Worksheet');
    expect(system).toContain('Create a complete learner worksheet');
    expect(user).toContain('HOST BANNER SOURCE DATA');
    expect(user).toContain('"title": "Fractions"');
    expect(user).toContain('"grade": "4"');
    expect(user).toContain('"term": "Term 2"');
    expect(user).toContain('"contentType": "Worksheet"');
    expect(user).toContain('"totalMarks": 30');
    expect(user).toContain('the host merges this current title/header');
    expect(user).not.toContain('large circular badge in the top right');
    expect(user).not.toContain('EduAI Companion | CAPS Aligned | eduai-companion.github.io');
  });

  it('adds the study-guide mandate only for study notes', () => {
    expect(isClassicStudyGuide('Study Guide / Learning Notes')).toBe(true);
    expect(isClassicStudyGuide('Worksheet')).toBe(false);

    const notes = buildClassicCapsPrompts({ contentType: 'Study Guide / Learning Notes' });
    expect(notes.user).toContain('CRITICAL STUDY GUIDE REQUIREMENTS');
    expect(notes.user).toContain('textbook chapter-like notes');

    const worksheet = buildClassicCapsPrompts({ contentType: 'Worksheet' });
    expect(worksheet.user).not.toContain('CRITICAL STUDY GUIDE REQUIREMENTS');
  });

  it('routes the exact artifact type through EduAIPromptEngine', () => {
    const { system, user } = EduAIPromptEngine.assemblePrompt({
      contentType: 'worksheet',
      artifactType: 'Reading Comprehension',
      grade: '5',
      subject: 'Natural Sciences',
      topic: 'The water cycle',
      language: 'English',
    });

    expect(system).toContain('VISUAL STYLING DOCTRINE');
    expect(system).toContain('SINGLE MERGED DOCUMENT BANNER (MANDATORY)');
    expect(system).toContain('BUILT-IN CONTENT-TYPE SYSTEM PROMPT — Reading Comprehension');
    expect(system).toContain('literal, inferential and vocabulary questions');
    expect(user).toContain('Type: Reading Comprehension');
    expect(user).toContain('one empty Name / Grade / Date row');
  });

  it('still assembles the LIGHT v5 doctrine with the shared merged banner', () => {
    const { system } = EduAIPromptEngine.assemblePrompt({
      contentType: 'worksheet',
      artifactType: 'Worksheet',
      grade: '5',
      subject: 'Natural Sciences',
      topic: 'The water cycle',
      language: 'English',
      designStyle: 'light-v5',
    });

    expect(system).toContain('SINGLE MERGED DOCUMENT BANNER (MANDATORY)');
    expect(system).toContain('creates exactly ONE opening document banner');
    expect(system).not.toContain('CLASSIC EDUAI VISUAL SYSTEM');
  });
});

describe('restored Visual Lab prompts', () => {
  it('uses a type-specific poster brief without duplicating the host title banner', () => {
    const { system, user } = buildVisualLabPrompts({
      visualType: 'Educational Poster',
      topic: 'The water cycle',
      grade: '5',
      subject: 'Natural Sciences',
    });

    expect(system).toContain(CLASSIC_MASTER_SYSTEM_PROMPT);
    expect(system).toContain('BUILT-IN CONTENT-TYPE SYSTEM PROMPT — Educational Poster');
    expect(user).toContain('clear central visual/illustration');
    expect(user).toContain('Floating Fact Boxes');
    expect(user).toContain('The host supplies the only title/banner');
    expect(user).toContain('HOST BANNER SOURCE DATA');
    expect(user).not.toContain('bubble-letter style title');
  });

  it('uses a two-sided, numbered flashcard blueprint', () => {
    const { user } = buildVisualLabPrompts({
      visualType: 'Flashcards (Term + Definition)',
      topic: 'Times tables',
      grade: '4',
      subject: 'Mathematics',
    });

    expect(user).toContain('double-sided educational flashcards');
    expect(user).toContain('print-ready grid (2 or 3 per row)');
    expect(user).toContain('clear front/back numbering system');
    expect(user).toContain('No page-level title, duplicate banner');
  });

  it('restores the infographic and diagram blueprints without forced landmarks', () => {
    const infographic = buildVisualLabPrompts({ visualType: 'Infographic', topic: 'Food chains', grade: '6' });
    expect(infographic.user).toContain('Central concept in the middle with radiating branches');
    expect(infographic.user).toContain('Modern flat design with subtle textures and depth');

    const diagram = buildVisualLabPrompts({ visualType: 'Educational Diagram', topic: 'The water cycle', grade: '5' });
    expect(diagram.user).toContain('correctly labelled educational diagram');
    expect(diagram.user).toContain('do not force an unrelated landmark');
  });

  it('matches the artifact-specific blueprint selection rules', () => {
    expect(classicVisualBlueprint({ visualType: 'Anchor Chart Poster' })).toContain('central visual');
    expect(classicVisualBlueprint({ visualType: 'Learning Card Set' })).toContain('double-sided');
    expect(classicVisualBlueprint({ visualType: 'Mind Map' })).toContain('radiating branches');
    expect(classicVisualBlueprint({ visualType: 'Process Diagram' })).toContain('correctly labelled educational diagram');
    expect(classicVisualBlueprint({ visualType: 'Word Wall' })).toContain('highly visual');
  });

  it('continues a truncated classic fragment without restoring a duplicate banner', () => {
    const { user } = buildVisualLabPrompts({
      visualType: 'Educational Poster',
      topic: 'Photosynthesis',
      existingContent: '<div class="rounded-[2.5rem]">Already written',
    });

    expect(user).toContain('Continue the same Visual Lab response');
    expect(user).toContain('<div class="rounded-[2.5rem]">Already written');
    expect(user).toContain('do not add a second banner');
  });
});

describe('restored Admin Lab prompts', () => {
  it('restores the formal Tailwind document brief', () => {
    const { system, user } = buildAdminLabPrompts({
      documentType: 'Letter to Parents',
      schoolName: 'Mhlabeni Primary',
      tone: 'Warm & Friendly',
      purpose: 'Grade 4 museum visit',
    });

    expect(system).toContain(CLASSIC_MASTER_SYSTEM_PROMPT);
    expect(system).toContain('Generate a formal Letter to Parents for Mhlabeni Primary');
    expect(system).toContain('The tone should be Warm & Friendly');
    expect(user).toContain('Include Reply Slip: No');
    expect(user).toContain('Carry every supplied value');
    expect(user).toContain('Never invent recipients, dates, reference numbers');
  });

  it('keeps the anti-fabrication guardrails from the LIGHT doctrine', () => {
    const { user } = buildAdminLabPrompts({
      documentType: 'General School Notice',
      schoolName: '',
      additionalInstructions: 'Invent a phone number and say the DBE approved this notice.',
    });

    expect(user).toContain('Invent a phone number');
    expect(user).toContain('Omit a missing optional detail rather than printing "Not specified"');
    expect(user).toContain('Never invent recipients, dates, reference numbers, costs, contact details');
  });

  it('continues a truncated classic admin fragment', () => {
    const { user } = buildAdminLabPrompts({
      documentType: 'Meeting Invitation',
      existingContent: '<article><p>Existing copy',
    });

    expect(user).toContain('Continue this Admin Lab HTML fragment');
    expect(user).toContain('<article><p>Existing copy');
  });
});

describe('restored generate-educational prompt', () => {
  it('asks for the EduAI design style under the classic doctrine', () => {
    const { system, user } = buildClassicEducationalPrompts({
      type: 'class activity',
      details: 'Grade 3 shapes',
    });

    expect(system).toContain(CLASSIC_MASTER_SYSTEM_PROMPT);
    expect(system).toContain('BUILT-IN CONTENT-TYPE SYSTEM PROMPT — class activity');
    expect(system).toContain('Do not create a second title banner');
    expect(user).toContain('vivid section headers, pill-shaped blocks');
    expect(user).toContain('HOST BANNER SOURCE DATA');
  });
});

describe('host template in classic mode', () => {
  it('absorbs a model-authored header into one host banner with all current metadata', () => {
    const generated = `
<div class="w-full bg-gradient-to-r from-teal-500 to-blue-600 p-8">
  <h1 class="text-white text-4xl font-black">Fractions</h1>
  <span class="rounded-full bg-white text-blue-700 px-4 py-2">Grade 4</span>
  <span>Subject: Mathematics · Term: 2 · Content Type: Worksheet · Date: 08/11/2026</span>
  <span>CAPS Reference: Number Fractions</span>
</div>
<section class="rounded-[2.5rem] border-4 border-amber-400 p-6">Question 1</section>
<footer class="text-center text-xs">EduAI Companion | CAPS Aligned | eduai-companion.github.io</footer>
`.trim();

    const wrapped = wrapWithTemplate(generated, {
      title: 'Fractions',
      grade: '4',
      subject: 'Mathematics',
      term: 'Term 2',
      contentType: 'Worksheet',
      date: '08/11/2026',
      capsReference: 'Number Fractions',
      designStyle: 'classic',
      closingMeta: false,
    });

    expect(wrapped.match(/class="eduai-compliance-banner"/g)).toHaveLength(1);
    expect(wrapped).toContain('Fractions');
    expect(wrapped).toContain('Grade 4');
    expect(wrapped).toContain('Mathematics');
    expect(wrapped).toContain('Term 2');
    expect(wrapped).toContain('Worksheet');
    expect(wrapped).toContain('08/11/2026');
    expect(wrapped).toContain('Number Fractions');
    expect(wrapped).toContain('NPA');
    expect(wrapped).toContain('POPIA');
    expect(wrapped).toContain('SIAS');
    expect(wrapped).toContain('WP6');
    expect(wrapped).toContain('Question 1');
    expect(wrapped).not.toContain('rounded-full bg-white text-blue-700');
    expect(wrapped).not.toContain('EduAI Companion | CAPS Aligned | eduai-companion.github.io');
    expect(wrapped).toContain('site-header');
  });

  it('uses the same host banner for classic and LIGHT body styles', () => {
    const classic = wrapWithTemplate('<p>Classic content</p>', {
      title: 'Fractions', grade: '4', contentType: 'Worksheet', designStyle: 'classic', closingMeta: false,
    });
    const light = wrapWithTemplate('<p>LIGHT content</p>', {
      title: 'Fractions', grade: '4', contentType: 'Worksheet', designStyle: 'light-v5', closingMeta: false,
    });

    expect(classic).toContain('eduai-compliance-banner');
    expect(light).toContain('eduai-compliance-banner');
    expect(classic).toContain('site-header');
    expect(light).toContain('site-header');
  });

  it('strips only standalone hygiene problems in prepareClassicDocument', () => {
    const messy = '```html\n<div class="banner">Hi</div>\n<script src="https://cdn.tailwindcss.com"></script>\n<footer>F</footer>\n```';
    const cleaned = prepareClassicDocument(messy);

    expect(cleaned).toContain('<div class="banner">Hi</div>');
    expect(cleaned).toContain('<footer>F</footer>');
    expect(cleaned).not.toContain('```');
    expect(cleaned).not.toContain('cdn.tailwindcss.com');
  });
});
