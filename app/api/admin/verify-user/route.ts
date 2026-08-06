import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser || currentUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const { targetUserId, isVerified } = body;

        if (!targetUserId || typeof isVerified !== 'boolean') {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { isVerified },
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error verifying user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
