import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { addDaysYmd, ymd } from "@/lib/date";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const days = clamp(parseInt(url.searchParams.get("days") ?? "", 10) || 14, 7, 90);

  const today = ymd(new Date());
  const fromDay = addDaysYmd(today, -(days - 1));

  const [snapshots, briefs] = await Promise.all([
    prisma.garminSnapshot.findMany({
      where: { userId: user.id, day: { gte: fromDay, lte: today } },
      orderBy: [{ day: "asc" }, { takenAt: "desc" }],
      select: { day: true, steps: true, restingHr: true, stressAvg: true, sleepHours: true, bodyBatteryLow: true },
    }),
    prisma.aiBrief.findMany({
      where: { userId: user.id, day: { gte: fromDay, lte: today } },
      orderBy: { day: "asc" },
      select: { day: true, risk: true },
    }),
  ]);

  const latestSnapByDay = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (!latestSnapByDay.has(s.day)) latestSnapByDay.set(s.day, s);
  }

  const briefByDay = new Map<string, (typeof briefs)[number]>();
  for (const b of briefs) briefByDay.set(b.day, b);

  const out: Array<{
    day: string;
    steps: number | null;
    restingHr: number | null;
    stressAvg: number | null;
    sleepHours: number | null;
    bodyBatteryLow: number | null;
    risk: "OK" | "LOW" | "MED" | "HIGH" | null;
  }> = [];

  for (let i = 0; i < days; i++) {
    const day = addDaysYmd(fromDay, i);
    const s = latestSnapByDay.get(day);
    const b = briefByDay.get(day);

    out.push({
      day,
      steps: s?.steps ?? null,
      restingHr: s?.restingHr ?? null,
      stressAvg: s?.stressAvg ?? null,
      sleepHours: s?.sleepHours ?? null,
      bodyBatteryLow: s?.bodyBatteryLow ?? null,
      risk:
        b && ["OK", "LOW", "MED", "HIGH"].includes(b.risk)
          ? (b.risk as "OK" | "LOW" | "MED" | "HIGH")
          : null,
    });
  }

  return NextResponse.json({ ok: true, fromDay, today, days, items: out });
}
