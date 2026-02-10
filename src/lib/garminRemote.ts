import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { decryptGarminTokens } from "@/lib/garminTokens";

const defaultPython = process.platform === "win32" ? "python" : "python3";
const PYTHON = process.env.HEALTH_TREND_PYTHON || defaultPython;

const EXPORT_SCRIPT = path.join(process.cwd(), "garmin", "export_daily.py");

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(p: string, data: unknown) {
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

function runExport(day: string, tokenDir: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [EXPORT_SCRIPT, "--date", day], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GARMINTOKENS: tokenDir,
      },
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += String(d)));
    child.stderr.on("data", (d) => (err += String(d)));

    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`garmin export failed (code ${code}): ${err || out}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`garmin export returned invalid JSON: ${String(e)} :: ${out.slice(0, 200)}`));
      }
    });
  });
}

export async function fetchGarminDailyFromTokens(userId: string, day: string): Promise<unknown> {
  if (!(await exists(EXPORT_SCRIPT))) {
    throw new Error(`missing_export_script: ${EXPORT_SCRIPT}`);
  }

  const acc = await prisma.garminAccount.findUnique({ where: { userId }, select: { tokensEncrypted: true } });
  if (!acc) throw new Error("garmin_not_connected");

  const tokens = decryptGarminTokens(acc.tokensEncrypted);

  const tokenDir = await fs.mkdtemp(path.join(os.tmpdir(), "health-trend-garmin-"));
  try {
    // garminconnect expects oauth1_token.json + oauth2_token.json
    await writeJson(path.join(tokenDir, "oauth1_token.json"), tokens.oauth1 ?? {});
    await writeJson(path.join(tokenDir, "oauth2_token.json"), tokens.oauth2 ?? {});

    return await runExport(day, tokenDir);
  } finally {
    await fs.rm(tokenDir, { recursive: true, force: true }).catch(() => {});
  }
}
