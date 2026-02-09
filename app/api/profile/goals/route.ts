import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.userProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });

  const rows = (await prisma.$queryRaw`
    SELECT "stepsGoal", "sleepGoalHours" FROM "UserProfile" WHERE "userId" = ${user.id} LIMIT 1
  `) as Array<{ stepsGoal: number; sleepGoalHours: number }>;

  const profile = rows?.[0] ?? { stepsGoal: 8000, sleepGoalHours: 7.5 };

  return NextResponse.json({ ok: true, profile });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    stepsGoal?: number;
    sleepGoalHours?: number;
  };

  const stepsGoal = typeof body.stepsGoal === "number" && Number.isFinite(body.stepsGoal) ? Math.round(body.stepsGoal) : undefined;
  const sleepGoalHours =
    typeof body.sleepGoalHours === "number" && Number.isFinite(body.sleepGoalHours)
      ? Math.round(body.sleepGoalHours * 10) / 10
      : undefined;

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(stepsGoal != null ? { stepsGoal } : {}),
      ...(sleepGoalHours != null ? { sleepGoalHours } : {}),
    },
    create: {
      userId: user.id,
      ...(stepsGoal != null ? { stepsGoal } : {}),
      ...(sleepGoalHours != null ? { sleepGoalHours } : {}),
    },
  });

  const rows = (await prisma.$queryRaw`
    SELECT "stepsGoal", "sleepGoalHours" FROM "UserProfile" WHERE "userId" = ${user.id} LIMIT 1
  `) as Array<{ stepsGoal: number; sleepGoalHours: number }>;

  const profile = rows?.[0] ?? { stepsGoal: 8000, sleepGoalHours: 7.5 };

  return NextResponse.json({ ok: true, profile });
}
