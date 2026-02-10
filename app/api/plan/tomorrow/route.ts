import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { defaultDay, computeTomorrowDeterministicPlan } from "@/lib/plan";
import { openaiJson } from "@/lib/openai";
import { cyclePhaseFromDay } from "@/lib/aiBrief";
import { addDaysYmd, isValidDay } from "@/lib/date";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit(req, { name: "plan-tomorrow", limit: 10, windowMs: 60_000, keyParts: [user.id] });
  if (!rl.ok) return rl.response;

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  if (dayParam && !isValidDay(dayParam)) return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  const basedOnDay = dayParam || defaultDay();
  const ai = (url.searchParams.get("ai") || "1") !== "0";
  const refresh = (url.searchParams.get("refresh") || "0") === "1";

  const day = addDaysYmd(basedOnDay, 1);
  const deterministic = await computeTomorrowDeterministicPlan(user.id, basedOnDay);

  const snap = await prisma.garminSnapshot.findFirst({
    where: { userId: user.id, day: basedOnDay },
    orderBy: { takenAt: "desc" },
    select: {
      takenAt: true,
      steps: true,
      restingHr: true,
      stressAvg: true,
      sleepHours: true,
      bodyBatteryLow: true,
    },
  });

  const manual = await prisma.manualDaily.findUnique({
    where: { userId_day: { userId: user.id, day: basedOnDay } },
    select: { symptomScore: true, caffeineCups: true, alcoholUnits: true, trained: true, meds: true, notes: true },
  });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { sex: true, pregnant: true, cycleDay: true },
  });

  const brief = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: user.id, day: basedOnDay } },
    select: { risk: true, short: true },
  });

  let aiPlan: unknown = null;
  if (ai) {
    if (!refresh) {
      const cached = await prisma.aiDayPlan.findUnique({
        where: { userId_day_kind: { userId: user.id, day, kind: "tomorrow" } },
        select: { payload: true },
      });
      if (cached?.payload) {
        aiPlan = cached.payload;
        return NextResponse.json({ ok: true, day, basedOnDay, deterministic, ai: aiPlan, cached: true });
      }
    }

    aiPlan = await openaiJson(
      JSON.stringify({
        instruction:
          "Lav en plan for I MORGEN på dansk ud fra dagens Garmin+manual. Brug profil-kontekst (sex, evt graviditet, cycleDay/cyclePhase). Nævn cyklus-variation kun hvis relevant. Output JSON med felter: intensity (let|moderat|hård), headline, focus, doToday (array), avoid (array), caffeine, bedtime. Den skal være realistisk for en småbørnsfar. Max 6 bullets under doToday. Referér evt til at planen er for i morgen.",
        data: {
          basedOnDay,
          day,
          snapshotToday: snap,
          manualToday: manual,
          briefToday: brief,
          deterministicTomorrow: deterministic,
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
    );

    await prisma.aiDayPlan.upsert({
      where: { userId_day_kind: { userId: user.id, day, kind: "tomorrow" } },
      update: { payload: aiPlan as Prisma.InputJsonValue },
      create: {
        userId: user.id,
        day,
        kind: "tomorrow",
        payload: aiPlan as Prisma.InputJsonValue,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    });
  }

  return NextResponse.json({ ok: true, day, basedOnDay, deterministic, ai: aiPlan, cached: false });
}
