import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { ymd } from "@/lib/date";
import { generateAiBriefForUser } from "@/lib/aiBrief";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const day = url.searchParams.get("day") || ymd(new Date());

  const item = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: user.id, day } },
  });

  return NextResponse.json({ ok: true, item });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { day?: string };
  const day = body?.day || ymd(new Date());

  try {
    const { saved } = await generateAiBriefForUser(user.id, day);
    return NextResponse.json({ ok: true, item: saved });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Kunne ikke lave brief";
    const status = msg === "no_snapshots" ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
