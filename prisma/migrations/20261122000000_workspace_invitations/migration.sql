CREATE TABLE "WorkspaceInvitation" (
 "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "email" TEXT NOT NULL,
 "role" "WorkspaceRole" NOT NULL DEFAULT 'EDITOR', "tokenHash" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL, "inviterId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "WorkspaceInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "WorkspaceInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WorkspaceInvitation_tokenHash_key" ON "WorkspaceInvitation"("tokenHash");
CREATE UNIQUE INDEX "WorkspaceInvitation_workspaceId_email_key" ON "WorkspaceInvitation"("workspaceId","email");
CREATE INDEX "WorkspaceInvitation_workspaceId_expiresAt_idx" ON "WorkspaceInvitation"("workspaceId","expiresAt");
