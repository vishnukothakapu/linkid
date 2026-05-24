/**
 * __tests__/lib/url.test.ts
 *
 * Unit tests for lib/url.ts
 *
 * Tests cover:
 *  - isValidHttpUrl(): URL format validation for http and https URLs
 *  - Edge cases: empty inputs, special characters, invalid protocols
 */

import { isValidHttpUrl } from "@/lib/url";

// ---------------------------------------------------------------------------
// isValidHttpUrl()
// ---------------------------------------------------------------------------
describe("isValidHttpUrl()", () => {
  const valid = [
    "https://github.com/user",
    "http://example.com",
    "https://www.linkedin.com/in/user-name",
    "https://sub.domain.co.uk/path?query=1#anchor",
    "https://leetcode.com/u/user123",
    "github.com/user",
    "not-a-url",
  ];

  const invalid = [
    "",
    "   ",
    "ftp://github.com",         // non-http(s) protocol
    "javascript:alert(1)",      // XSS attempt
    "//github.com/user",        // protocol-relative
    "https://",                 // no host
    "https:// spaces.com",      // spaces in URL
  ];

  valid.forEach((url) => {
    it(`returns true for "${url}"`, () => {
      expect(isValidHttpUrl(url)).toBe(true);
    });
  });

  invalid.forEach((url) => {
    it(`returns false for "${url || "(empty)"}"`, () => {
      expect(isValidHttpUrl(url)).toBe(false);
    });
  });
});
