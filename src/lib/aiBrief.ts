import { prisma } from "@/lib/prisma";
import { addDays, ymd } from "@/lib/date";
import { openaiJson } from "@/lib/openai";
import type { GarminSnapshot } from "@prisma/client";

function avg(nums: Array<number | null | undefined>): number | null {
  const xs = nums.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function detectOverstimulation(params: {
  manual: { caffeineCups?: number | null; alcoholUnits?: number | null; symptomScore?: number | null } | null;
  snapshots: Array<{ takenAt: Date; stressAvg: number | null; bodyBatteryLow: number | null }>;
}) {
  const { manual, snapshots } = params;
  if (!snapshots.length) return null;

  // Heuristic: overstimulation often looks like sustained/high stress + sharper depletion through the day.
  const sorted = [...snapshots].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const stressHigh = typeof last.stressAvg === "number" && last.stressAvg >= 35;
  const stressRising =
    typeof first.stressAvg === "number" &&
    typeof last.stressAvg === "number" &&
    Number.isFinite(first.stressAvg) &&
    Number.isFinite(last.stressAvg) &&
    last.stressAvg - first.stressAvg >= 8;

  const bbLowLow = typeof last.bodyBatteryLow === "number" && last.bodyBatteryLow <= 30;

  const caffeineHigh = typeof manual?.caffeineCups === "number" && manual.caffeineCups >= 3;
  const symptomHigh = typeof manual?.symptomScore === "number" && manual.symptomScore >= 7;

  const score =
    (stressHigh ? 1 : 0) +
    (stressRising ? 1 : 0) +
    (bbLowLow ? 1 : 0) +
    (caffeineHigh ? 1 : 0) +
    (symptomHigh ? 1 : 0);

  if (score < 2) return null;

  const reasons: string[] = [];
  if (stressHigh) reasons.push("stress høj");
  if (stressRising) reasons.push("stress stiger i løbet af dagen");
  if (bbLowLow) reasons.push("Body Battery low er lav");
  if (caffeineHigh) reasons.push("meget koffein");
  if (symptomHigh) reasons.push("højt symptomScore");

  return {
    score,
    reasons,
    note:
      "Heuristik: brug som et hint (ikke diagnose). Overstimulation kan være en kombination af mentalt/lyd/socialt pres + for lidt pause.",
  };
}

export function cyclePhaseFromDay(cycleDay: number | null | undefined): string | null {
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

  if (snapshotsToday.length === 0) {
    throw new Error("no_snapshots");
  }

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

  const overstimulationHint = detectOverstimulation({
    manual,
    snapshots: snapshotsToday.map((s: GarminSnapshot) => ({
      takenAt: s.takenAt,
      stressAvg: s.stressAvg,
      bodyBatteryLow: s.bodyBatteryLow,
    })),
  });

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
    overstimulationHint,
  };

  const ai = await openaiJson(
    `Opgave: Lav et sygdom/overbelastnings-brief for i dag (${day}).\n` +
      `Tag højde for profil-kontekst (sex, evt graviditet, cycleDay/cyclePhase) når du vurderer signaler og forslag.\n` +
      `Hvis profile.sex=female og cyclePhase findes: nævn kort om variation i fx RHR/stress/søvn kan hænge sammen med cyklus (uden at overforklare).\n` +
      `Hvis overstimulationHint er sat: vurder om dagens mønster ligner overstimulation (fx støj/social/mentalt pres + for få pauser). Hvis ja: nævn det som et signal og giv 1-2 konkrete forslag til regulering (pauser, lyd-diet, gåtur, “ingen skærm 20 min”, osv.).\n\n` +
      `Returnér JSON med præcis denne struktur:\n` +
      `{\n  "risk": "OK"|"LOW"|"MED"|"HIGH",\n  "short": string,\n  "signals": [{"name": string, "value": string, "why": string}],\n  "suggestions": [{"title": string, "detail": string}],\n  "trackNext": [{"field": "symptomScore"|"caffeineCups"|"alcoholUnits"|"trained"|"notes", "label": string, "why": string}]\n}\n\n` +
      `trackNext: vælg 0-3 felter som er mest værd at tracke i morgen for at afklare signalerne.\n\n` +
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

  // Optional: suggest what to track manually next (based on today’s signals)
  const trackNext = Array.isArray((ai as { trackNext?: unknown }).trackNext)
    ? (
        (ai as { trackNext: unknown[] }).trackNext.filter((x) => x && typeof x === "object") as Array<{
          field?: string;
          label?: string;
          why?: string;
        }>
      ).slice(0, 3)
    : [];

  if (trackNext.length) {
    const lines = trackNext
      .map((t) => {
        const label = typeof t.label === "string" ? t.label : typeof t.field === "string" ? t.field : "";
        const why = typeof t.why === "string" ? t.why : "";
        return label ? `• ${label}${why ? ` — ${why}` : ""}` : null;
      })
      .filter(Boolean);

    if (lines.length) {
      suggestions.unshift({
        title: "Track i manual (i morgen)",
        detail: lines.join("\n"),
      });
    }
  }

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
