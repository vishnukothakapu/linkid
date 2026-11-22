-- Add invalidatedSession table for session invalidation

CREATE TABLE "invalidatedSession" (
  "userId" text PRIMARY KEY,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
