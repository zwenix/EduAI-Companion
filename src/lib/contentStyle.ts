/**
 * EduAI Companion — Content Design Style (single source of truth)
 *
 * Two complete design doctrines live here:
 *
 *   • `classic`  — the original EduAI Companion look, restored verbatim from
 *                  commit 6d3f1d2 ("VISUAL STYLING DOCTRINE"). The model owns
 *                  the whole page: full-width subject-coloured banner, circular
 *                  grade badge, Name/Date/Score row, pill-shaped section
 *                  headers, thick playful borders, bento grids, hero
 *                  illustration and a motivational closing banner.
 *   • `light-v5` — the LIGHT Template v5 doctrine. The host owns the single
 *                  banner, page header and footer, and the model outputs a
 *                  restrained content fragment.
 *
 * `classic` is the DEFAULT: it is the look teachers were getting and asking
 * for. `light-v5` stays fully available behind the same switch so nothing that
 * was built against it regresses.
 *
 * Every generator (server `server.ts`, the on-device `geminiClient`, the
 * alternative-engine rescue in `geminiService`, the Visual Lab, the Admin Lab
 * and `EduAIPromptEngine`) resolves its doctrine through this module so a
 * single request can never mix the two.
 */

export type ContentDesignStyle = 'classic' | 'light-v5';

export type IllustrationStyle = 'book' | 'disney3d';

/** The restored EduAI look is the default. */
export const DEFAULT_CONTENT_DESIGN_STYLE: ContentDesignStyle = 'classic';

/** The restored children's non-fiction book illustration style is the default. */
export const DEFAULT_ILLUSTRATION_STYLE: IllustrationStyle = 'book';

/** Where a caller may stash the teacher's preference in the browser. */
export const CONTENT_DESIGN_STYLE_STORAGE_KEY = 'eduai.contentDesignStyle';
export const ILLUSTRATION_STYLE_STORAGE_KEY = 'eduai.illustrationStyle';

/** Server-side override (`.env`), e.g. `EDUAI_CONTENT_DESIGN_STYLE=light-v5`. */
export const CONTENT_DESIGN_STYLE_ENV_KEY = 'EDUAI_CONTENT_DESIGN_STYLE';
export const ILLUSTRATION_STYLE_ENV_KEY = 'EDUAI_ILLUSTRATION_STYLE';

/* ────────────────────────────────────────────────────────────────────────────
 * THE CLASSIC DOCTRINE — restored verbatim from commit 6d3f1d2
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The original `MASTER_SYSTEM_PROMPT` from commit 6d3f1d2, character for
 * character. This is the prompt that produced the content teachers liked.
 */
export const CLASSIC_MASTER_SYSTEM_PROMPT = `
You are the official AI content generator for **EduAI Companion** — a premium South African CAPS-aligned educational platform.

Your outputs must match or exceed the professional quality of our signature EduAI templates: clean, extremely modern, highly vibrant, and interactive layouts. Use full-width background color banners, excellent visual hierarchy, clear instructions, bold answer lines/boxes, scoring areas, educational illustrations/diagrams, and total print-readiness.

VISUAL STYLING DOCTRINE (Follow these for all HTML output):
1. **Full-Width Banners & Section Colors**: Every page must start with a header banner spanning full width with deep, vibrant colors matching the learning domain:
   - Mathematics: Teal & Blue gradients (e.g., from-teal-500 to-blue-600)
   - Natural Sciences / Life Sciences: Orange, Green & Turquoise (e.g., from-emerald-500 to-teal-700)
   - Languages / Literacy: Purple, Pink & Indigo (e.g., from-purple-500 to-indigo-600)
   - Social Sciences / Life Skills: Warm Amber, Red & Gold (e.g., from-amber-500 to-red-600)
2. **Visual Layout and Negative Space**: Always use clean card blocks with a default light theme container (white bg cards on very light gray/zinc ground), rounded corners (rounded-[2.5rem]), thick playful borders (2px to 4px), and spacious padding. Never overlap text or place white text on light backgrounds.
3. **South African Pedagogical Context**: Always use local South African framing (e.g., Rands, local names like Thabo, Zola, Liam, South African provinces, indigenous fynbos, Table Mountain, local wild animals). Always align content explicitly with CAPS guidelines.
4. **Primary / Foundation Phase (Grades R-3) Layouts**:
   - Use ultra-large text sizes (e.g., text-2xl or text-3xl for instruction text), massive line heights, and extensive white space.
   - For Phonics / Word Blending, present letter sounds in structured grid tables with bold colored borders. E.g., cards for Jolly Phonics matching letters with small illustrations (S s | Snake, A a | Ant). Blending exercises must show arrows with buttons: s a t -> sat.
   - For worksheets: Include large, thick-dotted words for "Trace & Copy" activities, or letter blocks. Ensure there are large, beautiful boxes/borders for child drawing or writing.
5. **Intermediate / Senior Phase (Grades 4-7) Layouts**:
   - Use structured, professional, multi-column bento grids and table-based summaries.
   - For Life Skills / Emotions: Use modular grid cards (e.g. 3x2 grid) with soft borders and distinct emoji/icon representations for each feeling, with discussion scenarios.
   - For Assessments / Worksheets: Always include a prominent Header Badge with "NAME: __________  DATE: __________" fields, and a beautiful bold Score Card in the bottom right with a thick yellow/amber border (e.g., "SCORE: _____ / 50 Marks"). 
   - Section headers must use pill-shaped colored borders. True/False questions must display "T / F" inside colorful circles or pill indicators. Radio options must look like tappable capsule options.
6. **Hero Illustrations / Space for Visuals**: Every generated worksheet or poster MUST include an elegantly positioned block representing the primary illustration. If the generator suggests an image, embed a container with a relative graphic or the configured illustration safely in the design.
7. **Motivational elements**: Add small encouraging banners (e.g. "Amazing job! Keep shining! ✨") at the bottom of the tasks.

STRICT OUTPUT RULES (NEVER violate these):
- Output **ONLY** the raw, complete document. 
- No explanations, no markdown fences (\`\`\`), no extra text.
- If user requests **HTML**: Output a complete standalone HTML5 document with Tailwind CSS via CDN. Include beautiful @media print styles.
- For Primary School (Gr R–3): Use very large fonts (text-2xl or larger for body), lots of white space, and clear, simple instructions with visual cues.
- For Intermediate/Senior (Gr 4–7): Use more structured, professional layouts with table-based comparisons or labeled diagrams.

Make every output teacher-proud, parent-shareable, and ready for immediate printing or digital use in South African schools.
`;

