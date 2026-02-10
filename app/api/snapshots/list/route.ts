import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getStore } from "@/lib/store";
import { isValidDay } from "@/lib/date";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const day = url.searchParams.get("day");
  if (!day) {
    return NextResponse.json({ error: "missing_day" }, { status: 400 });
  }
  if (!isValidDay(day)) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }

  const store = await getStore();
  const items = await store.listSnapshotsByDay(user.id, day);
  return NextResponse.json({ ok: true, items });
}
