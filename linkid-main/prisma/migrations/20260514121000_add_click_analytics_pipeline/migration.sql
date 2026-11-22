-- CreateTable
CREATE TABLE "ClickEvent" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitorKey" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "deviceType" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isUniqueVisitor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLinkAnalytics" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "botClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLinkAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClickEvent_linkId_createdAt_idx" ON "ClickEvent"("linkId", "createdAt");

-- CreateIndex
CREATE INDEX "ClickEvent_userId_createdAt_idx" ON "ClickEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ClickEvent_linkId_visitorKey_createdAt_idx" ON "ClickEvent"("linkId", "visitorKey", "createdAt");

-- CreateIndex
CREATE INDEX "ClickEvent_createdAt_idx" ON "ClickEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLinkAnalytics_linkId_date_key" ON "DailyLinkAnalytics"("linkId", "date");

-- CreateIndex
CREATE INDEX "DailyLinkAnalytics_userId_date_idx" ON "DailyLinkAnalytics"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyLinkAnalytics_date_idx" ON "DailyLinkAnalytics"("date");

-- AddForeignKey
ALTER TABLE "ClickEvent" ADD CONSTRAINT "ClickEvent_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLinkAnalytics" ADD CONSTRAINT "DailyLinkAnalytics_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
