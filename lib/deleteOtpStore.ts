/**
 * In-memory OTP store for account deletion verification.
 *
 * Stores ephemeral 6-digit OTPs with a 10-minute TTL and
 * a maximum of 3 verification attempts per OTP.
 *
 * Uses globalThis to persist across Next.js dev-mode hot reloads.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;
const MAX_SEND_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Persist across HMR in dev mode (same pattern as Prisma singleton)
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

/**
 * Stores an OTP for the given user. Overwrites any previous OTP.
 */
export function setOtp(userId: string, otp: string): void {
  otpStore.set(userId, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

/**
 * Verifies an OTP for the given user with constant-time comparison.
 * Returns true if the OTP is valid and not expired.
 * Increments attempt counter; auto-clears after max attempts.
 */
export function verifyOtp(userId: string, candidateOtp: string): { valid: boolean; error?: string } {
  const entry = otpStore.get(userId);
  if (!entry) return { valid: false, error: "Verification code expired or not requested" };

  // Check expiry
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(userId);
    return { valid: false, error: "Verification code expired. Please request a new one." };
  }

  // Check max attempts
  entry.attempts += 1;
  const attemptsRemaining = MAX_ATTEMPTS - entry.attempts;

  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(userId);
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Constant-time comparison
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

/**
 * Clears the OTP for the given user (e.g. after successful deletion).
 */
export function clearOtp(userId: string): void {
  otpStore.delete(userId);
  rateLimitStore.delete(userId);
}

/**
 * Checks and increments the rate limit for OTP sends.
 * Returns true if the request is allowed, false if rate-limited.
 */
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
