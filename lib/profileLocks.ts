import type { Prisma } from "@prisma/client";

type LockClient = Pick<Prisma.TransactionClient, "$queryRaw">;

export async function lockProfileUsernames(
  tx: LockClient,
  usernames: readonly (string | null | undefined)[]
): Promise<void> {
  // Stable lock ordering prevents deadlocks when a rename touches two names.
  const usernamesToLock = Array.from(
    new Set(
      usernames
        .map((username) => username?.trim().toLowerCase())
        .filter((username): username is string => Boolean(username))
    )
  ).sort();

  for (const username of usernamesToLock) {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${username}, 0))
    `;
  }
}

export async function lockProfileWorkspace(
  tx: LockClient,
  workspaceId: string
): Promise<void> {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${`workspace:${workspaceId}`}, 0))
  `;
}
