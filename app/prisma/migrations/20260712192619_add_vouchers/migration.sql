-- AlterEnum
ALTER TYPE "RiceLedgerEntryType" ADD VALUE 'VOUCHER_REDEMPTION';

-- CreateTable
CREATE TABLE "voucher" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riceCost" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_redemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "riceCostSnapshot" INTEGER NOT NULL,
    "voucherTitleSnapshot" TEXT NOT NULL,
    "voucherBrandSnapshot" TEXT NOT NULL,
    "ledgerEntryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_slug_key" ON "voucher"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemption_ledgerEntryId_key" ON "voucher_redemption"("ledgerEntryId");

-- CreateIndex
CREATE INDEX "voucher_redemption_userId_idx" ON "voucher_redemption"("userId");

-- CreateIndex
CREATE INDEX "voucher_redemption_voucherId_idx" ON "voucher_redemption"("voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_redemption_userId_idempotencyKey_key" ON "voucher_redemption"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "voucher_redemption" ADD CONSTRAINT "voucher_redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemption" ADD CONSTRAINT "voucher_redemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
