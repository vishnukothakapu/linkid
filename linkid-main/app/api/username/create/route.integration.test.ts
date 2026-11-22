import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import { after, before, mock, test } from "node:test";
import { NextRequest, NextResponse } from "next/server";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const sessionUserId = new AsyncLocalStorage<string>();
const userIds: string[] = [];
const workspaceIds: string[] = [];

type TestPrisma = typeof import("@/lib/prisma")["default"];
type UsernamePost = typeof import("./route")["POST"];

let prisma: TestPrisma | undefined;
let postUsername: UsernamePost | undefined;

before(async () => {
  if (!testDatabaseUrl) {
    return;
  }

  process.env.DATABASE_URL = testDatabaseUrl;

  mock.module("server-only", { defaultExport: {} });
  mock.module("next-auth", {
    namedExports: {
      getServerSession: async () => {
        const id = sessionUserId.getStore();
        return id ? { user: { id } } : null;
      },
    },
  });
  mock.module("@/lib/auth", {
    namedExports: { authOptions: {} },
  });
  mock.module("@/lib/rateLimit", {
    namedExports: {
      checkRateLimit: async () => true,
      rateLimitResponse: () =>
        NextResponse.json({ error: "Unexpected rate limit" }, { status: 429 }),
    },
  });
  mock.module("@/lib/profileCache", {
    namedExports: {
      invalidateProfileUsername: async () => {},
      writeThroughProfileCache: async () => {},
    },
  });
  mock.module("next/cache", {
    namedExports: { revalidateTag: () => {} },
  });

  prisma = (await import("@/lib/prisma")).default;
  await prisma.$connect();
  postUsername = (await import("./route")).POST;
});

after(async () => {
  if (!prisma) {
    return;
  }

  try {
    if (workspaceIds.length > 0) {
      await prisma.workspace.deleteMany({
        where: { id: { in: workspaceIds } },
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  } finally {
    await prisma.$disconnect();
  }
});

test(
  "serializes concurrent claims while a current username becomes an alias",
  { skip: !testDatabaseUrl && "Set TEST_DATABASE_URL to run PostgreSQL integration tests." },
  async () => {
    assert.ok(prisma);
    assert.ok(postUsername);

    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const aliasUsername = `alias${suffix}`;
    const ownerNewUsername = `owner${suffix}`;

    async function createWorkspace(username: string, label: string) {
      const user = await prisma!.user.create({
        data: {
          email: `${label}-${suffix}@example.test`,
          name: label,
        },
      });
      userIds.push(user.id);

      const workspace = await prisma!.workspace.create({
        data: {
          username,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });
      workspaceIds.push(workspace.id);

      return { userId: user.id, workspaceId: workspace.id };
    }

    const owner = await createWorkspace(aliasUsername, "owner");
    const contenders = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        createWorkspace(`c${suffix}${index}`, `contender-${index}`)
      )
    );

    const sendUsernameRequest = (userId: string, username: string, requestId: number) =>
      sessionUserId.run(userId, () =>
        postUsername!(
          new NextRequest("http://localhost/api/username/create", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-forwarded-for": `192.0.2.${requestId}`,
            },
            body: JSON.stringify({ username }),
          })
        )
      );

    const responses = await Promise.all([
      sendUsernameRequest(owner.userId, ownerNewUsername, 1),
      ...contenders.map((contender, index) =>
        sendUsernameRequest(contender.userId, aliasUsername, index + 2)
      ),
    ]);

    assert.equal(
      responses.filter((response) => response.status === 200).length,
      1
    );
    assert.equal(responses[0].status, 200);

    for (const response of responses.slice(1)) {
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        error: "Username already taken",
      });
    }

    const [alias, primaryClaims, ownerAfterRename] = await Promise.all([
      prisma.workspaceAlias.findUnique({ where: { username: aliasUsername } }),
      prisma.workspace.findMany({ where: { username: aliasUsername } }),
      prisma.workspace.findUnique({ where: { id: owner.workspaceId } }),
    ]);

    assert.equal(alias?.workspaceId, owner.workspaceId);
    assert.equal(primaryClaims.length, 0);
    assert.equal(ownerAfterRename?.username, ownerNewUsername);
  }
);
