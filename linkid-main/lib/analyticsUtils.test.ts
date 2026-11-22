import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDeviceType, parseRangeDays } from "@/lib/analyticsUtils";

// Chromium's Android tablet UAs omit Mobile, including after UA reduction.
// https://www.chromium.org/updates/ua-reduction/
const reducedTablet = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";
const reducedPhone = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36";

test("detectDeviceType recognizes Chrome Android tablets without a Tablet token", () => {
    assert.strictEqual(detectDeviceType(reducedTablet), "tablet");
    assert.strictEqual(detectDeviceType(reducedTablet.toUpperCase()), "tablet");
    assert.strictEqual(detectDeviceType("Mozilla/5.0 (Linux; Android 9; SM-T810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.0.0 Safari/537.36"), "tablet");
});

test("detectDeviceType preserves Android phone and iPhone classification", () => {
    assert.strictEqual(detectDeviceType(reducedPhone), "mobile");
    assert.strictEqual(detectDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"), "mobile");
});

test("detectDeviceType gives explicit tablet identifiers precedence over Mobile", () => {
    assert.strictEqual(detectDeviceType("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"), "tablet");
    assert.strictEqual(detectDeviceType("Mozilla/5.0 (Android; Tablet) Mobile Safari/537.36"), "tablet");
});

test("detectDeviceType preserves desktop and missing user-agent behavior", () => {
    assert.strictEqual(detectDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"), "desktop");
    assert.strictEqual(detectDeviceType(""), "unknown");
    assert.strictEqual(detectDeviceType(null), "unknown");
    assert.strictEqual(detectDeviceType(undefined), "unknown");
});

test("parseRangeDays defaults to 30 days when query parameter is omitted or undefined", () => {
    assert.deepStrictEqual(parseRangeDays(null), { days: 30 });
    assert.deepStrictEqual(parseRangeDays(undefined), { days: 30 });
});

test("parseRangeDays parses 'all' as null days filter for full history", () => {
    assert.deepStrictEqual(parseRangeDays("all"), { days: null });
});

test("parseRangeDays accepts valid whole-day integer strings between 1 and 365", () => {
    assert.deepStrictEqual(parseRangeDays("1"), { days: 1 });
    assert.deepStrictEqual(parseRangeDays("7"), { days: 7 });
    assert.deepStrictEqual(parseRangeDays("30"), { days: 30 });
    assert.deepStrictEqual(parseRangeDays("90"), { days: 90 });
    assert.deepStrictEqual(parseRangeDays("365"), { days: 365 });
});

test("parseRangeDays rejects truncated strings and non-integer inputs", () => {
    const expectedError = { error: "days must be between 1 and 365, or 'all'" };
    assert.deepStrictEqual(parseRangeDays("1e2"), expectedError);
    assert.deepStrictEqual(parseRangeDays("30days"), expectedError);
    assert.deepStrictEqual(parseRangeDays("365x"), expectedError);
    assert.deepStrictEqual(parseRangeDays("1.5"), expectedError);
    assert.deepStrictEqual(parseRangeDays("30.0"), expectedError);
    assert.deepStrictEqual(parseRangeDays(" 30"), expectedError);
    assert.deepStrictEqual(parseRangeDays("30 "), expectedError);
    assert.deepStrictEqual(parseRangeDays("030"), expectedError);
    assert.deepStrictEqual(parseRangeDays("+30"), expectedError);
});

test("parseRangeDays rejects out-of-range, negative, and invalid string values", () => {
    const expectedError = { error: "days must be between 1 and 365, or 'all'" };
    assert.deepStrictEqual(parseRangeDays("0"), expectedError);
    assert.deepStrictEqual(parseRangeDays("-1"), expectedError);
    assert.deepStrictEqual(parseRangeDays("366"), expectedError);
    assert.deepStrictEqual(parseRangeDays("1000"), expectedError);
    assert.deepStrictEqual(parseRangeDays(""), expectedError);
    assert.deepStrictEqual(parseRangeDays("abc"), expectedError);
    assert.deepStrictEqual(parseRangeDays("NaN"), expectedError);
    assert.deepStrictEqual(parseRangeDays("Infinity"), expectedError);
});
