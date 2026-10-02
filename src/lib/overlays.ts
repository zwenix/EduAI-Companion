// src/lib/overlays.ts
// Page overlay background images. Newly generated landing-page plates live in
// src/assets/images (bundled + hashed); the original public/overlays PNGs are
// retained untouched as protected assets.
//
// Which plate is on screen is decided by `overlayRouteFor()` at the bottom of
// this file: a sidebar landing page (hub) gets ITS OWN plate rather than the
// plate of whatever tab happened to be open underneath it.
import classroomChalkboard from '../assets/images/landing_dashboard_bg_1786962597.jpg';
import teachersToolbox     from '../assets/images/landing_toolbox_bg_1786962597.jpg';
import intelligentAi       from '../assets/images/landing_ai_bg_1786962597.jpg';
import classesLearners     from '../assets/images/landing_classes_bg_1786962597.jpg';
import analytics           from '../assets/images/landing_analytics_bg_1786962597.jpg';
import messageCollaborate  from '../assets/images/landing_message_bg_1786962597.jpg';
import settings            from '../assets/images/landing_settings_bg_1786962597.jpg';
import curriculumPlanning  from '../assets/images/landing_curriculum_bg_1786962597.jpg';
import alertsPlanner       from '../assets/images/landing_alerts_bg_1786962597.jpg';
import contentFactory      from '../assets/images/toolbox_content_studio_bg_1786962597.jpg';
import learnerPortfolios   from '../assets/images/learner_portfolio_bg_1786952984.jpg';
import practiceExercises   from '../assets/images/toolbox_practice_zone_bg_1786968958.jpg';
import contentArchive      from '../assets/images/toolbox_vault_bg_1786968958.jpg';
import capsGamificationHub from '../assets/images/games_hub_bg_1786968958.jpg';
import aiTutor             from '../assets/images/ai_tutor_bg_1786968958.jpg';
import alertsReminders     from '../assets/images/alerts_reminders_bg_1786975832.jpg';
import plannerDiary        from '../assets/images/planner_diary_bg_1786975832.jpg';
import weeklyPlanner       from '../assets/images/weekly_planner_bg_1786975832.jpg';
import helpdeskBg          from '../assets/images/helpdesk_bg_1786975832.jpg';
import ocrGradingBg        from '../assets/images/toolbox_ocr_bg_1786968958.jpg';
import interventionSupport from '../assets/images/intervention_support_bg_1786952984.jpg';

/** The rooms, by their current page id. */
export const OVERLAY_REGISTRY = {
  'classroom-chalkboard':  classroomChalkboard,
  'teachers-toolbox':      teachersToolbox,
  'intelligent-ai':        intelligentAi,
  'classes-learners':      classesLearners,
  'analytics':             analytics,
  'message-collaborate':   messageCollaborate,
  'settings':              settings,
  'curriculum-planning':   curriculumPlanning,
  'alerts-planner':        alertsPlanner,
  'content-factory':       contentFactory,
  'practice-exercises':    practiceExercises,
  'content-archive':       contentArchive,
  'learner-portfolios':    learnerPortfolios,
  'caps-gamification-hub': capsGamificationHub,
  'ai-tutor':              aiTutor,
  'alerts-reminders':      alertsReminders,
  'planner-diary':         plannerDiary,
  'weekly-planner':        weeklyPlanner,
  'helpdesk':              helpdeskBg,
  'ocr-grading':           ocrGradingBg,
  'learner-intervention':  interventionSupport,
} as const;

export type OverlayRoute = keyof typeof OVERLAY_REGISTRY;

/**
 * Every name a route might still answer to — old slugs, short forms,
 * the pre-rename pages — pointed at the room it became. This is the
 * safety net: rename a page tomorrow and the overlay follows it.
 */
