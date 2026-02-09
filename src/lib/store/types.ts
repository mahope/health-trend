export type GarminTokens = {
  oauth1?: unknown;
  oauth2?: unknown;
  dumpedAt?: string;
  source?: string;
};

export type SnapshotInput = {
  day: string; // YYYY-MM-DD
  takenAt: string; // ISO

  steps?: number | null;
  restingHr?: number | null;
  stressAvg?: number | null;
  sleepMinutes?: number | null;
  sleepHours?: number | null;
  bodyBatteryHigh?: number | null;
  bodyBatteryLow?: number | null;

  spo2Avg?: number | null;
  spo2Low?: number | null;
  respAvgWaking?: number | null;
  respAvgSleep?: number | null;

  activityCount?: number | null;
  activityMinutes?: number | null;
  activityDistanceKm?: number | null;
  activityCalories?: number | null;

  rawJson?: unknown;
};

export type StoredSnapshot = SnapshotInput & {
  id: string;
  createdAt: string;
};
