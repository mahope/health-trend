import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { defaultDay, computeDeterministicPlan } from "@/lib/plan";
import { openaiJson } from "@/lib/openai";
import { cyclePhaseFromDay } from "@/lib/aiBrief";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const day = url.searchParams.get("day") || defaultDay();
  const ai = (url.searchParams.get("ai") || "1") !== "0";

  const deterministic = await computeDeterministicPlan(user.id, day);

  const snap = await prisma.garminSnapshot.findFirst({
    where: { userId: user.id, day },
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
    where: { userId_day: { userId: user.id, day } },
    select: { symptomScore: true, caffeineCups: true, alcoholUnits: true, trained: true, meds: true, notes: true },
  });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { sex: true, pregnant: true, cycleDay: true },
  });

  const brief = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: user.id, day } },
    select: { risk: true, short: true },
  });

  let aiPlan: unknown = null;
  if (ai) {
    aiPlan = await openaiJson(
      JSON.stringify({
        instruction:
          "Lav en dagsplan på dansk ud fra Garmin+manual. Brug profil-kontekst (sex, evt graviditet, cycleDay/cyclePhase). Nævn cyklus-variation kun hvis relevant. Output JSON med felter: intensity (let|moderat|hård), headline, focus, doToday (array), avoid (array), caffeine, bedtime. Det skal være realistisk for en småbørnsfar. Max 6 bullets under doToday.",
        data: {
          day,
          snapshot: snap,
          manual,
          brief,
          deterministic,
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
  }

  return NextResponse.json({ ok: true, day, deterministic, ai: aiPlan });
}
