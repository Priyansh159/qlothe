import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Fail OPEN when Redis isn't configured, so local dev works without Upstash.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function makeLimiter(prefix: string, limit: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `qlothe:ratelimit:${prefix}`,
  });
}

export const registerLimiter = makeLimiter("register", 5, "10 m");
export const loginLimiter = makeLimiter("login", 10, "10 m");
export const checkoutLimiter = makeLimiter("checkout", 20, "1 m");

/** Returns success:true immediately if no limiter is configured (Redis env vars absent). */
export async function rateLimit(limiter: Ratelimit | null, identifier: string) {
  if (!limiter) return { success: true as const };
  return limiter.limit(identifier);
}

/** Best-effort client IP for unauthenticated routes (register). Not spoof-proof; good enough as a rate-limit key. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
