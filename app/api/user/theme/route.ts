import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { theme } = body;

        if (typeof theme !== "string") {
            return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { theme },
        });

        return NextResponse.json({ success: true, theme: updatedUser.theme }, { status: 200 });
    } catch (error) {
        console.error("Failed to update theme:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
