-- Add resumeUrl and resumeDownloadCount fields to User model
-- These were added to schema.prisma without a migration file.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resumeDownloadCount" INTEGER NOT NULL DEFAULT 0;
