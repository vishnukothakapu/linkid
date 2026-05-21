-- Add DeleteOtp table for OTP storage compatibility

CREATE TABLE "deleteOtp" (
  "userId" text PRIMARY KEY,
  "otp" text,
  "expiresAt" timestamp with time zone,
  "attempts" integer NOT NULL DEFAULT 0,
  "sendCount" integer NOT NULL DEFAULT 0,
  "windowStart" timestamp with time zone
);

CREATE INDEX "deleteOtp_windowStart_idx" ON "deleteOtp" ("windowStart");
