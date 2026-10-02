/**
 * Page overlay plates (`src/lib/overlays.ts` + its wiring in `src/App.tsx`).
 *
 * Regression guard for "every sidebar landing page shows the dashboard's plate".
 * Opening a landing page sets `categoryOverviewActive` but leaves `activeTab` on
 * whatever was open before (normally 'dashboard'); App used to hand <PageOverlay>
 * the bare `activeTab`, so every landing inherited the dashboard's backdrop.
 *
 * Plates are the JPGs in `src/assets/images`. Vitest turns each image import into
 * its URL string, so the assertions match on the stable file-name stem rather than
 * on the hashed/timestamped full name.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OVERLAY_REGISTRY, overlayRouteFor, resolveOverlay } from '../src/lib/overlays';

type Ctx = Parameters<typeof overlayRouteFor>[0];

/** The plate behind a given app state. */
const plateOf = (ctx: Ctx): string => resolveOverlay(overlayRouteFor(ctx));

/** What App holds while a landing page is open: the hub id, over a tab that is still 'dashboard'. */
const landing = (hub: string, role = 'teacher'): Ctx => ({ tab: 'dashboard', hub, role });

const DASHBOARD_PLATE = plateOf({ tab: 'dashboard' });

/** Every landing page a teacher can open from the sidebar / dashboard, and the plate it must show. */
const TEACHER_LANDINGS: Array<[hub: string, stem: string]> = [
  ['teacher-dashboard-menu', 'landing_dashboard_bg'],
  ['lesson-planning', 'landing_toolbox_bg'], //             Teacher's Toolbox
  ['curriculum-planning', 'landing_curriculum_bg'], //      Curriculum & Planning
  ['intelligence-ai', 'landing_ai_bg'], //                  Intelligent AI
  ['class-management', 'landing_classes_bg'], //            Classes & Learners
  ['class-analytics', 'landing_analytics_bg'], //           Analytics & Reports
  ['student-class-management', 'landing_message_bg'], //    Message & Collaborate
  ['system-support', 'helpdesk_bg'], //                     Help/Support Desk
  ['alerts-planner', 'landing_alerts_bg'], //               Alerts & Diary Planner (dashboard shortcut)
];

describe('landing pages get their own overlay plate', () => {
  it.each(TEACHER_LANDINGS)('%s → %s', (hub, stem) => {
    expect(plateOf(landing(hub))).toContain(stem);
  });

  it('never gives a landing page the plate of the dashboard underneath it', () => {
    for (const [hub] of TEACHER_LANDINGS) {
      if (hub === 'teacher-dashboard-menu') continue; // that landing IS the dashboard
      expect(plateOf(landing(hub)), hub).not.toBe(DASHBOARD_PLATE);
    }
  });

  it('uses a different plate for every landing page', () => {
    const plates = TEACHER_LANDINGS.map(([hub]) => plateOf(landing(hub)));
    expect(new Set(plates).size).toBe(TEACHER_LANDINGS.length);
  });

  it('accepts the alternate ids the dashboard shortcuts use', () => {
    expect(plateOf(landing('edu-tools-hub'))).toBe(plateOf(landing('lesson-planning')));
    expect(plateOf(landing('lesson-planning-landing'))).toBe(plateOf(landing('lesson-planning')));
    expect(plateOf(landing('intelligence-ai-landing'))).toBe(plateOf(landing('intelligence-ai')));
    expect(plateOf(landing('alerts-planner-landing'))).toBe(plateOf(landing('alerts-planner')));
  });
});

