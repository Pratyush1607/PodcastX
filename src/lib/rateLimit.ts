import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

const ratelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60 s"), prefix: "podcastx" })
  : null;

/**
 * True if the request should proceed. No-ops (always allows) until UPSTASH_REDIS_REST_URL /
 * UPSTASH_REDIS_REST_TOKEN are configured, so the app behaves identically before that's set up.
 */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) return true;
  const { success } = await ratelimit.limit(identifier);
  return success;
}

/** Best-effort caller IP for rate-limiting unauthenticated routes. */
export function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
