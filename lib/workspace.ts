import "server-only";
import prisma from "@/lib/prisma";
import type { Workspace, WorkspaceRole } from "@prisma/client";

export type WorkspaceWithRole = Workspace & { role: WorkspaceRole };

/**
 * Resolve the active workspace for a given user.
 *
 * Priority order:
 *  1. The workspace indicated by `workspaceId` (if the user is a member).
 *  2. The user's first OWNER workspace.
 *  3. Any workspace the user is a member of.
 *  4. Auto-migrated personal workspace (created from legacy User data).
 */
export async function resolveActiveWorkspace(
    userId: string,
    preferredWorkspaceId?: string | null
): Promise<WorkspaceWithRole | null> {
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
        orderBy: { createdAt: "asc" },
    });

    if (memberships.length === 0) {
        return autoMigratePersonalWorkspace(userId);
    }

    if (preferredWorkspaceId) {
        const preferred = memberships.find(
            (m) => m.workspaceId === preferredWorkspaceId
        );
        if (preferred) {
            return { ...preferred.workspace, role: preferred.role };
        }
    }

    const ownerMembership =
        memberships.find((m) => m.role === "OWNER") ?? memberships[0];

    return { ...ownerMembership.workspace, role: ownerMembership.role };
}

/**
 * Return all workspaces a user is a member of, with their role in each.
 */
export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
        orderBy: { createdAt: "asc" },
    });

    if (memberships.length === 0) {
        const ws = await autoMigratePersonalWorkspace(userId);
        return ws ? [ws] : [];
    }

    return memberships.map((m) => ({ ...m.workspace, role: m.role }));
}

/**
 * Auto-migrate a legacy user (who has no workspace yet) to the new model.
 * Creates a personal Workspace + WorkspaceMember (OWNER).
 */
async function autoMigratePersonalWorkspace(
    userId: string
): Promise<WorkspaceWithRole | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return prisma.$transaction(async (tx) => {
        // Re-check existing membership inside transaction to avoid race conditions
        const existingMembership = await tx.workspaceMember.findFirst({
            where: { userId },
            include: { workspace: true },
            orderBy: { createdAt: "asc" },
        });

        if (existingMembership) {
            return { ...existingMembership.workspace, role: existingMembership.role };
        }

        const workspace = await tx.workspace.create({
            data: {
                name: user.name ?? "My Workspace",
                members: {
                    create: {
                        userId,
                        role: "OWNER",
                    },
                },
            },
        });

        return { ...workspace, role: "OWNER" as WorkspaceRole };
    });
}

/**
 * Convenience: resolve the active workspace for a user email.
 */
export async function resolveWorkspaceByEmail(
    email: string,
    preferredWorkspaceId?: string | null
): Promise<WorkspaceWithRole | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return resolveActiveWorkspace(user.id, preferredWorkspaceId);
}

/**
 * Assert that a user is a member of a given workspace. Returns role or null.
 */
export async function getWorkspaceMembership(
    userId: string,
    workspaceId: string
): Promise<WorkspaceRole | null> {
    const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
    });
    return membership?.role ?? null;
}
