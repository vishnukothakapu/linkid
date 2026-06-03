-- Add updatedAt column to Link table
-- This was added to schema.prisma (commit a1b086c) without a migration file.
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
