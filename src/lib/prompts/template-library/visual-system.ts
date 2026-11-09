/**
 * Measured visual system for the reverse-engineered templates.
 *
 * Every value here was sampled directly from `assets/templates/**` (dominant
 * colour quantisation on the rendered PDF pages, plus the explicit CSS in the
 * HTML-rendered sheets). Nothing is invented, and nothing here overrides the
 * banner palettes in `bannerPalettes.ts`: the palettes stay the single source
 * of truth for the ONE host banner, while these constants describe what the
 * *reference documents* look like inside that banner.
 */

/** One subject's measured document palette. */
export interface MeasuredPalette {
  /** Reference file the colours were sampled from. */
  source: string;
  /** Solid header band colour the reference prints. */
  header: string;
  /** Document body ground colour. */
  body: string;
  /** Section-bar colours, in the order the reference cycles them. */
  sectionBars: string[];
  /** Accent used for question numbers / marks. */
  accent: string;
  /** True when the header is a two-colour gradient rather than a solid fill. */
  gradient?: boolean;
}

/**
 * The measured palettes. Keys are lower-case content families so a resolver can
 * look one up from a subject/grade pair without a switch statement.
 */
export const MEASURED_PALETTES: Record<string, MeasuredPalette> = {
  /** `gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf` */
  'mathematics-worksheet': {
    source: 'assets/templates/gr3-mathematics-worksheet-term2-placevalue-multiplication.pdf',
    header: '#1189B1',
    body: '#E2F6FB',
    sectionBars: ['#1189B1', '#05B79E', '#9A5DE4'],
    accent: '#0F7A9E',
  },
  /** `gr4-mathematics-assessment-…`, `gr6-mathematics-assessment-…` (teal / purple) */
  'mathematics-assessment': {
    source: 'assets/templates/gr4-mathematics-assessment-term3-numbers-operations-geometry.pdf',
    header: '#1189B1',
    body: '#E2F6FB',
    sectionBars: ['#1189B1', '#05B79E', '#9A5DE4'],
    accent: '#0F7A9E',
  },
  /** `gr3-life-skills-assessment-term1-healthy-living.pdf` */
  'life-skills-assessment': {
    source: 'assets/templates/gr3-life-skills-assessment-term1-healthy-living.pdf',
    header: '#F67E00',
    body: '#FFF2DF',
    sectionBars: ['#F6830C', '#1189B1', '#9A5DE4'],
    accent: '#C25E00',
  },
  /** `gr4-life-skills-worksheet-term2-emotions-relationships.pdf` */
  'life-skills-worksheet': {
    source: 'assets/templates/gr4-life-skills-worksheet-term2-emotions-relationships.pdf',
    header: '#388E3B',
    body: '#F0F8E8',
    sectionBars: ['#F6830C', '#9A5DE4', '#1189B1'],
    accent: '#2C6E2E',
  },
  /** `gr7-life-orientation-worksheet-term2-…`, `grR-phonics-tracing-letter-s.pdf` */
  'life-orientation-worksheet': {
    source: 'assets/templates/gr7-life-orientation-worksheet-term2-constitution-rights-health.pdf',
    header: '#EF466E',
    body: '#FFEFF2',
    sectionBars: ['#EF466E', '#9A5DE4', '#1189B1'],
    accent: '#C22B50',
  },
  /** `grR-phonics-sound-chart-group1.pdf` */
  'phonics-chart': {
    source: 'assets/templates/grR-phonics-sound-chart-group1.pdf',
    header: '#1189B1',
    body: '#FFFFFF',
    sectionBars: ['#EF466E', '#F6830C', '#05B79E', '#9A5DE4', '#EF466E', '#1189B1'],
    accent: '#0F7A9E',
  },
  /** `gr1-phonics-blending-cvc-words.pdf` */
  'phonics-blending': {
    source: 'assets/templates/gr1-phonics-blending-cvc-words.pdf',
    header: '#05D6A0',
    body: '#FFFFFF',
    sectionBars: ['#A8E063', '#F6830C'],
    accent: '#03A87E',
  },
  /** `about_blank_1.pdf` — the weekly planner */
  'weekly-planner': {
    source: 'assets/templates/about_blank_1.pdf',
    header: '#13B7A6',
    body: '#FFFFFF',
    sectionBars: ['#13B7A6', '#F59E0B', '#FDE68A'],
    accent: '#1BA9B8',
    gradient: true,
  },
  /** `Number Poster Gr3.pdf` — dark bento poster */
  'number-poster': {
    source: 'assets/templates/Number Poster Gr3.pdf',
    header: '#1E293B',
    body: '#1E293B',
    sectionBars: ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6'],
    accent: '#F27650',
  },
};

