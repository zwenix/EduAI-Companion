/**
 * Cartoon art kit for the Foundation Phase templates.
 *
 * Two layers, deliberately:
 *  1. **AI-drawn spot illustrations** (`public/illustrations/foundation/*.png`)
 *     — Elly the elephant mascot + bright prop art. Registered here with alt
 *     text and asset-path resolution so the same template renders correctly in
 *     the app (`/illustrations/...`) and inside the standalone printable pack
 *     (`../../illustrations/...`, because the pack lives in
 *     `public/templates/foundation-phase/`).
 *  2. **Hand-built inline SVG doodles** — borders, medals, tracing lines,
 *     confetti, corner critters. Vector = crisp at any print DPI, tiny in the
 *     document, and they keep the A4 layout intact even if a PNG fails to load
 *     (offline classroom printers).
 *
 * Never add generated artwork over an existing file: new art is placed in the
 * dedicated `public/illustrations/foundation/` folder (AGENTS.md asset rules).
 */

import type { ArtKey, RenderOptions } from './types';

export const FOUNDATION_ART_DIR = 'illustrations/foundation';

export interface ArtAsset {
    file: string;
    alt: string;
    /** Suggested printed width in mm for the hero container. */
    widthMm: number;
    /** Rounded-frame tint behind the art (matches the theme, but safe on white). */
    tint: string;
}

export const ART: Record<ArtKey, ArtAsset> = {
    'elly-trophy': { file: 'elly-trophy.png', alt: 'Elly the elephant mascot holding a big gold star medal with confetti', widthMm: 58, tint: '#fff3c4' },
    'elly-reading': { file: 'elly-reading.png', alt: 'Elly the elephant reading a storybook with two learners', widthMm: 52, tint: '#ffe0f0' },
    'elly-counting': { file: 'elly-counting.png', alt: 'Elly the elephant counting colourful blocks and beads', widthMm: 52, tint: '#dcfce7' },
    'elly-nature': { file: 'elly-nature.png', alt: 'Elly the elephant looking at a snail beside a protea flower', widthMm: 52, tint: '#d1fae5' },
    'medal-star': { file: 'medal-star.png', alt: 'Gold award medal with a smiling star and ribbon', widthMm: 34, tint: '#fff7d6' },
    'doodle-supplies': { file: 'doodle-supplies.png', alt: 'Smiling pencils, crayons, notebook and sun doodles', widthMm: 44, tint: '#e0f2fe' },
    'kids-classroom': { file: 'kids-classroom.png', alt: 'Happy diverse learners raising hands on a rainbow classroom rug', widthMm: 60, tint: '#ede9fe' },
    'homework-bag': { file: 'homework-bag.png', alt: 'Smiling schoolbag with a notebook in front of a schoolhouse', widthMm: 44, tint: '#fee2e2' },
    'rainbow-banner': { file: 'rainbow-banner.png', alt: 'Rainbow arc with smiling clouds, stars and confetti', widthMm: 120, tint: 'transparent' },
    'sticker-sheet': { file: 'sticker-sheet.png', alt: 'Sheet of round reward stickers with stars, hearts and thumbs up', widthMm: 46, tint: '#fef9c3' },
};

/** Brand palette (DESIGN.md tokens) + extras used by the print kit. */
export const PALETTE = {
    cyan: '#06b6d4',
    yellow: '#ffdf40',
    pink: '#FF69B4',
    green: '#2ed573',
    purple: '#9b59b6',
    orange: '#ff8a3d',
    red: '#ff5a5f',
    blue: '#2563eb',
    navy: '#1e3a5f',
    ink: '#12233f',
    paper: '#ffffff',
    cream: '#fffaf0',
    mist: '#f2fbff',
} as const;

export const RAINBOW = [PALETTE.red, PALETTE.orange, PALETTE.yellow, PALETTE.green, PALETTE.blue, PALETTE.purple];

/** Resolve an art path for the requested host document. */
export const artSrc = (key: ArtKey, mode: RenderOptions['assetMode'] = 'app'): string => {
    const file = `${FOUNDATION_ART_DIR}/${ART[key].file}`;
    return mode === 'standalone' ? `../../${file}` : `/${file}`;
};

