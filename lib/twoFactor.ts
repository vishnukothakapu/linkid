import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";

export const TWO_FACTOR_ISSUER = "LinkID";
export const TOTP_EPOCH_TOLERANCE_SECONDS = 30;
export const RECOVERY_CODES_COUNT = 10;
export const RECOVERY_CODE_LENGTH = 10;

const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTotpSecret(): string {
    return generateSecret();
}

export function buildOtpAuthUri(secret: string, email: string): string {
    return generateURI({
        issuer: TWO_FACTOR_ISSUER,
        label: email,
        secret,
    });
}

export async function verifyTotpCode(
    secret: string,
    code: string,
    lastTotpStep?: number | null
): Promise<{ valid: boolean; timeStep?: number }> {
    const normalized = code.replace(/\s+/g, "").trim();
    if (!/^\d{6}$/.test(normalized)) {
        return { valid: false };
    }

    try {
        const result = verifySync({
            token: normalized,
            secret,
            epochTolerance: [TOTP_EPOCH_TOLERANCE_SECONDS, 0],
            ...(lastTotpStep == null ? {} : { afterTimeStep: lastTotpStep }),
        });
        if (result.valid) {
            const timeStep = (
                result as { timeStep?: number }
            ).timeStep;
            return { valid: true, ...(timeStep == null ? {} : { timeStep }) };
        }
        return { valid: false };
    } catch {
        return { valid: false };
    }
}

function generateRecoveryCode(): string {
    const bytes = randomBytes(RECOVERY_CODE_LENGTH);
    let code = "";
    for (let index = 0; index < RECOVERY_CODE_LENGTH; index += 1) {
        code += RECOVERY_CODE_ALPHABET[bytes[index] % RECOVERY_CODE_ALPHABET.length];
    }
    return code;
}

export function generateRecoveryCodes(count: number = RECOVERY_CODES_COUNT): string[] {
    const codes = new Set<string>();
    while (codes.size < count) {
        codes.add(generateRecoveryCode());
    }
    return Array.from(codes);
}

export async function hashRecoveryCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
}

export async function hashRecoveryCodes(codes: string[]): Promise<string> {
    const hashed = await Promise.all(codes.map(hashRecoveryCode));
    return hashed.join("\n");
}

export function formatRecoveryCodes(codes: string[]): string {
    return codes.join("\n");
}

/**
 * Attempts to consume a one-time recovery code.
 *
 * Recovery codes are stored hashed (bcrypt), one per line. When a code
 * matches, it is removed from the list so it cannot be reused.
 *
 * @returns the remaining hashed codes joined by newlines, or `null` when the
 *          supplied code is not a valid recovery code.
 */
export async function consumeRecoveryCode(
    storedHashedCodes: string | null,
    code: string
): Promise<string | null> {
    if (!storedHashedCodes || !code) {
        return null;
    }

    const normalized = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!normalized) {
        return null;
    }

    const codes = storedHashedCodes.split("\n");

    for (const entry of codes) {
        if (await bcrypt.compare(normalized, entry)) {
            return codes.filter((hash) => hash !== entry).join("\n");
        }
    }

    return null;
}
