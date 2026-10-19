import assert from "node:assert/strict";
import test from "node:test";

import {
    activeLinkWhere,
    filterActiveLinks,
    isLinkActive,
} from "@/lib/linkVisibility";

const NOW = new Date("2026-01-15T12:00:00.000Z");
const PAST = new Date("2026-01-01T00:00:00.000Z");
const FUTURE = new Date("2026-02-01T00:00:00.000Z");

test("isLinkActive allows links without any schedule", () => {
    assert.equal(isLinkActive({}, NOW), true);
    assert.equal(isLinkActive({ startDate: null, endDate: null }, NOW), true);
});

test("isLinkActive rejects links that start in the future", () => {
    assert.equal(isLinkActive({ startDate: FUTURE }, NOW), false);
});

test("isLinkActive allows links that already started", () => {
    assert.equal(isLinkActive({ startDate: PAST }, NOW), true);
});

test("isLinkActive rejects links whose window has ended", () => {
    assert.equal(isLinkActive({ endDate: PAST }, NOW), false);
});

test("isLinkActive allows links that end in the future", () => {
    assert.equal(isLinkActive({ endDate: FUTURE }, NOW), true);
});

test("isLinkActive treats both bounds as inclusive", () => {
    assert.equal(isLinkActive({ startDate: NOW }, NOW), true);
    assert.equal(isLinkActive({ endDate: NOW }, NOW), true);
});

test("isLinkActive accepts ISO strings as well as Date objects", () => {
    assert.equal(isLinkActive({ startDate: FUTURE.toISOString() }, NOW), false);
    assert.equal(isLinkActive({ endDate: PAST.toISOString() }, NOW), false);
    assert.equal(isLinkActive({ startDate: PAST.toISOString() }, NOW), true);
});

test("filterActiveLinks keeps only the links inside their window", () => {
    const links = [
        { id: "always", startDate: null, endDate: null },
        { id: "scheduled", startDate: FUTURE, endDate: null },
        { id: "expired", startDate: null, endDate: PAST },
        { id: "running", startDate: PAST, endDate: FUTURE },
    ];

    assert.deepEqual(
        filterActiveLinks(links, NOW).map((link) => link.id),
        ["always", "running"]
    );
});

test("activeLinkWhere builds the null-or-in-range clauses", () => {
    assert.deepEqual(activeLinkWhere(NOW), {
        OR: [{ startDate: null }, { startDate: { lte: NOW } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: NOW } }] }],
    });
});
