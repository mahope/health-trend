import { prisma } from "@/lib/prisma";
import { addDaysYmd, ymd } from "@/lib/date";
import { computeSleepDebt, detectEarlyWarning } from "@/lib/insights";

export type DeterministicPlan = {
  day: string;
  intensity: "let" | "moderat" | "hård";
  reason: string;
  suggestions: string[];
  avoid: string[];
  bedtimeHint: string;
};

export async function computeDeterministicPlan(userId: string, day: string): Promise<DeterministicPlan> {
  const snap = await prisma.garminSnapshot.findFirst({
    where: { userId, day },
    orderBy: { takenAt: "desc" },
    select: { sleepHours: true, restingHr: true, stressAvg: true, bodyBatteryLow: true },
  });

  const sleepDebt = await computeSleepDebt(userId, day, 7);
  const ew = await detectEarlyWarning(userId, day).catch(() => ({ ok: false as const, reason: "err" }));

  const prevDay = addDaysYmd(day, -1);
  const brief = await prisma.aiBrief.findUnique({ where: { userId_day: { userId, day: prevDay } }, select: { risk: true } });

  const debt = sleepDebt.debtHours;
  const risk = brief?.risk ?? null;

  let intensity: DeterministicPlan["intensity"] = "moderat";
  const reasons: string[] = [];

  if (ew.ok) {
    intensity = "let";
    reasons.push("din baseline-advarsel (RHR/stress/body battery) peger på belastning");
  }

  if (debt >= 3) {
    intensity = "let";
    reasons.push(`du har ~${debt}t søvngæld (7 dage)`);
  }

  if (!ew.ok && debt < 1.5 && risk !== "HIGH" && risk !== "MED") {
    intensity = "moderat";
  }

  if (!ew.ok && debt < 0.5 && (snap?.stressAvg ?? 0) < 25 && (snap?.bodyBatteryLow ?? 100) > 35) {
    intensity = "hård";
    reasons.push("lav stress og ok recovery");
  }

  const reason = reasons.length ? reasons.join(", ") : "en balanceret dag baseret på dine seneste data";

  const bedtimeHint = debt >= 2 ? "Gå tidligere i seng i aften (sig efter 30-60 min ekstra)." : "Hold en stabil sengetid i aften.";

  const suggestions: string[] = [];
  const avoid: string[] = [];

  if (intensity === "let") {
    suggestions.push("20-40 min rolig gåtur (zone 1-2)");
    suggestions.push("Tidlig aften + lav stimulation efter kl. 20");
    suggestions.push("Vand + protein, og hold koffein tidligere på dagen");
    avoid.push("Hård træning / intervaller");
    avoid.push("Sen koffein (efter kl. 14)");
  }

  if (intensity === "moderat") {
    suggestions.push("30-60 min moderat aktivitet (gåtur/cykel/let styrke)");
    suggestions.push("2× 5 min ‘pause-anker’ i løbet af dagen");
    avoid.push("At ‘spare søvn’ for at få mere tid om aftenen");
  }

  if (intensity === "hård") {
    suggestions.push("Hvis du vil: hård træning OK (men stop hvis stress stikker af)");
    suggestions.push("Planlæg restitution: mad + søvn = performance");
    avoid.push("At presse igennem hvis kroppen føles off");
  }

  // Small contextual hint if metrics exist
  if ((snap?.restingHr ?? 0) >= 60) suggestions.push("Kort check-in: hvis du føler dig ‘off’, så vælg let dag.");

  return { day, intensity, reason, suggestions, avoid, bedtimeHint };
}

export async function computeTomorrowDeterministicPlan(
  userId: string,
  today: string,
): Promise<DeterministicPlan> {
  // Start from today's signals and suggest a realistic plan for tomorrow.
  // Heuristic: If you should go "hård" today, don't auto-suggest "hård" tomorrow.
  const todayPlan = await computeDeterministicPlan(userId, today);

  const tomorrow = addDaysYmd(today, 1);

  let intensity: DeterministicPlan["intensity"] = todayPlan.intensity;
  const reasons: string[] = [];

  if (todayPlan.intensity === "hård") {
    intensity = "moderat";
    reasons.push("hård dag i dag → planlæg en mere balanceret dag i morgen");
  }

  if (todayPlan.intensity === "let") {
    intensity = "moderat";
    reasons.push("let dag i dag → du kan sigte efter en moderat dag i morgen");
  }

  // If today already indicates strain, keep tomorrow light.
  if (todayPlan.intensity === "let" && todayPlan.reason.includes("belastning")) {
    intensity = "let";
    reasons.push("tegn på belastning i dag → hold i morgen let");
  }

  const reason = reasons.length ? reasons.join(", ") : "i morgen bygger videre på i dag (uden at overgøre det)";

  const suggestions: string[] = [];
  const avoid: string[] = [];

  if (intensity === "let") {
    suggestions.push("20-40 min rolig gåtur (zone 1-2)");
    suggestions.push("Lav stimulation efter aftensmad + tidlig sengetid");
    suggestions.push("Vælg 1 vigtig ting + 1 lille ting — og stop der");
    avoid.push("At ‘kompensere’ med hård træning");
    avoid.push("Sen koffein (efter kl. 14)");
  }

  if (intensity === "moderat") {
    suggestions.push("30-60 min moderat aktivitet (gåtur/let styrke/cykel)");
    suggestions.push("Planlæg et 30 min vindue, så det faktisk sker");
    suggestions.push("Tænk restitution: vand + protein + ro om aftenen");
    avoid.push("At lave planen for ambitiøs (så den ryger)");
  }

  if (intensity === "hård") {
    suggestions.push("Hård træning kan være OK — men planlæg søvn og mad omkring det");
    suggestions.push("Hold øje med stress: stop hvis det stikker af");
    avoid.push("At presse igennem hvis kroppen føles off");
  }

  const bedtimeHint = intensity === "let" ? "Prioritér søvn: sigt efter en tidlig sengetid." : "Hold en stabil sengetid.";

  return { day: tomorrow, intensity, reason, suggestions, avoid, bedtimeHint };
}

export type AiDayPlan = {
  intensity?: "let" | "moderat" | "hård";
  headline?: string;
  focus?: string;
  doToday?: string[];
  avoid?: string[];
  caffeine?: string;
  bedtime?: string;
};

export function defaultDay(): string {
  return ymd(new Date());
}
