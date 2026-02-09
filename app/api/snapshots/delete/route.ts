import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { generateAiBriefForUser } from "@/lib/aiBrief";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const snap = await prisma.garminSnapshot.findUnique({
    where: { id },
    select: { userId: true, day: true },
  });
  if (!snap || snap.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.garminSnapshot.delete({ where: { id } });

  // If we have a cached brief for this day, it's now stale. Best effort:
  // - Try to recompute immediately (if AI is configured)
  // - Otherwise delete the cached brief so UI won't show stale data.
  const brief = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: user.id, day: snap.day } },
  });

  if (brief) {
    try {
      const { saved } = await generateAiBriefForUser(user.id, snap.day);
      return NextResponse.json({ ok: true, briefRecomputed: true, brief: saved });
    } catch {
      await prisma.aiBrief.deleteMany({ where: { userId: user.id, day: snap.day } });
      return NextResponse.json({ ok: true, briefRecomputed: false, briefCleared: true });
    }
  }

  return NextResponse.json({ ok: true });
}
