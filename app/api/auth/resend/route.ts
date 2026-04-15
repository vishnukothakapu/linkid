import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // We return generic success to avoid email enumeration
            return NextResponse.json({ success: true, message: "If an account exists, a verification email has been sent." });
        }

        if (user.isVerified) {
            return NextResponse.json(
                { error: "Email is already verified" },
                { status: 400 }
            );
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiryHours = Number(process.env.TOKEN_EXPIRY_HOURS) || 24;
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + tokenExpiryHours);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                tokenExpiry,
            },
        });

        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({ success: true, message: "Verification email resent!" });
    } catch (err) {
        console.error("Resend error:", err);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
