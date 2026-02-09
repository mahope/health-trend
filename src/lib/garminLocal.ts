import fs from "node:fs/promises";
import path from "node:path";
import { GARMIN_DATA_DIR } from "@/lib/paths";

export function todayCph(): string {
  const d = new Date();
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function pickMetrics(payload: unknown) {
  const p = payload as Record<string, unknown>;
  const steps = num(p["steps"] ?? p["dailySteps"]);

  const wellness = (p["wellness"] as Record<string, unknown> | undefined) ?? undefined;
  const restingHr = num(
    p["restingHeartRate"] ?? p["restingHr"] ?? wellness?.["restingHeartRate"],
  );

  const stress = (p["stress"] as Record<string, unknown> | undefined) ?? undefined;
  const stressAvg = num(p["stressAvg"] ?? stress?.["avg"]);

  const sleep = (p["sleep"] as Record<string, unknown> | undefined) ?? undefined;
  const sleepTimeSeconds = sleep?.["sleepTimeSeconds"];
  const sleepMinutes = num(
    sleepTimeSeconds != null ? Number(sleepTimeSeconds) / 60 : p["sleepMinutes"],
  );
  const sleepHours = sleepMinutes != null ? sleepMinutes / 60 : null;

  const bodyBattery = (p["bodyBattery"] as Record<string, unknown> | undefined) ?? undefined;
  const bodyBatteryHigh = num(bodyBattery?.["high"] ?? p["bodyBatteryHigh"]);
  const bodyBatteryLow = num(bodyBattery?.["low"] ?? p["bodyBatteryLow"]);

  const spo2 = (p["spo2"] as Record<string, unknown> | undefined) ?? undefined;
  const spo2Avg = num(p["spo2Avg"] ?? spo2?.["avg"]);
  const spo2Low = num(p["spo2Low"] ?? spo2?.["low"]);

  const respiration =
    (p["respiration"] as Record<string, unknown> | undefined) ?? undefined;
  const respAvgWaking = num(respiration?.["avgWaking"]);
  const respAvgSleep = num(respiration?.["avgSleep"]);

  const rawActs =
    (Array.isArray(p["activities"]) ? (p["activities"] as unknown[]) : null) ??
    (Array.isArray(p["activityList"]) ? (p["activityList"] as unknown[]) : null) ??
    [];
  const acts = rawActs as Array<Record<string, unknown>>;

  const activityCount = acts.length || null;
  const activityMinutes =
    acts.length > 0
      ? acts
          .map((a) => num(a?.durationMinutes ?? a?.duration ?? a?.durationMin))
          .filter((x): x is number => x != null)
          .reduce((a, b) => a + b, 0)
      : null;

  const activityDistanceKm =
    acts.length > 0
      ? acts
          .map((a) => num(a?.distanceKm ?? a?.distance_km ?? a?.distance))
          .filter((x): x is number => x != null)
          .reduce((a, b) => a + b, 0)
      : null;

  const activityCalories =
    acts.length > 0
      ? acts
          .map((a) => num(a?.calories ?? a?.activeCalories))
          .filter((x): x is number => x != null)
          .reduce((a, b) => a + b, 0)
      : null;

  return {
    steps,
    restingHr,
    stressAvg,
    sleepMinutes,
    sleepHours,
    bodyBatteryHigh,
    bodyBatteryLow,
    spo2Avg,
    spo2Low,
    respAvgWaking,
    respAvgSleep,
    activityCount,
    activityMinutes,
    activityDistanceKm,
    activityCalories,
  };
}

export async function readGarminJsonForDay(day: string): Promise<{ file: string; payload: unknown }> {
  const file = path.join(GARMIN_DATA_DIR, `garmin-${day}.json`);
  const payload = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  return { file, payload };
}
