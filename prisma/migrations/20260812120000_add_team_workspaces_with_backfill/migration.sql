-- Step 1: Create Enum WorkspaceRole if not exists
DO $$ BEGIN
    CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create Table Workspace if not exists
CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT DEFAULT 'My Workspace',
    "username" TEXT,
    "bio" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "backgroundImage" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "customDomain" TEXT,
    "themeType" TEXT NOT NULL DEFAULT 'solid',
    "themeColor" TEXT NOT NULL DEFAULT 'slate',
    "themeCustom" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "enableEmailCapture" BOOLEAN NOT NULL DEFAULT false,
    "layoutStyle" "LayoutStyle" NOT NULL DEFAULT 'LIST',
    "resumeUrl" TEXT,
    "resumeDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create Table WorkspaceMember if not exists
CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create Table WorkspaceAlias if not exists
CREATE TABLE IF NOT EXISTS "WorkspaceAlias" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceAlias_pkey" PRIMARY KEY ("id")
);

-- Step 5: Ensure unique indexes required for ON CONFLICT backfill statements exist
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceAlias_username_key" ON "WorkspaceAlias"("username");

-- Step 6: Backfill Workspace for every existing User (using User.id as Workspace.id so IDs match)
INSERT INTO "Workspace" (
    "id",
    "name",
    "username",
    "bio",
    "seoTitle",
    "seoDescription",
    "backgroundImage",
    "isVerified",
    "customDomain",
    "themeType",
    "themeColor",
    "themeCustom",
    "theme",
    "enableEmailCapture",
    "layoutStyle",
    "resumeUrl",
    "resumeDownloadCount",
    "createdAt",
    "updatedAt"
)
SELECT
    u."id",
    COALESCE(u."name", 'My Workspace'),
    u."username",
    u."bio",
    u."seoTitle",
    u."seoDescription",
    u."backgroundImage",
    COALESCE(u."isVerified", false),
    u."customDomain",
    COALESCE(u."themeType", 'solid'),
    COALESCE(u."themeColor", 'slate'),
    u."themeCustom",
    COALESCE(u."theme", 'default'),
    COALESCE(u."enableEmailCapture", false),
    COALESCE(u."layoutStyle", 'LIST'::"LayoutStyle"),
    u."resumeUrl",
    COALESCE(u."resumeDownloadCount", 0),
    COALESCE(u."createdAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM "User" u
ON CONFLICT ("id") DO NOTHING;

-- Step 7: Backfill WorkspaceMember (OWNER role) for every existing User
INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "createdAt")
SELECT
    md5(random()::text || clock_timestamp()::text),
    u."id",
    u."id",
    'OWNER'::"WorkspaceRole",
    CURRENT_TIMESTAMP
FROM "User" u
ON CONFLICT ("workspaceId", "userId") DO NOTHING;

-- Step 8: Backfill WorkspaceAlias from existing UserAlias if table exists
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'UserAlias') THEN
        INSERT INTO "WorkspaceAlias" ("id", "username", "workspaceId", "createdAt")
        SELECT
            ua."id",
            ua."username",
            ua."userId",
            ua."createdAt"
        FROM "UserAlias" ua
        ON CONFLICT ("username") DO NOTHING;
    END IF;
END $$;

-- Step 9: Add nullable workspaceId columns to dependent tables if they don't exist yet
ALTER TABLE "Link" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "ClickEvent" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "DailyLinkAnalytics" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "ProfileDraft" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "ProfileVersion" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "ProfileVersion" ADD COLUMN IF NOT EXISTS "snapshot" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "ProfileVersion" ADD COLUMN IF NOT EXISTS "diff" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "ProfilePreviewToken" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "UsernameHistory" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- Step 10: Populate workspaceId from userId for existing rows in all dependent tables
UPDATE "Link" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "ClickEvent" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "DailyLinkAnalytics" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "ProfileDraft" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "ProfileVersion" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "ProfilePreviewToken" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "UsernameHistory" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;
UPDATE "Subscriber" SET "workspaceId" = "userId" WHERE "workspaceId" IS NULL AND "userId" IS NOT NULL;

-- Backfill NULL snapshot and diff fields in ProfileVersion to match non-nullable Prisma model fields
UPDATE "ProfileVersion" SET "snapshot" = '{}'::jsonb WHERE "snapshot" IS NULL;
UPDATE "ProfileVersion" SET "diff" = '{}'::jsonb WHERE "diff" IS NULL;

ALTER TABLE "ProfileVersion" ALTER COLUMN "snapshot" SET NOT NULL;
ALTER TABLE "ProfileVersion" ALTER COLUMN "diff" SET NOT NULL;

