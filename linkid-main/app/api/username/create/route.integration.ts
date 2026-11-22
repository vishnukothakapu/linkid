import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import { after, before, mock, test } from "node:test";
import { NextRequest, NextResponse } from "next/server";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("Set TEST_DATABASE_URL to run PostgreSQL integration tests.");
}
const sessionUserId = new AsyncLocalStorage<string>();
const userIds: string[] = [];
const workspaceIds: string[] = [];
const mergeRequestIds: string[] = [];

type TestPrisma = typeof import("@/lib/prisma")["default"];
type UsernamePost = typeof import("./route")["POST"];

let prisma: TestPrisma | undefined;
let postUsername: UsernamePost | undefined;

before(async () => {
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
    if (mergeRequestIds.length > 0) {
      await prisma.accountMergeRequest.deleteMany({
        where: { id: { in: mergeRequestIds } },
      });
    }

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

test(
  "serializes account-merge alias transfer against concurrent username claims",
  async () => {
    assert.ok(prisma);
    assert.ok(postUsername);

    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const sourceUsername = `source${suffix}`;
    const targetUsername = `target${suffix}`;
    const mergeCode = `LNK-${suffix.slice(0, 6)}-${suffix.slice(6, 12)}`;

    async function createWorkspace(username: string, label: string) {
      const email = `${label}-${suffix}@example.test`;
      const user = await prisma!.user.create({
        data: { email, name: label },
      });
      userIds.push(user.id);

      const workspace = await prisma!.workspace.create({
        data: {
          username,
          members: {
            create: { userId: user.id, role: "OWNER" },
          },
        },
      });
      workspaceIds.push(workspace.id);

      return { userId: user.id, workspaceId: workspace.id, email };
    }

    const source = await createWorkspace(sourceUsername, "merge-source");
    const target = await createWorkspace(targetUsername, "merge-target");
    const contenders = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        createWorkspace(`m${suffix}${index}`, `merge-contender-${index}`)
      )
    );

    const { hashMergeCode } = await import("@/lib/accountMergeUtils");
    const mergeRequest = await prisma.accountMergeRequest.create({
      data: {
        targetUserId: target.userId,
        codeHash: hashMergeCode(mergeCode),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    mergeRequestIds.push(mergeRequest.id);

    const { completeAccountMerge } = await import("@/lib/accountMerge");
    const mergeResult = completeAccountMerge({
      sourceUserId: source.userId,
      code: mergeCode,
      confirmEmail: source.email,
    });

    const claimResponses = Promise.all(
      contenders.map((contender, index) =>
        sessionUserId.run(contender.userId, () =>
          postUsername!(
            new NextRequest("http://localhost/api/username/create", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-forwarded-for": `198.51.100.${index + 1}`,
              },
              body: JSON.stringify({ username: sourceUsername }),
            })
          )
        )
      )
    );

    const [mergeOutcome, claimOutcome] = await Promise.allSettled([
      mergeResult,
      claimResponses,
    ]);
    if (mergeOutcome.status === "rejected") {
      throw mergeOutcome.reason;
    }
    if (claimOutcome.status === "rejected") {
      throw claimOutcome.reason;
    }
    const responses = claimOutcome.value;

    for (const response of responses) {
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        error: "Username already taken",
      });
    }

    const [alias, primaryClaims, targetAfterMerge] = await Promise.all([
      prisma.workspaceAlias.findUnique({ where: { username: sourceUsername } }),
      prisma.workspace.findMany({ where: { username: sourceUsername } }),
      prisma.workspace.findUnique({ where: { id: target.workspaceId } }),
    ]);

    assert.equal(alias?.workspaceId, target.workspaceId);
    assert.equal(primaryClaims.length, 0);
    assert.equal(targetAfterMerge?.username, targetUsername);
  }
);
