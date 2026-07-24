import { NextResponse } from "next/server";
import { verifyUserEmail } from "@/lib/verifyEmail";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=missing-token", req.url));
    }

    const result = await verifyUserEmail(token);

    if (result.error) {
        return NextResponse.redirect(new URL(`/login?error=${result.error}`, req.url));
    }

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
