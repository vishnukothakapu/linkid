import assert from "node:assert/strict";
import test from "node:test";

import { validatePlatformUrl, isKnownPlatform } from "@/lib/platforms";
import { PLATFORMS } from "@/lib/constants";

// --- isKnownPlatform ---

test("isKnownPlatform returns true for every declared platform", () => {
    const known = [
        PLATFORMS.GITHUB, PLATFORMS.LINKEDIN, "leetcode", PLATFORMS.YOUTUBE, "x",
        PLATFORMS.FACEBOOK, PLATFORMS.INSTAGRAM, "discord", "twitch",
        "hashnode", "devto", PLATFORMS.MEDIUM, "dribbble", PLATFORMS.WEBSITE,
        "codeforces", "codechef",
    ];
    for (const p of known) {
        assert.equal(isKnownPlatform(p), true, `expected true for "${p}"`);
    }
});

test("isKnownPlatform returns false for unknown and custom labels", () => {
    for (const p of ["twitter", "tiktok", "custom", "GITHUB", "", "mysite"]) {
        assert.equal(isKnownPlatform(p), false, `expected false for "${p}"`);
    }
});

test("isKnownPlatform is not fooled by prototype keys", () => {
    assert.equal(isKnownPlatform("__proto__"), false);
    assert.equal(isKnownPlatform("constructor"), false);
    assert.equal(isKnownPlatform("toString"), false);
});

// --- validatePlatformUrl ---

test("validatePlatformUrl accepts valid URLs for each platform", () => {
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "https://github.com/octocat"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "http://github.com/octocat"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "https://www.github.com/octocat"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "github.com/octocat"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.LINKEDIN, "https://linkedin.com/in/john-doe"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.LINKEDIN, "https://www.linkedin.com/company/acme"), true);
    assert.equal(validatePlatformUrl("leetcode", "https://leetcode.com/jsmith"), true);
    assert.equal(validatePlatformUrl("leetcode", "https://www.leetcode.com/jsmith"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.YOUTUBE, "https://youtube.com/@channel"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.YOUTUBE, "https://www.youtube.com/c/channelname"), true);
    assert.equal(validatePlatformUrl("x", "https://x.com/username"), true);
    assert.equal(validatePlatformUrl("x", "https://www.x.com/username"), true);
    assert.equal(validatePlatformUrl("x", "https://twitter.com/username"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.FACEBOOK, "https://facebook.com/username"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.FACEBOOK, "https://www.facebook.com/username"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.INSTAGRAM, "https://instagram.com/username"), true);
    assert.equal(validatePlatformUrl("discord", "https://discord.com/users/123456789"), true);
    assert.equal(validatePlatformUrl("twitch", "https://twitch.tv/streamer"), true);
    assert.equal(validatePlatformUrl("hashnode", "https://hashnode.com/@user"), true);
    assert.equal(validatePlatformUrl("hashnode", "https://user.hashnode.dev"), true);
    assert.equal(validatePlatformUrl("devto", "https://dev.to/username"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.MEDIUM, "https://medium.com/@author"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.MEDIUM, "https://medium.com/publication"), true);
    assert.equal(validatePlatformUrl("dribbble", "https://dribbble.com/designer"), true);
    assert.equal(validatePlatformUrl("codeforces", "https://codeforces.com/profile/tourist"), true);
    assert.equal(validatePlatformUrl("codechef", "https://www.codechef.com/users/tourist"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.WEBSITE, "https://my-portfolio.com"), true);
    assert.equal(validatePlatformUrl(PLATFORMS.WEBSITE, "https://blog.example.com/posts"), true);
});

test("validatePlatformUrl rejects URLs that don't match the platform", () => {
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "https://gitlab.com/octocat"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "https://github.io/octocat"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.YOUTUBE, "https://vimeo.com/channel"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.INSTAGRAM, "https://threads.net/user"), false);
    assert.equal(validatePlatformUrl("twitch", "https://youtube.com/@streamer"), false);
    assert.equal(validatePlatformUrl("codeforces", "https://codechef.com/users/tourist"), false);
    assert.equal(validatePlatformUrl("codechef", "https://codeforces.com/profile/tourist"), false);

});

test("validatePlatformUrl rejects cross-platform URL swaps", () => {
    assert.equal(validatePlatformUrl(PLATFORMS.GITHUB, "https://linkedin.com/in/octocat"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.LINKEDIN, "https://github.com/john"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.LINKEDIN, "https://glassdoor.com/john"), false);
    assert.equal(validatePlatformUrl("leetcode", "https://hackerrank.com/jsmith"), false);
    assert.equal(validatePlatformUrl("leetcode", "https://github.com/jsmith"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.YOUTUBE, "https://twitch.tv/channel"), false);
    assert.equal(validatePlatformUrl("x", "https://facebook.com/username"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.FACEBOOK, "https://instagram.com/username"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.FACEBOOK, "https://x.com/username"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.INSTAGRAM, "https://facebook.com/user"), false);
    assert.equal(validatePlatformUrl("discord", "https://slack.com/users/123"), false);
    assert.equal(validatePlatformUrl("discord", "https://discord.gg/invite"), false);
    assert.equal(validatePlatformUrl("twitch", "https://kick.com/streamer"), false);
    assert.equal(validatePlatformUrl("hashnode", "https://medium.com/@user"), false);
    assert.equal(validatePlatformUrl("devto", "https://medium.com/@user"), false);
    assert.equal(validatePlatformUrl("devto", "https://hashnode.com/@user"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.MEDIUM, "https://dev.to/username"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.MEDIUM, "https://substack.com/@author"), false);
    assert.equal(validatePlatformUrl("dribbble", "https://behance.net/designer"), false);
    assert.equal(validatePlatformUrl("dribbble", "https://figma.com/@designer"), false);
    assert.equal(validatePlatformUrl("codeforces", "https://codechef.com/users/tourist"), false);
    assert.equal(validatePlatformUrl("codechef", "https://codeforces.com/profile/tourist"), false);

});

test("validatePlatformUrl rejects LinkedIn /messaging/ and /feed/ paths", () => {
    assert.equal(validatePlatformUrl(PLATFORMS.LINKEDIN, "https://linkedin.com/messaging/thread/123"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.LINKEDIN, "https://www.linkedin.com/feed/"), false);

});

test("validatePlatformUrl rejects /messaging/ and /feed/ paths on any platform", () => {
    assert.equal(validatePlatformUrl(PLATFORMS.WEBSITE, "https://example.com/messaging/inbox"), false);
    assert.equal(validatePlatformUrl(PLATFORMS.WEBSITE, "https://example.com/feed/update"), false);
});
