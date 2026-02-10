import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStore } from "@/lib/store";
import { pickMetrics, readGarminJsonForDay, todayCph } from "@/lib/garminLocal";
import { generateAiBriefForUser } from "@/lib/aiBrief";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { detectEarlyWarning } from "@/lib/insights";

function isAuthorized(req: Request): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, reason: "missing_cron_secret" };

  // Preferred: header
  const header = req.headers.get("x-cron-secret") || "";
  if (header && header === secret) return { ok: true };

  // Fallback: query param
  const url = new URL(req.url);
  const q = url.searchParams.get("secret") || "";
  if (q && q === secret) return { ok: true };

  return { ok: false, reason: "bad_secret" };
}

export async function POST(req: Request) {
  const runId = crypto.randomUUID();
  const startedAt = Date.now();

  // Basic abuse guard. Note: in-memory per runtime, but good enough as a first line of defense.
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `cron:${ip}`, windowMs: 60_000, max: 10 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

  const auth = isAuthorized(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized", reason: auth.reason }, { status: 401 });
  }

  const url = new URL(req.url);

  const body = (await req.json().catch(() => ({}))) as {
    day?: string;
    mode?: "snapshot_only" | "snapshot_and_brief";
    idempotencyKey?: string;
  };

  const idempotencyKey =
    req.headers.get("x-idempotency-key") || body.idempotencyKey || url.searchParams.get("idempotencyKey") || undefined;

  const day = body.day || url.searchParams.get("day") || todayCph();
  const mode =
    body.mode ||
    (url.searchParams.get("mode") as "snapshot_only" | "snapshot_and_brief" | null) ||
    "snapshot_and_brief";

  // Make cron snapshot writes idempotent (by takenAt). Retry-safe, and prevents duplicate daily entries.
  const cronTakenAtIso = `${day}T00:00:00.000Z`;

  console.info(
    JSON.stringify({
      at: new Date().toISOString(),
      msg: "cron_run_started",
      runId,
      ip,
      day,
      mode,
      idempotencyKey,
    }),
  );

  const store = await getStore();

  // We run for all users for now (2 hardcoded users).
  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  const results: Array<{
    userId: string;
    email: string;
    snapshot?: { ok: boolean; error?: string };
    brief?: { ok: boolean; risk?: string; error?: string };
  }> = [];

  for (const u of users) {
    const out: (typeof results)[number] = { userId: u.id, email: u.email };

    // 1) Snapshot from local garmin json
    try {
      const { payload } = await readGarminJsonForDay(day);
      const metrics = pickMetrics(payload);
      await store.createSnapshot(u.id, {
        day,
        takenAt: cronTakenAtIso,
        ...metrics,
        rawJson: payload,
      });
      out.snapshot = { ok: true };
    } catch (e: unknown) {
      out.snapshot = {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "Kunne ikke læse garmin-JSON (mangler fil eller parse-fejl)",
      };
      results.push(out);
      continue;
    }

    // 2) Deterministic early-warning (baseline anomaly)
    try {
      const ew = await detectEarlyWarning(u.id, day);
      if (ew.ok) {
        await prisma.alert.upsert({
          where: {
            userId_day_severity_title: {
              userId: u.id,
              day,
              severity: ew.severity,
              title: ew.title,
            },
          },
          update: { body: ew.body },
          create: {
            userId: u.id,
            day,
            severity: ew.severity,
            title: ew.title,
            body: ew.body,
          },
        });
      }
    } catch {
      // ignore
    }

    if (mode === "snapshot_only") {
      results.push(out);
      continue;
    }

    // 3) AI brief
    try {
      const { saved, risk } = await generateAiBriefForUser(u.id, day);
      out.brief = { ok: true, risk };

      if (risk === "MED" || risk === "HIGH") {
        await prisma.alert.upsert({
          where: {
            userId_day_severity_title: {
              userId: u.id,
              day,
              severity: risk,
              title: "AI brief: risiko",
            },
          },
          update: {
            body: saved.short,
          },
          create: {
            userId: u.id,
            day,
            severity: risk,
            title: "AI brief: risiko",
            body: saved.short,
          },
        });
      }
    } catch (e: unknown) {
      out.brief = { ok: false, error: e instanceof Error ? e.message : "AI brief fejlede" };
    }

    results.push(out);
  }

  const durationMs = Date.now() - startedAt;

  console.info(
    JSON.stringify({
      at: new Date().toISOString(),
      msg: "cron_run_finished",
      runId,
      day,
      mode,
      idempotencyKey,
      durationMs,
      ok: true,
      users: results.map((r) => ({
        userId: r.userId,
        email: r.email,
        snapshotOk: r.snapshot?.ok ?? false,
        briefOk: r.brief?.ok ?? false,
        risk: r.brief?.risk,
      })),
    }),
  );

  return NextResponse.json({ ok: true, runId, idempotencyKey, day, mode, cronTakenAt: cronTakenAtIso, results, durationMs });
}
