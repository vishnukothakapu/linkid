export const usernameRegex = /^[a-zA-Z0-9-]+$/;

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: "Username is required" };
  }
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, and hyphens.",
    };
  }
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (username.length > 30) {
    return { valid: false, error: "Username must be under 30 characters" };
  }
  return { valid: true };
}
