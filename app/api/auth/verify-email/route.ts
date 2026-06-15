import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=missing-token", req.url));
    }

    const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
    });

    if (!verificationToken) {
        return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
    }

    if (verificationToken.expires < new Date()) {
        // Clean up expired token
        await prisma.verificationToken.delete({ where: { token } });
        return NextResponse.redirect(new URL("/login?error=token-expired", req.url));
    }

    // Mark email as verified and clean up token atomically
    await prisma.$transaction([
        prisma.user.updateMany({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        }),
        prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
