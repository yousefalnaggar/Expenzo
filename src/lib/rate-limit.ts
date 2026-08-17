import "server-only";

// In-memory fixed-window limiter. Good enough to blunt casual credential
// stuffing / spam registration on this single-instance-scale project — it
// does NOT survive across serverless cold starts or multiple instances, so a
// determined attacker spread across instances isn't actually throttled. A
// durable store (Redis/Upstash) would be needed for that; out of scope here.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now >= entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count += 1;
  return true;
}
