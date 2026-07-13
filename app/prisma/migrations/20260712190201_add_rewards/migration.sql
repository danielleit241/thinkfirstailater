-- CreateEnum
CREATE TYPE "RiceLedgerEntryType" AS ENUM ('DAILY_REWARD');

-- CreateTable
CREATE TABLE "reward_config" (
    "id" TEXT NOT NULL,
    "dailyRewardAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "streakCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rice_ledger_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "entryType" "RiceLedgerEntryType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rice_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rice_balance" (
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rice_balance_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "daily_reward_userId_idx" ON "daily_reward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reward_userId_businessDate_key" ON "daily_reward"("userId", "businessDate");

-- CreateIndex
CREATE INDEX "rice_ledger_entry_userId_idx" ON "rice_ledger_entry"("userId");

-- AddForeignKey
ALTER TABLE "daily_reward" ADD CONSTRAINT "daily_reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rice_ledger_entry" ADD CONSTRAINT "rice_ledger_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rice_balance" ADD CONSTRAINT "rice_balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