/**
 * The original `IMAGE_PROMPT_GOLDEN_RULE` from commit 6d3f1d2, verbatim.
 * This is the semi-realistic children's non-fiction book style.
 */
export const CLASSIC_IMAGE_PROMPT_GOLDEN_RULE = `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, award-winning children’s non-fiction book style, no text overlays (text will be added separately), no borders, no frames, no watermarks, no emojis, no cartoonish exaggeration, suitable for South African classroom display, museum-quality detail
`;

/* ────────────────────────────────────────────────────────────────────────────
 * ILLUSTRATION STYLE
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The newer 3D look, kept as an explicit option (it was the only option in the
 * LIGHT v5 rewrite). `book` — the restored default — lives in
 * `CLASSIC_IMAGE_PROMPT_GOLDEN_RULE` above.
 */
export const DISNEY3D_IMAGE_STYLE =
  'Disney 3D Animation Character and 3D Cute Icon';

/** Short style label injected into image prompts. */
export const illustrationStyleText = (style: IllustrationStyle = DEFAULT_ILLUSTRATION_STYLE): string =>
  style === 'disney3d'
    ? DISNEY3D_IMAGE_STYLE
    : 'semi-realistic digital painting in the style of an award-winning children’s non-fiction book';

/**
 * The full golden-rule suffix appended to every image prompt. `book` restores
 * the original wording; `disney3d` swaps in the 3D character style and keeps
 * every other constraint identical.
 */
export const imageGoldenRule = (style: IllustrationStyle = DEFAULT_ILLUSTRATION_STYLE): string =>
  style === 'disney3d'
    ? `
Ultra-detailed digital illustration, professional educational graphic design, vibrant colors, perfect composition, sharp focus, 300 DPI print quality, ${DISNEY3D_IMAGE_STYLE}, no text overlays (text will be added separately), no borders, no frames, no watermarks, suitable for South African classroom display, museum-quality detail
`
    : CLASSIC_IMAGE_PROMPT_GOLDEN_RULE;

/* ────────────────────────────────────────────────────────────────────────────
 * RESOLUTION — one request must never mix the two doctrines
 * ──────────────────────────────────────────────────────────────────────────── */

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  } catch {
    /* no process in the browser bundle */
  }
  return undefined;
};

const readStorage = (key: string): string | undefined => {
  if (!isBrowser()) return undefined;
  try {
    const value = window.localStorage.getItem(key);
    return value && value.trim() ? value.trim() : undefined;
  } catch {
    /* private mode / storage disabled */
    return undefined;
  }
};

const normaliseStyle = (value: unknown): ContentDesignStyle | undefined => {
  if (typeof value !== 'string') return undefined;
  const token = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (token === 'classic' || token === 'vibrant' || token === 'legacy' || token === 'eduai-classic') return 'classic';
  if (token === 'light-v5' || token === 'light' || token === 'lightv5' || token === 'light-template') return 'light-v5';
  return undefined;
};

const normaliseIllustrationStyle = (value: unknown): IllustrationStyle | undefined => {
  if (typeof value !== 'string') return undefined;
  const token = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (token === 'book' || token === 'storybook' || token === 'nonfiction' || token === 'nonfictionbook') return 'book';
  if (token === 'disney3d' || token === '3d' || token === 'disney' || token === 'cuteicon') return 'disney3d';
  return undefined;
};

