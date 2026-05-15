/**
 * In-memory store of recently deleted user IDs.
 *
 * When a user deletes their account, their ID is added here.
 * The JWT callback checks this set on every request — if the
 * user ID is found, the token is invalidated immediately,
 * forcing sign-out on all devices.
 *
 * Entries auto-expire after 24 hours to prevent memory leaks.
 * Uses globalThis to persist across Next.js dev-mode hot reloads.
 */

// Persist across HMR in dev mode (same pattern as Prisma singleton)
declare global {
  var __invalidatedUsers: Set<string> | undefined;
}

const invalidatedUsers = globalThis.__invalidatedUsers ?? new Set<string>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__invalidatedUsers = invalidatedUsers;
}

/**
 * Marks a user's sessions as invalidated across all devices.
 * Call this BEFORE deleting the user from the database.
 */
export function invalidateUserSessions(userId: string): void {
  invalidatedUsers.add(userId);

  // Auto-cleanup after 24 hours
  setTimeout(() => {
    invalidatedUsers.delete(userId);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Checks whether a user's sessions have been invalidated.
 */
export function isUserSessionInvalidated(userId: string): boolean {
  return invalidatedUsers.has(userId);
}
