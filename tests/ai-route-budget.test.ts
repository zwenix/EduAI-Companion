/**
 * Serverless AI-routing time budget — regression guard.
 *
 * The `/api/ai/:provider` chain (requested provider → sibling engine →
 * Gemini) used to run without any deadline. On Vercel the function is killed
 * after `maxDuration` (60s) and the browser receives a bare HTTP 504, so the
 * built-in Gemini fallback never ran.
 *
 * These assertions pin the budget arithmetic: the Gemini reserve is never
 * spent on an upstream provider, an attempt never starts without enough time
 * to be useful, and the total budget always stays below the platform limit.
 */
import { describe, expect, it } from 'vitest';
import {
  AI_ROUTE_ALTERNATIVE_MIN_MS,
  AI_ROUTE_BUDGET_MS,
  AI_ROUTE_GEMINI_RESERVE_MS,
  AI_ROUTE_MIN_ATTEMPT_MS,
  AI_ROUTE_PROVIDER_TIMEOUT_MS,
  AiRouteBudget,
  withDeadline,
} from '../src/lib/aiRouteBudget';

/** The Vercel function ceiling — the budget must stay well below it. */
const VERCEL_MAX_DURATION_MS = 60_000;

describe('AI route budget', () => {
  it('stays comfortably below the serverless function ceiling', () => {
    expect(AI_ROUTE_BUDGET_MS).toBeLessThan(VERCEL_MAX_DURATION_MS);
    expect(AI_ROUTE_BUDGET_MS + 5_000).toBeLessThanOrEqual(VERCEL_MAX_DURATION_MS);
  });

  it('keeps a Gemini reserve so the fallback can always answer', () => {
    expect(AI_ROUTE_GEMINI_RESERVE_MS).toBeGreaterThan(0);
    expect(AI_ROUTE_GEMINI_RESERVE_MS).toBeLessThan(AI_ROUTE_BUDGET_MS);
  });

  it('never hands the Gemini reserve out to an upstream provider', () => {
    const budget = new AiRouteBudget();
    // Fresh budget: the provider may only use budget - reserve.
    expect(budget.attemptTimeoutMs(AI_ROUTE_PROVIDER_TIMEOUT_MS)).toBe(
      Math.min(AI_ROUTE_PROVIDER_TIMEOUT_MS, AI_ROUTE_BUDGET_MS - AI_ROUTE_GEMINI_RESERVE_MS),
    );
  });

  it('refuses to start an attempt once the reserve is all that is left', () => {
    let clock = 0;
    const budget = new AiRouteBudget({ now: () => clock });
    clock = AI_ROUTE_BUDGET_MS - AI_ROUTE_GEMINI_RESERVE_MS;
    expect(budget.attemptTimeoutMs(AI_ROUTE_PROVIDER_TIMEOUT_MS)).toBe(0);
    expect(budget.canStartAttempt()).toBe(false);
  });

  it('only offers the sibling engine when enough time is left', () => {
    let clock = 0;
    const budget = new AiRouteBudget({ now: () => clock });

    // A fast failure leaves plenty of time for the sibling engine.
    clock = 1_000;
    expect(budget.canTryAlternative(AI_ROUTE_ALTERNATIVE_MIN_MS)).toBe(true);

    // A slow failure burns the budget down to the reserve.
    clock = AI_ROUTE_BUDGET_MS - AI_ROUTE_GEMINI_RESERVE_MS - 1_000;
    expect(budget.canTryAlternative(AI_ROUTE_ALTERNATIVE_MIN_MS)).toBe(false);
  });

  it('gives the Gemini fallback whatever is left', () => {
    let clock = 0;
    const budget = new AiRouteBudget({ now: () => clock });
    clock = 20_000;
    expect(budget.geminiTimeoutMs()).toBe(AI_ROUTE_BUDGET_MS - 20_000);
    expect(budget.geminiTimeoutMs()).toBeGreaterThan(0);
  });

  it('never reports a negative remaining time', () => {
    let clock = 0;
    const budget = new AiRouteBudget({ now: () => clock });
    clock = AI_ROUTE_BUDGET_MS * 3;
    expect(budget.remainingMs()).toBe(0);
    expect(budget.geminiTimeoutMs()).toBe(0);
  });
});

describe('withDeadline', () => {
  it('resolves when the promise finishes in time', async () => {
    await expect(withDeadline(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('rejects with a budget_exhausted error when the promise overruns', async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve('late'), 200));
    await expect(withDeadline(slow, 20, 'too slow')).rejects.toMatchObject({
      code: 'budget_exhausted',
      message: 'too slow',
    });
  });

  it('rejects immediately when there is no time left', async () => {
    await expect(withDeadline(Promise.resolve('ok'), 0)).rejects.toMatchObject({
      code: 'budget_exhausted',
    });
  });
});
