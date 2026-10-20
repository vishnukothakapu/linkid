import assert from "node:assert/strict";
import { test } from "node:test";

import { isLinkWithinSchedule } from "@/lib/linkSchedule";

const now = new Date("2026-10-20T12:00:00.000Z");

test("links without boundaries are always visible", () => {
    assert.equal(isLinkWithinSchedule({}, now), true);
    assert.equal(isLinkWithinSchedule({ startDate: null, endDate: null }, now), true);
});

test("a link with a future start date is hidden", () => {
    assert.equal(
        isLinkWithinSchedule({ startDate: new Date("2026-10-20T12:00:01.000Z") }, now),
        false
    );
});

test("a link with a past end date is hidden", () => {
    assert.equal(
        isLinkWithinSchedule({ endDate: new Date("2026-10-20T11:59:59.000Z") }, now),
        false
    );
});

test("a link inside both boundaries is visible", () => {
    assert.equal(
        isLinkWithinSchedule(
            {
                startDate: new Date("2026-10-19T12:00:00.000Z"),
                endDate: new Date("2026-10-21T12:00:00.000Z"),
            },
            now
        ),
        true
    );
});

test("string dates from a serialized payload are handled", () => {
    assert.equal(isLinkWithinSchedule({ startDate: "2026-10-19T00:00:00.000Z" }, now), true);
    assert.equal(isLinkWithinSchedule({ endDate: "2026-10-19T00:00:00.000Z" }, now), false);
});

test("an invalid boundary fails closed", () => {
    assert.equal(isLinkWithinSchedule({ startDate: "not-a-date" }, now), false);
    assert.equal(isLinkWithinSchedule({ endDate: "not-a-date" }, now), false);
});
