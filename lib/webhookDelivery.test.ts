import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

const validatedUrls: string[] = [];

mock.module("@/lib/ssrf", {
    namedExports: {
        validateWebhookUrl: async (url: string) => {
            validatedUrls.push(url);
        },
    },
});

let deliverWebhook: typeof import("@/lib/webhookDelivery").deliverWebhook;

before(async () => {
    const mod = await import("@/lib/webhookDelivery");
    deliverWebhook = mod.deliverWebhook;
});

const input = {
    url: "https://example.com/hooks/linkid",
    signature: "sha256=abc",
    body: { event: "click", id: "evt_1" },
};

test("sends a signed POST with a timeout signal", async () => {
    validatedUrls.length = 0;
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    const fetchImpl: typeof fetch = async (requestInput, requestInit) => {
        requests.push({ input: requestInput, init: requestInit });
        return new Response(null, { status: 204 });
    };

    await deliverWebhook(input, { fetchImpl, timeoutMs: 5_000 });

    assert.deepEqual(validatedUrls, [input.url]);
    assert.equal(requests.length, 1);

    const request = requests[0];
    assert.ok(request);
    assert.equal(request.input, input.url);
    assert.equal(request.init?.method, "POST");
    assert.equal(request.init?.redirect, "error");
    assert.equal(
        (request.init?.headers as Record<string, string>)["x-linkid-signature"],
        input.signature
    );
    assert.equal(request.init?.body, JSON.stringify(input.body));
    assert.ok(request.init?.signal instanceof AbortSignal);
});

test("surfaces a non-2xx response", async () => {
    const fetchImpl: typeof fetch = async () => new Response(null, { status: 503 });

    await assert.rejects(
        deliverWebhook(input, { fetchImpl, timeoutMs: 5_000 }),
        /Webhook dispatch failed with status: 503/
    );
});

test("aborts a receiver that never responds", async () => {
    const fetchImpl: typeof fetch = (_requestInput, requestInit) =>
        new Promise((_resolve, reject) => {
            requestInit?.signal?.addEventListener("abort", () => {
                reject(requestInit.signal?.reason);
            });
        });

    await assert.rejects(
        deliverWebhook(input, { fetchImpl, timeoutMs: 20 }),
        /Webhook delivery timed out after 20ms/
    );
});
