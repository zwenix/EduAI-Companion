/**
 * Dependency-free, in-memory rate limiter for the Express API.
 *
 * WHY
 * ---
 * `/api/*` is an unauthenticated provider gateway (see
 * TECHNICAL_SPECIFICATION.md §13.2): anyone who discovers the deployment can
 * consume Gemini / Qwen / NVIDIA quota, and an image or video request costs
 * real money. Full protection needs Firebase ID-token verification
 * (spec §15 roadmap item 1); this limiter is the zero-configuration, zero-risk
 * layer that blunts accidental and casual abuse today.
 *
 * LIMITATIONS (documented, not accidental)
 * ----------------------------------------
 *  • State is per process. On a horizontally scaled or serverless deployment
 *    each instance keeps its own counters, so the effective limit is
 *    `max × instances`. Move the store to Firestore/Redis for a shared limit.
 *  • Keys are derived from the client IP (or an explicit key), so a distributed
 *    attacker is not stopped — only throttled per source address.
 *
 * The implementation is a fixed-window counter: cheap, allocation-light, and
 * good enough for burst protection. It is deliberately free of timers so it can
 * be unit-tested with an injected clock.
 */

export interface RateLimitRule {
  /** Human-readable name used in the 429 body and logs. */
  name: string;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests permitted per key per window. */
  max: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** Requests remaining in the current window (0 when blocked). */
  remaining: number;
  /** Seconds the caller should wait before retrying (only when blocked). */
  retryAfterSeconds: number;
  /** Configured maximum for this rule (useful for headers). */
  limit: number;
}

interface Bucket {
  count: number;
  /** Window start (ms since epoch). */
  resetAt: number;
}

export interface RateLimiterOptions {
  /** Clock injection for tests. Defaults to `Date.now`. */
  now?: () => number;
  /** Maximum number of tracked keys before the oldest are evicted. */
  maxKeys?: number;
}

export interface RateLimiter {
  check(key: string, rule: RateLimitRule): RateLimitDecision;
  /** Current tracked-key count (diagnostics + tests). */
  size(): number;
  /** Forget all counters (tests / config reload). */
  reset(): void;
}

/** Preset budgets per endpoint class — tuned to provider cost, not to page views. */
export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  // Text generation: cheap-ish but quota-bound (Gemini/Qwen/NIM free tiers).
  ai: { name: 'ai', windowMs: 60_000, max: 30 },
  // Image generation: paid/quota-bound providers, slow responses.
  images: { name: 'images', windowMs: 60_000, max: 20 },
  // Video generation: Gradio queue + Replicate credit. Strictest budget.
  video: { name: 'video', windowMs: 60_000, max: 10 },
  // OCR and speech: third-party quotas (OCR.space, Hugging Face).
  media: { name: 'media', windowMs: 60_000, max: 40 },
  // Everything else under /api (health, notifications, ILDP, SA packages).
  general: { name: 'general', windowMs: 60_000, max: 120 },
};

/**
 * Pick the rule for a request path. Longest-prefix match so that
 * `/api/images/qwen-generate` uses the image budget, not the general one.
 */
export const ruleForPath = (path: string): RateLimitRule => {
  if (path.startsWith('/api/ai/')) return RATE_LIMIT_RULES.ai;
  if (path.startsWith('/api/images/') || path.startsWith('/api/image-proxy')) {
    return RATE_LIMIT_RULES.images;
  }
  if (path.startsWith('/api/video/')) return RATE_LIMIT_RULES.video;
  if (
    path.startsWith('/api/ocr') ||
    path.startsWith('/api/tts') ||
    path.startsWith('/api/gemini/')
  ) {
    return RATE_LIMIT_RULES.media;
  }
  return RATE_LIMIT_RULES.general;
};

export const createRateLimiter = (options: RateLimiterOptions = {}): RateLimiter => {
  const now = options.now ?? (() => Date.now());
  const maxKeys = options.maxKeys ?? 10_000;
  const buckets = new Map<string, Bucket>();

  const evictIfNeeded = () => {
    if (buckets.size <= maxKeys) return;
    // Map preserves insertion order; drop the oldest entries first.
    const excess = buckets.size - maxKeys;
    let dropped = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++dropped >= excess) break;
    }
  };

  return {
    check(key: string, rule: RateLimitRule): RateLimitDecision {
      const timestamp = now();
      const existing = buckets.get(key);

      if (!existing || timestamp >= existing.resetAt) {
        // New window (also covers a clock jump forward).
        buckets.delete(key);
        buckets.set(key, { count: 1, resetAt: timestamp + rule.windowMs });
        evictIfNeeded();
        return {
          allowed: true,
          remaining: Math.max(0, rule.max - 1),
          retryAfterSeconds: 0,
          limit: rule.max,
        };
      }

      if (existing.count >= rule.max) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - timestamp) / 1000)),
          limit: rule.max,
        };
      }

      existing.count += 1;
      // Refresh recency for LRU-style eviction.
      buckets.delete(key);
      buckets.set(key, existing);
      return {
        allowed: true,
        remaining: Math.max(0, rule.max - existing.count),
        retryAfterSeconds: 0,
        limit: rule.max,
      };
    },

    size: () => buckets.size,

    reset: () => buckets.clear(),
  };
};

/**
 * Best-effort client identity for rate-limit keying.
 *
 * `req.ip` is used when Express has been configured to trust a proxy
 * (`app.set('trust proxy', …)`); otherwise it is the socket address. The
 * `x-forwarded-for` header is only consulted as a fallback for raw Node
 * environments and is spoofable — never treat it as authentication.
 */
export const clientKeyFrom = (req: {
  ip?: string;
  headers?: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}): string => {
  if (req.ip) return req.ip;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};
