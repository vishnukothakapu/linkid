import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

let allowed = true;
const rateLimitKeys: string[] = [];
let lastLimit = 0;

mock.module("@/lib/userLookup", {
    namedExports: {
        resolveWorkspaceByUsernameOrAlias: async () => ({ workspaceId: "ws-1" }),
    },
});

const workspace = {
    id: "ws-1",
    name: "Alice",
    username: "alice",
    bio: null,
    members: [],
    links: [],
};

mock.module("@/lib/prisma", {
    defaultExport: {
        workspace: {
            findUnique: async () => workspace,
        },
    },
    namedExports: {
        prisma: {
            workspace: {
                findUnique: async () => workspace,
            },
        },
    },
});

mock.module("@/lib/generateResumePDF", {
    namedExports: {
        generateResumePDF: () => ({ type: "resume-document" }),
    },
});

mock.module("@react-pdf/renderer", {
    namedExports: {
        renderToBuffer: async () => Buffer.from("pdf-bytes"),
    },
});

mock.module("@/lib/rateLimit", {
    namedExports: {
        checkRateLimit: async (key: string, limit: number) => {
            rateLimitKeys.push(key);
            lastLimit = limit;
            return allowed;
        },
    },
});

let GET: (
    req: Request,
    context: { params: Promise<{ username: string }> }
) => Promise<Response>;

before(async () => {
    const route = await import("@/app/api/export/resume/[username]/route");
    GET = route.GET;
});

function makeRequest(headers: Record<string, string> = {}) {
    return new Request("http://localhost/api/export/resume/alice", { headers });
}

const context = { params: Promise.resolve({ username: "alice" }) };

test("uses the trusted client IP for the export limit", async () => {
    allowed = true;
    rateLimitKeys.length = 0;
    lastLimit = 0;

    const res = await GET(
        makeRequest({
            "x-real-ip": "203.0.113.9",
            "x-forwarded-for": "198.51.100.7",
        }),
        context
    );

    assert.equal(res.status, 200);
    assert.equal(rateLimitKeys.length, 1);
    assert.equal(rateLimitKeys[0], "resume-export:203.0.113.9");
    assert.equal(lastLimit, 10);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), Buffer.from("pdf-bytes"));
});

test("returns 429 with Retry-After when the limiter rejects", async () => {
    allowed = false;
    rateLimitKeys.length = 0;

    const res = await GET(makeRequest({ "x-real-ip": "203.0.113.9" }), context);

    assert.equal(res.status, 429);
    assert.equal(res.headers.get("retry-after"), "60");
    assert.equal(rateLimitKeys[0], "resume-export:203.0.113.9");
});
