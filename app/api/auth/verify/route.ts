import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Token is missing" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 400 }
            );
        }

        if (user.tokenExpiry && user.tokenExpiry < new Date()) {
            return NextResponse.json(
                { error: "Token has expired" },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                tokenExpiry: null,
                emailVerified: new Date(), // Standard NextAuth field
            },
        });

        return NextResponse.json({ success: true, message: "Email verified successfully!" });
    } catch (err) {
        console.error("Verification error:", err);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
