-- CreateTable
CREATE TABLE "AiDayPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDayPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDayPlan_userId_day_idx" ON "AiDayPlan"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AiDayPlan_userId_day_kind_key" ON "AiDayPlan"("userId", "day", "kind");

-- AddForeignKey
ALTER TABLE "AiDayPlan" ADD CONSTRAINT "AiDayPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
