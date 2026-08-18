-- AlterTable
ALTER TABLE "Link" ADD COLUMN "abTestVariant" TEXT,
ADD COLUMN "abTestParentId" TEXT;

-- CreateIndex
CREATE INDEX "Link_abTestParentId_idx" ON "Link"("abTestParentId");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_abTestParentId_fkey" FOREIGN KEY ("abTestParentId") REFERENCES "Link"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CheckConstraint
ALTER TABLE "Link" ADD CONSTRAINT "abTestVariant_check" CHECK ("abTestVariant" IN ('A', 'B'));
