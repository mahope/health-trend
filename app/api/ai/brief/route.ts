import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { ymd } from "@/lib/date";
import { generateAiBriefForUser } from "@/lib/aiBrief";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { day?: string };
  const day = body?.day || ymd(new Date());

  const { saved } = await generateAiBriefForUser(user.id, day);
  return NextResponse.json({ ok: true, item: saved });
}
