import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { LOCAL_DATA_DIR } from "@/lib/paths";
import type { Store } from "./index";
import type { GarminTokens, SnapshotInput, StoredSnapshot } from "./types";
import { encryptGarminTokens } from "@/lib/garminTokens";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function userDir(userId: string) {
  return path.join(LOCAL_DATA_DIR, "users", userId);
}

function tokensPath(userId: string) {
  return path.join(userDir(userId), "garmin.tokens.enc.txt");
}

function tokensMetaPath(userId: string) {
  return path.join(userDir(userId), "garmin.tokens.meta.json");
}

function snapshotsDir(userId: string) {
  return path.join(userDir(userId), "snapshots");
}

function snapshotPath(userId: string, day: string) {
  return path.join(snapshotsDir(userId), `${day}.json`);
}

async function readJson<T>(p: string, fallback: T): Promise<T> {
  try {
    const s = await fs.readFile(p, "utf8");
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(p: string, data: unknown) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

function newId() {
  return crypto.randomBytes(12).toString("hex");
}

export const fileStore: Store = {
  async setGarminTokens(userId: string, tokens: GarminTokens) {
    const enc = encryptGarminTokens(tokens);
    await ensureDir(userDir(userId));
    await fs.writeFile(tokensPath(userId), enc, "utf8");
    await writeJson(tokensMetaPath(userId), {
      tokensUpdatedAt: new Date().toISOString(),
      status: "ok",
      lastError: null,
    });
  },

  async getGarminStatus(userId: string) {
    try {
      const meta = await readJson<Record<string, unknown> | null>(
        tokensMetaPath(userId),
        null,
      );
      const exists = await fs
        .stat(tokensPath(userId))
        .then(() => true)
        .catch(() => false);
      if (!exists) return { connected: false };
      return {
        connected: true,
        tokensUpdatedAt: meta?.tokensUpdatedAt || new Date(0).toISOString(),
        status: meta?.status || "ok",
        lastError: meta?.lastError ?? null,
      };
    } catch {
      return { connected: false };
    }
  },

  async createSnapshot(userId: string, input: SnapshotInput) {
    const p = snapshotPath(userId, input.day);
    const existing = await readJson<StoredSnapshot[]>(p, []);

    const created: StoredSnapshot = {
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
    };

    existing.push(created);
    existing.sort((a, b) => a.takenAt.localeCompare(b.takenAt));

    await writeJson(p, existing);
    return created;
  },

  async listSnapshotsByDay(userId: string, day: string) {
    return await readJson<StoredSnapshot[]>(snapshotPath(userId, day), []);
  },
};
