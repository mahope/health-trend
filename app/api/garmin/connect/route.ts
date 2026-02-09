import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { GARMIN_TOKEN_DIR } from "@/lib/paths";
import { getStore } from "@/lib/store";
import type { GarminTokens } from "@/lib/garminTokens";

type Body =
  | { mode: "upload"; oauth1: unknown; oauth2: unknown }
  | { mode: "import_local" };

async function readJson(p: string) {
  const s = await fs.readFile(p, "utf8");
  return JSON.parse(s);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let tokens: GarminTokens;

  if (body.mode === "upload") {
    tokens = {
      oauth1: body.oauth1,
      oauth2: body.oauth2,
      dumpedAt: new Date().toISOString(),
      source: "upload",
    };
  } else if (body.mode === "import_local") {
    const oauth1Path = path.join(GARMIN_TOKEN_DIR, "oauth1_token.json");
    const oauth2Path = path.join(GARMIN_TOKEN_DIR, "oauth2_token.json");

    const [oauth1, oauth2] = await Promise.all([
      readJson(oauth1Path),
      readJson(oauth2Path),
    ]);

    tokens = {
      oauth1,
      oauth2,
      dumpedAt: new Date().toISOString(),
      source: `import_local:${GARMIN_TOKEN_DIR}`,
    };
  } else {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  const store = await getStore();
  await store.setGarminTokens(user.id, tokens);

  return NextResponse.json({ ok: true });
}
