import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { buildMergedPlatformSlug, generateMergeCode, hashMergeCode } from "@/lib/accountMergeUtils";

export class MergeError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "MergeError";
        this.status = status;
    }
}

async function verifyPasswordIfPresent(userId: string, password: string | undefined) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });

    if (user?.password) {
        if (!password) {
            throw new MergeError("Password confirmation is required", 400);
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new MergeError("Password confirmation failed", 401);
        }
    }
}

export async function createMergeRequest(input: { targetUserId: string; password?: string }) {
    await verifyPasswordIfPresent(input.targetUserId, input.password);

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

    await verifyPasswordIfPresent(input.sourceUserId, input.password);

    const [sourceUser, targetUser] = await Promise.all([
        prisma.user.findUnique({
            where: { id: input.sourceUserId },
            include: {
                links: { orderBy: { position: "asc" } },
                accounts: true,
                sessions: true,
            },
        }),
        prisma.user.findUnique({
            where: { id: mergeRequest.targetUserId },
            include: {
                links: { orderBy: { position: "asc" } },
                accounts: true,
                sessions: true,
            },
        }),
    ]);

    if (!sourceUser || !targetUser) {
        throw new MergeError("One of the accounts no longer exists", 404);
    }

    const targetPlatformSet = new Set(targetUser.links.map((link) => link.platform));
    const basePosition = targetUser.links.reduce(
        (maxPosition, link) => Math.max(maxPosition, link.position),
        0
    );
    const sourceIdentifier = sourceUser.username ?? sourceUser.id.slice(0, 8);
    const conflicts: string[] = [];
    let mergedLinks = 0;
    const finalTargetUsername = targetUser.username ?? sourceUser.username ?? null;

    const shouldAliasSourceUsername = Boolean(
        sourceUser.username && targetUser.username && sourceUser.username !== targetUser.username
    );

    await prisma.$transaction(async (tx) => {
        if (sourceUser.name && !targetUser.name) {
            await tx.user.update({ where: { id: targetUser.id }, data: { name: sourceUser.name } });
        }

        if (sourceUser.bio && !targetUser.bio) {
            await tx.user.update({ where: { id: targetUser.id }, data: { bio: sourceUser.bio } });
        }

        if (sourceUser.image && !targetUser.image) {
            await tx.user.update({ where: { id: targetUser.id }, data: { image: sourceUser.image } });
        }

        if (sourceUser.emailVerified && !targetUser.emailVerified) {
            await tx.user.update({ where: { id: targetUser.id }, data: { emailVerified: sourceUser.emailVerified } });
        }

        if (!targetUser.username && sourceUser.username) {
            await tx.user.update({ where: { id: targetUser.id }, data: { username: sourceUser.username } });
        } else if (shouldAliasSourceUsername && sourceUser.username) {
            await tx.userAlias.upsert({
                where: { username: sourceUser.username },
                update: { userId: targetUser.id },
                create: { username: sourceUser.username, userId: targetUser.id },
            });
        }

        const mergeCandidatePlatforms = new Set(targetPlatformSet);
        for (const link of sourceUser.links) {
            let platform = link.platform;
            if (mergeCandidatePlatforms.has(platform)) {
                platform = uniqueTransferPlatform({
                    platform,
                    sourceIdentifier,
                    existingPlatforms: mergeCandidatePlatforms,
                });
                conflicts.push(link.platform);
            }

            await tx.link.update({
                where: { id: link.id },
                data: {
                    userId: targetUser.id,
                    platform,
                    position: basePosition + mergedLinks + 1,
                },
            });
            mergeCandidatePlatforms.add(platform);
            mergedLinks += 1;
        }

        const mergedAccounts = await tx.account.updateMany({
            where: { userId: sourceUser.id },
            data: { userId: targetUser.id },
        });

        const transferredSessions = await tx.session.updateMany({
            where: { userId: sourceUser.id },
            data: { userId: targetUser.id },
        });

        await tx.accountMergeEvent.create({
            data: {
                sourceUserId: sourceUser.id,
                targetUserId: targetUser.id,
                sourceEmail: sourceUser.email,
                targetEmail: targetUser.email,
                sourceUsername: sourceUser.username,
                targetUsername: finalTargetUsername,
                mergedLinks,
                mergedAccounts: mergedAccounts.count,
                transferredSessions: transferredSessions.count,
                conflictsJson: conflicts.length > 0 ? JSON.stringify(conflicts) : null,
            },
        });

        await tx.accountMergeRequest.update({
            where: { id: mergeRequest.id },
            data: {
                consumedAt: new Date(),
                consumedByUserId: sourceUser.id,
            },
        });

        await tx.user.delete({
            where: { id: sourceUser.id },
        });
    });

    return {
        mergedLinks,
        mergedAccounts: sourceUser.accounts.length,
        transferredSessions: sourceUser.sessions.length,
        conflicts,
    };
}

