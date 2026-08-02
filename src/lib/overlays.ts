// src/lib/overlays.ts
// Saved as .png in src/assets/overlays/ — the download path yields .png,
// so the imports match reality. No .webp anywhere in this file.
import classroomChalkboard from '../assets/overlays/classroom-chalkboard.png';
import teachersToolbox     from '../assets/overlays/teachers-toolbox.png';
import intelligentAi       from '../assets/overlays/intelligent-ai.png';
import classesLearners     from '../assets/overlays/classes-learners.png';
import analytics           from '../assets/overlays/analytics.png';
import messageCollaborate  from '../assets/overlays/message-collaborate.png';
import settings            from '../assets/overlays/settings.png';
import contentFactory      from '../assets/overlays/content-factory.png';
import practiceExercises   from '../assets/overlays/practice-exercises.png';
import contentArchive      from '../assets/overlays/content-archive.png';
import learnerPortfolios   from '../assets/overlays/learner-portfolios.png';
import capsGamificationHub from '../assets/overlays/caps-gamification-hub.png';
import aiTutor             from '../assets/overlays/ai-tutor.png';

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
