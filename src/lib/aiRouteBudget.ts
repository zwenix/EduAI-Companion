/**
 * EduAI Companion — serverless time budget for the `/api/ai/:provider` chain.
 *
 * WHY THIS EXISTS
 * ---------------
 * The AI proxy walks up to three engines for one request:
 *
 *   1. the requested provider (NVIDIA NIM / Alibaba Model Studio)
 *   2. one sibling engine (`alternativeProviderFor`)
 *   3. the Gemini fallback
 *
 * On Vercel the whole API is one serverless function whose `maxDuration` is
 * 60s (`vercel.json`). When the chain ran past that limit the platform killed
 * the function and answered the browser with a bare **HTTP 504** — the client
 * then gave up on the request entirely and the built-in Gemini fallback never
 * ran. The upstream clients also had no per-request timeout, so a single hung
 * NVIDIA NIM call was enough to trip it.
 *
 * This module makes the budget explicit: every hop is given a hard deadline
 * derived from one shared budget, and the Gemini fallback always keeps a
 * reserved slice so the request can still be answered by the primary engine.
 *
 * The numbers below are deliberately conservative: the budget must stay well
 * below the platform limit so the function can still flush its response.
 */

/** Total wall-clock budget for one `/api/ai/:provider` request. */
export const AI_ROUTE_BUDGET_MS = 52_000;

/**
 * Time kept aside for the final Gemini fallback. The chain may only spend the
 * rest of the budget on upstream providers, so a slow provider can never
 * starve the engine that is guaranteed to answer.
 */
export const AI_ROUTE_GEMINI_RESERVE_MS = 15_000;

/**
 * Maximum time a single upstream provider attempt may take.
 *
 * Tightened from 28s: a reasoning model that has not started streaming within
 * ~20s is not going to finish inside a 60s serverless function anyway, and the
 * old cap let ONE slow hop consume the budget for the entire chain.
 */
export const AI_ROUTE_PROVIDER_TIMEOUT_MS = 20_000;

/**
 * Maximum time for a sibling-engine attempt.
 *
 * Tightened from 20s for the same reason: the sibling hops must fit alongside
 * the Gemini reserve, otherwise the "fallback" never runs.
 */
export const AI_ROUTE_ALTERNATIVE_TIMEOUT_MS = 14_000;

/**
 * Latency probe cap for availability/speed checks (`POST /api/ai/:provider`
 * with a tiny `max_completion_tokens`, as used by the Settings speed test).
 *
 * A probe that waits 20s for a healthy model is a broken probe: it reports the
 * engine as "did not answer within the time budget" and the UI shows a failure
 * for an engine that is perfectly fine, just slower than a probe should wait.
 */
export const AI_ROUTE_PROBE_TIMEOUT_MS = 9_000;

/** `max_completion_tokens` at or below this makes a request a latency PROBE. */
export const AI_ROUTE_PROBE_MAX_TOKENS = 64;

/**
 * Minimum free time before it is worth trying the sibling engine at all.
 * Below this the request would be better off going straight to Gemini.
 */
export const AI_ROUTE_ALTERNATIVE_MIN_MS = 10_000;

/**
 * Minimum time an attempt needs to be worth starting. A 2-second sliver of
 * budget is not enough for a model to answer anything useful.
 */
export const AI_ROUTE_MIN_ATTEMPT_MS = 5_000;

export interface AiRouteBudgetOptions {
  /** Total budget in ms. Defaults to {@link AI_ROUTE_BUDGET_MS}. */
  budgetMs?: number;
  /** Gemini reserve in ms. Defaults to {@link AI_ROUTE_GEMINI_RESERVE_MS}. */
  reserveMs?: number;
  /** Clock injection point (tests). Defaults to `Date.now`. */
  now?: () => number;
}

/**
 * A monotonic budget shared by every hop of one AI routing request.
 */
export class AiRouteBudget {
  private readonly startedAt: number;
  private readonly budgetMs: number;
  private readonly reserveMs: number;
  private readonly now: () => number;

  constructor(options: AiRouteBudgetOptions = {}) {
    this.now = options.now ?? Date.now;
    this.startedAt = this.now();
    this.budgetMs = options.budgetMs ?? AI_ROUTE_BUDGET_MS;
    this.reserveMs = options.reserveMs ?? AI_ROUTE_GEMINI_RESERVE_MS;
  }

  /** Time already spent on this request. */
  elapsedMs(): number {
    return Math.max(0, this.now() - this.startedAt);
  }

  /** Time left in the total budget (reserve included). */
  remainingMs(): number {
    return Math.max(0, this.budgetMs - this.elapsedMs());
  }

  /**
   * Time an upstream provider attempt may use.
   *
   * The Gemini reserve is never handed out, so the fallback always has time
   * left. Returns 0 when there is nothing left to spend.
   */
  attemptTimeoutMs(capMs: number): number {
    const spendable = this.remainingMs() - this.reserveMs;
    if (spendable <= 0) return 0;
    return Math.max(0, Math.min(capMs, spendable));
  }

  /**
   * True when a sibling-engine attempt still fits inside the budget while
   * keeping the Gemini reserve intact.
   */
  canTryAlternative(minMs: number = AI_ROUTE_ALTERNATIVE_MIN_MS): boolean {
    return this.attemptTimeoutMs(minMs) >= minMs;
  }

  /**
   * True when there is enough time left to start an attempt at all.
   */
  canStartAttempt(minMs: number = AI_ROUTE_MIN_ATTEMPT_MS): boolean {
    return this.spendableMs() >= minMs;
  }

  /** Time that may be spent on upstream providers (budget minus reserve). */
  spendableMs(): number {
    return Math.max(0, this.remainingMs() - this.reserveMs);
  }

  /** Time the final Gemini fallback may use (everything that is left). */
  geminiTimeoutMs(): number {
    return this.remainingMs();
  }
}

/**
 * Rejects with a `budget_exhausted` error when `promise` outlives `ms`.
 * The underlying promise is not cancelled — callers treat the rejection as
 * "this hop is too slow" and move on to the next engine.
 */
export const withDeadline = <T>(
  promise: Promise<T>,
  ms: number,
  message = 'AI route deadline exceeded',
): Promise<T> => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.reject(
      Object.assign(new Error(message), { code: 'budget_exhausted' }),
    );
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error(message), { code: 'budget_exhausted' }));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
};
