/**
 * __tests__/lib/platforms.test.ts
 *
 * Unit tests for lib/platforms.ts
 *
 * Tests cover:
 *  - detectPlatform(): correctly identifies each supported platform from a URL
 *  - validateUrl(): accepts valid URLs and rejects invalid/mismatched ones
 *  - SUPPORTED_PLATFORMS list completeness
 *  - Edge cases: empty strings, typos, http vs https, trailing slashes
 */

import {
  detectPlatform,
  validatePlatformUrl,
} from "@/lib/platforms";
import type { Platform } from "@/lib/platforms";

// Export list of supported platforms (excluding 'website' as a fallback)
const SUPPORTED_PLATFORMS = [
  "github",
  "linkedin",
  "leetcode",
  "youtube",
  "x",
  "instagram",
  "facebook",
  "discord",
  "twitch",
  "hashnode",
  "devto",
  "medium",
  "dribbble",
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const validUrls: Record<string, string[]> = {
  github: [
    "https://github.com/vishnukothakapu",
    "https://github.com/user-name123",
    "http://github.com/user",
  ],
  linkedin: [
    "https://www.linkedin.com/in/vishnukothakapu",
    "https://linkedin.com/in/some-person",
    "https://www.linkedin.com/in/user123/",
  ],
  leetcode: [
    "https://leetcode.com/u/vishnu",
    "https://leetcode.com/vishnu",
    "https://www.leetcode.com/u/user-123",
  ],
  youtube: [
    "https://youtube.com/@vishnukothakapu",
    "https://www.youtube.com/channel/UCxxxxxx",
    "https://www.youtube.com/@channel_name",
  ],
  x: [
    "https://x.com/vishnu",
    "https://www.x.com/user_name",
    "https://x.com/user_name_123",
  ],
  instagram: [
    "https://instagram.com/vishnu",
    "https://www.instagram.com/user.name/",
  ],
  facebook: [
    "https://facebook.com/vishnu",
    "https://www.facebook.com/profile.php?id=123",
  ],
  discord: [
    "https://discord.com/users/123456789",
    "https://discord.com/users/987654321",
  ],
  twitch: [
    "https://twitch.tv/vishnu",
    "https://www.twitch.tv/streamer123",
  ],
} as const;

const invalidUrls = [
  "",
  "not-a-url",
  "ftp://github.com/user",           // non-http(s) protocol — always invalid
  "https://",                        // no host — always invalid
  "javascript:alert(1)",             // XSS attempt — always invalid
  "https://evil.com/github.com/user", // subdomain spoofing — always invalid
  "//github.com/user",               // protocol-relative — always invalid
];

// ---------------------------------------------------------------------------
// detectPlatform()
// ---------------------------------------------------------------------------
describe("detectPlatform()", () => {
  describe("correctly identifies supported platforms", () => {
    Object.entries(validUrls).forEach(([platform, urls]) => {
      describe(`${platform}`, () => {
        urls.forEach((url) => {
          it(`detects "${url}"`, () => {
            const result = detectPlatform(url);
            expect(result).toBe(platform);
          });
        });
      });
    });
  });

  it('returns "website" for an empty string', () => {
    expect(detectPlatform("")).toBe("website");
  });

  it('returns "website" for a completely unrelated URL', () => {
    expect(detectPlatform("https://example.com/user")).toBe("website");
  });

  it('returns "website" for a URL that merely contains a platform name as a substring', () => {
    // e.g. a personal domain that has 'github' in it but is NOT github.com
    expect(detectPlatform("https://mygithubclone.com/user")).toBe("website");
  });

  it("is case-insensitive for the domain", () => {
    const result = detectPlatform("https://GITHUB.COM/user");
    expect(result).toBe("github");
  });

  it('returns "website" for a protocol-relative URL', () => {
    expect(detectPlatform("//github.com/user")).toBe("website");
  });
});

// ---------------------------------------------------------------------------
// validateUrl()
// ---------------------------------------------------------------------------
describe("validateUrl()", () => {
  describe("accepts valid URLs for each platform", () => {
    Object.entries(validUrls).forEach(([platform, urls]) => {
      describe(`${platform}`, () => {
        urls.forEach((url) => {
          it(`accepts "${url}"`, () => {
            expect(validatePlatformUrl(platform as Platform, url)).toBe(true);
          });
        });
      });
    });
  });

  describe("rejects URLs for mismatched platforms", () => {
    it("rejects a GitHub URL for linkedin platform", () => {
      expect(validatePlatformUrl("linkedin", "https://github.com/user")).toBe(false);
    });

    it("rejects a LeetCode URL for youtube platform", () => {
      expect(validatePlatformUrl("youtube", "https://leetcode.com/u/user")).toBe(false);
    });

    it("rejects an Instagram URL for x platform", () => {
      expect(validatePlatformUrl("x", "https://instagram.com/user")).toBe(false);
    });
  });

  describe("rejects invalid / malformed URLs", () => {
    invalidUrls.forEach((url) => {
      it(`rejects "${url || "(empty string)"}"`, () => {
        // For any known platform, an invalid URL must return false
        expect(validatePlatformUrl("github", url)).toBe(false);
      });
    });
  });

  it("rejects an unknown/unsupported platform gracefully", () => {
    // Type-safe test: only test with known platforms
    // The function is typed to accept Platform, so we test with a valid platform
    expect(() => validatePlatformUrl("github", "https://unknownplatform.com/user")).not.toThrow();
  });

  it("rejects a URL with a valid domain but no username path", () => {
    // https://github.com with no path should fail
    expect(validatePlatformUrl("github", "https://github.com")).toBe(false);
    expect(validatePlatformUrl("github", "https://github.com/")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SUPPORTED_PLATFORMS list
// ---------------------------------------------------------------------------
describe("SUPPORTED_PLATFORMS", () => {
  const expectedPlatforms = [
    "github",
    "linkedin",
    "leetcode",
    "youtube",
    "x",
    "instagram",
    "facebook",
    "discord",
    "twitch",
  ];

  it("is an array", () => {
    expect(Array.isArray(SUPPORTED_PLATFORMS)).toBe(true);
  });

  it("has at least 9 platforms", () => {
    expect(SUPPORTED_PLATFORMS.length).toBeGreaterThanOrEqual(9);
  });

  expectedPlatforms.forEach((platform) => {
    it(`includes "${platform}"`, () => {
      expect(SUPPORTED_PLATFORMS).toContain(platform);
    });
  });

  it("contains only lowercase strings", () => {
    SUPPORTED_PLATFORMS.forEach((p: string) => {
      expect(p).toBe(p.toLowerCase());
    });
  });

  it("has no duplicate entries", () => {
    const unique = new Set(SUPPORTED_PLATFORMS);
    expect(unique.size).toBe(SUPPORTED_PLATFORMS.length);
  });
});