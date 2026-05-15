const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const MAX_SEND_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

declare global {
  var __deleteOtpStore: Map<string, OtpEntry> | undefined;
  var __deleteRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const otpStore = globalThis.__deleteOtpStore ?? new Map<string, OtpEntry>();
const rateLimitStore = globalThis.__deleteRateLimitStore ?? new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__deleteOtpStore = otpStore;
  globalThis.__deleteRateLimitStore = rateLimitStore;
}

/**
 * Generates a cryptographically secure 6-digit OTP.
 */
export function generateOtp(): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1_000_000).padStart(6, "0");
}

export function setOtp(userId: string, otp: string): void {
  otpStore.set(userId, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

export function verifyOtp(userId: string, candidateOtp: string): { valid: boolean; error?: string } {
  const entry = otpStore.get(userId);
  if (!entry) return { valid: false, error: "Verification code expired or not requested" };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(userId);
    return { valid: false, error: "Verification code expired. Please request a new one." };
  }

  entry.attempts += 1;
  const attemptsRemaining = MAX_ATTEMPTS - entry.attempts;

  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(userId);
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

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
    return { valid: true };
  } else {
    if (attemptsRemaining <= 0) {
      otpStore.delete(userId);
      return { valid: false, error: "Incorrect verification code. Maximum attempts reached. Please request a new code." };
    }
    return { valid: false, error: `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.` };
  }
}


export function clearOtp(userId: string): void {
  otpStore.delete(userId);
  rateLimitStore.delete(userId);
}

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_SEND_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}
