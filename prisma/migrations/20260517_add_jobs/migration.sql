-- Add JobStatus enum and Job table

CREATE TYPE "JobStatus" AS ENUM ('PENDING','SCHEDULED','PROCESSING','COMPLETED','FAILED');

CREATE TABLE "Job" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "scheduleAt" timestamp with time zone,
  "attempts" integer NOT NULL DEFAULT 0,
  "lastError" text,
  "runAfter" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "Job_status_runAfter_idx" ON "Job" ("status", "runAfter");
CREATE INDEX "Job_scheduleAt_idx" ON "Job" ("scheduleAt");