/** `<img>` tag for a spot illustration, framed in a soft tinted bubble. */
export const artImg = (
    key: ArtKey,
    mode: RenderOptions['assetMode'],
    opts: { size?: number; className?: string; float?: 'left' | 'right' } = {},
): string => {
    const a = ART[key];
    const w = opts.size ?? a.widthMm;
    const tint = a.tint === 'transparent' ? 'transparent' : a.tint;
    const frame = tint === 'transparent' ? '' : `background:${tint};border-radius:22mm;padding:3mm;`;
    return `<span class="fp-art ${opts.className ?? ''} fp-float-${opts.float ?? 'right'}" style="width:${w}mm;${frame}">
  <img src="${artSrc(key, mode)}" alt="${a.alt}" style="width:100%;display:block;border-radius:${tint === 'transparent' ? 4 : 18}mm;" />
</span>`;
};

/* ────────────────────────── Inline SVG kit ────────────────────────── */

const svg = (viewBox: string, body: string, cls = '', extra = '') =>
    `<svg class="fp-svg ${cls}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;

/** Twinkly star with a smiley face. */
export const doodleStar = (color: string = PALETTE.yellow, size = 14, cls = ''): string =>
    svg(
        '0 0 48 48',
        `<path d="M24 3l5.6 12.2L43 17l-9.4 9.1L36 39.5 24 33.1 12 39.5l2.4-13.4L5 17l13.4-1.8z" fill="${color}" stroke="${PALETTE.ink}" stroke-width="2.2" stroke-linejoin="round"/>
     <circle cx="19.5" cy="20" r="1.7" fill="${PALETTE.ink}"/><circle cx="28.5" cy="20" r="1.7" fill="${PALETTE.ink}"/>
     <path d="M19 25q5 4.5 10 0" fill="none" stroke="${PALETTE.ink}" stroke-width="2" stroke-linecap="round"/>`,
        cls,
        `width="${size}" height="${size}"`,
    );

/** Smiling sun for corners. */
export const doodleSun = (size = 26, cls = ''): string =>
    svg(
        '0 0 64 64',
        `<g stroke="${PALETTE.orange}" stroke-width="3.4" stroke-linecap="round">
           ${Array.from({ length: 8 })
               .map((_, i) => {
                   const a = (Math.PI / 4) * i;
                   const x1 = 32 + Math.cos(a) * 22;
                   const y1 = 32 + Math.sin(a) * 22;
                   const x2 = 32 + Math.cos(a) * 29;
                   const y2 = 32 + Math.sin(a) * 29;
                   return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
               })
               .join('')}
         </g>
         <circle cx="32" cy="32" r="17" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="2.2"/>
         <circle cx="26.5" cy="30" r="2" fill="${PALETTE.ink}"/><circle cx="37.5" cy="30" r="2" fill="${PALETTE.ink}"/>
         <path d="M25.5 36q6.5 6 13 0" fill="none" stroke="${PALETTE.ink}" stroke-width="2.4" stroke-linecap="round"/>`,
        cls,
        `width="${size}" height="${size}"`,
    );

/** Fluffy cloud with a face. */
export const doodleCloud = (size = 26, cls = ''): string =>
    svg(
        '0 0 80 48',
        `<path d="M16 40q-12 0-12-11t12-11q2-13 16-13t18 12q12-1 13 10t-11 13z" fill="#ffffff" stroke="${PALETTE.cyan}" stroke-width="2.6" stroke-linejoin="round"/>
         <circle cx="30" cy="24" r="2" fill="${PALETTE.ink}"/><circle cx="44" cy="24" r="2" fill="${PALETTE.ink}"/>
         <path d="M30 30q7 5 14 0" fill="none" stroke="${PALETTE.ink}" stroke-width="2.2" stroke-linecap="round"/>`,
        cls,
        `width="${size * 1.6}" height="${size}"`,
    );

/** Buzzy bee. */
export const doodleBee = (size = 18, cls = ''): string =>
    svg(
        '0 0 64 48',
        `<ellipse cx="30" cy="30" rx="18" ry="13" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="2.4"/>
         <path d="M24 18v24M33 18v24" stroke="${PALETTE.ink}" stroke-width="3"/>
         <ellipse cx="42" cy="16" rx="9" ry="6" fill="#e0f2fe" stroke="${PALETTE.ink}" stroke-width="2"/>
         <circle cx="48" cy="27" r="5.5" fill="${PALETTE.ink}"/><circle cx="50" cy="25.5" r="1.5" fill="#fff"/>
         <path d="M52 24q6-6 10-3" fill="none" stroke="${PALETTE.ink}" stroke-width="2"/>`,
        cls,
        `width="${size}" height="${(size * 48) / 64}"`,
    );

/** Pencil marker used to lead every activity. */
export const doodlePencil = (size = 16, cls = ''): string =>
    svg(
        '0 0 48 48',
        `<path d="M6 42l4-12L32 8l8 8-22 22z" fill="${PALETTE.orange}" stroke="${PALETTE.ink}" stroke-width="2.4" stroke-linejoin="round"/>
         <path d="M32 8l8 8 4-4a3 3 0 000-4l-4-4a3 3 0 00-4 0z" fill="${PALETTE.pink}" stroke="${PALETTE.ink}" stroke-width="2.2"/>
         <path d="M10 30l8 8" stroke="${PALETTE.ink}" stroke-width="2"/>`,
        cls,
        `width="${size}" height="${size}"`,
    );

/** Award rosette with ribbons — the medal badge on certificates. */
export const doodleRosette = (size = 40, color: string = PALETTE.yellow, label = '★', cls = ''): string =>
    svg(
        '0 0 100 130',
        `<path d="M36 78l-12 42 26-12 26 12-12-42z" fill="${PALETTE.pink}" stroke="${PALETTE.ink}" stroke-width="3" stroke-linejoin="round"/>
         <circle cx="50" cy="46" r="34" fill="${color}" stroke="${PALETTE.ink}" stroke-width="3.4"/>
         <circle cx="50" cy="46" r="24" fill="#fffdf5" stroke="${PALETTE.ink}" stroke-width="2.2" stroke-dasharray="3 3"/>
         <text x="50" y="56" text-anchor="middle" font-size="26" font-family="Fredoka, sans-serif" fill="${PALETTE.navy}">${label}</text>`,
        cls,
        `width="${size}" height="${(size * 130) / 100}"`,
    );

/** Trophy. */
export const doodleTrophy = (size = 34, cls = ''): string =>
    svg(
        '0 0 64 64',
        `<path d="M18 10h28v14a14 14 0 01-28 0z" fill="${PALETTE.yellow}" stroke="${PALETTE.ink}" stroke-width="2.6"/>
         <path d="M18 14H10q0 12 10 12M46 14h8q0 12-10 12" fill="none" stroke="${PALETTE.ink}" stroke-width="2.6"/>
         <path d="M32 38v8M22 54h20l-3-8H25z" fill="${PALETTE.orange}" stroke="${PALETTE.ink}" stroke-width="2.6" stroke-linejoin="round"/>`,
        cls,
        `width="${size}" height="${size}"`,
    );

/** Rainbow arc used across the top of worksheets and award banners. */
export const rainbowArc = (cls = ''): string =>
    svg(
        '0 0 200 60',
        `${RAINBOW.map((c, i) => `<path d="M${14 + i * 6} 58a${86 - i * 12} ${86 - i * 12} 0 01${172 - i * 24} 0" fill="none" stroke="${c}" stroke-width="5.4" stroke-linecap="round"/>`).join('')}
         <circle cx="16" cy="58" r="8" fill="#fff" stroke="${PALETTE.cyan}" stroke-width="2.6"/>
         <circle cx="184" cy="58" r="8" fill="#fff" stroke="${PALETTE.cyan}" stroke-width="2.6"/>`,
        cls,
        `preserveAspectRatio="none" style="width:100%;height:16mm;display:block"`,
    );

/** Wavy scalloped band (used as a bottom footer flourish on every page). */
export const scallopBand = (color: string = PALETTE.cyan, cls = ''): string =>
    svg(
        '0 0 240 24',
        `<path d="M0 24V14q12-14 24 0t24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0V24z" fill="${color}" opacity=".9"/>`,
        cls,
        `preserveAspectRatio="none" style="width:100%;height:6mm;display:block"`,
    );

/** Confetti sprinkle strip (top of a page, behind the banner). */
export const confettiStrip = (count = 26, seed = 7): string => {
    let rnd = seed;
    const next = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648), rnd / 2147483648);
    const bits = Array.from({ length: count })
        .map(() => {
            const x = (next() * 100).toFixed(1);
            const y = (next() * 100).toFixed(1);
            const c = RAINBOW[Math.floor(next() * RAINBOW.length)];
            const kind = next();
            if (kind < 0.34) return `<circle cx="${x}" cy="${y}" r="${(1 + next() * 1.4).toFixed(1)}" fill="${c}"/>`;
            if (kind < 0.67)
                return `<rect x="${x}" y="${y}" width="${(2 + next() * 2).toFixed(1)}" height="1.6" rx=".8" fill="${c}" transform="rotate(${Math.floor(next() * 120 - 60)} ${x} ${y})"/>`;
            return `<path d="M${x} ${y}l1.6 1.6M${(+x + 1.6).toFixed(1)} ${y}l-1.6 1.6" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`;
        })
        .join('');
    return svg('0 0 100 100', bits, 'fp-confetti', `preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"`);
};

