import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Prisma, type Link } from "@prisma/client";

import { nestLinks } from "./linkTree";

// Only public profile fields — never `password`, `email`, `emailVerified`, or
// TOTP columns. This object is cached by unstable_cache and rendered into the
// public, unauthenticated profile tree, so credential material must not be here.
const publicProfileSelect = {
    id: true,
    name: true,
    username: true,
    bio: true,
    image: true,
    theme: true,
    themeType: true,
    themeColor: true,
    themeCustom: true,
    layoutStyle: true,
    enableEmailCapture: true,
    seoTitle: true,
    seoDescription: true,
    links: {
        where: { isPublic: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    },
} satisfies Prisma.UserSelect;

export const resolveUserByUsername = unstable_cache(
    async (username: string) => {
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
    },
    ["resolveUserByUsername"],
    { revalidate: 60, tags: ["public-profile"] }
);

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
