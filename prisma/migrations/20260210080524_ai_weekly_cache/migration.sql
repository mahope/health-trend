-- CreateTable
CREATE TABLE "AiWeeklyReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDay" TEXT NOT NULL,
    "endDay" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiWeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiWeeklyReport_userId_endDay_idx" ON "AiWeeklyReport"("userId", "endDay");

-- CreateIndex
CREATE UNIQUE INDEX "AiWeeklyReport_userId_startDay_endDay_key" ON "AiWeeklyReport"("userId", "startDay", "endDay");

-- AddForeignKey
ALTER TABLE "AiWeeklyReport" ADD CONSTRAINT "AiWeeklyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
