export function isUsernameUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    meta?: { target?: unknown };
  };
  if (candidate.code !== "P2002") {
    return false;
  }

  const target = candidate.meta?.target;
  if (Array.isArray(target)) {
    return target.some(
      (field) =>
        typeof field === "string" && field.toLowerCase().includes("username")
    );
  }

  return typeof target === "string" && target.toLowerCase().includes("username");
}
