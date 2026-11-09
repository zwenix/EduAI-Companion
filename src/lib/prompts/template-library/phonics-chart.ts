/**
 * PHONICS / SOUND CHART — reverse-engineered from
 *   assets/templates/grR-phonics-sound-chart-group1.pdf
 *   assets/templates/gr1-phonics-blending-cvc-words.pdf
 *
 * Two related Foundation Phase sheets share one anatomy: a coloured banner with
 * the sheet title and a "Grade R | Term 1 | <strand>" subtitle, a name/date row,
 * then a grid of letter/sound cards or blending rows, and a closing action strip.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT, resolveMeasuredPalette, measuredPaletteBrief } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Build the phonics sheet exactly in this order:

1. BANNER
   - Full-width band in a bright Foundation Phase colour (the sound chart uses teal-blue; the blending sheet uses mint green).
   - White sheet title with a small phonetic icon leading: "Let's Blend Sounds!" / "Jolly Phonics — Group 1 Sounds".
   - White subtitle: "Grade R | Term 1 | Sound Chart" / "Grade R/1 | CVC Word Building".
   - Two small ⭐ stars flanking the title, one at each edge of the band.

2. NAME / DATE ROW
   - "Name: ______________________________    Date: ________________" — ruled and empty.

3. SOUND / WORD GRID
   - SOUND CHART: a 2 × 3 (maximum 3 × 2) grid of tall cards. Each card prints, vertically: the capital letter, the lower-case letter, a solid dark square (the sound marker) and the key word in the card's own colour ("S s ▪ snake", "A a ▪ ant", "T t ▪ turtle", "I i ▪ itchy", "P p ▪ penguin", "N n ▪ nuts").
   - Each card has a thick coloured border and a pale tint of that same colour; the six cards cycle the palette (pink, orange, mint, lilac, rose, sky).
   - BLENDING SHEET: five rows. Each row prints three separate letter tiles (consonant, vowel, consonant) in three different band colours, an arrow, then the blended word in a bordered capsule, then a solid colour square, then "Write it:" with a ruled line on the right.
     The reference words are CVC: sat, pin, tin, sip, nap.

4. CLOSING STRIP
   - A full-width pale amber strip with a solid dark square icon and a bold line: "▪ Action Time! — Do the action while you say each sound — make it fun!" or "▪ Great blending! You are a STAR reader!"

HARD RULES FOR PHONICS SHEETS:
- Letters are printed as a matched pair (capital + lower case) and in a font a Grade R learner is taught to form. Never mix fonts within the grid.
- Every key word is a real, decodable word for that sound group, and the picture word matches the letter exactly.
- Only the fonts, letters, words, stars and colour tiles — no paragraphs of prose anywhere on the page.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a FOUNDATION PHASE PHONICS SHEET (Grade R–2). Everything on it is big, simple and visual: letters, sounds, one key word per sound, and a blank line to write on. A Grade R learner must be able to use it with no reading of instructions.`,
  visual: `VISUAL SYSTEM (measured from the reference phonics sheets):
${measuredPaletteBrief(resolveMeasuredPalette('Phonics', 'worksheet'))}
- Letter cards: tall rounded cards with a 3 px border in the card colour and a 10–15% tint of that colour as the fill.
- Letterforms: 64–96 px, heavy weight, the capital above the lower case, vertically stacked and centred.
- Key word: 14–16 px, 700 weight, in the card's own colour, beneath the sound square.
- Blending tiles: 56–72 px squares with 8 px radius, white letter in the tile colour.`,
  anatomy: BRIEF,
  banner: 'self',
  extra: `PHONICS SEQUENCE DISCIPLINE:
- Keep to the Jolly Phonics group being requested. Group 1 = s, a, t, i, p, n. Group 2 = c, k, e, h, r, m, d. Group 3 = g, o, u, l, f, b. Group 4 = ai, j, oa, ie, ee, or. Group 5 = z, w, ng, v, oo, oo. Group 6 = y, x, ch, sh, th, th. Group 7 = qu, ou, oi, ue, er, ar.
- Never introduce a sound outside the requested group into a blending row.
- CVC blending rows use only the letters already taught.`,
});

export const phonicsChartTemplate: ContentTypeTemplate = {
  id: 'phonics-chart',
  aliases: ['phonics', 'sound chart', 'letter sound chart', 'alphabet chart', 'phonics chart', 'cvc', 'blending'],
  title: 'Phonics / Sound Chart',
  purpose: 'A Foundation Phase sound or blending sheet: letter-pair cards with key words, or CVC blending rows with write-it lines.',
  sources: [
    'assets/templates/grR-phonics-sound-chart-group1.pdf',
    'assets/templates/gr1-phonics-blending-cvc-words.pdf',
  ],
  sections: [
    { id: 'banner', heading: 'Banner', content: 'Bright band, starred title, grade | term | strand subtitle.' },
    { id: 'fields', heading: 'Name / Date row', content: 'Ruled name and date, left empty.', learnerWriting: true },
    { id: 'grid', heading: 'Sound or blending grid', content: 'Letter-pair cards with key words, or CVC tiles → blended word → write-it line.' },
    { id: 'closing', heading: 'Closing strip', content: 'Amber action strip in the reference voice.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'bright Foundation Phase band (mint or teal-blue)',
    paletteId: 'foundation',
    gradeBadge: 'grade in the banner subtitle',
    sectionBar: 'tall letter cards with tinted fills and thick borders',
    scoreCard: 'no marks — Foundation Phase phonics is not scored',
    typography: 'letters 64–96 px; key words 14–16 px; almost no other text',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Name:', 'Date:', 'Grade R', 'Action Time!', 'snake', 'ant', 'turtle', 'itchy', 'penguin', 'nuts', 'sat', 'pin', 'tin', 'sip', 'nap'],
  blankFields: ['Name', 'Date'],
  guardrails: [
    'Only sounds from the requested Jolly Phonics group.',
    'Every key word must begin with (or contain) the target sound.',
    'No prose instructions — icons, words and one closing strip only.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade || 'R',
        subject: input.subject || 'Phonics',
        topic: input.topic,
        term: input.term || '1',
        language: input.language,
        quantity: input.quantity || 6,
      }),
      brief: `Build the complete phonics sheet for this request.

If the request is a SOUND CHART: use the six sounds of the requested group, each as a card (capital, lower case, sound square, key word) in the six reference colours.

If the request is BLENDING: use five CVC words built only from sounds already taught, each as a row of three colour tiles → arrow → word capsule → colour square → "Write it:" line.

${illustrationClause({ generateImage: input.generateImage, style: input.illustrationStyle, goldenRule: input.imageGoldenRule })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default phonicsChartTemplate;
