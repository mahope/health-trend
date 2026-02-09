import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const day = url.searchParams.get("day");
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
