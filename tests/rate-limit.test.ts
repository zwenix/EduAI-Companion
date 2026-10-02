/**
 * API abuse protection (`src/lib/rateLimit.ts` + its wiring in `server.ts`).
 *
 * `/api/*` is an unauthenticated provider gateway, so this limiter is the
 * always-on, zero-configuration guard on provider quota. The wiring guard at the
 * end of this file keeps the middleware from being silently removed.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RATE_LIMIT_RULES,
  clientKeyFrom,
  createRateLimiter,
  ruleForPath,
} from '../src/lib/rateLimit';

describe('createRateLimiter', () => {
  it('allows requests up to the limit then blocks with a retry hint', () => {
    let clock = 0;
    const limiter = createRateLimiter({ now: () => clock });
    const rule = { name: 'test', windowMs: 1000, max: 3 };

    for (let i = 0; i < 3; i += 1) {
      const decision = limiter.check('client-a', rule);
      expect(decision.allowed).toBe(true);
      expect(decision.remaining).toBe(2 - i);
    }

    const blocked = limiter.check('client-a', rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(blocked.limit).toBe(3);
  });

  it('resets the allowance when the window elapses', () => {
    let clock = 0;
    const limiter = createRateLimiter({ now: () => clock });
    const rule = { name: 'test', windowMs: 1000, max: 1 };

    expect(limiter.check('client-a', rule).allowed).toBe(true);
    expect(limiter.check('client-a', rule).allowed).toBe(false);

    clock += 1000;
    expect(limiter.check('client-a', rule).allowed).toBe(true);
  });

  it('counts each key independently', () => {
    const limiter = createRateLimiter({ now: () => 0 });
    const rule = { name: 'test', windowMs: 1000, max: 1 };

    expect(limiter.check('client-a', rule).allowed).toBe(true);
    expect(limiter.check('client-b', rule).allowed).toBe(true);
    expect(limiter.check('client-a', rule).allowed).toBe(false);
  });

  it('counts each rule independently for the same key', () => {
    const limiter = createRateLimiter({ now: () => 0 });
    expect(limiter.check('ai:client-a', RATE_LIMIT_RULES.ai).allowed).toBe(true);
    expect(limiter.check('images:client-a', RATE_LIMIT_RULES.images).allowed).toBe(true);
  });

  it('reports a retry window that never exceeds the configured window', () => {
    let clock = 0;
    const limiter = createRateLimiter({ now: () => clock });
    const rule = { name: 'test', windowMs: 60_000, max: 1 };

    limiter.check('client-a', rule);
    clock += 59_500;
    const decision = limiter.check('client-a', rule);
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBe(1);
  });

  it('evicts the oldest keys instead of growing without bound', () => {
    const limiter = createRateLimiter({ now: () => 0, maxKeys: 3 });
    const rule = { name: 'test', windowMs: 1000, max: 1 };

    for (const key of ['a', 'b', 'c', 'd']) limiter.check(key, rule);

    expect(limiter.size()).toBeLessThanOrEqual(3);
  });

  it('exposes a reset for tests and configuration reloads', () => {
    const limiter = createRateLimiter({ now: () => 0 });
    const rule = { name: 'test', windowMs: 1000, max: 1 };
    limiter.check('client-a', rule);
    expect(limiter.size()).toBe(1);
    limiter.reset();
    expect(limiter.size()).toBe(0);
  });
});

describe('ruleForPath', () => {
  it('routes each endpoint class to its own budget', () => {
    expect(ruleForPath('/api/ai/gemini').name).toBe('ai');
    expect(ruleForPath('/api/images/qwen-generate').name).toBe('images');
    expect(ruleForPath('/api/image-proxy').name).toBe('images');
    expect(ruleForPath('/api/video/generate').name).toBe('video');
    expect(ruleForPath('/api/video/status/omni-1').name).toBe('video');
    expect(ruleForPath('/api/ocr').name).toBe('media');
    expect(ruleForPath('/api/tts/hf').name).toBe('media');
    expect(ruleForPath('/api/gemini/action').name).toBe('media');
    expect(ruleForPath('/api/reports/ildp').name).toBe('general');
    expect(ruleForPath('/api/sa/generate-package').name).toBe('general');
  });

  it('keeps the strictest budget on the most expensive pipeline', () => {
    expect(RATE_LIMIT_RULES.video.max).toBeLessThan(RATE_LIMIT_RULES.images.max);
    expect(RATE_LIMIT_RULES.images.max).toBeLessThan(RATE_LIMIT_RULES.ai.max);
    expect(RATE_LIMIT_RULES.ai.max).toBeLessThanOrEqual(RATE_LIMIT_RULES.general.max);
  });

  it('gives every rule a positive window and limit', () => {
    for (const rule of Object.values(RATE_LIMIT_RULES)) {
      expect(rule.windowMs).toBeGreaterThan(0);
      expect(rule.max).toBeGreaterThan(0);
      expect(rule.name).toBeTruthy();
    }
  });
});

describe('clientKeyFrom', () => {
  it('prefers the Express-resolved ip', () => {
    expect(clientKeyFrom({ ip: '203.0.113.7' })).toBe('203.0.113.7');
  });

  it('falls back to the first forwarded address', () => {
    expect(clientKeyFrom({ headers: { 'x-forwarded-for': '198.51.100.2, 10.0.0.1' } })).toBe(
      '198.51.100.2',
    );
  });

  it('falls back to the socket address and finally to a constant', () => {
    expect(clientKeyFrom({ socket: { remoteAddress: '10.0.0.9' } })).toBe('10.0.0.9');
    expect(clientKeyFrom({})).toBe('unknown');
  });
});

describe('server wiring guard', () => {
  const serverSource = readFileSync(resolve(__dirname, '..', 'server.ts'), 'utf8');

  it('applies the limiter to the whole /api surface', () => {
    expect(serverSource).toMatch(/app\.use\('\/api', \(req, res, next\) => \{/);
  });

  it('answers 429 with a Retry-After header', () => {
    expect(serverSource).toMatch(/res\.status\(429\)/);
    expect(serverSource).toMatch(/Retry-After/);
  });

  it('can be disabled by configuration and exempts the cheap liveness probes', () => {
    expect(serverSource).toMatch(/RATE_LIMIT_DISABLED/);
    expect(serverSource).toMatch(/'\/api\/health'/);
  });

  it('relies on the proxy-aware trust setting so buckets are per client', () => {
    expect(serverSource).toMatch(/app\.set\(["']trust proxy["'],\s*1\)/);
  });
});
