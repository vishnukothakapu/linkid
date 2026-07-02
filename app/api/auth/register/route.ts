import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/email";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
        return NextResponse.json(
            { error: "Too many registration attempts. Please wait before trying again." },
            { status: 429 },
        );
    }

    try {
        const body = await req.json();
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body?.password === "string" ? body.password : "";

        if (!email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { error: "Password does not meet requirements" },
                { status: 400 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let user;
        try {
            user = await prisma.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    password: hashedPassword,
                    // emailVerified intentionally left null — set only after verification
                },
            });
        } catch (err: unknown) {
            if (
                typeof err === "object" &&
                err !== null &&
                "code" in err &&
                err.code === "P2002"
            ) {
                return NextResponse.json({ error: "User already exists" }, { status: 409 });
            }
            throw err;
        }

        // Generate a secure verification token and store it
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: normalizedEmail,
                token,
                expires,
            },
        });

        // Send verification email — non-blocking in dev if SMTP not configured
        try {
            await sendVerificationEmail(normalizedEmail, token);
        } catch {
            // Email sending failure should not block registration
            console.error("Failed to send verification email to", normalizedEmail);
        }

        return NextResponse.json(
            { success: true, message: "Account created. Please check your email to verify your account." },
            { status: 201 },
        );
    } catch (err) {
        console.error("Registration error:", err);
        const message = err instanceof Error ? err.message : "Something went wrong";
        return NextResponse.json(
            { error: process.env.NODE_ENV === "production" ? "Something went wrong" : message },
            { status: 500 },
        );
    }
}