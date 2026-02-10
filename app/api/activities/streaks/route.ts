import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { addDaysYmd, ymd } from "@/lib/date";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function bucketType(raw?: string): "walk" | "run" | "strength" | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  // Garmin typeKeys vary a bit; keep it simple and robust.
  if (s.includes("walk")) return "walk";
  if (s.includes("run")) return "run";
  if (s.includes("strength") || s.includes("weight") || s.includes("gym")) return "strength";
  return null;
}

function streaksFromFlags(daysAsc: string[], flags: Set<string>): { current: number; longest: number; lastDayHad: string | null } {
  let current = 0;
  let longest = 0;
  let run = 0;
  let lastDayHad: string | null = null;

  for (const day of daysAsc) {
    const has = flags.has(day);
    if (has) {
      run += 1;
      lastDayHad = day;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  // Current streak: walk backwards from today.
  for (let i = daysAsc.length - 1; i >= 0; i--) {
    if (flags.has(daysAsc[i]!)) current += 1;
    else break;
  }

  return { current, longest, lastDayHad };
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const days = clamp(parseInt(url.searchParams.get("days") ?? "", 10) || 60, 7, 180);

  const today = ymd(new Date());
  const fromDay = addDaysYmd(today, -(days - 1));

  const snaps = await prisma.garminSnapshot.findMany({
    where: { userId: user.id, day: { gte: fromDay, lte: today } },
    orderBy: { takenAt: "desc" },
    take: 500,
    select: { rawJson: true },
  });

  const perTypeDays: Record<"walk" | "run" | "strength", Set<string>> = {
    walk: new Set<string>(),
    run: new Set<string>(),
    strength: new Set<string>(),
  };

  for (const s of snaps) {
    const p = (s.rawJson ?? null) as Record<string, unknown> | null;
    if (!p) continue;

    const rawActs = Array.isArray(p["activities"]) ? (p["activities"] as unknown[]) : [];
    for (const x of rawActs) {
      if (!x || typeof x !== "object") continue;
      const a = x as Record<string, unknown>;

      const startTimeLocal =
        (typeof a["startTimeLocal"] === "string" ? (a["startTimeLocal"] as string) : null) ??
        (typeof a["startTime"] === "string" ? (a["startTime"] as string) : null);

      if (!startTimeLocal) continue;
      const d = new Date(startTimeLocal);
      if (Number.isNaN(d.getTime())) continue;
      const day = ymd(d);
      if (day < fromDay || day > today) continue;

      const typeKey =
        typeof a["activityType"] === "string"
          ? (a["activityType"] as string)
          : typeof (a["activityType"] as Record<string, unknown> | undefined)?.["typeKey"] === "string"
            ? String((a["activityType"] as Record<string, unknown>)["typeKey"])
            : undefined;

      const b = bucketType(typeKey);
      if (!b) continue;
      perTypeDays[b].add(day);
    }
  }

  const daysAsc: string[] = Array.from({ length: days }, (_, i) => addDaysYmd(fromDay, i));

  const walk = streaksFromFlags(daysAsc, perTypeDays.walk);
  const run = streaksFromFlags(daysAsc, perTypeDays.run);
  const strength = streaksFromFlags(daysAsc, perTypeDays.strength);

  return NextResponse.json({
    ok: true,
    fromDay,
    today,
    days,
    streaks: { walk, run, strength },
  });
}
