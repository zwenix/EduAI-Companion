/**
 * Shared prompt policy for every Content Factory generator.
 *
 * Preset controls are useful defaults, but an instructor's typed brief is the
 * source of truth for the creative/subject matter request. Safety, the output
 * schema, and factual age-appropriate education remain non-negotiable.
 */
export const EDUCATIONAL_IMAGE_STYLE =
  'Disney 3D Animation Character and 3D Cute Icon';

export const EDUCATIONAL_IMAGE_STYLE_SUFFIX =
  ', Disney 3D Animation Character, 3D Cute Icon, educational, high quality, vibrant colours';

export const buildInstructorPriority = (instructions?: string): string => {
  const brief = (instructions || '').trim();
  if (!brief) return '';

  return `
### INSTRUCTOR BRIEF — HIGHEST PRIORITY USER DIRECTIVE
The text between <instructor_brief> tags is the instructor's deliberate request. Treat it as the source of truth for the requested topic, examples, names, structure, emphasis, tone, and visual/content details.
- Follow the instructor brief before any preselected app option or generic creative default.
- Treat Grade, subject, content type, language, and CAPS settings as supporting constraints and use them to fill gaps only; never silently replace, dilute, or hallucinate over a specific instructor request.
- If the instructor brief conflicts with a preselected style, colour, topic suggestion, layout suggestion, or other app default, follow the instructor brief.
- Preserve the instructor's exact facts, terminology, requested sequence, and named examples. Do not invent replacements or unrelated details.
- You may only override the brief when required for safety, factual accuracy, age appropriateness, CAPS compliance, or the requested response schema. If an adjustment is necessary, keep the instructor's intent and make the smallest possible change.
<instructor_brief>
${brief}
</instructor_brief>
### END INSTRUCTOR BRIEF
`;
};
