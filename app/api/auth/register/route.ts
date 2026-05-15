import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body?.password === "string" ? body.password : "";

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing fields" },
                { status: 400 }
            );
        }
        const normalizedEmail = email.toLowerCase().trim();

        const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { error: "Password does not meet requirements" },
                { status: 400 }
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
        if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {

      return NextResponse.json (
        {error: "User already exists"},
        {status: 409} 
    );
    }
    throw err;
    }
        return NextResponse.json ({ success: true, message: "User created successfully"},
        {status: 201}
    );

    } catch (err) {
        console.error("Registration error:", err);

        const message = err instanceof Error ? err.message : "Something went wrong";

        return NextResponse.json(
            {
                error:
                    process.env.NODE_ENV === "production"
                        ? "Something went wrong"
                        : message,
            },
            { status: 500 }
        );
    }
}
