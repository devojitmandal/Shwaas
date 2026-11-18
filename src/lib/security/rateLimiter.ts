interface RateLimitConfig {
  limit: number; // max requests per window
  windowMs: number; // window size in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

// In-memory sliding window IP store with bounded capacity to prevent memory exhaustion
const ipHits = new Map<string, number[]>();
const MAX_TRACKED_IPS = 2000;

function pruneStaleEntries(now: number, windowMs: number): void {
  const windowStart = now - windowMs;
  for (const [key, timestamps] of ipHits.entries()) {
    const active = timestamps.filter((t) => t > windowStart);
    if (active.length === 0) {
      ipHits.delete(key);
    } else {
      ipHits.set(key, active);
    }
  }
}

export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = { limit: 15, windowMs: 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Prune map if it grows beyond maximum threshold
  if (ipHits.size > MAX_TRACKED_IPS) {
    pruneStaleEntries(now, config.windowMs);
  }

  const timestamps = ipHits.get(ip) || [];
  // Filter out expired timestamps
  const activeTimestamps = timestamps.filter((t) => t > windowStart);

  if (activeTimestamps.length >= config.limit) {
    const oldestTimestamp = activeTimestamps[0] || now;
    const retryAfterMs = oldestTimestamp + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetTime: oldestTimestamp + config.windowMs,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  activeTimestamps.push(now);
  ipHits.set(ip, activeTimestamps);

  return {
    allowed: true,
    remaining: config.limit - activeTimestamps.length,
    resetTime: now + config.windowMs,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimiter(): void {
  ipHits.clear();
}
