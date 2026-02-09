import { prisma } from "@/lib/prisma";
import { encryptGarminTokens } from "@/lib/garminTokens";
import type { GarminTokens, SnapshotInput, StoredSnapshot } from "./types";
import { fileStore } from "./localFileStore";

async function canUseDb(): Promise<boolean> {
  if (process.env.USE_FILE_STORE === "1") return false;
  if (!process.env.DATABASE_URL) return false;
  try {
    // Quick ping
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export type Store = {
  setGarminTokens: (userId: string, tokens: GarminTokens) => Promise<void>;
  getGarminStatus: (userId: string) => Promise<
    | { connected: false }
    | { connected: true; tokensUpdatedAt: string; status: string; lastError?: string | null }
  >;

  createSnapshot: (userId: string, input: SnapshotInput) => Promise<StoredSnapshot>;
  listSnapshotsByDay: (userId: string, day: string) => Promise<StoredSnapshot[]>;
};

let cached: Store | null = null;

export async function getStore(): Promise<Store> {
  if (cached) return cached;

  if (await canUseDb()) {
    cached = {
      async setGarminTokens(userId, tokens) {
        const tokensEncrypted = encryptGarminTokens(tokens);
        await prisma.garminAccount.upsert({
          where: { userId },
          update: {
            tokensEncrypted,
            tokensUpdatedAt: new Date(),
            status: "ok",
            lastError: null,
          },
          create: {
            userId,
            tokensEncrypted,
            tokensUpdatedAt: new Date(),
            status: "ok",
          },
        });
      },

      async getGarminStatus(userId) {
        const rec = await prisma.garminAccount.findUnique({ where: { userId } });
        if (!rec) return { connected: false };
        return {
          connected: true,
          tokensUpdatedAt: rec.tokensUpdatedAt.toISOString(),
          status: rec.status,
          lastError: rec.lastError,
        };
      },

      async createSnapshot(userId, input) {
        const created = await prisma.garminSnapshot.create({
          data: {
            userId,
            day: input.day,
            takenAt: new Date(input.takenAt),

            steps: input.steps ?? undefined,
            restingHr: input.restingHr ?? undefined,
            stressAvg: input.stressAvg ?? undefined,
            sleepMinutes: input.sleepMinutes ?? undefined,
            sleepHours: input.sleepHours ?? undefined,
            bodyBatteryHigh: input.bodyBatteryHigh ?? undefined,
            bodyBatteryLow: input.bodyBatteryLow ?? undefined,
            spo2Avg: input.spo2Avg ?? undefined,
            spo2Low: input.spo2Low ?? undefined,
            respAvgWaking: input.respAvgWaking ?? undefined,
            respAvgSleep: input.respAvgSleep ?? undefined,

            activityCount: input.activityCount ?? undefined,
            activityMinutes: input.activityMinutes ?? undefined,
            activityDistanceKm: input.activityDistanceKm ?? undefined,
            activityCalories: input.activityCalories ?? undefined,

            rawJson: input.rawJson as unknown as object | undefined,
          },
        });

        return {
          id: created.id,
          createdAt: created.createdAt.toISOString(),
          day: created.day,
          takenAt: created.takenAt.toISOString(),
          steps: created.steps,
          restingHr: created.restingHr,
          stressAvg: created.stressAvg,
          sleepMinutes: created.sleepMinutes,
          sleepHours: created.sleepHours,
          bodyBatteryHigh: created.bodyBatteryHigh,
          bodyBatteryLow: created.bodyBatteryLow,
          spo2Avg: created.spo2Avg,
          spo2Low: created.spo2Low,
          respAvgWaking: created.respAvgWaking,
          respAvgSleep: created.respAvgSleep,
          activityCount: created.activityCount,
          activityMinutes: created.activityMinutes,
          activityDistanceKm: created.activityDistanceKm,
          activityCalories: created.activityCalories,
          rawJson: created.rawJson,
        };
      },

      async listSnapshotsByDay(userId, day) {
        const rows = await prisma.garminSnapshot.findMany({
          where: { userId, day },
          orderBy: { takenAt: "asc" },
        });
        return rows.map((x) => ({
          id: x.id,
          createdAt: x.createdAt.toISOString(),
          day: x.day,
          takenAt: x.takenAt.toISOString(),
          steps: x.steps,
          restingHr: x.restingHr,
          stressAvg: x.stressAvg,
          sleepMinutes: x.sleepMinutes,
          sleepHours: x.sleepHours,
          bodyBatteryHigh: x.bodyBatteryHigh,
          bodyBatteryLow: x.bodyBatteryLow,
          spo2Avg: x.spo2Avg,
          spo2Low: x.spo2Low,
          respAvgWaking: x.respAvgWaking,
          respAvgSleep: x.respAvgSleep,
          activityCount: x.activityCount,
          activityMinutes: x.activityMinutes,
          activityDistanceKm: x.activityDistanceKm,
          activityCalories: x.activityCalories,
          rawJson: x.rawJson,
        }));
      },
    };

    return cached;
  }

  cached = fileStore;
  return cached;
}
