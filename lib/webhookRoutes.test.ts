import assert from "node:assert/strict";
import { test, mock, before } from "node:test";
let role = "EDITOR",
  userId: string | null = "editor";
mock.module("next-auth", {
  namedExports: {
    getServerSession: async () => (userId ? { user: { id: userId } } : null),
  },
});
mock.module("./auth", { namedExports: { authOptions: {} } });
mock.module("./prisma", {
  defaultExport: {
    workspaceMember: { findUnique: async () => ({ role }) },
    webhookDelivery: {
      findMany: async (args: {
        where: { workspaceId: string };
        take: number;
        select: object;
      }) => {
        assert.equal(args.where.workspaceId, "team");
        assert.equal(args.take, 10);
        assert.ok(!("webhookSecret" in args.select));
        return [];
      },
    },
  },
});
mock.module("./rateLimit", {
  namedExports: { checkRateLimit: async () => true },
});
mock.module("./webhooks", {
  namedExports: {
    enqueueWorkspaceWebhook: async () => null,
    dispatchWebhook: async () => null,
  },
});
let webhookRoute: typeof import("./webhookRoutes").webhookRoute;
before(async () => {
  webhookRoute = (await import("./webhookRoutes")).webhookRoute;
});
const request = () =>
  new Request("http://localhost/api/settings/webhook/deliveries", {
    headers: { "x-workspace-id": "team" },
  });
test("editors cannot read delivery payloads or trigger tests", async () => {
  role = "EDITOR";
  assert.equal((await webhookRoute(request(), false)).status, 403);
  assert.equal((await webhookRoute(request(), true)).status, 403);
});
test("owners receive bounded logs for only the requested workspace", async () => {
  role = "OWNER";
  assert.deepEqual(await (await webhookRoute(request(), false)).json(), {
    deliveries: [],
  });
});
test("anonymous callers cannot read delivery logs", async () => {
  userId = null;
  assert.equal((await webhookRoute(request(), false)).status, 401);
});
