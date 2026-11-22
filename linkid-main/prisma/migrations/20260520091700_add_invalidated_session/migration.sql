-- CreateTable
CREATE TABLE "InvalidatedSession" (
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvalidatedSession_pkey" PRIMARY KEY ("userId")
);
