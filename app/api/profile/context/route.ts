import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
    select: { sex: true, pregnant: true, cycleDay: true },
  });

  return NextResponse.json({ ok: true, profile });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    sex?: "male" | "female";
    pregnant?: boolean;
    cycleDay?: number | null;
  };

  const sex = body.sex === "female" ? "female" : "male";
  const pregnant = Boolean(body.pregnant);
  const cycleDay =
    body.cycleDay === null || body.cycleDay === undefined
      ? null
      : Number.isFinite(Number(body.cycleDay))
        ? Math.max(1, Math.min(40, Math.round(Number(body.cycleDay))))
        : null;

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: { sex, pregnant, cycleDay },
    create: { userId: user.id, sex, pregnant, cycleDay },
    select: { sex: true, pregnant: true, cycleDay: true },
  });

  return NextResponse.json({ ok: true, profile });
}
