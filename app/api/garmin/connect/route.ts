import { NextResponse } from "next/server";

export async function POST() {
  // TODO: implement Garmin token bootstrap flow.
  // For now, we return a clear placeholder.
  return NextResponse.json(
    {
      ok: false,
      error: "Not implemented yet (requires DB + token flow)",
    },
    { status: 501 },
  );
}
