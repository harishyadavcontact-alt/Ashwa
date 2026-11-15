-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "ParentProfile" ADD COLUMN "referralCode" TEXT UNIQUE;

-- AlterTable
ALTER TABLE "Child" ADD COLUMN "referralCode" TEXT;

-- CreateTable
CREATE TABLE "ParentReferral" (
    "id" TEXT NOT NULL,
    "referrerParentId" TEXT NOT NULL,
    "referredParentId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentReferralEarnings" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "referredParentId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 200,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREDITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentReferralEarnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentReferral_referralCode_key" ON "ParentReferral"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_childId_month_year_key" ON "PaymentRecord"("childId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ParentReferralEarnings_referralId_month_year_key" ON "ParentReferralEarnings"("referralId", "month", "year");

-- AddForeignKey
ALTER TABLE "ParentReferral" ADD CONSTRAINT "ParentReferral_referrerParentId_fkey" FOREIGN KEY ("referrerParentId") REFERENCES "ParentProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentReferral" ADD CONSTRAINT "ParentReferral_referredParentId_fkey" FOREIGN KEY ("referredParentId") REFERENCES "ParentProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentReferralEarnings" ADD CONSTRAINT "ParentReferralEarnings_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentReferralEarnings" ADD CONSTRAINT "ParentReferralEarnings_referredParentId_fkey" FOREIGN KEY ("referredParentId") REFERENCES "ParentProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
