-- AlterTable
ALTER TABLE "Link" ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "parentId" TEXT;

-- AddForeignKey (Not Valid initially)
ALTER TABLE "Link" ADD CONSTRAINT "Link_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
