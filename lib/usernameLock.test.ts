import assert from "node:assert/strict";
import test from "node:test";

import { acquireUsernameLock, UsernameTakenError } from "@/lib/usernameLock";

type Tx = Parameters<typeof acquireUsernameLock>[0];

test("acquireUsernameLock takes a transaction-scoped advisory lock on the username", async () => {
    const calls: Array<{ sql: string; values: unknown[] }> = [];
    const tx = {
        $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
            calls.push({ sql: strings.join("?"), values });
            return Promise.resolve([]);
        },
    };

    await acquireUsernameLock(tx as unknown as Tx, "Jane");

    assert.equal(calls.length, 1);
    // Transaction-scoped, so PostgreSQL releases it at commit/rollback.
    assert.match(calls[0].sql, /pg_advisory_xact_lock\(hashtext\(\?\)\)/);
    assert.deepEqual(calls[0].values, ["Jane"]);
});

test("acquireUsernameLock passes the raw username as the lock key", async () => {
    const values: unknown[] = [];
    const tx = {
        $queryRaw: (_strings: TemplateStringsArray, ...rest: unknown[]) => {
            values.push(...rest);
            return Promise.resolve([]);
        },
    };

    await acquireUsernameLock(tx as unknown as Tx, "case-sensitive-name");
    assert.deepEqual(values, ["case-sensitive-name"]);
});

test("UsernameTakenError carries the 409 message", () => {
    const error = new UsernameTakenError();
    assert.ok(error instanceof Error);
    assert.equal(error.name, "UsernameTakenError");
    assert.equal(error.message, "Username already taken");
});
