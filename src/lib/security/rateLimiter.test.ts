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

  it('caps tracked IP entries at MAX_TRACKED_IPS even under active burst load', () => {
    for (let i = 0; i < 2050; i++) {
      checkRateLimit(`10.0.${Math.floor(i / 256)}.${i % 256}`, { limit: 5, windowMs: 60000 });
    }
    // Re-checking earliest IP succeeds as a fresh entry because it was evicted under capacity pressure
    const firstAgain = checkRateLimit('10.0.0.0', { limit: 5, windowMs: 60000 });
    expect(firstAgain.remaining).toBe(4);
  });
});
