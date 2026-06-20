-- Fix column type drift for Job, Link, deleteOtp, and invalidatedSession tables.
-- Some earlier migrations used `timestamp with time zone` instead of `TIMESTAMP(3)`,
-- causing a type mismatch between the actual database and the Prisma schema.

-- Fix Job table columns
ALTER TABLE "Job"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "scheduleAt" SET DATA TYPE TIMESTAMP(3),
  ALTER COLUMN "runAfter" SET DATA TYPE TIMESTAMP(3),
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
  ALTER COLUMN "updatedAt" DROP DEFAULT,
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- Fix Link table updatedAt default (remove database-level default, Prisma manages it)
ALTER TABLE "Link" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Fix deleteOtp table timestamp columns
ALTER TABLE "deleteOtp"
  ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
  ALTER COLUMN "windowStart" SET DATA TYPE TIMESTAMP(3);

-- Fix invalidatedSession table timestamp columns
ALTER TABLE "invalidatedSession"
  ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
