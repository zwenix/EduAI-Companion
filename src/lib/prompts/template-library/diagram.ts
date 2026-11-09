/**
 * EDUCATIONAL DIAGRAM / MIND MAP — reverse-engineered from
 *   assets/templates/AI_IMG (2).jpg   — the six-poster grammar set (labelled model posters)
 *   assets/templates/AI_IMG (19).jpg  — the antonyms room scene + word-pair table
 *   assets/templates/Number Poster Gr3.pdf — the central anchor + satellite bento
 *
 * The two grammars:
 *   • LABELLED MODEL — an accurate drawing with leader lines and labels around it,
 *     plus a compact key. Used for science, geography and anatomy drawings.
 *   • RADIATING MAP — the concept in a centre capsule, 4–6 branches with 1–3
 *     sub-concepts each, connectors printed, hierarchy explicit.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Choose the grammar that fits the topic, then build it.

GRAMMAR A — LABELLED MODEL (process, structure, map, apparatus)
1. Draw the subject large and centred, occupying 55–65% of the page. Accuracy beats decoration: proportions, parts and directions must be correct.
2. Leader lines: thin (1.5–2 px) straight lines from the part to a label chip, never crossing each other. Label chips are pale capsules with 13–15 px 600-weight text.
3. Sequence diagrams print numbered step chips (1–8) on the diagram itself, and a short numbered legend beneath.
4. Add a compact key only when a symbol is used twice or more.

GRAMMAR B — RADIATING MIND MAP (concept relationships)
1. Centre capsule: the core concept, 24–30 px 800 weight, in the strongest colour.
2. Four to six branches radiating out, each with its own hue, each ending in a label chip.
3. Each branch carries one to three short sub-concepts (maximum 6 words each).
4. Connectors are drawn, curved where possible, with the branch colour; hierarchy is shown by distance, size and weight, never by colour alone.
5. A cross-link is drawn as a dashed connector with its own label ("causes", "is part of").

EITHER GRAMMAR:
- Every label must be legible at A4 print (≥ 12 pt).
- No unlabelled shapes; no decorative arrows whose direction is not real.
- The South African context is used only when it helps the concept (the reference antonyms scene is a real classroom; the science diagram may use a Karoo or Drakensberg setting).`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is an EDUCATIONAL DIAGRAM or MIND MAP. Its value is factual and structural accuracy: the parts, their names, their order and their relationships must be right.`,
  visual: `VISUAL SYSTEM (measured from the reference diagrams):
${measuredPaletteBrief(resolveMeasuredPalette('Mathematics', 'poster'))}
- Central subject: 55–65% of the page on a calm ground.
- Labels: 13–15 px, 600 weight, in pale capsule chips with a 1 px border.
- Branch hues: one per branch, drawn from the measured palette and never repeated within one map.
- Connectors: 1.5–2 px, straight for leader lines, curved for mind-map branches.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `ACCURACY MANDATE:
- Never draw a label pointing at the wrong part. If you are not certain where a part sits, simplify the drawing until every remaining label is certain.
- Never invent a stage in a cycle or a step in a process. If the process has four steps, draw four.`,
});

export const diagramTemplate: ContentTypeTemplate = {
  id: 'diagram',
  aliases: ['educational diagram', 'diagram', 'mind map / concept map', 'mind map', 'concept map', 'process flow diagram', 'flow diagram', 'labelled diagram'],
  title: 'Educational Diagram / Mind Map',
  purpose: 'An accurate labelled model or a radiating concept map with printed connectors, consistent hues and print-legible labels.',
  sources: [
    'assets/templates/AI_IMG (2).jpg',
    'assets/templates/AI_IMG (19).jpg',
    'assets/templates/Number Poster Gr3.pdf',
  ],
  sections: [
    { id: 'subject', heading: 'Central subject', content: 'Large accurate drawing or the centre capsule.' },
    { id: 'labels', heading: 'Labels and leader lines', content: 'Capsule label chips on thin non-crossing leader lines.' },
    { id: 'branches', heading: 'Branches or legend', content: 'Hue-coded branches with 1–3 sub-concepts each, or a numbered legend.' },
    { id: 'key', heading: 'Key (only when needed)', content: 'A compact legend when a symbol repeats.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (content type palette)',
    paletteId: 'poster',
    gradeBadge: 'none — the host banner carries metadata',
    sectionBar: 'hue-coded branch chips',
    scoreCard: 'none',
    typography: 'centre 24–30 px; labels 13–15 px; legend 12 px',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Key', 'Step', 'is part of', 'causes'],
  blankFields: [],
  guardrails: [
    'No label may point at the wrong part.',
    'No invented process steps or cycle stages.',
    'Arrows only where direction or causation is real.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        language: input.language,
        dimensions: input.dimensions || 'A4 landscape',
      }),
      brief: `Build the complete ${/mind ?map|concept map/i.test(String(input.topic || '')) ? 'mind map (grammar B)' : 'labelled diagram (grammar A)'} for this request.

First list the parts/steps/branches you will draw and check each one is correct. Then lay them out and label them.

${illustrationClause({ generateImage: input.generateImage, style: input.illustrationStyle, goldenRule: input.imageGoldenRule })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default diagramTemplate;
