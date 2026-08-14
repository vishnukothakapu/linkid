import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Prisma, type Link } from "@prisma/client";

import { nestLinks } from "./linkTree";
import { cacheResolvedProfile, getProfileGeneration, readCachedResolvedProfile } from "./profileCache";

// Only public profile fields — never `password`, `email`, `emailVerified`, or
// TOTP columns. This object is cached in Redis and rendered into the
// public, unauthenticated profile tree, so credential material must not be here.
const publicProfileSelect = {
    id: true,
    name: true,
    username: true,
    bio: true,
    image: true,
    backgroundImage: true,
    theme: true,
    themeType: true,
    themeColor: true,
    themeCustom: true,
    layoutStyle: true,
    enableEmailCapture: true,
    seoTitle: true,
    seoDescription: true,
    isVerified: true,
    links: {
        where: { isPublic: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    },
} satisfies Prisma.UserSelect;

/**
 * Database-backed username resolution. This is the cache-miss path — it queries
 * PostgreSQL and is never memoized directly. Public caching lives in Redis
 * (see `resolveUserByUsername` below), keyed by user id so a single
 * `invalidateProfileCache(userId)` purge refreshes every alias at once.
 */
async function resolveUserByUsernameFromDb(username: string) {
    const exactUser = await prisma.user.findUnique({
        where: { username },
        select: publicProfileSelect,
    });

    if (exactUser) {
        const safeLinks = exactUser.links.map(l => ({ ...l, pinCode: (l as any).pinCode ? "locked" : null }));
        return { user: { ...exactUser, links: nestLinks(safeLinks as any) }, canonicalUsername: exactUser.username ?? username };
    }

    const alias = await prisma.userAlias.findUnique({
        where: { username },
    });

    if (!alias) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: alias.userId },
        select: publicProfileSelect,
    });

    if (!user) {
        return null;
    }
    const safeLinks = user.links.map(l => ({ ...l, pinCode: (l as any).pinCode ? "locked" : null }));
    return { user: { ...user, links: nestLinks(safeLinks as any) }, canonicalUsername: user.username ?? username };
}

export type ResolvedUserProfile = NonNullable<
    Awaited<ReturnType<typeof resolveUserByUsernameFromDb>>
>;

/**
 * Resolve a username (canonical or alias) to a public profile.
 *
 * Cache-first: reads the resolved payload from Redis, and only queries
 * PostgreSQL on a miss. Cache hits are served without touching the database.
 * Negatives (unknown usernames) are intentionally not cached so the 404 path
 * stays authoritative.
 */
export async function resolveUserByUsername(
    username: string
): Promise<ResolvedUserProfile | null> {
    const { userId: cachedOwnerId, payload } =
        await readCachedResolvedProfile<ResolvedUserProfile>(username);
    if (payload) {
        return payload;
    }

    // Pin the cache generation *before* the database read so a mutation that
    // invalidates the cache mid-read cannot have its stale payload written
    // back afterwards. When the index has no owner yet (first-ever cache),
    // there is nothing to pin — the write proceeds as before.
    const capturedGeneration =
        cachedOwnerId != null ? await getProfileGeneration(cachedOwnerId) : null;

    const resolved = await resolveUserByUsernameFromDb(username);
    if (resolved) {
        const ownerUnchanged =
            cachedOwnerId != null && cachedOwnerId === resolved.user.id;
        await cacheResolvedProfile(
            username,
            resolved.user.id,
            resolved,
            ownerUnchanged ? capturedGeneration : null
        );
    }
    return resolved;
}

/**
 * Get public user data including resume URL
 */
export const getPublicUserData = unstable_cache(
    async (username: string) => {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                image: true,
                resumeUrl: true,
            },
        });

        return user;
    },
    ["getPublicUserData"],
    { revalidate: 60, tags: ["public-profile"] }
);

/**
 * Get all users with a published (public) profile, for sitemap generation.
 * A profile is considered "published" once the user has claimed a username.
 */
export const getPublishedUsernames = unstable_cache(
    async () => {
        const users = await prisma.user.findMany({
            where: { username: { not: null } },
            select: { username: true, createdAt: true },
        });

        return users.filter(
            (u): u is { username: string; createdAt: Date } => u.username !== null
        );
    },
    ["getPublishedUsernames"],
    { revalidate: 3600, tags: ["public-profile"] }
);
