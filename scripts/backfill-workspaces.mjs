import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('[backfill-workspaces] Starting database workspace backfill...');

    // 1. Backfill Personal Workspaces for existing Users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            bio: true,
            seoTitle: true,
            seoDescription: true,
            backgroundImage: true,
            isVerified: true,
            customDomain: true,
            themeType: true,
            themeColor: true,
            themeCustom: true,
            theme: true,
            enableEmailCapture: true,
            layoutStyle: true,
            resumeUrl: true,
            resumeDownloadCount: true,
            createdAt: true,
        },
    });

    console.log(`[backfill-workspaces] Found ${users.length} users to migrate.`);

    for (const user of users) {
        // Create workspace with same ID as user if it doesn't exist
        const existingWorkspace = await prisma.workspace.findUnique({
            where: { id: user.id },
        });

        if (!existingWorkspace) {
            await prisma.workspace.create({
                data: {
                    id: user.id,
                    name: user.name ?? 'My Workspace',
                    username: user.username ?? null,
                    bio: user.bio ?? null,
                    seoTitle: user.seoTitle ?? null,
                    seoDescription: user.seoDescription ?? null,
                    backgroundImage: user.backgroundImage ?? null,
                    isVerified: user.isVerified ?? false,
                    customDomain: user.customDomain ?? null,
                    themeType: user.themeType ?? 'solid',
                    themeColor: user.themeColor ?? 'slate',
                    themeCustom: user.themeCustom ?? null,
                    theme: user.theme ?? 'default',
                    enableEmailCapture: user.enableEmailCapture ?? false,
                    layoutStyle: user.layoutStyle ?? 'LIST',
                    resumeUrl: user.resumeUrl ?? null,
                    resumeDownloadCount: user.resumeDownloadCount ?? 0,
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
            console.log(`[backfill-workspaces] Created workspace & owner membership for user ${user.id} (${user.username ?? 'no-username'})`);
        }
    }

    console.log('[backfill-workspaces] Backfill completed successfully.');
}

main()
    .catch((e) => {
        console.error('[backfill-workspaces] Error during backfill:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
