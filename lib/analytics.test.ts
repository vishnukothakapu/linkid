import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTopBreakdown, computePercentChange } from "@/lib/analyticsMath";

test("computePercentChange returns a positive percentage when clicks increased", () => {
    assert.strictEqual(computePercentChange(118, 100), 18);
});

test("computePercentChange returns a negative percentage when clicks decreased", () => {
    assert.strictEqual(computePercentChange(82, 100), -18);
});

test("computePercentChange returns 0 when there is no change", () => {
    assert.strictEqual(computePercentChange(100, 100), 0);
});

test("computePercentChange returns \"new\" when previous period had zero clicks but current has clicks", () => {
    assert.strictEqual(computePercentChange(50, 0), "new");
});

test("computePercentChange returns null when both periods had zero clicks", () => {
    assert.strictEqual(computePercentChange(0, 0), null);
});

test("computePercentChange returns -100 when clicks dropped to zero", () => {
    assert.strictEqual(computePercentChange(0, 50), -100);
});

test("buildTopBreakdown groups empty values and trims labels", () => {
    const breakdown = buildTopBreakdown(
        [
            { key: null, count: 1 },
            { key: "   ", count: 2 },
            { key: "  google.com ", count: 4 },
        ],
        "Direct / Unknown"
    );

    assert.deepStrictEqual(breakdown, [
        { label: "google.com", count: 4 },
        { label: "Direct / Unknown", count: 3 },
    ]);
});

test("buildTopBreakdown rolls overflow rows into Other", () => {
    const breakdown = buildTopBreakdown(
        [
            { key: "one", count: 10 },
            { key: "two", count: 9 },
            { key: "three", count: 8 },
            { key: "four", count: 7 },
            { key: "five", count: 6 },
            { key: "six", count: 5 },
            { key: "seven", count: 4 },
            { key: "eight", count: 3 },
            { key: "nine", count: 2 },
        ],
        "Unknown"
    );

    assert.deepStrictEqual(breakdown, [
        { label: "one", count: 10 },
        { label: "two", count: 9 },
        { label: "three", count: 8 },
        { label: "four", count: 7 },
        { label: "five", count: 6 },
        { label: "six", count: 5 },
        { label: "seven", count: 4 },
        { label: "eight", count: 3 },
        { label: "Other", count: 2 },
    ]);
});
