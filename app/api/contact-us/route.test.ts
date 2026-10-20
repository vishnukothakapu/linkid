import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

const rateLimitKeys: string[] = [];
let allowed = true;

mock.module("@/lib/email", {
    namedExports: {
        sendSupportEmail: async () => undefined,
    },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: async (key: string) => {
            rateLimitKeys.push(key);
            return allowed;
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let POST: (...args: any[]) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/contact-us/route");
    POST = route.POST;
});

function makeRequest(headers: Record<string, string>) {
    return new Request("http://localhost/api/contact-us", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...headers,
        },
        body: JSON.stringify({
            name: "Alice",
            email: "alice@example.com",
            subject: "Hello",
            description: "A message",
        }),
    });
}

test("keys the rate limit on x-real-ip, not x-forwarded-for", async () => {
    rateLimitKeys.length = 0;
    allowed = true;

    const res = await POST(
        makeRequest({
            "x-real-ip": "203.0.113.9",
            "x-forwarded-for": "198.51.100.7",
        })
    );

    assert.equal(res.status, 200);
    assert.deepEqual(rateLimitKeys, ["contact-us:203.0.113.9"]);
});

test("rotating x-forwarded-for does not create new buckets", async () => {
    rateLimitKeys.length = 0;
    allowed = true;

    await POST(
        makeRequest({
            "x-real-ip": "203.0.113.9",
            "x-forwarded-for": "198.51.100.1",
        })
    );
    await POST(
        makeRequest({
            "x-real-ip": "203.0.113.9",
            "x-forwarded-for": "198.51.100.2",
        })
    );

    assert.equal(rateLimitKeys.length, 2);
    assert.equal(rateLimitKeys[0], rateLimitKeys[1]);
});

test("returns 429 when the limiter rejects the request", async () => {
    rateLimitKeys.length = 0;
    allowed = false;

    const res = await POST(makeRequest({ "x-real-ip": "203.0.113.9" }));

    assert.equal(res.status, 429);
});
