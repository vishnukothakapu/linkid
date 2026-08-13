import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LayoutStyle } from "@/app/[username]/types/type";
import { invalidateProfileCache } from "@/lib/profileCache";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { layoutStyle } = body;

        if (layoutStyle !== "LIST" && layoutStyle !== "GRID") {
            return NextResponse.json({ error: "Invalid layout style" }, { status: 400 });
        }

        const validLayout: LayoutStyle = layoutStyle;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { layoutStyle: validLayout },
        });

        // Layout style is rendered on the public profile — purge the cache.
        await invalidateProfileCache(updatedUser.id);

        return NextResponse.json({ success: true, layoutStyle: updatedUser.layoutStyle }, { status: 200 });
    } catch (error) {
        console.error("Failed to update layout style:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
