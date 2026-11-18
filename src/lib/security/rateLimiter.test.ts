import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimiter } from './rateLimiter';

describe('In-Memory Sliding Window Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows requests within the configured quota', () => {
    const ip = '192.168.1.1';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(ip, { limit: 5, windowMs: 10000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - (i + 1));
    }
  });

  it('blocks requests exceeding the quota with 429 status recommendation', () => {
    const ip = '192.168.1.2';
    // Consume 3 requests
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ip, { limit: 3, windowMs: 10000 });
    }

    // 4th request must be blocked
    const blocked = checkRateLimit(ip, { limit: 3, windowMs: 10000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
