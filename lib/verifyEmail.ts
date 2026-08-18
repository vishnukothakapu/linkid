import prisma from "@/lib/prisma";

export async function verifyUserEmail(token: string) {
    const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
    });

    if (!verificationToken) {
        return { error: "invalid-token" };
    }

    if (verificationToken.expires < new Date()) {
        // Clean up expired token
        await prisma.verificationToken.delete({ where: { token } });
        return { error: "token-expired" };
    }

    // Mark email as verified and clean up token atomically
    await prisma.$transaction([
        prisma.user.updateMany({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        }),
        prisma.verificationToken.delete({ where: { token } }),
    ]);

    return { success: true };
}
