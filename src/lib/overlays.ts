/**
 * EduAI Companion — Holographic page overlays
 * ------------------------------------------------------------------
 * One luminous schematic per route, drawn to hug the corners and leave
 * the centre quiet for the real UI. Keyed so the sidebar rail, the top
 * DASHBOARD / CLASSROOMS / ARCHIVE tabs, and the Content Creator view
 * all resolve to a tile without any per‑page guesswork.
 *
 * Drop the matching PNGs into /public/overlays/ (see the save map).
 */

export interface OverlayDef {
  /** Path under /public — served from site root. */
  src: string;
  /** Decorative only; left empty so screen readers ignore the layer. */
  alt: string;
}

const O = (file: string): OverlayDef => ({ src: `/overlays/${file}`, alt: '' });

export const OVERLAYS: Record<string, OverlayDef> = {
  // ── Actual Tab IDs from App.tsx ──────────────────────────────────
  'teacher-dashboard-menu': O('dashboard.jpg'),
  'lesson-planning':        O('toolbox.jpg'),
  'intelligence-ai':        O('ai-tutor.jpg'),
  'class-management':       O('class-manager.jpg'),
  'class-analytics':        O('resource-library.jpg'),
  'student-class-management': O('games.jpg'),
  'system-support':         O('settings.jpg'),
  'student-practice':       O('dashboard.jpg'),
  'collaborative-workspace': O('games.jpg'),

  // ── Core Routes / Fallbacks ──────────────────────────────────────
  home:                   O('dashboard.jpg'),
  dashboard:              O('dashboard.jpg'),
  'magic-lessons':        O('magic-lessons.jpg'),
  'super-worksheets':     O('super-worksheets.jpg'),
  'smart-bot-tutor':      O('ai-tutor.jpg'),
  'intelligent-ai':       O('ai-tutor.jpg'),
  'personalized-learning': O('personalized.jpg'),
  'educational-games':    O('games.jpg'),
  'class-manager':        O('class-manager.jpg'),
  'resource-library':     O('resource-library.jpg'),
  settings:               O('settings.jpg'),

  // ── Content creator / 3D Holo‑Forge ──────────────────────────────
  toolbox:                O('toolbox.jpg'),
  'content-creator':      O('toolbox.jpg'),
  'holo-forge':           O('toolbox.jpg'),

  // ── Additional sub-pages/tabs ────────────────────────────────────
  classrooms:             O('class-manager.jpg'),
  archive:                O('resource-library.jpg'),
  alerts:                 O('dashboard.jpg'),
  reports:                O('resource-library.jpg'),
  planner:                O('settings.jpg'),
  portfolios:             O('class-manager.jpg'),
  curriculum:             O('toolbox.jpg'),
};

/**
 * Resolve a route id, an alias, or a free‑form label ("Teachers Board",
 * "Teacher's Toolbox", "Intelligent AI"…) to an overlay. Returns null
 * when nothing matches so the caller can render nothing rather than a
 * wrong tile.
 */
export function resolveOverlay(route: string | null | undefined): OverlayDef | null {
  if (!route) return null;
  const key = route.trim().toLowerCase();
  if (OVERLAYS[key]) return OVERLAYS[key];

  const aliases: Record<string, string> = {
    'teachers board': 'dashboard',
    'teacher board': 'dashboard',
    'teachers toolbox': 'toolbox',
    "teacher's toolbox": 'toolbox',
    'content studio': 'toolbox',
    'intelligent ai': 'ai-tutor',
    'ai tutor': 'ai-tutor',
    'smart bot': 'ai-tutor',
    'personalized': 'personalized-learning',
    'games': 'educational-games',
    'library': 'resource-library',
  };
  const aliased = aliases[key];
  return aliased ? OVERLAYS[aliased] : null;
}
