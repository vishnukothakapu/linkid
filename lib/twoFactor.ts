import { createHash, randomBytes } from "crypto";
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

export function verifyTotpCode(secret: string, code: string): boolean {
    const normalized = code.replace(/\s+/g, "").trim();
    if (!/^\d{6}$/.test(normalized)) {
        return false;
    }

    try {
        return verifySync({
            token: normalized,
            secret,
            epochTolerance: TOTP_EPOCH_TOLERANCE_SECONDS,
        }).valid;
    } catch {
        return false;
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

export function hashRecoveryCode(code: string): string {
    return createHash("sha256").update(code).digest("hex");
}

export function hashRecoveryCodes(codes: string[]): string {
    return codes.map(hashRecoveryCode).join("\n");
}

export function formatRecoveryCodes(codes: string[]): string {
    return codes.join("\n");
}

/**
 * Attempts to consume a one-time recovery code.
 *
 * Recovery codes are stored hashed (SHA-256), one per line. When a code
 * matches, it is removed from the list so it cannot be reused.
 *
 * @returns the remaining hashed codes joined by newlines, or `null` when the
 *          supplied code is not a valid recovery code.
 */
export function consumeRecoveryCode(
    storedHashedCodes: string | null,
    code: string
): string | null {
    if (!storedHashedCodes || !code) {
        return null;
    }

    const normalized = code.replace(/\s+/g, "").toUpperCase().trim();
    if (!normalized) {
        return null;
    }

    const hashed = hashRecoveryCode(normalized);
    const codes = storedHashedCodes.split("\n");

    if (!codes.includes(hashed)) {
        return null;
    }

    return codes.filter((entry) => entry !== hashed).join("\n");
}
