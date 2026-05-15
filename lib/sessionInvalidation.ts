declare global {
  var __invalidatedUsers: Set<string> | undefined;
}

const invalidatedUsers = globalThis.__invalidatedUsers ?? new Set<string>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__invalidatedUsers = invalidatedUsers;
}

export function invalidateUserSessions(userId: string): void {
  invalidatedUsers.add(userId);

  // Auto-cleanup after 24 hours
  setTimeout(() => {
    invalidatedUsers.delete(userId);
  }, 24 * 60 * 60 * 1000);
}

export function isUserSessionInvalidated(userId: string): boolean {
  return invalidatedUsers.has(userId);
}
