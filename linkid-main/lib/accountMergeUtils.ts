import { createHash, randomBytes } from "node:crypto";

const MERGE_CODE_PREFIX = "LNK";

export function generateMergeCode(): string {
    const chunkA = randomBytes(3).toString("hex").toUpperCase();
    const chunkB = randomBytes(3).toString("hex").toUpperCase();
    return `${MERGE_CODE_PREFIX}-${chunkA}-${chunkB}`;
}

export function normalizeMergeCode(code: string): string {
    return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function hashMergeCode(code: string): string {
    return createHash("sha256").update(normalizeMergeCode(code)).digest("hex");
}

export function buildMergedPlatformSlug(input: {
    platform: string;
    sourceIdentifier: string;
    existingPlatforms: Set<string>;
}): string {
    const sanitizedSource = input.sourceIdentifier
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 20) || "merged";

    const base = `${input.platform.toLowerCase()}-from-${sanitizedSource}`;
    let candidate = base;
    let suffix = 2;

    while (input.existingPlatforms.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }

    return candidate;
}
