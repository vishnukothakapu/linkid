// lib/reservedUsernames.ts
export const RESERVED_USERNAMES = new Set([
  // App Router path conflicts
  'api', 'app', 'auth', '_next',
  // Admin paths
  'admin', 'administrator', 'root', 'superuser', 'moderator',
  // Auth routes
  'login', 'logout', 'register', 'signup', 'signin', 'signout',
  'callback', 'verify', 'reset', 'forgot', 'onboarding',
  // Dashboard routes
  'dashboard', 'settings', 'profile', 'account',
  // Brand reserved
  'linkid', 'support', 'help', 'docs', 'blog', 'about',
  'contact', 'terms', 'privacy', 'security', 'status',
  // Generic abuse targets
  'null', 'undefined', 'anonymous', 'test', 'demo', 'example',
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase().trim());
}