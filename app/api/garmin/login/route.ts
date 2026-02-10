import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getStore } from "@/lib/store";
import type { GarminTokens } from "@/lib/garminTokens";

const defaultPython = process.platform === "win32" ? "python" : "python3";
const PYTHON = process.env.HEALTH_TREND_PYTHON || defaultPython;
const GARMIN_LOGIN_SCRIPT = path.join(process.cwd(), "garmin", "garmin_login.py");

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(p: string) {
  const s = await fs.readFile(p, "utf8");
  return JSON.parse(s);
}

type GarminLoginFailKind = "AUTH" | "RATE_LIMIT" | "CONNECTION" | "UNKNOWN";

function parsePythonError(stderr: string): { kind: GarminLoginFailKind; message: string } {
  // Our python prints: HT_ERR:<KIND>:<MESSAGE>
  const m = stderr.match(/HT_ERR:([A-Z_]+):([^\r\n]*)/);
  const kind = (m?.[1] as GarminLoginFailKind | undefined) || "UNKNOWN";
  const message = (m?.[2] || "Login fejlede").trim();
  return { kind, message };
}

function runPythonLogin({ email, password, tokenDir }: { email: string; password: string; tokenDir: string }) {
  return new Promise<{ ok: true } | { ok: false; code: number; kind: GarminLoginFailKind; message: string; raw: string }>((resolve) => {
    const child = spawn(PYTHON, [GARMIN_LOGIN_SCRIPT], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GARMIN_EMAIL: email,
        GARMIN_PASSWORD: password,
        GARMINTOKENS: tokenDir,
      },
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += String(d)));
    child.stderr.on("data", (d) => (err += String(d)));

    child.on("error", (e) => {
      resolve({ ok: false, code: 1, kind: "UNKNOWN", message: String(e), raw: String(e) });
    });
    child.on("close", (code) => {
      if (code === 0) return resolve({ ok: true });
      const parsed = parsePythonError(err || out);
      resolve({ ok: false, code: code ?? 1, kind: parsed.kind, message: parsed.message, raw: (err || out).slice(0, 4000) });
    });
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "missing_email_or_password" }, { status: 400 });
  }

  // Script must exist; python must be available in PATH or configured via HEALTH_TREND_PYTHON.
  if (!(await exists(GARMIN_LOGIN_SCRIPT))) {
    return NextResponse.json({ error: "missing_garmin_login_script", detail: GARMIN_LOGIN_SCRIPT }, { status: 500 });
  }

  const tokenDir = await fs.mkdtemp(path.join(os.tmpdir(), "health-trend-garmin-"));

  try {
    const res = await runPythonLogin({ email, password, tokenDir });
    if (!res.ok) {
      const status =
        res.kind === "AUTH" ? 401 :
        res.kind === "RATE_LIMIT" ? 429 :
        res.kind === "CONNECTION" ? 502 :
        500;
      return NextResponse.json(
        {
          error: "garmin_login_failed",
          kind: res.kind,
          message: res.message,
          // raw is useful during local dev; keep it, but truncated.
          raw: res.raw,
        },
        { status },
      );
    }

    const oauth1Path = path.join(tokenDir, "oauth1_token.json");
    const oauth2Path = path.join(tokenDir, "oauth2_token.json");

    const [oauth1, oauth2] = await Promise.all([readJson(oauth1Path), readJson(oauth2Path)]);

    const tokens: GarminTokens = {
      oauth1,
      oauth2,
      dumpedAt: new Date().toISOString(),
      source: "login",
    };

    const store = await getStore();
    await store.setGarminTokens(user.id, tokens);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    // Unexpected server-side failure (IO, JSON parse, store failure, etc.)
    return NextResponse.json(
      {
        error: "garmin_login_server_error",
        message: e instanceof Error ? e.message : "login_failed",
      },
      { status: 500 },
    );
  } finally {
    // best-effort cleanup
    try {
      await fs.rm(tokenDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
