/**
 * Tests for the restored Classic content prompt engineering (commit 6d3f1d2).
 *
 * These assert that the original "VISUAL STYLING DOCTRINE" is back as the
 * default, that every generator routes through it, and that the host template
 * no longer strips the model's own banner — which is what had flattened the
 * original design.
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
  it('carries the full VISUAL STYLING DOCTRINE verbatim', () => {
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('VISUAL STYLING DOCTRINE (Follow these for all HTML output):');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('Full-Width Banners & Section Colors');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('rounded-[2.5rem]');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('thick playful borders (2px to 4px)');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('pill-shaped colored borders');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('Hero Illustrations / Space for Visuals');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('Amazing job! Keep shining!');
  });

  it('keeps the subject colour gradients', () => {
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-teal-500 to-blue-600');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-emerald-500 to-teal-700');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-purple-500 to-indigo-600');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).toContain('from-amber-500 to-red-600');
  });

  it('never tells the model to suppress its own banner', () => {
    // This instruction is what flattened the original design.
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).not.toContain('Do not generate a page-level header/footer');
    expect(CLASSIC_MASTER_SYSTEM_PROMPT).not.toContain('start straight into content cards');
  });
});

describe('restored CAPS content prompts', () => {
  it('restores the hero illustration, grade badge, score row and footer', () => {
    const { system, user } = buildClassicCapsPrompts({
      contentType: 'Worksheet',
      grade: '4',
      subject: 'Mathematics',
      topic: 'Fractions',
      totalMarks: 30,
    });

    expect(system).toContain(CLASSIC_MASTER_SYSTEM_PROMPT);
    expect(system).toContain('award winning');
    expect(user).toContain('ONE stunning hero illustration at the top that occupies 25–30% of the page');
    expect(user).toContain('Semi-realistic digital painting style (like children’s non-fiction books)');
    expect(user).toContain('Include full-width colored banners');
    expect(user).toContain('large circular badge in the top right for the Grade');
    expect(user).toContain('"Name: ____ Date: _____ Total __ / 30"');
    expect(user).toContain('pill-shaped boxes with a colored border');
    expect(user).toContain('EduAI Companion | CAPS Aligned | eduai-companion.github.io');
    expect(user).toContain(CLASSIC_IMAGE_PROMPT_GOLDEN_RULE.trim());
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

  it('routes EduAIPromptEngine through the classic doctrine by default', () => {
    const { system, user } = EduAIPromptEngine.assemblePrompt({
      contentType: 'worksheet',
      grade: '5',
      subject: 'Natural Sciences',
      topic: 'The water cycle',
      language: 'English',
    });

    expect(system).toContain('VISUAL STYLING DOCTRINE');
    expect(system).toContain('CLASSIC EDUAI VISUAL SYSTEM (MANDATORY)');
    expect(user).toContain('ONE stunning hero illustration');
    expect(user).toContain('circular Grade badge in the top right');
    // The LIGHT v5 suppression wording must not leak into classic output.
    expect(system).not.toContain('Do NOT emit a school/DBE header band');
  });

  it('still assembles the LIGHT v5 doctrine on request', () => {
    const { system } = EduAIPromptEngine.assemblePrompt({
      contentType: 'worksheet',
      grade: '5',
      subject: 'Natural Sciences',
      topic: 'The water cycle',
      language: 'English',
      designStyle: 'light-v5',
    });

    expect(system).toContain('SA COMPLIANCE VISUALS');
    expect(system).toContain('Do NOT emit a school/DBE header band');
    expect(system).not.toContain('CLASSIC EDUAI VISUAL SYSTEM');
  });
});

describe('restored Visual Lab prompts', () => {
  it('restores the poster blueprint — bubble letters and floating fact boxes', () => {
    const { system, user } = buildVisualLabPrompts({
      visualType: 'Educational Poster',
      topic: 'The water cycle',
      grade: '5',
      subject: 'Natural Sciences',
    });

    expect(system).toContain(CLASSIC_MASTER_SYSTEM_PROMPT);
    expect(user).toContain('multi-colored bubble-letter style title');
    expect(user).toContain('Floating Fact Boxes: 4-6 small floating fact boxes');
    expect(user).toContain('solid 4px red, green, blue border');
    expect(user).toContain('Make it look like an adventure map');
    expect(user).toContain('Sky blue background');
    expect(user).toContain('Make it vibrant, instantly engaging, and child-friendly');
  });

  it('restores the double-sided flashcard grid', () => {
    const { user } = buildVisualLabPrompts({
      visualType: 'Flashcards',
      topic: 'Times tables',
      grade: '4',
      subject: 'Mathematics',
    });

    expect(user).toContain('double-sided educational flashcards');
    expect(user).toContain('Show multiple cards in a grid (2 or 3 per row)');
    expect(user).toContain('rounded-3xl corners, thick colored borders (2px)');
    expect(user).toContain('Use vibrant colors that change per card');
  });

  it('restores the radiating infographic and SA-landscape diagram', () => {
    const infographic = buildVisualLabPrompts({ visualType: 'Infographic', topic: 'Food chains', grade: '6' });
    expect(infographic.user).toContain('Central concept in the middle with radiating branches');
    expect(infographic.user).toContain('Modern flat design with subtle textures and depth');

    const diagram = buildVisualLabPrompts({ visualType: 'Diagram', topic: 'The water cycle', grade: '5' });
    expect(diagram.user).toContain('Include Table Mountain, Drakensberg, or Karoo');
    expect(diagram.user).toContain('Use indigenous animals (lion, impala, acacia tree, vulture, etc.)');
    expect(diagram.user).toContain('National Geographic kids magazine quality');
  });

  it('matches the original blueprint selection rules', () => {
    expect(classicVisualBlueprint({ visualType: 'Anchor Chart Poster' })).toContain('bubble-letter');
    expect(classicVisualBlueprint({ visualType: 'Learning Card Set' })).toContain('double-sided');
    expect(classicVisualBlueprint({ visualType: 'Mind Map' })).toContain('radiating branches');
    expect(classicVisualBlueprint({ visualType: 'Process Diagram' })).toContain('Table Mountain');
    expect(classicVisualBlueprint({ visualType: 'Word Wall' })).toContain('Create a highly visual');
  });

  it('continues a truncated classic fragment instead of rebuilding it', () => {
    const { user } = buildVisualLabPrompts({
      visualType: 'Educational Poster',
      topic: 'Photosynthesis',
      existingContent: '<div class="rounded-[2.5rem]">Already written',
    });

    expect(user).toContain('Continue the same Visual Lab response');
    expect(user).toContain('<div class="rounded-[2.5rem]">Already written');
    expect(user).toContain('the full-width banner, the grade badge and every fact box already written');
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
    expect(system).toContain('DO NOT USE MARKDOWN.');
    expect(user).toContain('Follow the EduAI design style (colored banners, pill-shaped blocks, distinct sections, vibrant design)');
  });
});

describe('host template in classic mode', () => {
  it('preserves the model banner, grade badge and footer', () => {
    const generated = `
<div class="w-full bg-gradient-to-r from-teal-500 to-blue-600 p-8">
  <h1 class="text-white text-4xl font-black">Fractions</h1>
  <span class="rounded-full bg-white text-blue-700 px-4 py-2">Grade 4</span>
</div>
<section class="rounded-[2.5rem] border-4 border-amber-400 p-6">NAME: ______ DATE: ______</section>
<footer class="text-center text-xs">EduAI Companion | CAPS Aligned | eduai-companion.github.io</footer>
`.trim();

    const wrapped = wrapWithTemplate(generated, {
      title: 'Fractions',
      grade: '4',
      designStyle: 'classic',
    });

    // The banner, grade badge and footer survive — nothing is absorbed into a
    // second host banner.
    expect(wrapped).toContain('from-teal-500 to-blue-600');
    expect(wrapped).toContain('Grade 4');
    expect(wrapped).toContain('rounded-[2.5rem]');
    expect(wrapped).toContain('EduAI Companion | CAPS Aligned | eduai-companion.github.io');
    // And the LIGHT chrome is not injected on top of it.
    expect(wrapped).not.toContain('eduai-compliance-banner');
    expect(wrapped).not.toContain('site-header');
  });

  it('still applies the full LIGHT chrome when light-v5 is selected', () => {
    const wrapped = wrapWithTemplate('<p>Some content</p>', {
      title: 'Fractions',
      grade: '4',
      designStyle: 'light-v5',
    });

    expect(wrapped).toContain('eduai-compliance-banner');
    expect(wrapped).toContain('site-header');
  });

  it('strips only hygiene problems, never the design', () => {
    const messy = '```html\n<div class="banner">Hi</div>\n<script src="https://cdn.tailwindcss.com"></script>\n<footer>F</footer>\n```';
    const cleaned = prepareClassicDocument(messy);

    expect(cleaned).toContain('<div class="banner">Hi</div>');
    expect(cleaned).toContain('<footer>F</footer>');
    expect(cleaned).not.toContain('```');
    expect(cleaned).not.toContain('cdn.tailwindcss.com');
  });
});
