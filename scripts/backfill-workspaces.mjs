import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('[backfill-workspaces] Starting database workspace backfill...');

    const BATCH_SIZE = 100;
    let cursor = undefined;
    let totalMigrated = 0;

    while (true) {
        const users = await prisma.user.findMany({
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                name: true,
                username: true,
                createdAt: true,
            },
        });

        if (users.length === 0) break;

        const userIds = users.map((u) => u.id);
        const existingWorkspaces = await prisma.workspace.findMany({
            where: { id: { in: userIds } },
            select: { id: true },
        });
        const existingSet = new Set(existingWorkspaces.map((w) => w.id));

        for (const user of users) {
            if (!existingSet.has(user.id)) {
                await prisma.workspace.create({
                    data: {
                        id: user.id,
                        name: user.name ?? 'My Workspace',
                        username: user.username ?? null,
                        createdAt: user.createdAt,
                        members: {
                            create: {
                                userId: user.id,
                                role: 'OWNER',
                                createdAt: user.createdAt,
                            },
                        },
                    },
                });
                totalMigrated++;
                console.log(`[backfill-workspaces] Created workspace for user ${user.id}`);
            }
        }

        cursor = users[users.length - 1].id;
    }

    console.log(`[backfill-workspaces] Backfill completed. Migrated ${totalMigrated} new workspaces.`);
}

main()
    .catch((e) => {
        console.error('[backfill-workspaces] Error during backfill:', e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
