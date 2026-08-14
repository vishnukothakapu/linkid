import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { revalidateTag } from "next/cache";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { backgroundImage, workspaceId: bodyWorkspaceId } = body;

        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        if (preferredWorkspaceId && workspace.id !== preferredWorkspaceId) {
            return NextResponse.json({ error: "Forbidden: Access denied to requested workspace" }, { status: 403 });
        }

        if (backgroundImage !== null && typeof backgroundImage !== "string") {
            return NextResponse.json({ error: "Invalid backgroundImage" }, { status: 400 });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { backgroundImage },
        });
        
        revalidateTag("public-profile", "default");

        return NextResponse.json({ success: true, backgroundImage: updatedWorkspace.backgroundImage }, { status: 200 });
    } catch (error) {
        console.error("Failed to update background image:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