-- Audit orphan rows without a workspaceId before cleanup
DO $$ 
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM "ClickEvent" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "DailyLinkAnalytics" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "Link" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "ProfileDraft" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "ProfileVersion" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "ProfilePreviewToken" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "UsernameHistory" WHERE "workspaceId" IS NULL) +
        (SELECT COUNT(*) FROM "Subscriber" WHERE "workspaceId" IS NULL)
    INTO orphan_count;

    IF orphan_count > 0 THEN
        RAISE NOTICE 'Audit found % orphan records with NULL workspaceId before cleanup.', orphan_count;
    END IF;
END $$;

-- Clean up any orphaned rows without a matching workspaceId
DELETE FROM "ClickEvent" WHERE "workspaceId" IS NULL;
DELETE FROM "DailyLinkAnalytics" WHERE "workspaceId" IS NULL;
DELETE FROM "Link" WHERE "workspaceId" IS NULL;
DELETE FROM "ProfileDraft" WHERE "workspaceId" IS NULL;
DELETE FROM "ProfileVersion" WHERE "workspaceId" IS NULL;
DELETE FROM "ProfilePreviewToken" WHERE "workspaceId" IS NULL;
DELETE FROM "UsernameHistory" WHERE "workspaceId" IS NULL;
DELETE FROM "Subscriber" WHERE "workspaceId" IS NULL;

-- Step 11: Set NOT NULL on workspaceId columns
ALTER TABLE "Link" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ClickEvent" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "DailyLinkAnalytics" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ProfileDraft" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ProfileVersion" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ProfilePreviewToken" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "UsernameHistory" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Subscriber" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Step 12: Drop old userId columns
ALTER TABLE "Link" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "ClickEvent" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "DailyLinkAnalytics" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "ProfileDraft" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "ProfileVersion" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "ProfilePreviewToken" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "UsernameHistory" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "Subscriber" DROP COLUMN IF EXISTS "userId";

-- Step 13: Add Indexes & Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_username_key" ON "Workspace"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_customDomain_key" ON "Workspace"("customDomain");
CREATE INDEX IF NOT EXISTS "Workspace_username_idx" ON "Workspace"("username");

CREATE INDEX IF NOT EXISTS "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

CREATE INDEX IF NOT EXISTS "WorkspaceAlias_workspaceId_idx" ON "WorkspaceAlias"("workspaceId");

CREATE INDEX IF NOT EXISTS "Link_workspaceId_idx" ON "Link"("workspaceId");
CREATE INDEX IF NOT EXISTS "ClickEvent_workspaceId_createdAt_idx" ON "ClickEvent"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "DailyLinkAnalytics_workspaceId_date_idx" ON "DailyLinkAnalytics"("workspaceId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "ProfileDraft_workspaceId_key" ON "ProfileDraft"("workspaceId");

CREATE INDEX IF NOT EXISTS "ProfileVersion_workspaceId_createdAt_idx" ON "ProfileVersion"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProfilePreviewToken_workspaceId_expiresAt_idx" ON "ProfilePreviewToken"("workspaceId", "expiresAt");

-- Fix Subscriber unique constraint
DROP INDEX IF EXISTS "Subscriber_email_userId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_workspaceId_key" ON "Subscriber"("email", "workspaceId");
CREATE INDEX IF NOT EXISTS "Subscriber_workspaceId_idx" ON "Subscriber"("workspaceId");

-- Step 14: Add Foreign Key Constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMember_workspaceId_fkey') THEN
        ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMember_userId_fkey') THEN
        ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceAlias_workspaceId_fkey') THEN
        ALTER TABLE "WorkspaceAlias" ADD CONSTRAINT "WorkspaceAlias_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Link_workspaceId_fkey') THEN
        ALTER TABLE "Link" ADD CONSTRAINT "Link_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClickEvent_workspaceId_fkey') THEN
        ALTER TABLE "ClickEvent" ADD CONSTRAINT "ClickEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DailyLinkAnalytics_workspaceId_fkey') THEN
        ALTER TABLE "DailyLinkAnalytics" ADD CONSTRAINT "DailyLinkAnalytics_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProfileDraft_workspaceId_fkey') THEN
        ALTER TABLE "ProfileDraft" ADD CONSTRAINT "ProfileDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProfileVersion_workspaceId_fkey') THEN
        ALTER TABLE "ProfileVersion" ADD CONSTRAINT "ProfileVersion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProfilePreviewToken_workspaceId_fkey') THEN
        ALTER TABLE "ProfilePreviewToken" ADD CONSTRAINT "ProfilePreviewToken_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UsernameHistory_workspaceId_fkey') THEN
        ALTER TABLE "UsernameHistory" ADD CONSTRAINT "UsernameHistory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subscriber_workspaceId_fkey') THEN
        ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
