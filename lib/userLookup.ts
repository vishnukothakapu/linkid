import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

import { nestLinks } from "./linkTree";
import { cacheResolvedProfile, getProfileGeneration, readCachedResolvedProfile } from "./profileCache";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Shape a Workspace + its OWNER User into the public profile object that the
 * rest of the app expects (backward-compatible with the old User-based shape).
 */
const workspaceInclude = {
    members: {
        where: { role: "OWNER" as const },
        include: {
            user: {
                select: { image: true },
            },
        },
    },
    links: {
        where: { isPublic: true },
        orderBy: [
            { position: "asc" as const },
            { createdAt: "asc" as const },
        ],
    },
} satisfies Prisma.WorkspaceInclude;

type WorkspaceWithOwner = Prisma.WorkspaceGetPayload<{
    include: typeof workspaceInclude;
}>;

function shapeWorkspaceProfile(
    workspace: WorkspaceWithOwner,
    canonicalUsername: string
) {
    const owner = workspace.members.find((m) => m.role === "OWNER")?.user ?? null;

    const rawLinks = workspace.links ?? [];
    const safeLinks = rawLinks.map((l) => ({
        ...l,
        pinCode: l.pinCode ? "locked" : null,
    }));

    const user = {
        // Use workspace id as the profile id so downstream code that passes
        // this id to workspace-scoped APIs gets the right entity.
        id: workspace.id,
        name: workspace.name ?? null,
        username: workspace.username ?? null,
        bio: workspace.bio ?? null,
        // image comes from OWNER user, email is omitted for privacy in public lookup
        image: owner?.image ?? null,
        email: null,
        backgroundImage: workspace.backgroundImage ?? null,
        theme: workspace.theme,
        themeType: workspace.themeType,
        themeColor: workspace.themeColor,
        themeCustom: workspace.themeCustom ?? null,
        layoutStyle: workspace.layoutStyle,
        enableEmailCapture: workspace.enableEmailCapture,
        seoTitle: workspace.seoTitle ?? null,
        seoDescription: workspace.seoDescription ?? null,
        isVerified: workspace.isVerified,
        customDomain: workspace.customDomain ?? null,
        resumeUrl: workspace.resumeUrl ?? null,
        resumeDownloadCount: workspace.resumeDownloadCount,
        links: nestLinks(safeLinks as Parameters<typeof nestLinks>[0]),
        createdAt: workspace.createdAt,
    };

    return { user, canonicalUsername };
}

/**
 * Database-backed username resolution for workspaces.
 */
async function resolveUserByUsernameFromDb(username: string) {
    const exactWorkspace = await prisma.workspace.findUnique({
        where: { username },
        include: workspaceInclude,
    });

    if (exactWorkspace) {
        return shapeWorkspaceProfile(
            exactWorkspace,
            exactWorkspace.username ?? username
        );
    }

    const alias = await prisma.workspaceAlias.findUnique({
        where: { username },
    });

    if (!alias) return null;

    const aliasedWorkspace = await prisma.workspace.findUnique({
        where: { id: alias.workspaceId },
        include: workspaceInclude,
    });

    if (!aliasedWorkspace || !aliasedWorkspace.username) return null;

    return shapeWorkspaceProfile(
        aliasedWorkspace,
        aliasedWorkspace.username
    );
}

export type ResolvedUserProfile = NonNullable<
    Awaited<ReturnType<typeof resolveUserByUsernameFromDb>>
>;

/**
 * Resolve a username (canonical or alias) to a public profile.
 *
 * Cache-first: reads the resolved payload from Redis, and only queries
 * PostgreSQL on a miss. Cache hits are served without touching the database.
 */
export async function resolveUserByUsername(
    username: string
): Promise<ResolvedUserProfile | null> {
    const { userId: cachedOwnerId, payload } =
        await readCachedResolvedProfile<ResolvedUserProfile>(username);
    if (payload) {
        return payload;
    }

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
 * Get public workspace data including resume URL (used by resume download routes).
 */
export const getPublicUserData = unstable_cache(
    async (username: string) => {
        const workspace = await prisma.workspace.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                resumeUrl: true,
                members: {
                    where: { role: "OWNER" },
                    include: { user: { select: { image: true } } },
                    take: 1,
                },
            },
        });

        if (!workspace) return null;

        const owner = workspace.members[0]?.user ?? null;

        return {
            id: workspace.id,
            name: workspace.name ?? null,
            username: workspace.username ?? null,
            bio: workspace.bio ?? null,
            image: owner?.image ?? null,
            resumeUrl: workspace.resumeUrl ?? null,
        };
    },
    ["getPublicUserData"],
    { revalidate: 60, tags: ["public-profile"] }
);

/**
 * Get all workspaces with a published (public) profile, for sitemap generation.
 * A profile is considered "published" once the workspace has claimed a username.
 */
export const getPublishedUsernames = unstable_cache(
    async () => {
        const workspaces = await prisma.workspace.findMany({
            where: { username: { not: null } },
            select: { username: true, createdAt: true },
        });

        return workspaces.filter(
            (w): w is { username: string; createdAt: Date } => w.username !== null
        );
    },
    ["getPublishedUsernames"],
    { revalidate: 3600, tags: ["public-profile"] }
);

export async function resolveWorkspaceByUsernameOrAlias(username: string) {
    const exactWorkspace = await prisma.workspace.findUnique({
        where: { username },
        select: { id: true, username: true },
    });

    if (exactWorkspace) {
        return {
            workspaceId: exactWorkspace.id,
            canonicalUsername: exactWorkspace.username ?? username,
        };
    }

    const alias = await prisma.workspaceAlias.findUnique({
        where: { username },
    });

    if (!alias) return null;

    const aliasedWorkspace = await prisma.workspace.findUnique({
        where: { id: alias.workspaceId },
        select: { id: true, username: true },
    });

    if (!aliasedWorkspace) return null;

    return {
        workspaceId: aliasedWorkspace.id,
        canonicalUsername: aliasedWorkspace.username ?? username,
    };
}
