import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";

const PROFILE_SELECT = {
  sex: true,
  pregnant: true,
  cycleDay: true,
  lastPeriodStart: true,
  cycleLengthDays: true,
  cycleSymptoms: true,
} as const;

type CycleSymptom =
  | "cramps"
  | "headache"
  | "bloating"
  | "breastTenderness"
  | "acne"
  | "mood"
  | "fatigue";

function normalizeSymptoms(input: unknown): CycleSymptom[] {
  if (!Array.isArray(input)) return [];
  const allowed: CycleSymptom[] = [
    "cramps",
    "headache",
    "bloating",
    "breastTenderness",
    "acne",
    "mood",
    "fatigue",
  ];
  const set = new Set<CycleSymptom>();
  for (const v of input) {
    if (typeof v !== "string") continue;
    if ((allowed as string[]).includes(v)) set.add(v as CycleSymptom);
  }
  return Array.from(set);
}

function parseIsoDate(input: unknown): Date | null {
  if (typeof input !== "string" || !input) return null;
  // Expect YYYY-MM-DD from <input type="date">
  const d = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
    select: PROFILE_SELECT,
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

    lastPeriodStart?: string | null; // YYYY-MM-DD
    cycleLengthDays?: number | null;
    cycleSymptoms?: unknown;
  };

  const sex = body.sex === "female" ? "female" : "male";
  const pregnant = Boolean(body.pregnant);

  const cycleDay =
    body.cycleDay === null || body.cycleDay === undefined
      ? null
      : Number.isFinite(Number(body.cycleDay))
        ? Math.max(1, Math.min(40, Math.round(Number(body.cycleDay))))
        : null;

  const lastPeriodStart =
    sex === "female"
      ? body.lastPeriodStart
        ? parseIsoDate(body.lastPeriodStart)
        : null
      : null;

  const cycleLengthDays =
    sex === "female"
      ? body.cycleLengthDays === null || body.cycleLengthDays === undefined
        ? null
        : Number.isFinite(Number(body.cycleLengthDays))
          ? Math.max(20, Math.min(45, Math.round(Number(body.cycleLengthDays))))
          : null
      : null;

  const cycleSymptoms = sex === "female" ? normalizeSymptoms(body.cycleSymptoms) : [];

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      sex,
      pregnant,
      cycleDay,
      lastPeriodStart,
      cycleLengthDays,
      cycleSymptoms,
    },
    create: {
      userId: user.id,
      sex,
      pregnant,
      cycleDay,
      lastPeriodStart,
      cycleLengthDays,
      cycleSymptoms,
    },
    select: PROFILE_SELECT,
  });

  return NextResponse.json({ ok: true, profile });
}
