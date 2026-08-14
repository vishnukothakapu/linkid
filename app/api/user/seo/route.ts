import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { invalidateProfileCache } from "@/lib/profileCache";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { seoTitle, seoDescription, workspaceId: bodyWorkspaceId } = body;

        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        if (preferredWorkspaceId && workspace.id !== preferredWorkspaceId) {
            return NextResponse.json({ error: "Forbidden: Access denied to requested workspace" }, { status: 403 });
        }

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

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { 
                seoTitle: finalSeoTitle, 
                seoDescription: finalSeoDescription,
            },
        });

        // SEO fields feed the public page metadata — purge the cache.
        await invalidateProfileCache(workspace.id);
        const { revalidateTag } = await import("next/cache");
        revalidateTag("public-profile", "default");

        return NextResponse.json({ 
            success: true, 
            seoTitle: updatedWorkspace.seoTitle,
            seoDescription: updatedWorkspace.seoDescription 
        }, { status: 200 });
    } catch (error) {
        console.error("Failed to update SEO settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
