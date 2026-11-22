CREATE TABLE "WebhookDelivery" (
 "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "event" TEXT NOT NULL,
 "url" TEXT NOT NULL, "statusCode" INTEGER, "requestBody" JSONB NOT NULL, "responseBody" TEXT,
 "durationMs" INTEGER, "status" TEXT NOT NULL, "error" TEXT, "attempt" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "WebhookDelivery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WebhookDelivery_eventId_attempt_key" ON "WebhookDelivery"("eventId","attempt");
CREATE INDEX "WebhookDelivery_workspaceId_createdAt_idx" ON "WebhookDelivery"("workspaceId","createdAt");
