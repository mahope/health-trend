import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { addDaysYmd, ymd } from "@/lib/date";
import { openaiJson } from "@/lib/openai";

function avg(nums: Array<number | null | undefined>) {
  const xs = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const endDay = url.searchParams.get("endDay") || ymd(new Date());
  const startDay = addDaysYmd(endDay, -6);

  const snaps = await prisma.garminSnapshot.findMany({
    where: { userId: user.id, day: { gte: startDay, lte: endDay } },
    orderBy: { day: "asc" },
    select: {
      day: true,
      steps: true,
      restingHr: true,
      stressAvg: true,
      sleepHours: true,
      bodyBatteryLow: true,
      activityMinutes: true,
      activityDistanceKm: true,
      activityCount: true,
    },
  });

  const manual = await prisma.manualDaily.findMany({
    where: { userId: user.id, day: { gte: startDay, lte: endDay } },
    orderBy: { day: "asc" },
    select: { day: true, symptomScore: true, caffeineCups: true, alcoholUnits: true, trained: true },
  });

  const summary = {
    window: { startDay, endDay, days: 7 },
    averages: {
      steps: avg(snaps.map((s) => s.steps)),
      sleepHours: avg(snaps.map((s) => s.sleepHours)),
      restingHr: avg(snaps.map((s) => s.restingHr)),
      stressAvg: avg(snaps.map((s) => s.stressAvg)),
      bodyBatteryLow: avg(snaps.map((s) => s.bodyBatteryLow)),
      activityMinutes: avg(snaps.map((s) => s.activityMinutes)),
      symptomScore: avg(manual.map((m) => m.symptomScore)),
      caffeineCups: avg(manual.map((m) => m.caffeineCups)),
      alcoholUnits: avg(manual.map((m) => m.alcoholUnits)),
    },
    days: snaps,
  };

  const wantsAi = (url.searchParams.get("ai") || "1") !== "0";

  let ai: unknown = null;
  if (wantsAi) {
    ai = await openaiJson(
      JSON.stringify({
        instruction:
          "Lav en kort ugereview på dansk baseret på data. Vær konkret og jordnær. Output som JSON med felter: headline, wins (array), risks (array), focusNextWeek (array), oneSmallHabit (string).",
        data: summary,
      }),
    );
  }

  return NextResponse.json({ ok: true, summary, ai });
}
