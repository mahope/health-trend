import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { addDaysYmd, isValidDay, ymd } from "@/lib/date";
import { computeSleepDebt } from "@/lib/insights";

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  if (dayParam && !isValidDay(dayParam)) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }
  const day = dayParam || ymd(new Date());
  const windowDays = clampInt(Number(url.searchParams.get("window") || 7), 1, 30);
  const points = clampInt(Number(url.searchParams.get("points") || 14), 3, 31);

  const start = addDaysYmd(day, -(points - 1));

  // NOTE: This is intentionally simple (N queries). It’s small (<= 31) and keeps logic in computeSleepDebt.
  const series = [] as Array<{ day: string; debtHours: number }>;
  for (let i = 0; i < points; i++) {
    const d = addDaysYmd(start, i);
    const debt = await computeSleepDebt(user.id, d, windowDays);
    series.push({ day: d, debtHours: debt.debtHours });
  }

  return NextResponse.json({ ok: true, day, windowDays, points, series });
}
