import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();

  // Keep this endpoint dependency-free and safe to call from uptime checks.
  // It intentionally does not leak env vars.
  let dbOk = false;
  let dbMs: number | null = null;

  const t0 = Date.now();
  try {
    // Fast connectivity check.
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  } finally {
    dbMs = Date.now() - t0;
  }

  const res = NextResponse.json(
    {
      ok: true,
      service: "health-trend",
      now: now.toISOString(),
      env: process.env.NODE_ENV || "unknown",
      db: { ok: dbOk, ms: dbMs },
    },
    { status: 200 }
  );

  // Helpful for proxies + basic monitoring
  res.headers.set("Cache-Control", "no-store");
  return res;
}
