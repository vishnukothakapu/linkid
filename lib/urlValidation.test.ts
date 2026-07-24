import assert from "node:assert/strict";
import test from "node:test";

import { isSafeRedirectUrl } from "@/lib/urlValidation";

test("isSafeRedirectUrl accepts http URLs", () => {
    assert.equal(isSafeRedirectUrl("http://example.com"), true);
});

test("isSafeRedirectUrl accepts https URLs", () => {
    assert.equal(isSafeRedirectUrl("https://example.com/path?query=1"), true);
});

test("isSafeRedirectUrl rejects javascript: URIs", () => {
    assert.equal(isSafeRedirectUrl("javascript:alert(document.cookie)"), false);
});

test("isSafeRedirectUrl rejects data: URIs", () => {
    assert.equal(isSafeRedirectUrl("data:text/html,<script>alert(1)</script>"), false);
});

test("isSafeRedirectUrl rejects file: URIs", () => {
    assert.equal(isSafeRedirectUrl("file:///etc/passwd"), false);
});

test("isSafeRedirectUrl rejects scheme-less values", () => {
    assert.equal(isSafeRedirectUrl("example.com"), false);
});

test("isSafeRedirectUrl rejects empty or malformed strings", () => {
    assert.equal(isSafeRedirectUrl(""), false);
    assert.equal(isSafeRedirectUrl("not a url"), false);
});

test("isSafeRedirectUrl does not reject deceptive-looking but valid https URLs (host validation is handled at write time)", () => {
    assert.equal(isSafeRedirectUrl("https://legitimate.com.attacker.com"), true);
});
