import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const day = url.searchParams.get("day");
  if (!day) return NextResponse.json({ error: "missing_day" }, { status: 400 });

  const rec = await prisma.manualDaily.findUnique({
    where: { userId_day: { userId: user.id, day } },
  });

  return NextResponse.json({ ok: true, item: rec });
}
