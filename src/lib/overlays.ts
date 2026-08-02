// src/lib/overlays.ts
// Direct hosted image URLs for reliable overlay rendering across all pages.
const classroomChalkboard = 'https://i.ibb.co/RGmCJ3jh/teachers-toolbox.png';
const teachersToolbox     = 'https://i.ibb.co/RGmCJ3jh/teachers-toolbox.png';
const intelligentAi       = 'https://i.ibb.co/22bDqWm/intelligent-ai.png';
const classesLearners     = 'https://i.ibb.co/5pVh4rL/classes-learners.png';
const analytics           = 'https://i.ibb.co/MkWLX6qt/analytics.png';
const messageCollaborate  = 'https://i.ibb.co/SXyQK2df/message-collaborate.png';
const settings            = 'https://i.ibb.co/5Jv6WQH/settings.png';
const contentFactory      = 'https://i.ibb.co/zySmQWz/content-factory.png';
const practiceExercises   = 'https://i.ibb.co/ch7V6ZVt/practice-exercises.png';
const contentArchive      = 'https://i.ibb.co/d0b9bBw0/content-archive.png';
const learnerPortfolios   = 'https://i.ibb.co/ksM48wgF/learner-portfolios.png';
const capsGamificationHub = 'https://i.ibb.co/60vh3Jnr/caps-gamification-hub.png';
const aiTutor             = 'https://i.ibb.co/chSwj5SL/ai-tutor.png';

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
  // Settings
  preferences: 'settings', config: 'settings',
};

/** Resolve any route / slug / legacy name to its plate. Never returns null. */
export const resolveOverlay = (route?: string | null): string => {
  const key = (route ?? '').toLowerCase().trim();
  const canonical = (ALIASES[key] ?? key) as OverlayRoute;
  return OVERLAY_REGISTRY[canonical] ?? classroomChalkboard;
};
