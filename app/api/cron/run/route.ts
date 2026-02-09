import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStore } from "@/lib/store";
import { pickMetrics, readGarminJsonForDay, todayCph } from "@/lib/garminLocal";
import { generateAiBriefForUser } from "@/lib/aiBrief";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // Dev convenience: allow calling without secret locally.
  if (!secret && process.env.NODE_ENV !== "production") return true;
  if (!secret) return false;

  const header = req.headers.get("x-cron-secret") || "";
  if (header && header === secret) return true;

  const url = new URL(req.url);
  const q = url.searchParams.get("secret") || "";
  if (q && q === secret) return true;

  return false;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    day?: string;
    mode?: "snapshot_only" | "snapshot_and_brief";
  };

  const day = body.day || todayCph();
  const mode = body.mode || "snapshot_and_brief";

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
        takenAt: new Date().toISOString(),
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

    if (mode === "snapshot_only") {
      results.push(out);
      continue;
    }

    // 2) AI brief
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

  return NextResponse.json({ ok: true, day, mode, results });
}
