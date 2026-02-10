import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { addDaysYmd, ymd } from "@/lib/date";

function avg(nums: Array<number | null | undefined>): number | null {
  const xs = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function pickSleepHours(s: { sleepHours?: number | null; sleepMinutes?: number | null }): number | null {
  if (typeof s.sleepHours === "number") return s.sleepHours;
  if (typeof s.sleepMinutes === "number") return s.sleepMinutes / 60;
  return null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = ymd(new Date());
  const start = addDaysYmd(today, -30);

  const [snapshots, briefs] = await Promise.all([
    prisma.garminSnapshot.findMany({
      where: { userId: user.id, day: { gte: start, lte: today } },
      orderBy: { takenAt: "desc" },
      select: {
        id: true,
        day: true,
        takenAt: true,
        steps: true,
        stressAvg: true,
        sleepHours: true,
        sleepMinutes: true,
        bodyBatteryLow: true,
        bodyBatteryHigh: true,
      },
    }),
    prisma.aiBrief.findMany({
      where: { userId: user.id, day: { gte: start, lte: today } },
      select: { day: true, risk: true },
    }),
  ]);

  const riskByDay = new Map(briefs.map((b) => [b.day, b.risk] as const));

  // pick latest snapshot per day
  const latestByDay = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (!latestByDay.has(s.day)) latestByDay.set(s.day, s);
  }

  const rows = Array.from(latestByDay.values()).map((s) => ({
    day: s.day,
    risk: riskByDay.get(s.day) ?? null,
    steps: s.steps,
    stressAvg: s.stressAvg,
    sleepHours: pickSleepHours(s),
    bodyBatteryLow: s.bodyBatteryLow,
    bodyBatteryHigh: s.bodyBatteryHigh,
  }));

  const withRisk = rows.filter((r) => typeof r.risk === "string");
  const low = withRisk.filter((r) => r.risk === "LOW");

  const allAvg = {
    steps: avg(withRisk.map((r) => r.steps)),
    sleepHours: avg(withRisk.map((r) => r.sleepHours)),
    stressAvg: avg(withRisk.map((r) => r.stressAvg)),
    bodyBatteryLow: avg(withRisk.map((r) => r.bodyBatteryLow)),
  };

  const lowAvg = {
    steps: avg(low.map((r) => r.steps)),
    sleepHours: avg(low.map((r) => r.sleepHours)),
    stressAvg: avg(low.map((r) => r.stressAvg)),
    bodyBatteryLow: avg(low.map((r) => r.bodyBatteryLow)),
  };

  const diff = {
    steps: lowAvg.steps !== null && allAvg.steps !== null ? lowAvg.steps - allAvg.steps : null,
    sleepHours: lowAvg.sleepHours !== null && allAvg.sleepHours !== null ? lowAvg.sleepHours - allAvg.sleepHours : null,
    stressAvg: lowAvg.stressAvg !== null && allAvg.stressAvg !== null ? lowAvg.stressAvg - allAvg.stressAvg : null,
    bodyBatteryLow:
      lowAvg.bodyBatteryLow !== null && allAvg.bodyBatteryLow !== null ? lowAvg.bodyBatteryLow - allAvg.bodyBatteryLow : null,
  };

  return NextResponse.json({
    ok: true,
    window: { start, end: today, days: 31 },
    counts: { daysWithRisk: withRisk.length, lowDays: low.length },
    avg: { all: allAvg, low: lowAvg, diff },
    sample: {
      lowDays: low
        .slice(0, 5)
        .map((r) => ({ day: r.day, steps: r.steps ?? null, sleepHours: r.sleepHours ?? null, stressAvg: r.stressAvg ?? null })),
    },
  });
}
