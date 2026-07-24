import assert from "node:assert/strict";
import test from "node:test";

import {
    buildMergedPlatformSlug,
    generateMergeCode,
    hashMergeCode,
    normalizeMergeCode,
} from "@/lib/accountMergeUtils";
import { PLATFORMS } from "@/lib/constants";

test("generateMergeCode returns a readable merge code", () => {
    const code = generateMergeCode();
    assert.match(code, /^LNK-[A-F0-9]{6}-[A-F0-9]{6}$/);
});

test("normalizeMergeCode strips noise and uppercases", () => {
    assert.equal(normalizeMergeCode("  lnk-ab12cd-ef34gh!! "), "LNK-AB12CD-EF34GH");
});

test("hashMergeCode is deterministic for the same code", () => {
    assert.equal(hashMergeCode("lnk-ab12cd-ef34gh"), hashMergeCode(" LNK-AB12CD-EF34GH "));
});

test("buildMergedPlatformSlug avoids collisions", () => {
    const slug = buildMergedPlatformSlug({
        platform: PLATFORMS.GITHUB,
        sourceIdentifier: "deepika",
        existingPlatforms: new Set(["github-from-deepika", "github-from-deepika-2"]),
    });

    assert.equal(slug, "github-from-deepika-3");
});
