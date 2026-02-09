-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "sex" TEXT NOT NULL DEFAULT 'male',
    "pregnant" BOOLEAN NOT NULL DEFAULT false,
    "cycleDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GarminAccount" (
    "userId" TEXT NOT NULL,
    "tokensEncrypted" TEXT NOT NULL,
    "tokensUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GarminAccount_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GarminSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL,
    "steps" INTEGER,
    "restingHr" INTEGER,
    "stressAvg" INTEGER,
    "sleepMinutes" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "bodyBatteryHigh" INTEGER,
    "bodyBatteryLow" INTEGER,
    "spo2Avg" DOUBLE PRECISION,
    "spo2Low" INTEGER,
    "respAvgWaking" DOUBLE PRECISION,
    "respAvgSleep" DOUBLE PRECISION,
    "activityCount" INTEGER,
    "activityMinutes" INTEGER,
    "activityDistanceKm" DOUBLE PRECISION,
    "activityCalories" INTEGER,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarminSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "symptomScore" INTEGER,
    "caffeineCups" INTEGER,
    "alcoholUnits" INTEGER,
    "notes" TEXT,
    "trained" BOOLEAN,
    "meds" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBrief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "GarminSnapshot_userId_day_idx" ON "GarminSnapshot"("userId", "day");

-- CreateIndex
CREATE INDEX "GarminSnapshot_userId_takenAt_idx" ON "GarminSnapshot"("userId", "takenAt");

-- CreateIndex
CREATE UNIQUE INDEX "GarminSnapshot_userId_takenAt_key" ON "GarminSnapshot"("userId", "takenAt");

-- CreateIndex
CREATE INDEX "ManualDaily_userId_day_idx" ON "ManualDaily"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "ManualDaily_userId_day_key" ON "ManualDaily"("userId", "day");

-- CreateIndex
CREATE INDEX "AiBrief_userId_day_idx" ON "AiBrief"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "AiBrief_userId_day_key" ON "AiBrief"("userId", "day");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarminAccount" ADD CONSTRAINT "GarminAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarminSnapshot" ADD CONSTRAINT "GarminSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDaily" ADD CONSTRAINT "ManualDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBrief" ADD CONSTRAINT "AiBrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
