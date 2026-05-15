import assert from "node:assert/strict";
import test from "node:test";

import { detectDeviceType, isLikelyBot } from "@/lib/analyticsUtils";

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
