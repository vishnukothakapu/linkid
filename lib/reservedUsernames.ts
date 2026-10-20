/**
 * Names that collide with a static route or that are used for platform
 * identity. Next.js resolves static segments before the `[username]` route,
 * so a profile claiming one of these can never be reached at its canonical
 * URL. The list is lowercase and compared case-insensitively.
 */
const RESERVED_USERNAMES = new Set([
    "about",
    "account-deleted",
    "admin",
    "administrator",
    "analytics",
    "api",
    "apple-icon",
    "assets",
    "billing",
    "blog",
    "components",
    "contact",
    "contact-us",
    "dashboard",
    "docs",
    "documentation",
    "domain",
    "download",
    "extension-auth",
    "favicon",
    "forgot-password",
    "help",
    "home",
    "icon0",
    "icon1",
    "legal",
    "linkid",
    "login",
    "logout",
    "mail",
    "manifest",
    "official",
    "preview",
    "pricing",
    "privacy",
    "privacy-policy",
    "profile",
    "register",
    "reset-password",
    "robots",
    "root",
    "security",
    "settings",
    "signin",
    "signup",
    "sitemap",
    "static",
    "status",
    "support",
    "team",
    "terms",
    "user",
    "username",
    "workspace",
    "www",
]);

export function isReservedUsername(username: string): boolean {
    return RESERVED_USERNAMES.has(username.trim().toLowerCase());
}

export function getReservedUsernames(): readonly string[] {
    return [...RESERVED_USERNAMES];
}
