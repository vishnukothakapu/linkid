import assert from "node:assert/strict";
import test from "node:test";

import { enqueueJobSchema, supportedJobTypes } from "./jobs";

test("supportedJobTypes contains all known job types", () => {
    assert.ok(supportedJobTypes.includes("send-email"));
    assert.ok(supportedJobTypes.includes("recalculate-analytics"));
    assert.equal(supportedJobTypes.length, 2);
});

test("enqueueJobSchema rejects missing type", () => {
    const result = enqueueJobSchema.safeParse({});
    assert.equal(result.success, false);
});

test("enqueueJobSchema rejects unknown job type", () => {
    const result = enqueueJobSchema.safeParse({ type: "unknown-job" });
    assert.equal(result.success, false);
    if (!result.success) {
        assert.ok(result.error.issues.length > 0);
        assert.match(result.error.issues[0].message, /unsupported job type/i);
    }
});

test("enqueueJobSchema accepts valid send-email job", () => {
    const result = enqueueJobSchema.safeParse({
        type: "send-email",
        payload: { to: "user@example.com", subject: "Hello" },
    });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.type, "send-email");
        assert.deepEqual(result.data.payload, { to: "user@example.com", subject: "Hello" });
    }
});

test("enqueueJobSchema accepts valid recalculate-analytics job", () => {
    const result = enqueueJobSchema.safeParse({
        type: "recalculate-analytics",
        payload: { userId: "abc" },
    });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.type, "recalculate-analytics");
        assert.deepEqual(result.data.payload, { userId: "abc" });
    }
});

test("enqueueJobSchema rejects invalid scheduleAt (non-ISO string)", () => {
    const result = enqueueJobSchema.safeParse({
        type: "send-email",
        payload: {},
        scheduleAt: "not-a-date",
    });
    assert.equal(result.success, false);
});

test("enqueueJobSchema accepts valid scheduleAt", () => {
    const result = enqueueJobSchema.safeParse({
        type: "send-email",
        payload: {},
        scheduleAt: "2026-07-10T12:00:00.000Z",
    });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.data.scheduleAt, "2026-07-10T12:00:00.000Z");
    }
});

test("enqueueJobSchema defaults payload to empty object when omitted", () => {
    const result = enqueueJobSchema.safeParse({ type: "send-email" });
    assert.equal(result.success, true);
    if (result.success) {
        assert.deepEqual(result.data.payload, {});
    }
});

test("enqueueJobSchema rejects non-object payload", () => {
    const result = enqueueJobSchema.safeParse({ type: "send-email", payload: "string" });
    assert.equal(result.success, false);
});

test("enqueueJobSchema rejects null type", () => {
    const result = enqueueJobSchema.safeParse({ type: null, payload: {} });
    assert.equal(result.success, false);
});
