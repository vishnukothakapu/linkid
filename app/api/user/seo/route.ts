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

        let finalSeoTitle = null;
        if (typeof seoTitle === "string") {
            const trimmed = seoTitle.trim();
            if (trimmed) {
                finalSeoTitle = trimmed.substring(0, 60);
            }
        }

        let finalSeoDescription = null;
        if (typeof seoDescription === "string") {
            const trimmed = seoDescription.trim();
            if (trimmed) {
                finalSeoDescription = trimmed.substring(0, 160);
            }
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { 
                seoTitle: finalSeoTitle, 
                seoDescription: finalSeoDescription,
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
