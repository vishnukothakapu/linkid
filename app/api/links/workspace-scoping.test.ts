import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import { NextRequest } from "next/server";
const scopes: string[] = [];
const writes: unknown[] = [];
mock.module("next-auth", {
  namedExports: { getServerSession: async () => ({ user: { id: "editor" } }) },
});
mock.module("@/lib/auth", { namedExports: { authOptions: {} } });
mock.module("@/lib/workspace", {
  namedExports: {
    resolveActiveWorkspace: async (_user: string, preferred: string) => {
      scopes.push(preferred);
      return preferred === "delegated"
        ? { id: preferred, role: "EDITOR" }
        : null;
    },
  },
});
mock.module("@/lib/rateLimit", {
  namedExports: {
    checkRateLimit: async () => true,
    rateLimitResponse: () => new Response(null, { status: 429 }),
  },
});
mock.module("@/lib/profileCache", {
  namedExports: {
    invalidateProfileCache: async () => {},
    writeThroughProfileCache: async () => {},
  },
});
mock.module("@/lib/pusher", {
  namedExports: { triggerPusherEvent: async () => {} },
});
const link = {
  findMany: async (args: { where: { workspaceId: string } }) => {
    assert.equal(args.where.workspaceId, "delegated");
    return [{ id: "link", parentId: null, isGroup: false, position: 0 }];
  },
  aggregate: async () => ({ _max: { position: 0 } }),
  count: async () => 0,
  create: async (args: unknown) => {
    writes.push(args);
    return { id: "group" };
  },
  updateMany: async (args: unknown) => {
    writes.push(args);
    return { count: 1 };
  },
};
mock.module("@/lib/prisma", {
  defaultExport: {
    link,
    $transaction: async (fn: (tx: unknown) => unknown) => fn({ link }),
  },
});
let routes: typeof import("./route"), reorder: typeof import("./reorder/route");
before(async () => {
  routes = await import("./route");
  reorder = await import("./reorder/route");
});
beforeEach(() => {
  writes.length = 0;
  scopes.length = 0;
});
const request = (method: string, body?: unknown, workspace = "delegated") =>
  new NextRequest("http://localhost/api/links", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-workspace-id": workspace,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
test("editor list and create are scoped to the explicit delegated workspace", async () => {
  assert.equal((await routes.GET(request("GET"))).status, 200);
  assert.equal(
    (await routes.POST(request("POST", { isGroup: true, label: "Group" })))
      .status,
    200,
  );
  assert.deepEqual(scopes, ["delegated", "delegated"]);
  assert.equal(
    (writes[0] as { data: { workspaceId: string } }).data.workspaceId,
    "delegated",
  );
});
test("editor reorder writes only to the delegated workspace", async () => {
  assert.equal(
    (await reorder.POST(request("POST", { orderedIds: ["link"] }))).status,
    200,
  );
  assert.equal(
    (writes[0] as { where: { workspaceId: string } }).where.workspaceId,
    "delegated",
  );
});
test("foreign explicit IDs cannot create or reorder in a fallback workspace", async () => {
  assert.equal(
    (
      await routes.POST(
        request("POST", { isGroup: true, label: "Group" }, "foreign"),
      )
    ).status,
    404,
  );
  assert.equal(
    (await reorder.POST(request("POST", { orderedIds: ["link"] }, "foreign")))
      .status,
    404,
  );
  assert.deepEqual(writes, []);
});
