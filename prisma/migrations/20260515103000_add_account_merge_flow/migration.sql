-- CreateTable
CREATE TABLE "UserAlias" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMergeRequest" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "consumedByUserId" TEXT,

    CONSTRAINT "AccountMergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMergeEvent" (
    "id" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "sourceEmail" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "sourceUsername" TEXT,
    "targetUsername" TEXT,
    "mergedLinks" INTEGER NOT NULL DEFAULT 0,
    "mergedAccounts" INTEGER NOT NULL DEFAULT 0,
    "transferredSessions" INTEGER NOT NULL DEFAULT 0,
    "conflictsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountMergeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAlias_username_key" ON "UserAlias"("username");

-- CreateIndex
CREATE INDEX "UserAlias_userId_idx" ON "UserAlias"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountMergeRequest_codeHash_key" ON "AccountMergeRequest"("codeHash");

-- CreateIndex
CREATE INDEX "AccountMergeRequest_targetUserId_createdAt_idx" ON "AccountMergeRequest"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AccountMergeRequest_expiresAt_idx" ON "AccountMergeRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "AccountMergeEvent_sourceUserId_idx" ON "AccountMergeEvent"("sourceUserId");

-- CreateIndex
CREATE INDEX "AccountMergeEvent_targetUserId_createdAt_idx" ON "AccountMergeEvent"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserAlias" ADD CONSTRAINT "UserAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMergeRequest" ADD CONSTRAINT "AccountMergeRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
