/**
 * Reverse-engineered template library — one built-in generation prompt per
 * content type found in `assets/templates/**`.
 *
 * Usage:
 *
 *   import { buildContentTypePrompt, resolveTemplateContentType } from './template-library';
 *
 *   const type = resolveTemplateContentType('Worksheet');       // → 'worksheet'
 *   const { system, user } = buildContentTypePrompt(type, {     // → ready to send
 *     grade: '3', subject: 'Mathematics', topic: 'Place value', totalMarks: 30,
 *   });
 *
 * Every template shares the same shape (`ContentTypeTemplate`), so a new content
 * type never needs a second code path: add the anatomy object + prompt, and the
 * resolver, the docs generator and the tests all pick it up.
 */

import type { ContentTypeTemplate, TemplateContentType, TemplatePromptInput } from './types';
import { worksheetTemplate } from './worksheet';
import { formalAssessmentTemplate } from './formal-assessment';
import { lessonPlanTemplate } from './lesson-plan';
import { studyGuideTemplate } from './study-guide';
import { posterTemplate } from './poster';
import { phonicsChartTemplate } from './phonics-chart';
import { tracingWorksheetTemplate } from './tracing-worksheet';
import { flashcardsTemplate } from './flashcards';
import { infographicTemplate } from './infographic';
import { diagramTemplate } from './diagram';
import { visualLabTemplate } from './visual-lab';
import { adminDocumentTemplate } from './admin-document';
import { timetablePlannerTemplate } from './timetable-planner';
import { markingMemoTemplate } from './marking-memo';
import { rubricTemplate } from './rubric';

export type {
  TemplateContentType,
  TemplatePromptInput,
  TemplateSection,
  TemplateVisualSystem,
  ContentTypeTemplate,
} from './types';

export {
  LESSON_PROCEDURE_PHASES,
  LESSON_PROCEDURE_TOTAL_MINUTES,
  LESSON_PLAN_BLOCKS,
  LESSON_PLAN_CONTENT_CONTRACT,
  LESSON_PLAN_WORKSHEET_CONTRACT,
  lessonPhaseTable,
  scaleLessonPhases,
} from './lesson-plan-contract';

export type { LessonPhaseSpec } from './lesson-plan-contract';

export {
  MEASURED_PALETTES,
  MEASURED_LAYOUT,
  measuredPaletteBrief,
  resolveMeasuredPalette,
} from './visual-system';

export type { MeasuredPalette } from './visual-system';

export { worksheetTemplate } from './worksheet';
export { formalAssessmentTemplate } from './formal-assessment';
export { lessonPlanTemplate } from './lesson-plan';
export { studyGuideTemplate } from './study-guide';
export { posterTemplate } from './poster';
export { phonicsChartTemplate } from './phonics-chart';
export { tracingWorksheetTemplate } from './tracing-worksheet';
export { flashcardsTemplate } from './flashcards';
export { infographicTemplate } from './infographic';
export { diagramTemplate } from './diagram';
export { visualLabTemplate } from './visual-lab';
export { adminDocumentTemplate } from './admin-document';
export { timetablePlannerTemplate } from './timetable-planner';
export { markingMemoTemplate } from './marking-memo';
export { rubricTemplate } from './rubric';

/**
 * The registry. Order matters only for documentation output; lookup is by id.
 */
export const CONTENT_TYPE_TEMPLATES: Record<TemplateContentType, ContentTypeTemplate> = {
  worksheet: worksheetTemplate,
  'formal-assessment': formalAssessmentTemplate,
  'lesson-plan': lessonPlanTemplate,
  'study-guide': studyGuideTemplate,
  poster: posterTemplate,
  'phonics-chart': phonicsChartTemplate,
  'tracing-worksheet': tracingWorksheetTemplate,
  flashcards: flashcardsTemplate,
  infographic: infographicTemplate,
  diagram: diagramTemplate,
  'visual-lab': visualLabTemplate,
  'admin-document': adminDocumentTemplate,
  'timetable-planner': timetablePlannerTemplate,
  'marking-memo': markingMemoTemplate,
  rubric: rubricTemplate,
};

