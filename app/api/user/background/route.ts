import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { backgroundImage } = body;

        if (backgroundImage !== null && typeof backgroundImage !== "string") {
            return NextResponse.json({ error: "Invalid backgroundImage" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { backgroundImage },
        });
        
        revalidateTag("public-profile", "default");

        return NextResponse.json({ success: true, backgroundImage: updatedUser.backgroundImage }, { status: 200 });
    } catch (error) {
        console.error("Failed to update background image:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
