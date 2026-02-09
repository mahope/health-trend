-- Add Alert table

CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Alert_userId_fkey'
  ) THEN
    ALTER TABLE "Alert"
    ADD CONSTRAINT "Alert_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "Alert_userId_day_idx" ON "Alert"("userId", "day");
CREATE INDEX IF NOT EXISTS "Alert_deliveredAt_idx" ON "Alert"("deliveredAt");

-- Uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Alert_userId_day_severity_title_key'
  ) THEN
    ALTER TABLE "Alert"
    ADD CONSTRAINT "Alert_userId_day_severity_title_key" UNIQUE ("userId", "day", "severity", "title");
  END IF;
END $$;