/**
 * Handwriting guide line: solid baseline + dotted mid-line, with a descender
 * zone — the classic Foundation Phase four-line writer's block.
 */
export const writingLines = (repeat = 1, guideText = '', mode: RenderOptions['assetMode'] = 'app'): string => {
    const rows = Array.from({ length: repeat })
        .map(
            (_, i) => `<div class="fp-wline${i === 0 && guideText ? ' fp-wline-first' : ''}">
        <span class="fp-wguide">${guideText && i === 0 ? escapeHtml(guideText) : ''}</span>
        <span class="fp-wdot"></span>
      </div>`,
        )
        .join('');
    return `<div class="fp-writer">${rows}</div>`;
};

/** Dotted tracer text (the model word/letter the learner writes over). */
export const tracer = (text: string, cls = ''): string =>
    `<span class="fp-tracer ${cls}" aria-label="Trace the word ${escapeHtml(text)}">${escapeHtml(text.toUpperCase())}</span>`;

/** Scissors + dashed cut line. */
export const cutLine = (label = 'Cut here'): string =>
    `<div class="fp-cutline"><span class="fp-cut-icon">${svg('0 0 48 32', `<circle cx="9" cy="24" r="6" fill="none" stroke="${PALETTE.ink}" stroke-width="2.6"/><circle cx="9" cy="8" r="6" fill="none" stroke="${PALETTE.ink}" stroke-width="2.6"/><path d="M14 12l28 16M14 20L42 4" stroke="${PALETTE.ink}" stroke-width="2.6" stroke-linecap="round"/>`, '', 'width="16" height="11"')}</span><span class="fp-cut-dash"></span><span class="fp-cut-label">${escapeHtml(label)}</span></div>`;

