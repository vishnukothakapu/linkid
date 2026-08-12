import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import {
    consumeRecoveryCode,
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
            `2fa-disable:${userId}`,
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

        const { password, code } = body as { password?: string; code?: string };
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
                email: true,
                password: true,
                totpSecret: true,
                twoFactorEnabled: true,
                recoveryCodes: true,
                lastTotpStep: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.twoFactorEnabled) {
            return NextResponse.json(
                { error: "Two-factor authentication is not enabled." },
                { status: 400 }
            );
        }

        if (user.password) {
            if (!password) {
                return NextResponse.json(
                    { error: "Password is required" },
                    { status: 400 }
                );
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Incorrect password" },
                    { status: 403 }
                );
            }
        }

        const totpResult = user.totpSecret
            ? await verifyTotpCode(user.totpSecret, code, user.lastTotpStep)
            : null;

        if (
            !totpResult?.valid &&
            (await consumeRecoveryCode(user.recoveryCodes, code)) === null
        ) {
            return NextResponse.json(
                { error: "Invalid verification code." },
                { status: 400 }
            );
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                totpSecret: null,
                twoFactorEnabled: false,
                recoveryCodes: null,
                lastTotpStep: null,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("2FA disable error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
