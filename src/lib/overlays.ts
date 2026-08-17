// src/lib/overlays.ts
// Page overlay background images. Newly generated landing-page plates live in
// src/assets/images (bundled + hashed); the original public/overlays PNGs are
// retained untouched as protected assets.
import classroomChalkboard from '../assets/images/landing_dashboard_bg_1786962597.jpg';
import teachersToolbox     from '../assets/images/landing_toolbox_bg_1786962597.jpg';
import intelligentAi       from '../assets/images/landing_ai_bg_1786962597.jpg';
import classesLearners     from '../assets/images/landing_classes_bg_1786962597.jpg';
import analytics           from '../assets/images/landing_analytics_bg_1786962597.jpg';
import messageCollaborate  from '../assets/images/landing_message_bg_1786962597.jpg';
import settings            from '../assets/images/landing_settings_bg_1786962597.jpg';
import contentFactory      from '../assets/images/toolbox_content_studio_bg_1786962597.jpg';
import learnerPortfolios   from '../assets/images/learner_portfolio_bg_1786952984.jpg';
import practiceExercises   from '../assets/images/toolbox_practice_zone_bg_1786968958.jpg';
import contentArchive      from '../assets/images/toolbox_vault_bg_1786968958.jpg';
import capsGamificationHub from '../assets/images/games_hub_bg_1786968958.jpg';
import aiTutor             from '../assets/images/ai_tutor_bg_1786968958.jpg';

/** The thirteen rooms, by their current page id. */
export const OVERLAY_REGISTRY = {
  'classroom-chalkboard':  classroomChalkboard,
  'teachers-toolbox':      teachersToolbox,
  'intelligent-ai':        intelligentAi,
  'classes-learners':      classesLearners,
  'analytics':             analytics,
  'message-collaborate':   messageCollaborate,
  'settings':              settings,
  'content-factory':       contentFactory,
  'practice-exercises':    practiceExercises,
  'content-archive':       contentArchive,
  'learner-portfolios':    learnerPortfolios,
  'caps-gamification-hub': capsGamificationHub,
  'ai-tutor':              aiTutor,
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
  // Toolbox
  toolbox: 'teachers-toolbox', 'content-creator': 'teachers-toolbox', teaching: 'teachers-toolbox',
  // Intelligent AI
  'ai-hub': 'intelligent-ai', 'intelligent-ai-hub': 'intelligent-ai',
  'smart-bot-tutor': 'intelligent-ai',
  // Classes & Learners
  classes: 'classes-learners', learners: 'classes-learners',
  'class-manager': 'classes-learners', 'class-management': 'classes-learners',
  // Analytics
  stats: 'analytics', reports: 'analytics', insights: 'analytics',
  // Message & Collaborate
  message: 'message-collaborate', messages: 'message-collaborate',
  collaborate: 'message-collaborate', collaboration: 'message-collaborate', messenger: 'message-collaborate',
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
  // Curriculum & Planning
  'curriculum-planning': 'teachers-toolbox', 'weekly-planner': 'teachers-toolbox',
  planner: 'teachers-toolbox', curriculum: 'teachers-toolbox', alerts: 'settings',
  illustrations: 'content-factory', visual: 'content-factory', video: 'content-factory',
  admin: 'settings', grade1: 'teachers-toolbox',
  'collaborative-workspace': 'message-collaborate', 'student-notes': 'learner-portfolios',
  // Settings
  preferences: 'settings', config: 'settings',
};

/** Resolve any route / slug / legacy name to its plate. Never returns null. */
export const resolveOverlay = (route?: string | null): string => {
  const key = (route ?? '').toLowerCase().trim();
  const canonical = (ALIASES[key] ?? key) as OverlayRoute;
  return OVERLAY_REGISTRY[canonical] ?? classroomChalkboard;
};
