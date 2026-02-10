import { prisma } from "@/lib/prisma";
import { addDaysYmd, ymd } from "@/lib/date";

export type Baseline = {
  restingHrAvg?: number;
  stressAvg?: number;
  bodyBatteryLowAvg?: number;
  sleepHoursAvg?: number;
  stepsAvg?: number;
};

function avg(nums: Array<number | null | undefined>) {
  const xs = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (xs.length === 0) return undefined;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export async function computeBaseline(userId: string, toDay: string, days = 14): Promise<Baseline> {
  const fromDay = addDaysYmd(toDay, -(days - 1));
  const snaps = await prisma.garminSnapshot.findMany({
    where: { userId, day: { gte: fromDay, lte: toDay } },
    orderBy: { day: "asc" },
    select: {
      restingHr: true,
      stressAvg: true,
      bodyBatteryLow: true,
      sleepHours: true,
      steps: true,
    },
  });

  return {
    restingHrAvg: avg(snaps.map((s) => s.restingHr)),
    stressAvg: avg(snaps.map((s) => s.stressAvg)),
    bodyBatteryLowAvg: avg(snaps.map((s) => s.bodyBatteryLow)),
    sleepHoursAvg: avg(snaps.map((s) => s.sleepHours)),
    stepsAvg: avg(snaps.map((s) => s.steps)),
  };
}

export async function computeSleepDebt(
  userId: string,
  toDay: string,
  days = 7,
): Promise<{ debtHours: number; avgSleepHours?: number; goalHours?: number }>
{
  const rows = (await prisma.$queryRaw`
    SELECT "sleepGoalHours" FROM "UserProfile" WHERE "userId" = ${userId} LIMIT 1
  `) as Array<{ sleepGoalHours: number }>;
  const goal = rows?.[0]?.sleepGoalHours ?? 7.5;

  const fromDay = addDaysYmd(toDay, -(days - 1));
  const snaps = await prisma.garminSnapshot.findMany({
    where: { userId, day: { gte: fromDay, lte: toDay } },
    orderBy: { day: "asc" },
    select: { sleepHours: true },
  });

  const sleeps = snaps.map((s) => s.sleepHours).filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const avgSleep = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : undefined;

  const expected = goal * days;
  const actual = sleeps.reduce((a, b) => a + b, 0);
  const debtHours = Math.max(0, expected - actual);

  return { debtHours: Math.round(debtHours * 10) / 10, avgSleepHours: avgSleep, goalHours: goal };
}

export async function computeStreaks(userId: string, toDay: string): Promise<{ stepsStreak: number; sleepStreak: number; stepsGoal: number; sleepGoalHours: number }>
{
  // Ensure profile exists
  await prisma.userProfile.upsert({ where: { userId }, update: {}, create: { userId } });

  const goalRows = (await prisma.$queryRaw`
    SELECT "stepsGoal", "sleepGoalHours" FROM "UserProfile" WHERE "userId" = ${userId} LIMIT 1
  `) as Array<{ stepsGoal: number; sleepGoalHours: number }>;

  const profile = goalRows?.[0] ?? { stepsGoal: 8000, sleepGoalHours: 7.5 };
  const daysBack = 60;
  const fromDay = addDaysYmd(toDay, -(daysBack - 1));
  const snaps = await prisma.garminSnapshot.findMany({
    where: { userId, day: { gte: fromDay, lte: toDay } },
    orderBy: { day: "desc" },
    select: { day: true, steps: true, sleepHours: true },
  });

  let stepsStreak = 0;
  let sleepStreak = 0;

  // Count consecutive days from toDay backwards where goal is met.
  for (const s of snaps) {
    if ((s.steps ?? 0) >= profile.stepsGoal) stepsStreak += 1;
    else break;
  }

  for (const s of snaps) {
    if ((s.sleepHours ?? 0) >= profile.sleepGoalHours) sleepStreak += 1;
    else break;
  }

  return { stepsStreak, sleepStreak, stepsGoal: profile.stepsGoal, sleepGoalHours: profile.sleepGoalHours };
}

export type AnomalyResult =
  | { ok: true; severity: "MED" | "HIGH"; title: string; body: string }
  | { ok: false; reason: string };

export async function detectEarlyWarning(userId: string, day: string): Promise<AnomalyResult> {
  const todaySnap = await prisma.garminSnapshot.findFirst({
    where: { userId, day },
    orderBy: { takenAt: "desc" },
    select: { restingHr: true, stressAvg: true, bodyBatteryLow: true, sleepHours: true },
  });

  if (!todaySnap) return { ok: false, reason: "no_snapshot" };

  // Baseline: previous 14 days excluding today.
  const prevDay = addDaysYmd(day, -1);
  const base = await computeBaseline(userId, prevDay, 14);
  if (base.restingHrAvg === undefined || base.stressAvg === undefined || base.bodyBatteryLowAvg === undefined) {
    return { ok: false, reason: "insufficient_baseline" };
  }

  const rhr = todaySnap.restingHr ?? null;
  const stress = todaySnap.stressAvg ?? null;
  const bbLow = todaySnap.bodyBatteryLow ?? null;

  if (rhr == null || stress == null || bbLow == null) {
    return { ok: false, reason: "missing_metrics" };
  }

  const rhrDelta = rhr - base.restingHrAvg;
  const stressDelta = stress - base.stressAvg;
  const bbDelta = bbLow - base.bodyBatteryLowAvg;

  // Simple heuristic thresholds (tweak later):
  // MED: elevated RHR + stress and lower body battery
  // HIGH: bigger deltas.
  const med = rhrDelta >= 5 && stressDelta >= 10 && bbDelta <= -10;
  const high = rhrDelta >= 8 && stressDelta >= 15 && bbDelta <= -15;

  if (!med && !high) return { ok: false, reason: "no_anomaly" };

  const severity: "MED" | "HIGH" = high ? "HIGH" : "MED";

  const title = "Tidlig advarsel: mulig belastning";
  const body =
    `Dagens tal afviger fra din 14-dages baseline: ` +
    `RHR +${Math.round(rhrDelta)} bpm, stress +${Math.round(stressDelta)}, body battery low ${Math.round(bbDelta)}. ` +
    `Overvej at tage det roligt i dag (gåtur, tidligt i seng, ekstra væske, mindre koffein).`;

  return { ok: true, severity, title, body };
}

export function todayYmd() {
  return ymd(new Date());
}
