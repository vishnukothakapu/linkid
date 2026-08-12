import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import {
    generateRecoveryCodes,
    hashRecoveryCodes,
    verifyTotpCode,
} from "@/lib/twoFactor";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const allowed = await checkRateLimit(
            `2fa-enable:${userId}`,
            10,
            15 * 60 * 1000
        );
        if (!allowed) {
            return NextResponse.json(
                { error: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { code } = body as { code?: string };
        if (!code) {
            return NextResponse.json(
                { error: "Verification code is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                totpSecret: true,
                twoFactorEnabled: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.twoFactorEnabled) {
            return NextResponse.json(
                { error: "Two-factor authentication is already enabled." },
                { status: 400 }
            );
        }

        if (!user.totpSecret) {
            return NextResponse.json(
                { error: "No pending setup found. Generate a new secret first." },
                { status: 400 }
            );
        }

        const totpResult = await verifyTotpCode(user.totpSecret, code);
        if (!totpResult.valid) {
            return NextResponse.json(
                { error: "Invalid verification code. Please try again." },
                { status: 400 }
            );
        }

        const recoveryCodes = generateRecoveryCodes();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: true,
                recoveryCodes: await hashRecoveryCodes(recoveryCodes),
                lastTotpStep: totpResult.timeStep,
            },
        });

        return NextResponse.json(
            { success: true, recoveryCodes },
            { status: 200 }
        );
    } catch (error) {
        console.error("2FA enable error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
