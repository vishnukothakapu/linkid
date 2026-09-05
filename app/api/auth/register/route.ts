import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { getForwardedIp } from "@/lib/analyticsUtils";
import { sendVerificationEmail } from "@/lib/email";
import { signupSchema } from "@/lib/validations/auth";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

const registerSchema = signupSchema.pick({ email: true, password: true });

export async function POST(req: Request) {
    // Use the spoof-resistant client IP (trusts x-real-ip set by the platform)
    // rather than the raw first x-forwarded-for value, which a client can
    // rotate to bypass the per-IP registration rate limit.
    const ip = getForwardedIp(req.headers) ?? "unknown";

    if (!(await checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS))) {
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

        const result = registerSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            if (fieldErrors.email) {
                return NextResponse.json(
                    { error: "Invalid email address" },
                    { status: 400 },
                );
            }
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
                    email: result.data.email,
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
                identifier: result.data.email,
                token,
                expires,
            },
        });

        // Send verification email — non-blocking in dev if SMTP not configured
        try {
            await sendVerificationEmail(result.data.email, token);
        } catch {
            // Email sending failure should not block registration
            console.error("Failed to send verification email to", result.data.email);
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
