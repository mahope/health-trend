import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { addDaysYmd, ymd } from "@/lib/date";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Activity = {
  id: string;
  startTimeLocal?: string;
  activityName?: string;
  activityType?: string;
  durationMinutes?: number;
  distanceKm?: number;
  calories?: number;
};

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeActivity(a: Record<string, unknown>): Activity | null {
  const idRaw = a["activityId"] ?? a["id"] ?? a["activity_id"];
  const id = typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : null;

  const startTimeLocal =
    (typeof a["startTimeLocal"] === "string" ? (a["startTimeLocal"] as string) : null) ??
    (typeof a["startTime"] === "string" ? (a["startTime"] as string) : null) ??
    null;

  const activityName = typeof a["activityName"] === "string" ? (a["activityName"] as string) : undefined;
  const activityType =
    typeof a["activityType"] === "string"
      ? (a["activityType"] as string)
      : typeof (a["activityType"] as Record<string, unknown> | undefined)?.["typeKey"] === "string"
        ? String((a["activityType"] as Record<string, unknown>)["typeKey"])
        : undefined;

  const durationSeconds = num(a["duration"] ?? a["durationSeconds"] ?? a["durationInSeconds"]);
  const durationMinutes = durationSeconds != null ? durationSeconds / 60 : num(a["durationMinutes"]);

  const distanceMeters = num(a["distance"] ?? a["distanceMeters"]);
  const distanceKm = distanceMeters != null ? distanceMeters / 1000 : num(a["distanceKm"]);

  const calories = num(a["calories"] ?? a["activeKilocalories"]);

  if (!id && !startTimeLocal) return null;

  return {
    id: id ?? `start:${startTimeLocal}`,
    startTimeLocal: startTimeLocal ?? undefined,
    activityName,
    activityType,
    durationMinutes: durationMinutes ?? undefined,
    distanceKm: distanceKm ?? undefined,
    calories: calories ?? undefined,
  };
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = clamp(Number(url.searchParams.get("limit") || 10), 1, 50);
  const days = clamp(Number(url.searchParams.get("days") || 14), 1, 90);

  const today = ymd(new Date());
  const fromDay = addDaysYmd(today, -(days - 1));

  // Pull a bunch of snapshots and extract activities from rawJson.
  const snaps = await prisma.garminSnapshot.findMany({
    where: { userId: user.id, day: { gte: fromDay, lte: today } },
    orderBy: { takenAt: "desc" },
    take: 120,
    select: { rawJson: true },
  });

  const seen = new Set<string>();
  const out: Activity[] = [];

  for (const s of snaps) {
    const p = (s.rawJson ?? null) as Record<string, unknown> | null;
    if (!p) continue;

    const rawActs = Array.isArray(p["activities"]) ? (p["activities"] as unknown[]) : [];
    for (const x of rawActs) {
      if (!x || typeof x !== "object") continue;
      const act = normalizeActivity(x as Record<string, unknown>);
      if (!act) continue;
      if (seen.has(act.id)) continue;
      seen.add(act.id);
      out.push(act);
      if (out.length >= limit) break;
    }

    if (out.length >= limit) break;
  }

  return NextResponse.json({ ok: true, items: out, fromDay, today });
}
