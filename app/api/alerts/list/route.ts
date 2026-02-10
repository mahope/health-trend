import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import { isValidDay } from "@/lib/date";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const day = url.searchParams.get("day");
  if (day && !isValidDay(day)) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }
  const onlyUndelivered = (url.searchParams.get("undelivered") || "").toLowerCase() === "1";

  const items = await prisma.alert.findMany({
    where: {
      userId: user.id,
      ...(day ? { day } : {}),
      ...(onlyUndelivered ? { deliveredAt: null } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ ok: true, items });
}
