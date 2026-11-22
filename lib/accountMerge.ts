import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { buildMergedPlatformSlug, generateMergeCode, hashMergeCode } from "@/lib/accountMergeUtils";
import { resolveActiveWorkspace } from "@/lib/workspace";
import {
    lockProfileUsernames,
    lockProfileWorkspace,
} from "@/lib/profileLocks";

export class MergeError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "MergeError";
        this.status = status;
    }
}

async function verifyMergeConfirmation(
    userId: string,
    confirmation: { password?: string; confirmEmail?: string }
) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, email: true },
    });

    if (user?.password) {
        if (!confirmation.password) {
            throw new MergeError("Password confirmation is required", 400);
        }

        const isValid = await bcrypt.compare(confirmation.password, user.password);
        if (!isValid) {
            throw new MergeError("Password confirmation failed", 401);
        }
        return;
    }

    if (user?.email) {
        const provided = confirmation.confirmEmail?.trim().toLowerCase();
        if (!provided) {
            throw new MergeError(
                "Please re-enter your account email to confirm this merge",
                400
            );
        }
        if (provided !== user.email.toLowerCase()) {
            throw new MergeError("Email confirmation did not match", 401);
        }
        return;
    }

    throw new MergeError("This account cannot be verified for merge", 400);
}

export async function createMergeRequest(input: {
    targetUserId: string;
    password?: string;
    confirmEmail?: string;
}) {
    await verifyMergeConfirmation(input.targetUserId, {
        password: input.password,
        confirmEmail: input.confirmEmail,
    });

    const code = generateMergeCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.accountMergeRequest.create({
        data: {
            targetUserId: input.targetUserId,
            codeHash: hashMergeCode(code),
            expiresAt,
        },
    });

    return {
        code,
        expiresAt,
    };
}

function uniqueTransferPlatform(input: {
    platform: string;
    sourceIdentifier: string;
    existingPlatforms: Set<string>;
}) {
    return buildMergedPlatformSlug(input);
}

