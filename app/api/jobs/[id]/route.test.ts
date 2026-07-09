import assert from "node:assert/strict";
import { mock, test, before } from "node:test";

let mockSession: unknown = null;
let mockJob: unknown = null;

mock.module("next-auth", {
    namedExports: {
        getServerSession: () => Promise.resolve(mockSession),
    },
});

mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
});

mock.module("@/lib/prisma", {
    defaultExport: {
        job: {
            findUnique: () => Promise.resolve(mockJob),
        },
    },
    namedExports: {
        prisma: {
            job: {
                findUnique: () => Promise.resolve(mockJob),
            },
        },
    },
});

let GET: (...args: unknown[]) => Promise<Response>;

before(async () => {
    const route = await import("./route");
    GET = route.GET;
});

function getCtx(id = "test-job-id") {
    return { params: Promise.resolve({ id }) };
}

test("GET 401 — no session", async () => {
    mockSession = null;
    const res = await GET(new Request("http://localhost/api/jobs/test"), getCtx());
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "Unauthorized" });
});

test("GET 404 — job not found", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockJob = null;
    const res = await GET(new Request("http://localhost/api/jobs/missing"), getCtx("missing"));
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "not found" });
});

test("GET 200 — job found", async () => {
    mockSession = { user: { email: "user@example.com" } };
    mockJob = { id: "job-1", type: "send-email", status: "COMPLETED" };
    const res = await GET(new Request("http://localhost/api/jobs/job-1"), getCtx("job-1"));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, "job-1");
    assert.equal(body.type, "send-email");
});