/** Answer box grid (single-digit writing squares). */
export const digitBoxes = (count: number, size = 11): string =>
    `<span class="fp-boxes">${Array.from({ length: count })
        .map(() => `<span class="fp-box" style="width:${size}mm;height:${size}mm"></span>`)
        .join('')}</span>`;

/** Big circled numeral for question numbers. */
export const numberBadge = (n: number | string, color: string = PALETTE.cyan): string =>
    `<span class="fp-num" style="background:${color}">${escapeHtml(String(n))}</span>`;

/** Colour swatch chip for "colour the …" tasks. */
export const colourChip = (name: string, hex: string): string =>
    `<span class="fp-swatch"><span class="fp-swatch-dot" style="background:${hex}"></span>${escapeHtml(name)}</span>`;

export const PALETTE_SWATCHES: Array<[string, string]> = [
    ['red', PALETTE.red],
    ['blue', PALETTE.blue],
    ['yellow', PALETTE.yellow],
    ['green', PALETTE.green],
    ['orange', PALETTE.orange],
    ['purple', PALETTE.purple],
    ['pink', PALETTE.pink],
    ['brown', '#8d5524'],
    ['black', PALETTE.ink],
    ['white', '#ffffff'],
];

/** Tick box (square, generous for small hands). */
export const tickBox = (size = 8): string => `<span class="fp-tick" style="width:${size}mm;height:${size}mm"></span>`;

export const escapeHtml = (str: string): string =>
    String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

export default {
    ART,
    PALETTE,
    RAINBOW,
    artSrc,
    artImg,
    doodleStar,
    doodleSun,
    doodleCloud,
    doodleBee,
    doodlePencil,
    doodleRosette,
    doodleTrophy,
    rainbowArc,
    scallopBand,
    confettiStrip,
    writingLines,
    tracer,
    cutLine,
    digitBoxes,
    numberBadge,
    colourChip,
    PALETTE_SWATCHES,
    tickBox,
};
