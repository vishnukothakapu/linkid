import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { LayoutStyle } from "@/app/[username]/types/type";
import { invalidateProfileCache } from "@/lib/profileCache";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { layoutStyle, workspaceId: bodyWorkspaceId } = body;

        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        if (layoutStyle !== "LIST" && layoutStyle !== "GRID") {
            return NextResponse.json({ error: "Invalid layout style" }, { status: 400 });
        }

        const validLayout: LayoutStyle = layoutStyle;

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { layoutStyle: validLayout },
        });

        // Layout style is rendered on the public profile — purge the cache.
        await invalidateProfileCache(workspace.id);

        return NextResponse.json({ success: true, layoutStyle: updatedWorkspace.layoutStyle }, { status: 200 });
    } catch (error) {
        console.error("Failed to update layout style:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
