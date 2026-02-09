import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | null
    | {
        day?: string;
        symptomScore?: number | null;
        caffeineCups?: number | null;
        alcoholUnits?: number | null;
        notes?: string | null;
        trained?: boolean | null;
        meds?: boolean | null;
      };

  if (!body?.day) return NextResponse.json({ error: "missing_day" }, { status: 400 });

  const day = body.day;

  const item = await prisma.manualDaily.upsert({
    where: { userId_day: { userId: user.id, day } },
    update: {
      symptomScore: body.symptomScore ?? null,
      caffeineCups: body.caffeineCups ?? null,
      alcoholUnits: body.alcoholUnits ?? null,
      notes: body.notes ?? null,
      trained: body.trained ?? null,
      meds: body.meds ?? null,
    },
    create: {
      userId: user.id,
      day,
      symptomScore: body.symptomScore ?? null,
      caffeineCups: body.caffeineCups ?? null,
      alcoholUnits: body.alcoholUnits ?? null,
      notes: body.notes ?? null,
      trained: body.trained ?? null,
      meds: body.meds ?? null,
    },
  });

  return NextResponse.json({ ok: true, item });
}