/** Every template, in documentation order. */
export const ALL_CONTENT_TYPE_TEMPLATES: ContentTypeTemplate[] =
  Object.values(CONTENT_TYPE_TEMPLATES);

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[\u2010-\u2015_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Resolve a loose content-type label ("Worksheet", "Lesson Plan",
 * "Marking Memo", "gr3-life-skills-worksheet") to a template id.
 *
 * Resolution order: exact id → exact alias → the longest alias contained in the
 * label → keyword heuristics → `worksheet` as the safe default. The heuristics
 * are deliberately ordered most-specific first so "classroom rules poster"
 * resolves to a poster rather than to a worksheet.
 */
export const resolveTemplateContentType = (contentType?: string): TemplateContentType => {
  const value = normalise(String(contentType ?? ''));
  if (!value) return 'worksheet';

  if ((CONTENT_TYPE_TEMPLATES as Record<string, ContentTypeTemplate>)[value]) {
    return value as TemplateContentType;
  }

  for (const template of ALL_CONTENT_TYPE_TEMPLATES) {
    if (template.aliases.includes(value)) return template.id;
  }

  // Longest-alias containment wins, so "weekly lesson plan" beats "planner".
  const contained = ALL_CONTENT_TYPE_TEMPLATES
    .flatMap((template) => template.aliases.map((alias) => ({ id: template.id, alias })))
    .filter(({ alias }) => alias.length > 3 && value.includes(alias))
    .sort((a, b) => b.alias.length - a.alias.length);
  if (contained.length) return contained[0].id;

  // Specialist families first — most-specific match wins, so "Alphabet Chart"
  // is a phonics sheet and "Timetable Template" is a planner rather than
  // falling into the broader poster / admin catch-alls.
  if (/phonic|letter sound|sound chart|blend|alphabet/.test(value)) return 'phonics-chart';
  if (/trac|handwrit/.test(value)) return 'tracing-worksheet';
  if (/flash|card set|learning card|cut-out activity/.test(value)) return 'flashcards';
  if (/mind ?map|concept map/.test(value)) return 'diagram';
  if (/diagram|flow|cycle|labelled/.test(value)) return 'diagram';
  if (/infographic/.test(value)) return 'infographic';
  if (/timetable|planner|calendar|register|routine/.test(value)) return 'timetable-planner';
  if (/wall chart|word wall|display|anchor chart|classroom rules|poster/.test(value)) return 'poster';
  if (/memo|memorandum|answer key|marking guideline/.test(value)) return 'marking-memo';
  if (/rubric|matrix|checklist/.test(value)) return 'rubric';
  if (/lesson plan|unit plan|lesson note/.test(value)) return 'lesson-plan';
  if (/study guide|learning notes|revision|summary notes/.test(value)) return 'study-guide';
  if (/test|exam|assessment|investigation|project|portfolio|\bFAT\b/.test(value)) return 'formal-assessment';
  if (/chart|graph|map of/.test(value)) return 'poster';
  if (/letter|notice|slip|invitation|policy|certificate|award|newsletter|admin|letterhead|seal|emblem/.test(value)) {
    return 'admin-document';
  }

  return 'worksheet';
};

/** Get the template for a loose label. */
export const getContentTypeTemplate = (contentType?: string): ContentTypeTemplate =>
  CONTENT_TYPE_TEMPLATES[resolveTemplateContentType(contentType)];

/**
 * The single entry point every generator should call.
 *
 * Returns the built-in system prompt and the fully-populated user prompt for a
 * content type. The prompts are plain strings, so the same pair can be sent to
 * Gemini, Qwen, a Nemotron model or the on-device client without translation.
 */
export const buildContentTypePrompt = (
  contentType: string | undefined,
  input: TemplatePromptInput = {},
): { system: string; user: string; type: TemplateContentType; template: ContentTypeTemplate } => {
  const template = getContentTypeTemplate(contentType);
  return {
    system: template.systemPrompt,
    user: template.buildUserPrompt(input),
    type: template.id,
    template,
  };
};

/**
 * The prompt pair for the content types the `generate-caps` pipeline handles.
 *
 * `generate-caps` normalises its UI label to `'lesson-plan' | 'worksheet' |
 * 'study-guide'` before it reaches a prompt, so this is the exact hook the
 * server, the on-device client and the alternative-engine rescue use.
 */
export const buildCapsContentTypePrompt = (
  contentType: 'lesson-plan' | 'worksheet' | 'study-guide',
  input: TemplatePromptInput = {},
): { system: string; user: string } => {
  const { system, user } = buildContentTypePrompt(contentType, input);
  return { system, user };
};

/**
 * A COMPACT anatomy brief, for the shared `assemblePrompt()` pipeline.
 *
 * Unlike the built-in per-type prompts above (which are complete and stand
 * alone), this returns only the reference anatomy — the section list, the fixed
 * micro-copy and the guardrails. It is appended to the existing templates so a
 * document produced through `server.ts`, the on-device client or the
 * alternative-engine rescue still carries the reverse-engineered structure of
 * its content type without duplicating the whole prompt.
 */
export const contentTypeAnatomyBrief = (contentType?: string): string => {
  const template = getContentTypeTemplate(contentType);
  const sections = template.sections
    .map((section, index) => `  ${index + 1}. ${section.heading} — ${section.content}`)
    .join('\n');
  return `REFERENCE ANATOMY — ${template.title} (reverse-engineered from the EduAI template library: ${template.sources.length} reference file(s))
${sections}
FIXED MICRO-COPY (print these labels exactly): ${template.fixedCopy.slice(0, 12).map((copy) => `"${copy}"`).join(' · ')}
LEAVE BLANK FOR HANDWRITING (never pre-fill): ${template.blankFields.length ? template.blankFields.join(' · ') : 'none'}
GUARDRAILS:
${template.guardrails.map((rule) => `  - ${rule}`).join('\n')}`;
};

/** Every documented content type and the reference files it was built from. */
export const templateLibraryManifest = (): Array<{
  id: TemplateContentType;
  title: string;
  sources: string[];
  aliases: string[];
}> =>
  ALL_CONTENT_TYPE_TEMPLATES.map((template) => ({
    id: template.id,
    title: template.title,
    sources: template.sources,
    aliases: template.aliases,
  }));
