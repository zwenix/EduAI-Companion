/**
 * FLASHCARDS / LEARNING CARDS — reverse-engineered from
 *   assets/templates/AI_IMG (5).jpg   — alphabet flashcards (Aa / appèl / drawing box)
 *   assets/templates/AI_IMG (10).jpg  — number flashcards (1 / one / finger / rabbit / trace)
 *   assets/templates/AI_IMG (16).jpg  — classroom-rules picture cards
 *   assets/templates/AI_IMG (15).jpg  — grammar mini-posters (their / there / they're)
 *   assets/templates/AI_IMG (17).jpg  — "WELCOME" acrostic card
 *   assets/templates/AI_IMG (18).jpg  — "my school – grade 1" picture-vocabulary sheet
 *   assets/templates/AI_IMG (19).jpg  — antonyms room scene + word-pair table
 *
 * Two card grammars recur:
 *   • PICTURE CARD — big letter/number/word on top, one clear picture, word label
 *     underneath, and a dotted trace box on the reverse.
 *   • RULE / CONCEPT CARD — a short rule line, one picture showing the behaviour,
 *     and a coloured border that groups the set.
 */

import type { ContentTypeTemplate, TemplatePromptInput } from './types';
import { MEASURED_LAYOUT } from './visual-system';
import { SA_PUBLISHER_IDENTITY, composeSystemPrompt, composeUserPrompt, illustrationClause, requestBlock } from './shared';

const BRIEF = `Build the card set exactly to this grammar:

CARD GRAMMAR A — PICTURE / VOCABULARY CARD
- Top band: the letter, number or word in very large display type (96–140 px). For a letter, print the capital and the lower case side by side ("Aa"); for a number, print the numeral plus the number word ("1 / one").
- Middle: one clear, single-subject picture of the key word, centred, generous white space. No background clutter, no text inside the picture.
- Bottom: the word label in 20–24 px, 600 weight.
- Border: a solid 4 px colour that differs per card in the set (the reference cycles pink, blue, green, orange, purple, teal).
- Reverse (printed on the card back or in the memo): a dotted trace box for the letter/number and three ruled lines.

CARD GRAMMAR B — RULE / CONCEPT CARD
- One rule or contrast as the lead, set in the card's colour, 20–28 px, 700 weight ("Always be NICE to each other", "No YELLING in the classroom", "THEIR indicates possession").
- One picture or icon showing the behaviour or the concept.
- A colour-block highlight on the key word only (the reference tints single words rather than whole lines).
- The card border colour groups the set — same-colour cards belong together.

SET RULES:
- The number of cards is fixed by the caller's quantity field; every card in the set is the same physical size so they cut and stack cleanly.
- Print-cut guidance: a 3 mm gutter between cards, a light cut line, and corner marks — never bleed artwork into the gutter.
- Every card is self-contained: a learner holding one card alone must understand it.
- No marks, no questions, no "answer overleaf" unless the card is explicitly a quiz card.`;

const systemPrompt = composeSystemPrompt({
  role: `${SA_PUBLISHER_IDENTITY}

Your document is a SET OF FLASHCARDS / LEARNING CARDS. Each card teaches exactly one letter, number, word, rule or contrast, and the set is designed to be printed, cut and handled by learners.`,
  visual: `VISUAL SYSTEM (measured from the reference card sets):
- Card size: A6 (105 × 148 mm) for picture cards, 90 × 90 mm for rule cards, or the size the caller supplies.
- Border: 4 px solid, one colour per card, cycling the set palette.
- Display type: 96–140 px for letters/numbers, 20–28 px for rule leads, 18–20 px for labels.
- Picture area: at least 45% of the card, centred, isolated subject on white.
- Page: ${MEASURED_LAYOUT.page} with cut guides.`,
  anatomy: BRIEF,
  banner: 'host',
  extra: `FOUNDATION PHASE CARD SAFETY:
- Pictures show whole, friendly, unambiguous objects a South African child recognises (apple, bread, jacket, rabbit, taxi, donkey cart).
- Never place two different words under one picture; the label matches the picture exactly.
- For letter cards the key word must start with the letter's sound, not just its spelling.`,
});

export const flashcardsTemplate: ContentTypeTemplate = {
  id: 'flashcards',
  aliases: [
    'flashcards',
    'flashcards (term + definition)',
    'vocabulary cards',
    'formula reference cards',
    'timeline cards',
    'matching cards',
    'cut-out activity cards',
    'learning card set',
    'award / sticker template',
    'certificate template',
  ],
  title: 'Flashcards / Learning Cards',
  purpose: 'A cut-ready card set: picture-and-word cards or rule/contrast cards with a consistent border palette per set.',
  sources: [
    'assets/templates/AI_IMG (5).jpg',
    'assets/templates/AI_IMG (10).jpg',
    'assets/templates/AI_IMG (15).jpg',
    'assets/templates/AI_IMG (16).jpg',
    'assets/templates/AI_IMG (17).jpg',
    'assets/templates/AI_IMG (18).jpg',
    'assets/templates/AI_IMG (19).jpg',
  ],
  sections: [
    { id: 'top', heading: 'Card top band', content: 'Letter / number / rule lead in large display type.' },
    { id: 'picture', heading: 'Picture area', content: 'One isolated, unambiguous subject or behaviour picture.' },
    { id: 'label', heading: 'Word label', content: 'The key word at 18–24 px in the card colour.' },
    { id: 'reverse', heading: 'Reverse / trace box', content: 'Dotted trace box plus ruled lines, or the definition when the card is a term card.' },
  ] as ContentTypeTemplate['sections'],
  visual: {
    bannerGradient: 'host banner (cards palette: teal → royal blue)',
    paletteId: 'cards',
    gradeBadge: 'none on the cards themselves',
    sectionBar: '4 px card borders cycling the set palette',
    scoreCard: 'none — cards are not marked',
    typography: '96–140 px display; 20–28 px rule leads; 18–20 px labels',
    footer: MEASURED_LAYOUT.footer,
  },
  fixedCopy: ['Aa', 'one', 'Their', 'There', "They're", 'No', 'Always'],
  blankFields: [],
  guardrails: [
    'One idea per card; a card alone must make sense.',
    'Label matches picture exactly.',
    'A consistent cut gutter — never bleed art into the gutter.',
  ],
  systemPrompt,
  buildUserPrompt: (input: TemplatePromptInput) =>
    composeUserPrompt({
      requestBlock: requestBlock({
        grade: input.grade,
        subject: input.subject,
        topic: input.topic,
        language: input.language,
        visualType: input.visualType,
        quantity: input.quantity || 6,
        dimensions: input.dimensions,
      }),
      brief: `Build the complete card set for this request, using card grammar ${/rule|classroom rules|grammar|contrast/i.test(String(input.visualType || input.topic || '')) ? 'B (rule / concept cards)' : 'A (picture / vocabulary cards)'} and the number of cards requested.

CRITICAL: the set is printed and cut, so every card is the same size, sits inside a light cut line with a 3 mm gutter, and never relies on artwork bleeding past its border.

${illustrationClause({ generateImage: input.generateImage, style: input.illustrationStyle, goldenRule: input.imageGoldenRule })}`,
      language: input.language,
      additionalInstructions: input.additionalInstructions,
    }),
};

export default flashcardsTemplate;
