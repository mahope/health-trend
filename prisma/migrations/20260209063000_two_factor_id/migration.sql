-- Make TwoFactor compatible with better-auth twoFactor plugin (expects an `id` field)
-- Safe to run if already applied.

ALTER TABLE "twoFactor" ADD COLUMN IF NOT EXISTS "id" TEXT;

-- Populate id for any existing rows
UPDATE "twoFactor"
SET "id" = md5(random()::text || clock_timestamp()::text)
WHERE "id" IS NULL;

-- Ensure `id` is NOT NULL
ALTER TABLE "twoFactor" ALTER COLUMN "id" SET NOT NULL;

-- Switch primary key to `id` (drop old PK if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'twoFactor_pkey') THEN
    ALTER TABLE "twoFactor" DROP CONSTRAINT "twoFactor_pkey";
  END IF;
END $$;

ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id");

-- Unique per user
CREATE UNIQUE INDEX IF NOT EXISTS "twoFactor_userId_key" ON "twoFactor"("userId");
