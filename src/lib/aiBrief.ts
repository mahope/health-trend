import { prisma } from "@/lib/prisma";
import { addDays, ymd } from "@/lib/date";
import { openaiJson } from "@/lib/openai";

function avg(nums: Array<number | null | undefined>): number | null {
  const xs = nums.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function cyclePhaseFromDay(cycleDay: number | null | undefined): string | null {
  if (!cycleDay || !Number.isFinite(cycleDay)) return null;
  // Very rough heuristic (assume ~28d cycle)
  if (cycleDay <= 5) return "menstruation";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulation";
  if (cycleDay <= 28) return "luteal";
  return "luteal";
}

export async function generateAiBriefForUser(userId: string, day: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  const manual = await prisma.manualDaily.findUnique({
    where: { userId_day: { userId, day } },
  });

  const snapshotsToday = await prisma.garminSnapshot.findMany({
    where: { userId, day },
    orderBy: { takenAt: "asc" },
  });

  const fromDay = ymd(addDays(new Date(day + "T12:00:00"), -14));
  const baselineRows = await prisma.garminSnapshot.findMany({
    where: {
      userId,
      day: { gte: fromDay, lt: day },
    },
    orderBy: [{ day: "asc" }, { takenAt: "desc" }],
  });

  const latestByDay = new Map<string, typeof baselineRows[number]>();
  for (const row of baselineRows) {
    if (!latestByDay.has(row.day)) latestByDay.set(row.day, row);
  }
  const baseline = Array.from(latestByDay.values());

  const baselineAvg = {
    restingHr: avg(baseline.map((x) => x.restingHr)),
    stressAvg: avg(baseline.map((x) => x.stressAvg)),
    sleepHours: avg(baseline.map((x) => x.sleepHours)),
    bodyBatteryLow: avg(baseline.map((x) => x.bodyBatteryLow)),
  };

  const todaysLatest = snapshotsToday.length ? snapshotsToday[snapshotsToday.length - 1] : null;

  const prompt = {
    day,
    profile: profile
      ? {
          sex: profile.sex,
          pregnant: profile.pregnant,
          cycleDay: profile.cycleDay,
          cyclePhase: cyclePhaseFromDay(profile.cycleDay),
        }
      : null,
    manual,
    snapshots: snapshotsToday.map((s) => ({
      takenAt: s.takenAt.toISOString(),
      steps: s.steps,
      restingHr: s.restingHr,
      stressAvg: s.stressAvg,
      sleepHours: s.sleepHours,
      bodyBatteryHigh: s.bodyBatteryHigh,
      bodyBatteryLow: s.bodyBatteryLow,
      spo2Avg: s.spo2Avg,
      respAvgWaking: s.respAvgWaking,
      respAvgSleep: s.respAvgSleep,
    })),
    baselineAvg,
    todaysLatest: todaysLatest
      ? {
          takenAt: todaysLatest.takenAt.toISOString(),
          restingHr: todaysLatest.restingHr,
          stressAvg: todaysLatest.stressAvg,
          sleepHours: todaysLatest.sleepHours,
          bodyBatteryLow: todaysLatest.bodyBatteryLow,
        }
      : null,
  };

  const ai = await openaiJson(
    `Opgave: Lav et sygdom/overbelastnings-brief for i dag (${day}).\n` +
      `Tag højde for profil-kontekst (sex, evt graviditet, cycleDay/cyclePhase) når du vurderer signaler og forslag.\n` +
      `Hvis profile.sex=female og cyclePhase findes: nævn kort om variation i fx RHR/stress/søvn kan hænge sammen med cyklus (uden at overforklare).\n\n` +
      `Returnér JSON med præcis denne struktur:\n` +
      `{\n  "risk": "OK"|"LOW"|"MED"|"HIGH",\n  "short": string,\n  "signals": [{"name": string, "value": string, "why": string}],\n  "suggestions": [{"title": string, "detail": string}]\n}\n\n` +
      `Data (JSON):\n` +
      JSON.stringify(prompt),
  );

  const risk =
    (typeof ai.risk === "string" && ["OK", "LOW", "MED", "HIGH"].includes(ai.risk)
      ? ai.risk
      : "LOW") as "OK" | "LOW" | "MED" | "HIGH";

  const short = typeof ai.short === "string" ? ai.short : "";
  const signals = Array.isArray(ai.signals) ? ai.signals : [];
  const suggestions = Array.isArray(ai.suggestions) ? ai.suggestions : [];

  const saved = await prisma.aiBrief.upsert({
    where: { userId_day: { userId, day } },
    update: {
      risk,
      short,
      signals: signals as unknown as object,
      suggestions: suggestions as unknown as object,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    create: {
      userId,
      day,
      risk,
      short,
      signals: signals as unknown as object,
      suggestions: suggestions as unknown as object,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
  });

  return { saved, risk };
}
