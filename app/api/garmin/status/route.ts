import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getStore } from "@/lib/store";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = await getStore();
  const status = await store.getGarminStatus(user.id);
  return NextResponse.json({ ok: true, status });
}
