import prisma from "@/lib/prisma";

export async function resolveUserByUsername(username: string) {
    const exactUser = await prisma.user.findUnique({
        where: { username },
        include: { links: { where: { isPublic: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
    });

    if (exactUser) {
        return { user: exactUser, canonicalUsername: exactUser.username ?? username };
    }

    const alias = await prisma.userAlias.findUnique({
        where: { username },
    });

    if (!alias) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: alias.userId },
        include: { links: { where: { isPublic: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
    });

    if (!user) {
        return null;
    }

    return { user, canonicalUsername: user.username ?? username };
}

