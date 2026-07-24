-- CreateTable
CREATE TABLE "ProfileDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "bio" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "bio" TEXT,
    "image" TEXT,
    "changeType" TEXT NOT NULL,
    "diffJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePreviewToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ProfilePreviewToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDraft_userId_key" ON "ProfileDraft"("userId");

-- CreateIndex
CREATE INDEX "ProfileDraft_userId_idx" ON "ProfileDraft"("userId");

-- CreateIndex
CREATE INDEX "ProfileVersion_userId_createdAt_idx" ON "ProfileVersion"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePreviewToken_tokenHash_key" ON "ProfilePreviewToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ProfilePreviewToken_userId_expiresAt_idx" ON "ProfilePreviewToken"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "ProfileDraft" ADD CONSTRAINT "ProfileDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersion" ADD CONSTRAINT "ProfileVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePreviewToken" ADD CONSTRAINT "ProfilePreviewToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
