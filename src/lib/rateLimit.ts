type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function rateLimit({
  key,
  windowMs,
  max,
}: {
  key: string;
  windowMs: number;
  max: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const cur = buckets.get(key);

  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (cur.count >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  cur.count += 1;
  buckets.set(key, cur);
  return { ok: true };
}

export function getClientIp(req: Request): string {
  // Best-effort: behind proxies/CDN, x-forwarded-for is common.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
