import { NextResponse } from "next/server";

export async function POST() {
  // TODO: implement taking a snapshot (fetch from Garmin + store).
  return NextResponse.json(
    {
      ok: false,
      error: "Not implemented yet (requires DB + Garmin tokens)",
    },
    { status: 501 },
  );
}