/** Padding / radius / type ramp measured from the reference sheets. */
export const MEASURED_LAYOUT = {
  /** Page: A4 portrait, 210 × 297 mm. */
  page: 'A4 portrait (210 × 297 mm)',
  /** Body margin inside the sheet. */
  pagePadding: '14 mm',
  /** Banner height, as a fraction of the page. */
  bannerHeight: '7–9% of the page',
  /** Section bar radius. */
  sectionBarRadius: '9999px (fully rounded pill)',
  /** Card radius. */
  cardRadius: '1.5rem–2rem',
  /** Gap between blocks. */
  blockGap: '20–28 px',
  /** Body type ramp. */
  typography: {
    title: '28–34 px, 800–900 weight',
    subtitle: '16–18 px, 500 weight',
    sectionBar: '15–17 px, 700 weight, white on the bar colour',
    body: '14–15 px, 500 weight, line-height 1.6',
    marks: '12–13 px, 700 weight, right-aligned in [square brackets]',
  },
  /** The one footer every document carries. */
  footer: 'EduAI Companion  |  CAPS Aligned  |  eduai-companion.github.io',
} as const;

/**
 * Resolve the measured palette for a subject + content family.
 *
 * Deliberately simple string matching, mirroring `bannerPalettes.ts`'s approach
 * so a caller can reason about it without reading a table.
 */
export const resolveMeasuredPalette = (
  subject: string | undefined,
  family: 'worksheet' | 'assessment' | 'poster' = 'worksheet',
): MeasuredPalette => {
  const value = (subject || '').toLowerCase();

  if (/phonics|blend|letter sound/.test(value)) {
    return family === 'assessment' ? MEASURED_PALETTES['phonics-chart'] : MEASURED_PALETTES['phonics-blending'];
  }
  if (/life orientation/.test(value)) return MEASURED_PALETTES['life-orientation-worksheet'];
  if (/life skills|life-skill/.test(value)) {
    return family === 'assessment'
      ? MEASURED_PALETTES['life-skills-assessment']
      : MEASURED_PALETTES['life-skills-worksheet'];
  }
  if (/math|wiskunde|number/.test(value)) {
    return family === 'poster'
      ? MEASURED_PALETTES['number-poster']
      : family === 'assessment'
        ? MEASURED_PALETTES['mathematics-assessment']
        : MEASURED_PALETTES['mathematics-worksheet'];
  }
  // Default: the teal Mathematics sheet — the most common reference document.
  return family === 'assessment'
    ? MEASURED_PALETTES['mathematics-assessment']
    : MEASURED_PALETTES['mathematics-worksheet'];
};

/** Render a measured palette for a prompt. */
export const measuredPaletteBrief = (palette: MeasuredPalette): string =>
  [
    `- Header band: ${palette.header}${palette.gradient ? ' as a two-colour vertical gradient' : ' solid fill'}`,
    `- Page ground: ${palette.body}`,
    `- Section bars, in order: ${palette.sectionBars.join(' → ')}`,
    `- Question numbers / marks accent: ${palette.accent}`,
    `- Type ramp: title ${MEASURED_LAYOUT.typography.title}; subtitle ${MEASURED_LAYOUT.typography.subtitle}; section bar ${MEASURED_LAYOUT.typography.sectionBar}; body ${MEASURED_LAYOUT.typography.body}`,
    `- Cards: ${MEASURED_LAYOUT.cardRadius} radius, ${MEASURED_LAYOUT.blockGap} between blocks, ${MEASURED_LAYOUT.pagePadding} page padding`,
  ].join('\n');

export default MEASURED_PALETTES;
