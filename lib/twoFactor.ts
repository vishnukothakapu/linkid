import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";

export const TWO_FACTOR_ISSUER = "LinkID";
export const TOTP_EPOCH_TOLERANCE_SECONDS = 30;
export const RECOVERY_CODES_COUNT = 10;
export const RECOVERY_CODE_LENGTH = 10;

const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Non-secret prefix stored alongside each bcrypt hash so consumeRecoveryCode
// only runs the expensive bcrypt comparison against the (typically single)
// entry whose prefix matches — a few characters leak nothing about the code.
const RECOVERY_CODE_PREFIX_LENGTH = 4;

function normalizeRecoveryCode(code: string): string {
    return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function recoveryCodePrefix(code: string): string {
    return code.slice(0, RECOVERY_CODE_PREFIX_LENGTH);
}

// Storage representation for one recovery-code entry: `PREFIX:BCRYPT_HASH`.
// A missing separator marks a legacy bare bcrypt hash (written before
// prefixing) which is compared directly for backward compatibility.
function formatRecoveryCodeEntry(code: string, hash: string): string {
    return `${recoveryCodePrefix(code)}:${hash}`;
}

function splitRecoveryCodeEntry(entry: string): {
    prefix: string | null;
    hash: string;
} {
    const separator = entry.indexOf(":");
    if (separator === -1) {
        return { prefix: null, hash: entry };
    }
    return {
        prefix: entry.slice(0, separator),
        hash: entry.slice(separator + 1),
    };
}

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
    const normalized = normalizeRecoveryCode(code);
    const hash = await bcrypt.hash(normalized, 10);
    return formatRecoveryCodeEntry(normalized, hash);
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
 * Recovery codes are stored as `PREFIX:BCRYPT_HASH` entries, one per line. The
 * non-secret prefix narrows the expensive bcrypt comparison to matching
 * entries. When a code matches, its entry is removed so it cannot be reused.
 *
 * @returns the remaining stored entries joined by newlines, or `null` when the
 *          supplied code is not a valid recovery code.
 */
export async function consumeRecoveryCode(
    storedHashedCodes: string | null,
    code: string
): Promise<string | null> {
    if (!storedHashedCodes || !code) {
        return null;
    }

    const normalized = normalizeRecoveryCode(code);
    if (!normalized) {
        return null;
    }

    const entries = storedHashedCodes.split("\n");
    const prefix = recoveryCodePrefix(normalized);

    // Only compare against entries whose prefix matches (or legacy bare-hash
    // entries, which must be tried unconditionally). This keeps the cost of a
    // wrong guess at one bcrypt compare instead of one per stored code.
    const candidates = entries.filter((entry) => {
        const { prefix: entryPrefix } = splitRecoveryCodeEntry(entry);
        return entryPrefix === null || entryPrefix === prefix;
    });

    for (const entry of candidates) {
        const { hash } = splitRecoveryCodeEntry(entry);
        if (await bcrypt.compare(normalized, hash)) {
            return entries.filter((candidate) => candidate !== entry).join("\n");
        }
    }

    return null;
}
