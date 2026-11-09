/**
 * Console diagnostics — what belongs in DevTools and what does not.
 *
 * The rule this module encodes: **a message the UI already shows the user is
 * not an error**. Typing a wrong password is normal life for a login form; it
 * used to dump a full `FirebaseError` stack into the console on every typo and
 * made real problems impossible to spot. Expected authentication outcomes are
 * therefore logged as a single `console.info` line; anything unexpected stays
 * loud.
 *
 * `warnOnce` solves the sibling problem: a listener that fails on every
 * remount (a stale Firestore rule, a blocked host) used to repeat the same
 * warning dozens of times per session. One line per key is enough to diagnose
 * it, and it keeps the console readable for the next deploy check.
 *
 * See `docs/console-error-triage.md` for the deploy checklist that consumes
 * these messages.
 */

/** Authentication outcomes that are a normal part of using the login form. */
const EXPECTED_AUTH_CODES = new Set([
  'auth/invalid-credential',
  'auth/wrong-password',
  'auth/user-not-found',
  'auth/email-already-in-use',
  'auth/weak-password',
  'auth/invalid-email',
  'auth/missing-email',
  'auth/too-many-requests',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/network-request-failed',
]);

/** True when the failure is something the UI already explains to the user. */
export const isExpectedAuthFailure = (err: unknown): boolean => {
  const code = String((err as { code?: unknown } | null)?.code || '');
  if (EXPECTED_AUTH_CODES.has(code)) return true;
  // Older SDKs report the same conditions through the message only.
  const message = String((err as { message?: unknown } | null)?.message || '');
  return /auth\/(invalid-credential|wrong-password|user-not-found|email-already-in-use|weak-password|invalid-email|missing-email|too-many-requests|popup-closed-by-user|cancelled-popup-request|network-request-failed)/.test(
    message
  );
};

/**
 * Logs an authentication failure at the right volume.
 *
 * Expected outcomes → one `console.info` line naming the code (no stack).
 * Anything else → `console.error` with the error, because it is a real defect.
 */
export const logAuthFailure = (context: string, err: unknown): void => {
  const code = String((err as { code?: unknown } | null)?.code || '');
  if (isExpectedAuthFailure(err)) {
    console.info(`[EduAI] ${context}: ${code || 'expected failure'}`);
    return;
  }
  console.error(`[EduAI] ${context}:`, err);
};

const announced = new Set<string>();

/**
 * Logs a warning at most once per key per page load.
 *
 * Use it for conditions that persist (deployed Firestore rules, a blocked
 * host): they reproduce on every remount, and repeating them buries the
 * messages that matter.
 */
export const warnOnce = (key: string, message: string, detail?: unknown): void => {
  if (announced.has(key)) return;
  announced.add(key);
  if (detail === undefined) console.warn(message);
  else console.warn(message, detail);
};

/** Test/debug hook — forget every announced warning. */
export const resetConsoleDiagnostics = (): void => {
  announced.clear();
};
