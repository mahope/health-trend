import { NextResponse } from "next/server";

type RateLimitOptions = {
  /** Human-readable name used in the key (e.g. "auth" / "manual-upsert") */
  name: string;
  /** Max requests within the window */
  limit: number;
  /** Rolling window duration */
  windowMs: number;
  /** Extra key material (e.g. userId) */
  keyParts?: Array<string | number | null | undefined>;
};

type Bucket = {
  count: number;
  resetAt: number;
};

function getStore(): Map<string, Bucket> {
  const g = globalThis as unknown as { __healthTrendRateLimitStore?: Map<string, Bucket> };
  if (!g.__healthTrendRateLimitStore) g.__healthTrendRateLimitStore = new Map();
  return g.__healthTrendRateLimitStore;
}

export function getClientIp(req: Request) {
  // In most deployments, the real client IP will be forwarded by the edge/proxy.
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0]?.trim() || "unknown";

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  return "unknown";
}

type LegacyRateLimitOpts = { key: string; windowMs: number; max: number };

function isRequestLike(x: unknown): x is Request {
  if (!x || typeof x !== "object") return false;
  const maybe = x as { headers?: unknown };
  if (!maybe.headers || typeof maybe.headers !== "object") return false;
  const h = maybe.headers as { get?: unknown };
  return typeof h.get === "function";
}

/**
 * Rate limit helper.
 *
 * Supports two call styles:
 * 1) New (request-aware): rateLimit(req, { name, limit, windowMs, keyParts })
 * 2) Legacy (key-only):  rateLimit({ key, windowMs, max })
 */
export function rateLimit(
  req: Request,
  opts: RateLimitOptions,
): { ok: true; headers: Record<string, string> } | { ok: false; response: NextResponse };
export function rateLimit(
  opts: LegacyRateLimitOpts,
): { ok: true } | { ok: false; retryAfterSeconds: number };
export function rateLimit(
  a: Request | LegacyRateLimitOpts,
  b?: RateLimitOptions,
):
  | { ok: true; headers: Record<string, string> }
  | { ok: false; response: NextResponse }
  | { ok: true }
  | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();

  // Legacy: rateLimit({ key, windowMs, max })
  if (!isRequestLike(a)) {
    const { key, windowMs, max } = a;
    const store = getStore();
    const existing = store.get(key);

    const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + windowMs;
    const count = existing && existing.resetAt > now ? existing.count + 1 : 1;

    store.set(key, { count, resetAt });

    if (count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
      return { ok: false as const, retryAfterSeconds };
    }

    return { ok: true as const };
  }

  // New: rateLimit(req, { name, limit, windowMs, keyParts })
  const req = a;
  const opts = b!;

  const ip = getClientIp(req);

  const keyParts = [opts.name, ip, ...(opts.keyParts ?? [])]
    .filter((p) => p !== null && p !== undefined)
    .map((p) => String(p));

  const key = keyParts.join(":");

  const store = getStore();
  const existing = store.get(key);

  const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + opts.windowMs;
  const count = existing && existing.resetAt > now ? existing.count + 1 : 1;

  store.set(key, { count, resetAt });

  const remaining = Math.max(0, opts.limit - count);

  if (count > opts.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

    const res = NextResponse.json({ error: "rate_limited", retryAfterSeconds }, { status: 429 });

    res.headers.set("Retry-After", String(retryAfterSeconds));
    res.headers.set("X-RateLimit-Limit", String(opts.limit));
    res.headers.set("X-RateLimit-Remaining", "0");
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    return { ok: false as const, response: res };
  }

  return {
    ok: true as const,
    headers: {
      "X-RateLimit-Limit": String(opts.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    },
  };
}
