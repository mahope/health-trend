import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { ymd, isValidDay } from "@/lib/date";
import { generateAiBriefForUser } from "@/lib/aiBrief";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  if (dayParam && !isValidDay(dayParam)) return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  const day = dayParam || ymd(new Date());

  const item = await prisma.aiBrief.findUnique({
    where: { userId_day: { userId: user.id, day } },
  });

  return NextResponse.json({ ok: true, item });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit(req, { name: "ai-brief", limit: 10, windowMs: 60_000, keyParts: [user.id] });
  if (!rl.ok) return rl.response;

  const body = (await req.json().catch(() => null)) as null | { day?: string };
  if (body?.day && !isValidDay(body.day)) return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  const day = body?.day || ymd(new Date());

  try {
    const { saved } = await generateAiBriefForUser(user.id, day);
    return NextResponse.json({ ok: true, item: saved });
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : "";
    if (raw === "no_snapshots") {
      return NextResponse.json({ error: "no_snapshots" }, { status: 400 });
    }
    console.error("ai/brief error:", raw);
    return NextResponse.json({ error: "brief_failed" }, { status: 500 });
  }
}
