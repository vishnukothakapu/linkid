import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { theme, workspaceId: bodyWorkspaceId } = body;

        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        if (preferredWorkspaceId && workspace.id !== preferredWorkspaceId) {
            return NextResponse.json({ error: "Forbidden: Access denied to requested workspace" }, { status: 403 });
        }

        if (typeof theme !== "string") {
            return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { theme },
        });

        const { revalidateTag } = await import("next/cache");
        revalidateTag("public-profile", "default");

        return NextResponse.json({ success: true, theme: updatedWorkspace.theme }, { status: 200 });
    } catch (error) {
        console.error("Failed to update theme:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
