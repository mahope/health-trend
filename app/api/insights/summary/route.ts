import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { addDaysYmd, ymd } from "@/lib/date";
import { computeSleepDebt, computeStreaks } from "@/lib/insights";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const day = url.searchParams.get("day") || ymd(new Date());
  const debtDays = clamp(Number(url.searchParams.get("sleepDebtDays") || 7), 1, 30);

  const sleepDebt = await computeSleepDebt(user.id, day, debtDays);
  const streaks = await computeStreaks(user.id, day);

  const tomorrow = addDaysYmd(day, 1);

  return NextResponse.json({
    ok: true,
    day,
    tomorrow,
    sleepDebt,
    streaks,
  });
}