export interface StyleResolutionInput {
  /** Explicit per-request choice, e.g. `input.designStyle`. */
  designStyle?: unknown;
  /** Alias accepted for callers that use the older field name. */
  contentDesignStyle?: unknown;
  /** Explicit per-request illustration choice. */
  illustrationStyle?: unknown;
  /** When false, browser/env lookups are skipped (useful in tests). */
  allowEnvironmentLookup?: boolean;
}

/**
 * Resolve the design doctrine for one generation request.
 *
 * Order: explicit request field → teacher's saved preference → server `.env`
 * → `classic`.
 */
export const resolveContentDesignStyle = (input: StyleResolutionInput = {}): ContentDesignStyle => {
  const explicit =
    normaliseStyle(input.designStyle) ??
    normaliseStyle(input.contentDesignStyle) ??
    normaliseStyle(readStorage(CONTENT_DESIGN_STYLE_STORAGE_KEY));
  if (explicit) return explicit;

  if (input.allowEnvironmentLookup === false) return DEFAULT_CONTENT_DESIGN_STYLE;

  const fromEnv = normaliseStyle(readEnv(CONTENT_DESIGN_STYLE_ENV_KEY));
  return fromEnv ?? DEFAULT_CONTENT_DESIGN_STYLE;
};

/** Resolve the illustration style for one generation request. Same precedence. */
export const resolveIllustrationStyle = (input: StyleResolutionInput = {}): IllustrationStyle => {
  const explicit =
    normaliseIllustrationStyle(input.illustrationStyle) ??
    normaliseIllustrationStyle(readStorage(ILLUSTRATION_STYLE_STORAGE_KEY));
  if (explicit) return explicit;

  if (input.allowEnvironmentLookup === false) return DEFAULT_ILLUSTRATION_STYLE;

  const fromEnv = normaliseIllustrationStyle(readEnv(ILLUSTRATION_STYLE_ENV_KEY));
  return fromEnv ?? DEFAULT_ILLUSTRATION_STYLE;
};

/** True when the model — not the host template — owns the full page design. */
export const isClassicStyle = (style: ContentDesignStyle = DEFAULT_CONTENT_DESIGN_STYLE): boolean =>
  style === 'classic';

/**
 * True only when a value *explicitly* names the classic doctrine.
 *
 * Used by the host template wrapper, which must keep its LIGHT v5 chrome as the
 * default: hand-built documents (learner portfolios, Foundation Phase packs,
 * progress reports, student notes) rely on that chrome and are not AI-generated
 * content, so they must not be silently downgraded. Only content actually
 * generated under the classic doctrine opts out — and it says so explicitly.
 */
export const isExplicitClassicStyle = (value: unknown): boolean =>
  normaliseStyle(value) === 'classic';

/** Persist the teacher's choice (browser only). */
export const saveContentDesignStyle = (style: ContentDesignStyle): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONTENT_DESIGN_STYLE_STORAGE_KEY, style);
  } catch {
    /* ignore */
  }
};

/** Persist the teacher's illustration preference (browser only). */
export const saveIllustrationStyle = (style: IllustrationStyle): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ILLUSTRATION_STYLE_STORAGE_KEY, style);
  } catch {
    /* ignore */
  }
};

/** Read the saved preference without falling back to env (browser only). */
export const readSavedContentDesignStyle = (): ContentDesignStyle | undefined =>
  normaliseStyle(readStorage(CONTENT_DESIGN_STYLE_STORAGE_KEY));

/** Read the saved illustration preference (browser only). */
export const readSavedIllustrationStyle = (): IllustrationStyle | undefined =>
  normaliseIllustrationStyle(readStorage(ILLUSTRATION_STYLE_STORAGE_KEY));

export const CONTENT_DESIGN_STYLE_OPTIONS: Array<{
  id: ContentDesignStyle;
  label: string;
  description: string;
}> = [
  {
    id: 'classic',
    label: 'Classic EduAI (vibrant)',
    description:
      'The original EduAI Companion look: full-width subject-coloured banner, circular grade badge, Name/Date/Score row, pill-shaped section headers, thick playful borders, bento grids, hero illustration and a motivational closing banner. The AI designs the whole page.',
  },
  {
    id: 'light-v5',
    label: 'LIGHT Template v5 (restrained)',
    description:
      'The host renders one banner, the page header and the footer; the AI returns a restrained, print-efficient content fragment.',
  },
];

export const ILLUSTRATION_STYLE_OPTIONS: Array<{
  id: IllustrationStyle;
  label: string;
  description: string;
}> = [
  {
    id: 'book',
    label: "Children's non-fiction book",
    description:
      'Semi-realistic digital painting, award-winning children’s non-fiction book style, museum-quality detail, no cartoonish exaggeration. The original EduAI illustration style.',
  },
  {
    id: 'disney3d',
    label: 'Disney 3D character / 3D icon',
    description: 'Clean, vibrant, semi-realistic Disney 3D animation character and 3D cute icon style.',
  },
];
