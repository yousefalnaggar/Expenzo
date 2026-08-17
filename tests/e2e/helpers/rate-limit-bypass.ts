// The rate limiter (src/lib/rate-limit.ts) keys on x-forwarded-for, which is
// absent for plain local requests — every e2e test would otherwise share one
// "unknown" bucket and trip "Too many attempts" partway through the suite.
// Real deployments always have a distinct client IP per user; simulating one
// per spec file here keeps each file's own bucket isolated, without touching
// (or bypassing) the actual rate-limiting logic under test elsewhere.
export function fakeClientIp(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `10.${hash & 0xff}.${(hash >> 8) & 0xff}.${(hash >> 16) & 0xff}`;
}
