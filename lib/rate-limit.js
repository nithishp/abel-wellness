/**
 * In-memory rate limiter for API endpoints.
 * Uses a Map with IP/key + timestamps.
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rate-limit";
 *   const limiter = rateLimit({ interval: 15 * 60 * 1000, maxRequests: 5 });
 *   const { success } = limiter.check(ip);
 */

const rateLimitMap = new Map();

// Clean old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(interval) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, timestamps] of rateLimitMap.entries()) {
    const filtered = timestamps.filter((t) => now - t < interval);
    if (filtered.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, filtered);
    }
  }
}

/**
 * Create a rate limiter instance.
 * @param {Object} options
 * @param {number} options.interval - Time window in milliseconds
 * @param {number} options.maxRequests - Max requests per interval
 * @param {string} [options.prefix] - Key prefix for namespacing
 * @returns {{ check: (key: string) => { success: boolean, remaining: number, resetIn: number } }}
 */
export function rateLimit({
  interval = 60 * 1000,
  maxRequests = 10,
  prefix = "",
} = {}) {
  return {
    check(key) {
      cleanupExpired(interval);

      const rateLimitKey = `${prefix}:${key}`;
      const now = Date.now();
      const timestamps = rateLimitMap.get(rateLimitKey) || [];

      // Filter to only include timestamps within the interval
      const recentTimestamps = timestamps.filter((t) => now - t < interval);

      if (recentTimestamps.length >= maxRequests) {
        const oldestInWindow = recentTimestamps[0];
        const resetIn = Math.ceil((oldestInWindow + interval - now) / 1000);
        return {
          success: false,
          remaining: 0,
          resetIn,
        };
      }

      recentTimestamps.push(now);
      rateLimitMap.set(rateLimitKey, recentTimestamps);

      return {
        success: true,
        remaining: maxRequests - recentTimestamps.length,
        resetIn: Math.ceil(interval / 1000),
      };
    },

    /**
     * Reset rate limit for a specific key
     */
    reset(key) {
      rateLimitMap.delete(`${prefix}:${key}`);
    },
  };
}

// Pre-configured limiters for common use cases
export const loginLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  prefix: "login",
});

export const otpSendLimiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3,
  prefix: "otp-send",
});

export const otpVerifyLimiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5,
  prefix: "otp-verify",
});
