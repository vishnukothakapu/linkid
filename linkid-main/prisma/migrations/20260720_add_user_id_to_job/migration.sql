-- Add userId column to Job model for ownership tracking
ALTER TABLE "Job" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';

-- Index for efficient queries by userId
CREATE INDEX "Job_userId_idx" ON "Job" ("userId");
