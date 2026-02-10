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
        // Idempotent on (userId, takenAt). Useful for cron runs and retries.
        const takenAt = new Date(input.takenAt);

        const upserted = await prisma.garminSnapshot.upsert({
          where: {
            userId_takenAt: {
              userId,
              takenAt,
            },
          },
          update: {
            day: input.day,

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
          create: {
            userId,
            day: input.day,
            takenAt,

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
          id: upserted.id,
          createdAt: upserted.createdAt.toISOString(),
          day: upserted.day,
          takenAt: upserted.takenAt.toISOString(),
          steps: upserted.steps,
          restingHr: upserted.restingHr,
          stressAvg: upserted.stressAvg,
          sleepMinutes: upserted.sleepMinutes,
          sleepHours: upserted.sleepHours,
          bodyBatteryHigh: upserted.bodyBatteryHigh,
          bodyBatteryLow: upserted.bodyBatteryLow,
          spo2Avg: upserted.spo2Avg,
          spo2Low: upserted.spo2Low,
          respAvgWaking: upserted.respAvgWaking,
          respAvgSleep: upserted.respAvgSleep,
          activityCount: upserted.activityCount,
          activityMinutes: upserted.activityMinutes,
          activityDistanceKm: upserted.activityDistanceKm,
          activityCalories: upserted.activityCalories,
          rawJson: upserted.rawJson,
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
