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
        const { seoTitle, seoDescription } = body;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { 
                seoTitle: typeof seoTitle === "string" ? seoTitle : null, 
                seoDescription: typeof seoDescription === "string" ? seoDescription : null,
            },
        });

        return NextResponse.json({ 
            success: true, 
            seoTitle: updatedUser.seoTitle,
            seoDescription: updatedUser.seoDescription 
        }, { status: 200 });
    } catch (error) {
        console.error("Failed to update SEO settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
