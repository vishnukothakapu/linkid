import type { Prisma } from "@prisma/client";

/**
 * Serialize username claims per normalized username.
 *
 * `Workspace.username` and `WorkspaceAlias.username` are separate unique
 * indexes and no constraint spans the two tables, while every claim flow is
 * check-then-write. Two transactions can therefore both pass
 * `isProfileUsernameAvailable` and then write, leaving the same name on an
 * alias row and a primary row at once. `resolveUserByUsername` prefers the
 * primary row, so the name silently changes hands.
 *
 * A transaction-scoped advisory lock on `hashtext(username)` makes the check
 * and the write atomic without locking unrelated rows. PostgreSQL releases the
 * lock automatically at commit or rollback, so callers cannot forget to
 * unlock. Distinct names that hash to the same key only serialize against
 * each other, which is harmless.
 *
 * Callers must pass a transaction client: outside a transaction the lock is
 * released as soon as the statement completes and provides no protection.
 */
export async function acquireUsernameLock(
    tx: Prisma.TransactionClient,
    username: string
): Promise<void> {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${username}))`;
}

/**
 * Raised when the recheck performed while holding the username lock finds the
 * name taken. Callers map this to a 409 response.
 */
export class UsernameTakenError extends Error {
    constructor() {
        super("Username already taken");
        this.name = "UsernameTakenError";
    }
}
