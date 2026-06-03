import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

// Allow at most 5 registration attempts per IP per hour.
// This prevents automated mass account creation while keeping the limit
// generous enough for legitimate users who may retry on validation errors.
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
    // Derive caller IP from the forwarded header set by proxies/CDNs, or fall
    // back to a sentinel so single-instance local dev is never blocked.
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
        return NextResponse.json(
            {
                error: "Too many registration attempts. Please wait before trying again.",
            },
            { status: 429 },
        );
    }

    try {
        const body = await req.json();
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const email =
            typeof body?.email === "string"
                ? body.email.trim().toLowerCase()
                : "";
        const password =
            typeof body?.password === "string" ? body.password : "";

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 },
            );
        }
        const normalizedEmail = email.toLowerCase().trim();

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { error: "Password does not meet requirements" },
                { status: 400 },
            );
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await prisma.user.create({
                data: {
                    name,
                    email: normalizedEmail,
                    password: hashedPassword,
                },
            });
        } catch (err: unknown) {
            if (
                typeof err === "object" &&
                err !== null &&
                "code" in err &&
                err.code === "P2002"
            ) {
                return NextResponse.json(
                    { error: "User already exists" },
                    { status: 409 },
                );
            }
            throw err;
        }

        return NextResponse.json(
            { success: true, message: "User created successfully" },
            { status: 201 },
        );
    } catch (err) {
        console.error("Registration error:", err);

        const message =
            err instanceof Error ? err.message : "Something went wrong";

        return NextResponse.json(
            {
                error:
                    process.env.NODE_ENV === "production"
                        ? "Something went wrong"
                        : message,
            },
            { status: 500 },
        );
    }
}