describe('every sidebar entry in App.tsx has a plate of its own', () => {
  const appSource = readFileSync(resolve(__dirname, '..', 'src', 'App.tsx'), 'utf8');
  const block = appSource.slice(
    appSource.indexOf('const getSidebarCategories'),
    appSource.indexOf('const sidebarCategories = getSidebarCategories'),
  );
  const sidebarIds = [...new Set([...block.matchAll(/\{ id: '([\w-]+)', label:/g)].map((m) => m[1]))];

  it('finds the sidebar definition', () => {
    expect(sidebarIds.length).toBeGreaterThanOrEqual(7);
  });

  // Adding a sidebar entry without registering a plate would silently fall back to the
  // dashboard's — exactly the bug this file guards against.
  it.each(sidebarIds)('%s', (id) => {
    if (id === 'teacher-dashboard-menu') {
      expect(plateOf(landing(id))).toBe(DASHBOARD_PLATE);
    } else {
      expect(plateOf(landing(id))).not.toBe(DASHBOARD_PLATE);
    }
  });
});

describe('with no landing page open, the open page decides', () => {
  it.each([
    ['dashboard', 'landing_dashboard_bg'],
    ['reports', 'landing_analytics_bg'],
    ['class-management', 'landing_classes_bg'],
    ['messenger', 'landing_message_bg'],
    ['alerts', 'alerts_reminders_bg'], //        the Alerts page keeps its own plate
    ['settings', 'landing_settings_bg'],
    ['helpdesk', 'helpdesk_bg'],
    ['teaching', 'landing_toolbox_bg'],
  ])('%s → %s', (tab, stem) => {
    expect(plateOf({ tab, hub: null, role: 'teacher' })).toContain(stem);
  });

  it('keeps the CAPS Syllabus Hub (teacher "curriculum") on the Curriculum plate', () => {
    expect(plateOf({ tab: 'curriculum', role: 'teacher' })).toContain('landing_curriculum_bg');
  });

  it('falls back to the dashboard plate for unknown or empty routes — never null', () => {
    expect(plateOf({ tab: 'no-such-page' })).toBe(DASHBOARD_PLATE);
    expect(plateOf({ tab: null, hub: null })).toBe(DASHBOARD_PLATE);
    expect(plateOf({})).toBe(DASHBOARD_PLATE);
  });
});

describe('student sidebar entries that are re-labelled follow their label', () => {
  it('"My Class" (stored under the Toolbox id) shows the Classes plate', () => {
    expect(plateOf(landing('lesson-planning', 'student'))).toContain('landing_classes_bg');
  });

  it('"Study & Assessment Tools" shows the Practice plate, not Message & Collaborate', () => {
    expect(plateOf(landing('student-class-management', 'student'))).toContain('toolbox_practice_zone_bg');
    expect(plateOf(landing('student-class-management', 'teacher'))).toContain('landing_message_bg');
  });

  it('"CAPS & Gamification Hub" (student "curriculum" tab) shows the Games plate', () => {
    expect(plateOf({ tab: 'curriculum', role: 'student' })).toContain('games_hub_bg');
  });

  it('leaves the shared landings alone for students', () => {
    expect(plateOf(landing('intelligence-ai', 'student'))).toContain('landing_ai_bg');
    expect(plateOf(landing('class-analytics', 'student'))).toContain('landing_analytics_bg');
    expect(plateOf(landing('system-support', 'student'))).toContain('helpdesk_bg');
  });
});

describe('registry', () => {
  it('maps every plate to an image in src/assets/images', () => {
    for (const [route, url] of Object.entries(OVERLAY_REGISTRY)) {
      expect(url, route).toMatch(/src\/assets\/images\/.+\.(jpe?g|png|webp)$/);
    }
  });
});

describe('App wiring guard', () => {
  const appSource = readFileSync(resolve(__dirname, '..', 'src', 'App.tsx'), 'utf8');

  it('feeds <PageOverlay> through overlayRouteFor with the open landing page', () => {
    expect(appSource).toMatch(
      /<PageOverlay\s+route=\{overlayRouteFor\(\{\s*tab:\s*activeTab,\s*hub:\s*categoryOverviewActive,\s*role:\s*userRole\s*\}\)\}/,
    );
  });

  it('no longer passes the bare activeTab as the route', () => {
    expect(appSource).not.toMatch(/<PageOverlay\s+route=\{activeTab\}/);
  });
});