export async function completeAccountMerge(input: {
    sourceUserId: string;
    code: string;
    password?: string;
    confirmEmail?: string;
}) {
    const requestCodeHash = hashMergeCode(input.code);
    const mergeRequest = await prisma.accountMergeRequest.findUnique({
        where: { codeHash: requestCodeHash },
    });

    if (!mergeRequest) {
        throw new MergeError("Invalid or expired merge code", 404);
    }

    if (mergeRequest.consumedAt) {
        throw new MergeError("This merge code has already been used", 409);
    }

    if (mergeRequest.expiresAt.getTime() < Date.now()) {
        throw new MergeError("This merge code has expired", 410);
    }

    if (mergeRequest.targetUserId === input.sourceUserId) {
        throw new MergeError("You cannot merge an account into itself", 400);
    }

    await verifyMergeConfirmation(input.sourceUserId, {
        password: input.password,
        confirmEmail: input.confirmEmail,
    });

    // Load basic user records (auth credentials only — profile data is in workspaces).
    const [sourceUser, targetUser] = await Promise.all([
        prisma.user.findUnique({
            where: { id: input.sourceUserId },
            include: { accounts: true, sessions: true },
        }),
        prisma.user.findUnique({
            where: { id: mergeRequest.targetUserId },
            include: { accounts: true, sessions: true },
        }),
    ]);

    if (!sourceUser || !targetUser) {
        throw new MergeError("One of the accounts no longer exists", 404);
    }

    // Resolve the personal (OWNER) workspace for the source user and active workspace for target user.
    const [sourceOwnerMember, targetWorkspace] = await Promise.all([
        prisma.workspaceMember.findFirst({
            where: { userId: sourceUser.id, role: "OWNER" },
            include: { workspace: true },
            orderBy: { createdAt: "asc" },
        }),
        resolveActiveWorkspace(targetUser.id),
    ]);

    if (!sourceOwnerMember || !targetWorkspace) {
        throw new MergeError("Could not resolve workspace for one of the accounts", 404);
    }
    const sourceWorkspace = { ...sourceOwnerMember.workspace, role: sourceOwnerMember.role };

    // Load workspace links for merge planning.
    const [sourceLinks, targetLinks] = await Promise.all([
        prisma.link.findMany({
            where: { workspaceId: sourceWorkspace.id },
            orderBy: { position: "asc" },
        }),
        prisma.link.findMany({
            where: { workspaceId: targetWorkspace.id },
            orderBy: { position: "asc" },
        }),
    ]);

    const targetPlatformSet = new Set<string>(targetLinks.map((link) => link.platform));
    const basePosition = targetLinks.reduce(
        (maxPosition, link) => Math.max(maxPosition, link.position),
        0
    );
    const sourceIdentifier = sourceWorkspace.username ?? sourceUser.id.slice(0, 8);
    const conflicts: string[] = [];
    let mergedLinks = 0;
    const finalTargetUsername = targetWorkspace.username ?? sourceWorkspace.username ?? null;

    // Merge workspace profile fields from source → target (workspace level).
    const workspaceUpdateData: Prisma.WorkspaceUpdateInput = {};
    if (sourceWorkspace.name && !targetWorkspace.name) workspaceUpdateData.name = sourceWorkspace.name;
    if (sourceWorkspace.bio && !targetWorkspace.bio) workspaceUpdateData.bio = sourceWorkspace.bio;
    if (!targetWorkspace.username && sourceWorkspace.username) workspaceUpdateData.username = sourceWorkspace.username;

    const deletedSubscribers = await prisma.$transaction(async (tx) => {
        const workspaceIds = [sourceWorkspace.id, targetWorkspace.id].sort();
        for (const workspaceId of workspaceIds) {
            await lockProfileWorkspace(tx, workspaceId);
        }

        const [currentSourceWorkspace, currentTargetWorkspace, currentMergeRequest] =
            await Promise.all([
                tx.workspace.findUnique({
                    where: { id: sourceWorkspace.id },
                    select: { id: true, username: true },
                }),
                tx.workspace.findUnique({
                    where: { id: targetWorkspace.id },
                    select: { id: true, username: true },
                }),
                tx.accountMergeRequest.findUnique({
                    where: { id: mergeRequest.id },
                }),
            ]);

        if (!currentSourceWorkspace || !currentTargetWorkspace) {
            throw new MergeError("One of the workspaces no longer exists", 409);
        }
        if (
            currentSourceWorkspace.username !== sourceWorkspace.username ||
            currentTargetWorkspace.username !== targetWorkspace.username
        ) {
            throw new MergeError(
                "A workspace username changed during the merge. Please try again.",
                409
            );
        }
        if (
            !currentMergeRequest ||
            currentMergeRequest.consumedAt ||
            currentMergeRequest.expiresAt.getTime() < Date.now()
        ) {
            throw new MergeError("This merge code is no longer available", 409);
        }

        const sourceAliases = await tx.workspaceAlias.findMany({
            where: { workspaceId: sourceWorkspace.id },
            select: { username: true },
        });
        await lockProfileUsernames(tx, [
            sourceWorkspace.username,
            targetWorkspace.username,
            ...sourceAliases.map((alias) => alias.username),
        ]);

        if (sourceWorkspace.username) {
            const existingAlias = await tx.workspaceAlias.findUnique({
                where: { username: sourceWorkspace.username },
            });
            if (
                existingAlias &&
                existingAlias.workspaceId !== sourceWorkspace.id &&
                existingAlias.workspaceId !== targetWorkspace.id
            ) {
                throw new MergeError("Username already taken", 409);
            }
        }

        const transactionOperations: Prisma.PrismaPromise<unknown>[] = [];

        const userUpdateData: Prisma.UserUpdateInput = {};
        if (sourceUser.name && !targetUser.name) userUpdateData.name = sourceUser.name;
        if (sourceUser.image && !targetUser.image) userUpdateData.image = sourceUser.image;
        if (sourceUser.emailVerified && !targetUser.emailVerified) userUpdateData.emailVerified = sourceUser.emailVerified;

        if (Object.keys(userUpdateData).length > 0) {
            transactionOperations.push(
                tx.user.update({ where: { id: targetUser.id }, data: userUpdateData })
            );
        }

        if (workspaceUpdateData.username) {
            transactionOperations.push(
                tx.workspace.update({
                    where: { id: sourceWorkspace.id },
                    data: { username: null },
                })
            );
        }

        if (Object.keys(workspaceUpdateData).length > 0) {
            transactionOperations.push(
                tx.workspace.update({
                    where: { id: targetWorkspace.id },
                    data: workspaceUpdateData,
                })
            );
        }

        const shouldAliasSourceUsername = Boolean(
            sourceWorkspace.username &&
            targetWorkspace.username &&
            sourceWorkspace.username !== targetWorkspace.username
        );
        if (shouldAliasSourceUsername && sourceWorkspace.username) {
            transactionOperations.push(
                tx.workspaceAlias.upsert({
                    where: { username: sourceWorkspace.username },
                    update: { workspaceId: targetWorkspace.id },
                    create: {
                        username: sourceWorkspace.username,
                        workspaceId: targetWorkspace.id,
                    },
                })
            );
        }

        const mergeCandidatePlatforms = new Set<string>(targetPlatformSet);
        for (const link of sourceLinks) {
            let platform = link.platform;
            if (mergeCandidatePlatforms.has(platform)) {
                platform = uniqueTransferPlatform({
                    platform,
                    sourceIdentifier,
                    existingPlatforms: mergeCandidatePlatforms,
                });
                conflicts.push(link.platform);
            }

            transactionOperations.push(
                tx.link.update({
                    where: { id: link.id },
                    data: {
                        workspaceId: targetWorkspace.id,
                        platform,
                        position: basePosition + mergedLinks + 1,
                    },
                })
            );
            mergeCandidatePlatforms.add(platform);
            mergedLinks += 1;
        }

        transactionOperations.push(
            tx.clickEvent.updateMany({
                where: { workspaceId: sourceWorkspace.id },
                data: { workspaceId: targetWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.dailyLinkAnalytics.updateMany({
                where: { workspaceId: sourceWorkspace.id },
                data: { workspaceId: targetWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.workspaceAlias.updateMany({
                where: { workspaceId: sourceWorkspace.id },
                data: { workspaceId: targetWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.usernameHistory.updateMany({
                where: { workspaceId: sourceWorkspace.id },
                data: { workspaceId: targetWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.profileVersion.updateMany({
                where: { workspaceId: sourceWorkspace.id },
                data: { workspaceId: targetWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.profilePreviewToken.updateMany({
                where: { workspaceId: sourceWorkspace.id },
                data: { workspaceId: targetWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.profileDraft.deleteMany({
                where: { workspaceId: sourceWorkspace.id },
            })
        );

        let deletedSubscriberCount = 0;
        const [sourceSubscribers, targetSubscribers] = await Promise.all([
            tx.subscriber.findMany({
                where: { workspaceId: sourceWorkspace.id },
            }),
            tx.subscriber.findMany({
                where: { workspaceId: targetWorkspace.id },
                select: { email: true },
            }),
        ]);
        const targetEmailSet = new Set(
            targetSubscribers.map((subscriber) => subscriber.email.toLowerCase())
        );

        for (const subscriber of sourceSubscribers) {
            if (!targetEmailSet.has(subscriber.email.toLowerCase())) {
                transactionOperations.push(
                    tx.subscriber.update({
                        where: { id: subscriber.id },
                        data: { workspaceId: targetWorkspace.id },
                    })
                );
                targetEmailSet.add(subscriber.email.toLowerCase());
            } else {
                deletedSubscriberCount += 1;
                transactionOperations.push(
                    tx.subscriber.delete({ where: { id: subscriber.id } })
                );
            }
        }

        transactionOperations.push(
            tx.account.updateMany({
                where: { userId: sourceUser.id },
                data: { userId: targetUser.id },
            })
        );
        transactionOperations.push(
            tx.session.updateMany({
                where: { userId: sourceUser.id },
                data: { userId: targetUser.id },
            })
        );
        transactionOperations.push(
            tx.accountMergeEvent.create({
                data: {
                    sourceUserId: sourceUser.id,
                    targetUserId: targetUser.id,
                    sourceEmail: sourceUser.email,
                    targetEmail: targetUser.email,
                    sourceUsername: sourceWorkspace.username,
                    targetUsername: finalTargetUsername,
                    mergedLinks,
                    mergedAccounts: sourceUser.accounts.length,
                    transferredSessions: sourceUser.sessions.length,
                    conflictsJson:
                        conflicts.length > 0 ? JSON.stringify(conflicts) : null,
                },
            })
        );
        transactionOperations.push(
            tx.accountMergeRequest.update({
                where: { id: mergeRequest.id },
                data: {
                    consumedAt: new Date(),
                    consumedByUserId: sourceUser.id,
                },
            })
        );
        transactionOperations.push(
            tx.workspaceMember.deleteMany({
                where: { workspaceId: sourceWorkspace.id },
            })
        );
        transactionOperations.push(
            tx.workspace.delete({ where: { id: sourceWorkspace.id } })
        );
        transactionOperations.push(tx.user.delete({ where: { id: sourceUser.id } }));

        for (const operation of transactionOperations) {
            await operation;
        }

        return deletedSubscriberCount;
    });

    return {
        mergedLinks,
        mergedAccounts: sourceUser.accounts.length,
        transferredSessions: sourceUser.sessions.length,
        deletedSubscribers,
        conflicts,
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
        // The source username's ownership changes on merge (it becomes the
        // target's alias/canonical username or is freed) — callers clear its
        // cached username→userId index entry alongside the payload purge.
        sourceUsername: sourceWorkspace.username ?? null,
    };
}
