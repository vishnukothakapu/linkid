import prisma from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const MAX_SEND_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Generates a cryptographically secure 6-digit OTP.
 */
export function generateOtp(): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1_000_000).padStart(6, "0");
}

export async function setOtp(userId: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.deleteOtp.upsert({
    where: { userId },
    update: {
      otp,
      expiresAt,
      attempts: 0,
    },
    create: {
      userId,
      otp,
      expiresAt,
      attempts: 0,
    },
  });
}

export async function verifyOtp(userId: string, candidateOtp: string): Promise<{ valid: boolean; error?: string }> {
  const entry = await prisma.deleteOtp.findUnique({ where: { userId } });
  
  if (!entry || !entry.otp || !entry.expiresAt) {
    return { valid: false, error: "Verification code expired or not requested" };
  }

  if (Date.now() > entry.expiresAt.getTime()) {
    await clearOtpFields(userId);
    return { valid: false, error: "Verification code expired. Please request a new one." };
  }

  const attempts = entry.attempts + 1;
  const attemptsRemaining = MAX_ATTEMPTS - attempts;

  if (attempts > MAX_ATTEMPTS) {
    await clearOtpFields(userId);
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  await prisma.deleteOtp.update({
    where: { userId },
    data: { attempts },
  });

  const encoder = new TextEncoder();
  const a = encoder.encode(candidateOtp);
  const b = encoder.encode(entry.otp);

  let mismatch = 0;
  if (a.length !== b.length) {
    mismatch = 1;
  } else {
    for (let i = 0; i < a.length; i++) {
      mismatch |= a[i] ^ b[i];
    }
  }

  if (mismatch === 0) {
    await clearOtpFields(userId);
    return { valid: true };
  } else {
    if (attemptsRemaining <= 0) {
      await clearOtpFields(userId);
      return { valid: false, error: "Incorrect verification code. Maximum attempts reached. Please request a new code." };
    }
    return { valid: false, error: `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.` };
  }
}

async function clearOtpFields(userId: string) {
  // Clear OTP but retain rate-limiting window
  await prisma.deleteOtp.update({
    where: { userId },
    data: { otp: null, expiresAt: null, attempts: 0 },
  }).catch(() => {});
}

export async function clearOtp(userId: string): Promise<void> {
  await prisma.deleteOtp.delete({
    where: { userId },
  }).catch(() => {});
}

export async function checkRateLimit(userId: string): Promise<boolean> {
  const now = new Date();
  const entry = await prisma.deleteOtp.findUnique({ where: { userId } });
  
  if (!entry || now.getTime() - entry.windowStart.getTime() > RATE_LIMIT_WINDOW_MS) {
    await prisma.deleteOtp.upsert({
      where: { userId },
      update: { sendCount: 1, windowStart: now },
      create: { userId, sendCount: 1, windowStart: now }
    });
    return true;
  }

  if (entry.sendCount >= MAX_SEND_PER_WINDOW) {
    return false;
  }

  await prisma.deleteOtp.update({
    where: { userId },
    data: { sendCount: entry.sendCount + 1 },
  });
  
  return true;
}
