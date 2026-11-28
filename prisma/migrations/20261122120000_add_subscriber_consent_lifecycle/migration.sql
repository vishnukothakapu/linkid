-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'CONFIRMED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "SubscriberTokenType" AS ENUM ('CONFIRMATION', 'UNSUBSCRIBE');

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "status" "SubscriberStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Subscriber" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);
ALTER TABLE "Subscriber" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "SubscriberToken" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "SubscriberTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriberToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriberToken_tokenHash_key" ON "SubscriberToken"("tokenHash");

-- CreateIndex
CREATE INDEX "SubscriberToken_subscriberId_type_idx" ON "SubscriberToken"("subscriberId", "type");

-- CreateIndex
CREATE INDEX "Subscriber_workspaceId_status_idx" ON "Subscriber"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "SubscriberToken" ADD CONSTRAINT "SubscriberToken_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
