-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "cycleLengthDays" INTEGER,
ADD COLUMN     "cycleSymptoms" JSONB,
ADD COLUMN     "lastPeriodStart" TIMESTAMP(3);
