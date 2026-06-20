// lib/platform.test.ts
import test, { describe, it } from "node:test";
import assert from "node:assert";
import { detectPlatform, validatePlatformUrl, getDeepLink } from "./platforms.js"; // Added .js suffix for native resolution

describe("Platform Utilities - Regression Tests", () => {
  
  // 1. validatePlatformUrl blocklist behavior
  describe("validatePlatformUrl() - Blocklist Enforcement", () => {
    it("should reject unauthenticated LinkedIn feed URLs", () => {
      const result = validatePlatformUrl("linkedin", "https://www.linkedin.com/feed/");
      assert.strictEqual(result, false);
    });

    it("should reject unauthenticated Facebook group URLs", () => {
      const result = validatePlatformUrl("facebook", "https://www.facebook.com/groups/tech-innovators");
      assert.strictEqual(result, false);
    });

    it("should allow valid standard public profile URLs", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/in/test-user"), true);
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/test.user.123"), true);
    });
  });

  // 2. detectPlatform for Instagram post/reel URLs
  describe("detectPlatform() - Instagram Traversal", () => {
    it("should successfully route Instagram post links to the instagram platform category", () => {
      const result = detectPlatform("https://www.instagram.com/p/C3bXyZ12/");
      assert.strictEqual(result, "instagram");
    });

    it("should successfully route Instagram reel links to the instagram platform category", () => {
      const result = detectPlatform("https://www.instagram.com/reel/C3bXyZ12/");
      assert.strictEqual(result, "instagram");
    });
  });

  // 3. getDeepLink mapping for Instagram posts/reels and YouTube short IDs
  describe("getDeepLink() - Native Mapping Configurations", () => {
    it("should build proper scheme structures for Instagram media posts", () => {
      const link = getDeepLink("instagram", "https://www.instagram.com/p/C3bXyZ12/");
      assert.strictEqual(link.android, "instagram://p/C3bXyZ12");
      assert.strictEqual(link.ios, "instagram://p/C3bXyZ12");
    });

    it("should build proper scheme structures for Instagram video reels", () => {
      const link = getDeepLink("instagram", "https://www.instagram.com/reel/C3bXyZ12/");
      assert.strictEqual(link.android, "instagram://reel/C3bXyZ12");
      assert.strictEqual(link.ios, "instagram://reel/C3bXyZ12");
    });

    it("should build accurate video scheme mappings for YouTube short video IDs", () => {
      const link = getDeepLink("youtube", "https://www.youtube.com/shorts/hW9_8k8Gjks");
      assert.strictEqual(link.android, "vnd.youtube://hW9_8k8Gjks");
      assert.strictEqual(link.ios, "https://www.youtube.com/shorts/hW9_8k8Gjks");
    });
  });

  // 4. Facebook blocked paths regression tests
  describe("validatePlatformUrl() - Facebook Blocked Paths", () => {
    it("should reject facebook.com/messages", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/messages"), false);
    });

    it("should reject facebook.com/feed/ (trailing slash)", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/feed/"), false);
    });

    it("should reject facebook.com/gaming", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/gaming"), false);
    });

    it("should reject facebook.com/watch", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/watch"), false);
    });

    it("should reject facebook.com/marketplace", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/marketplace"), false);
    });

    it("should reject facebook.com/profile.php without id parameter", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/profile.php"), false);
    });

    it("should allow facebook.com/profile.php?id=123456", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/profile.php?id=123456"), true);
    });

    it("should allow valid facebook.com public username", () => {
      assert.strictEqual(validatePlatformUrl("facebook", "https://www.facebook.com/johndoe"), true);
    });
  });

  // 5. LinkedIn blocked paths regression tests
  describe("validatePlatformUrl() - LinkedIn Blocked Paths", () => {
    it("should reject linkedin.com/feed/", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/feed/"), false);
    });

    it("should reject linkedin.com/mynetwork", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/mynetwork"), false);
    });

    it("should reject linkedin.com/jobs", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/jobs"), false);
    });

    it("should reject linkedin.com/learning", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/learning"), false);
    });

    it("should allow linkedin.com/in/username", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/in/johndoe"), true);
    });

    it("should allow linkedin.com/company/name", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/company/google"), true);
    });

    it("should allow linkedin.com/school/name", () => {
      assert.strictEqual(validatePlatformUrl("linkedin", "https://www.linkedin.com/school/mit"), true);
    });
  });
});