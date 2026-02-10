import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { defaultDay, computeDeterministicPlan } from "@/lib/plan";
import { openaiJson } from "@/lib/openai";
import { cyclePhaseFromDay } from "@/lib/aiBrief";
import { isValidDay } from "@/lib/date";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit(req, { name: "plan-today", limit: 10, windowMs: 60_000, keyParts: [user.id] });
  if (!rl.ok) return rl.response;

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  if (dayParam && !isValidDay(dayParam)) return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  const day = dayParam || defaultDay();
  const ai = (url.searchParams.get("ai") || "1") !== "0";
  const refresh = (url.searchParams.get("refresh") || "0") === "1";

  const deterministic = await computeDeterministicPlan(user.id, day);

  const [snap, manual, profile, brief] = await Promise.all([
    prisma.garminSnapshot.findFirst({
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
    }),
    prisma.manualDaily.findUnique({
      where: { userId_day: { userId: user.id, day } },
      select: { symptomScore: true, caffeineCups: true, alcoholUnits: true, trained: true, meds: true, notes: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { sex: true, pregnant: true, cycleDay: true },
    }),
    prisma.aiBrief.findUnique({
      where: { userId_day: { userId: user.id, day } },
      select: { risk: true, short: true },
    }),
  ]);

  let aiPlan: unknown = null;
  if (ai) {
    // Cache per day so dashboard refreshes don't burn tokens.
    if (!refresh) {
      const cached = await prisma.aiDayPlan.findUnique({
        where: { userId_day_kind: { userId: user.id, day, kind: "today" } },
        select: { payload: true },
      });
      if (cached?.payload) {
        aiPlan = cached.payload;
        return NextResponse.json({ ok: true, day, deterministic, ai: aiPlan, cached: true });
      }
    }

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

    await prisma.aiDayPlan.upsert({
      where: { userId_day_kind: { userId: user.id, day, kind: "today" } },
      update: { payload: aiPlan as Prisma.InputJsonValue },
      create: {
        userId: user.id,
        day,
        kind: "today",
        payload: aiPlan as Prisma.InputJsonValue,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    });
  }

  return NextResponse.json({ ok: true, day, deterministic, ai: aiPlan, cached: false });
}
