import assert from "node:assert/strict";
import test from "node:test";

import { detectDeviceType, getForwardedIp, isLikelyBot, isPrivateIp } from "@/lib/analyticsUtils";

test("isLikelyBot identifies common crawler user agents", () => {
    assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
    assert.equal(isLikelyBot("Twitterbot/1.0"), true);
});

test("isLikelyBot treats normal browser user agents as non-bot", () => {
    assert.equal(
        isLikelyBot(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"
        ),
        false
    );
});

test("detectDeviceType classifies mobile, tablet and desktop", () => {
    assert.equal(
        detectDeviceType(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
        ),
        "mobile"
    );

    assert.equal(
        detectDeviceType(
            "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
        ),
        "tablet"
    );

    assert.equal(
        detectDeviceType(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"
        ),
        "desktop"
    );
});

// isPrivateIp
test("isPrivateIp returns true for RFC-1918 and loopback ranges", () => {
    assert.equal(isPrivateIp("10.0.0.1"), true);
    assert.equal(isPrivateIp("10.255.255.255"), true);
    assert.equal(isPrivateIp("172.16.0.1"), true);
    assert.equal(isPrivateIp("172.31.255.255"), true);
    assert.equal(isPrivateIp("192.168.1.1"), true);
    assert.equal(isPrivateIp("127.0.0.1"), true);
});

test("isPrivateIp returns false for public IPs", () => {
    assert.equal(isPrivateIp("1.2.3.4"), false);
    assert.equal(isPrivateIp("8.8.8.8"), false);
    assert.equal(isPrivateIp("172.15.0.1"), false);   // just outside 172.16/12
    assert.equal(isPrivateIp("172.32.0.1"), false);   // just outside 172.16/12
    assert.equal(isPrivateIp("203.0.113.1"), false);  // TEST-NET-3, public
});

test("isPrivateIp rejects malformed values", () => {
    assert.equal(isPrivateIp("not-an-ip"), false);
    assert.equal(isPrivateIp(""), false);
    assert.equal(isPrivateIp("10.0.0"), false);
});

// getForwardedIp
test("getForwardedIp returns x-real-ip directly when upstream is public", () => {
    const h = new Headers({
        "x-real-ip": "203.0.113.5",
        "x-forwarded-for": "10.0.0.1, 203.0.113.5",
    });
    // Upstream (x-real-ip) is public, so x-forwarded-for must be ignored.
    assert.equal(getForwardedIp(h), "203.0.113.5");
});

test("getForwardedIp trusts x-forwarded-for first hop when upstream is private", () => {
    const h = new Headers({
        "x-real-ip": "10.0.0.2",         // private proxy
        "x-forwarded-for": "203.0.113.9, 10.0.0.2",
    });
    assert.equal(getForwardedIp(h), "203.0.113.9");
});

test("getForwardedIp returns null when no IP headers present", () => {
    assert.equal(getForwardedIp(new Headers()), null);
});

test("getForwardedIp ignores spoofed x-forwarded-for when x-real-ip is absent", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4" });
    // No x-real-ip means we cannot verify the proxy chain.
    assert.equal(getForwardedIp(h), null);
});