const ALIASES: Record<string, OverlayRoute> = {
  // Chalkboard / home
  home: 'classroom-chalkboard', dashboard: 'classroom-chalkboard',
  'teachers-board': 'classroom-chalkboard', chalkboard: 'classroom-chalkboard',
  'teacher-dashboard-menu': 'classroom-chalkboard',
  // Toolbox
  toolbox: 'teachers-toolbox', 'content-creator': 'teachers-toolbox', teaching: 'teachers-toolbox',
  'lesson-planning': 'teachers-toolbox', 'lesson-planning-landing': 'teachers-toolbox',
  'edu-tools-hub': 'teachers-toolbox',
  // Intelligent AI
  'ai-hub': 'intelligent-ai', 'intelligent-ai-hub': 'intelligent-ai',
  'smart-bot-tutor': 'intelligent-ai',
  'intelligence-ai': 'intelligent-ai', 'intelligence-ai-landing': 'intelligent-ai',
  // Classes & Learners
  classes: 'classes-learners', learners: 'classes-learners',
  'class-manager': 'classes-learners', 'class-management': 'classes-learners',
  // Analytics
  stats: 'analytics', reports: 'analytics', insights: 'analytics',
  'class-analytics': 'analytics',
  // Message & Collaborate
  message: 'message-collaborate', messages: 'message-collaborate',
  collaborate: 'message-collaborate', collaboration: 'message-collaborate', messenger: 'message-collaborate',
  'student-class-management': 'message-collaborate',
  // Content Factory (was Magic Lessons)
  'magic-lessons': 'content-factory', factory: 'content-factory',
  'content-studio': 'content-factory',
  // Practice & Exercises (was Super Worksheets)
  'super-worksheets': 'practice-exercises', worksheets: 'practice-exercises',
  exercises: 'practice-exercises', practice: 'practice-exercises', 'student-practice': 'practice-exercises',
  // Content Archive (was Resource Library)
  'resource-library': 'content-archive', archive: 'content-archive',
  library: 'content-archive', vault: 'content-archive',
  // Learner Personal Portfolios (was Personalized Learning)
  'personalized-learning': 'learner-portfolios', portfolio: 'learner-portfolios',
  portfolios: 'learner-portfolios', 'learner-portfolio': 'learner-portfolios',
  // CAPS & Gamification Hub (was Educational Games)
  'educational-games': 'caps-gamification-hub', games: 'caps-gamification-hub',
  gamification: 'caps-gamification-hub',
  // AI Tutor
  tutor: 'ai-tutor', 'ai-tutor-companion': 'ai-tutor', elly: 'ai-tutor',
  // Curriculum & Planning (its own plate: 'curriculum-planning' is registered above)
  'weekly-planner': 'weekly-planner',
  planner: 'planner-diary', curriculum: 'curriculum-planning', alerts: 'alerts-reminders',
  // Alerts & Diary Planner landing (the Dashboard shortcut) — the Alerts *page* keeps 'alerts-reminders'
  'alerts-planner-landing': 'alerts-planner',
  illustrations: 'content-factory', visual: 'content-factory', video: 'content-factory',
  admin: 'settings', grade1: 'teachers-toolbox',
  'collaborative-workspace': 'message-collaborate', 'student-notes': 'learner-portfolios',
  // Standalone feature pages (outside the hub CategoryOverview) — each has its own dedicated plate
  ocr: 'ocr-grading', 'ocr-grading': 'ocr-grading',
  'learner-intervention': 'learner-intervention',
  intervention: 'learner-intervention', 'intervention-hub': 'learner-intervention',
  help: 'helpdesk', faq: 'helpdesk', support: 'helpdesk', 'system-support': 'helpdesk',
  // Settings
  preferences: 'settings', config: 'settings',
};

/** Resolve any route / slug / legacy name to its plate. Never returns null. */
export const resolveOverlay = (route?: string | null): string => {
  const key = (route ?? '').toLowerCase().trim();
  const canonical = (ALIASES[key] ?? key) as OverlayRoute;
  return OVERLAY_REGISTRY[canonical] ?? classroomChalkboard;
};

/** What the app knows at the moment it has to pick a plate. */
export interface OverlayContext {
  /** The open page — App's `activeTab`. */
  tab?: string | null;
  /**
   * The sidebar landing page (hub) currently covering that page, if any — App's
   * `categoryOverviewActive`. Opening a hub does NOT change `activeTab`, so on
   * its own `tab` is still whatever was open before (usually the dashboard).
   */
  hub?: string | null;
  /** The signed-in role: a few sidebar entries mean something else to a student. */
  role?: string | null;
}

/**
 * Sidebar entries that are re-labelled for students, so their plate has to
 * follow the label, not the id: "My Class" is stored under the teacher's
 * Toolbox id and "Study & Assessment Tools" under Message & Collaborate's.
 */
const STUDENT_HUB_PLATES: Record<string, OverlayRoute> = {
  'lesson-planning': 'classes-learners',
  'student-class-management': 'practice-exercises',
};

/**
 * Which plate belongs behind what is on screen right now — the value to pass as
 * `<PageOverlay route={…}>`.
 *
 * While a landing page is open its own id wins; otherwise the open page decides.
 * Feeding `PageOverlay` the bare `activeTab` was the bug that made every
 * sidebar landing page show the dashboard's plate.
 */
export const overlayRouteFor = ({ tab, hub, role }: OverlayContext): string => {
  if (hub) return (role === 'student' && STUDENT_HUB_PLATES[hub]) || hub;
  // The student's "CAPS & Gamification Hub" shares the `curriculum` tab id with the teacher's Syllabus Hub.
  if (role === 'student' && tab === 'curriculum') return 'caps-gamification-hub';
  return tab ?? '';
};
