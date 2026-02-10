import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { addDaysYmd, ymd, isValidDay } from "@/lib/date";
import { openaiJson } from "@/lib/openai";
import { rateLimit } from "@/lib/rateLimit";
import { cyclePhaseFromDay } from "@/lib/aiBrief";

function avg(nums: Array<number | null | undefined>) {
  const xs = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit(req, { name: "reports-weekly", limit: 5, windowMs: 60_000, keyParts: [user.id] });
  if (!rl.ok) return rl.response;

  const url = new URL(req.url);
  const endDayParam = url.searchParams.get("endDay");
  if (endDayParam && !isValidDay(endDayParam)) return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  const endDay = endDayParam || ymd(new Date());
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

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { sex: true, pregnant: true, cycleDay: true },
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
  const refresh = (url.searchParams.get("refresh") || "0") === "1";

  let ai: unknown = null;
  if (wantsAi) {
    if (!refresh) {
      const cached = await prisma.aiWeeklyReport.findUnique({
        where: { userId_startDay_endDay: { userId: user.id, startDay, endDay } },
        select: { payload: true },
      });
      if (cached?.payload) {
        return NextResponse.json({ ok: true, summary, ai: cached.payload, cached: true });
      }
    }

    ai = await openaiJson(
      JSON.stringify({
        instruction:
          "Lav en kort ugereview på dansk baseret på data. Vær konkret og jordnær. Brug profil-kontekst (sex, evt graviditet, cycleDay/cyclePhase) når du vurderer signaler og forslag. Nævn cyklus-variation kun hvis relevant. Output som JSON med felter: headline, wins (array), risks (array), focusNextWeek (array), oneSmallHabit (string).",
        data: {
          ...summary,
          profile: profile
            ? {
                sex: profile.sex,
                pregnant: profile.pregnant,
                cycleDay: profile.cycleDay,
                cyclePhase: cyclePhaseFromDay(profile.cycleDay),
              }
            : null,
        },
      }),
      {
        // Use a better model for weekly (configurable)
        model: process.env.OPENAI_MODEL_WEEKLY || process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    );

    await prisma.aiWeeklyReport.upsert({
      where: { userId_startDay_endDay: { userId: user.id, startDay, endDay } },
      update: { payload: ai as Prisma.InputJsonValue, model: process.env.OPENAI_MODEL_WEEKLY || process.env.OPENAI_MODEL || "gpt-4o-mini" },
      create: {
        userId: user.id,
        startDay,
        endDay,
        payload: ai as Prisma.InputJsonValue,
        model: process.env.OPENAI_MODEL_WEEKLY || process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    });
  }

  return NextResponse.json({ ok: true, summary, ai, cached: false });
}
