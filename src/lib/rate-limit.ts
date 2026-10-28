type Bucket = {
  tokens: number;
  last: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window-ish token bucket. In-memory (per serverless instance).
 * Good enough to blunt spam; use Redis/Upstash for multi-region hard limits.
 */
export function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let b = buckets.get(params.key);
  if (!b) {
    b = { tokens: params.limit, last: now };
    buckets.set(params.key, b);
  }

  const elapsed = now - b.last;
  if (elapsed >= params.windowMs) {
    b.tokens = params.limit;
    b.last = now;
  }

  if (b.tokens <= 0) {
    return {
      ok: false,
      remaining: 0,
      resetMs: Math.max(0, params.windowMs - (now - b.last)),
    };
  }

  b.tokens -= 1;
  return { ok: true, remaining: b.tokens, resetMs: params.windowMs - (now - b.last) };
}

export function clientIp(request: Request): string {
  const h = request.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Reset helpers for tests */
export function __resetRateLimitBuckets() {
  buckets.clear();
}
