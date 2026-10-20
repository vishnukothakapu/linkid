import { NextResponse } from "next/server";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import {
    buildOtpAuthUri,
    generateTotpSecret,
    TWO_FACTOR_ISSUER,
} from "@/lib/twoFactor";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const allowed = await checkRateLimit(
            `2fa-setup:${userId}`,
            10,
            60 * 60 * 1000
        );
        if (!allowed) {
            return NextResponse.json(
                { error: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        let password: string | undefined;
        try {
            const body = await req.json();
            if (body && typeof body.password === "string") {
                password = body.password;
            }
        } catch {
            // OAuth-only accounts can start setup without a request body.
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                password: true,
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

        if (user.password) {
            if (!password) {
                return NextResponse.json(
                    { error: "Password confirmation is required" },
                    { status: 400 }
                );
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Password confirmation failed" },
                    { status: 401 }
                );
            }
        }

        const secret = generateTotpSecret();
        const otpauthUrl = buildOtpAuthUri(secret, user.email);
        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

        await prisma.user.update({
            where: { id: user.id },
            data: { totpSecret: secret },
        });

        return NextResponse.json(
            {
                success: true,
                secret,
                qrCodeUrl,
                issuer: TWO_FACTOR_ISSUER,
                accountName: user.email,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("2FA setup error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
