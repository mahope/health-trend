import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getStore } from "@/lib/store";
import { pickMetrics, readGarminJsonForDay, todayCph } from "@/lib/garminLocal";
import { isValidDay } from "@/lib/date";
import { fetchGarminDailyFromTokens } from "@/lib/garminRemote";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    day?: string;
    takenAt?: string;
  };

  if (body.day && !isValidDay(body.day)) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }
  const day = body.day || todayCph();
  const takenAt = body.takenAt || new Date().toISOString();

  let payload: unknown;
  let file = "";
  try {
    // Prefer remote Garmin via tokens, fallback to local JSON.
    try {
      payload = await fetchGarminDailyFromTokens(user.id, day);
    } catch {
      const res = await readGarminJsonForDay(day);
      payload = res.payload;
      file = res.file;
    }
  } catch {
    return NextResponse.json(
      {
        error: "missing_garmin_file",
        file,
        hint: "Connect Garmin (recommended) or place a local Garmin export (garmin-YYYY-MM-DD.json) in the configured data directory.",
      },
      { status: 400 },
    );
  }

  const metrics = pickMetrics(payload);
  const store = await getStore();
  const created = await store.createSnapshot(user.id, {
    day,
    takenAt,
    ...metrics,
    rawJson: payload,
  });

  return NextResponse.json({ ok: true, created });
}
