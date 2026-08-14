import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";

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
        const { targetUserId, targetWorkspaceId, isVerified } = body;

        if (!targetUserId || typeof isVerified !== 'boolean') {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // isVerified now lives on Workspace, not User.
        // Find the target user's active workspace (or specified workspace) and update it.
        const workspace = await resolveActiveWorkspace(targetUserId, targetWorkspaceId);
        if (!workspace || (targetWorkspaceId && workspace.id !== targetWorkspaceId)) {
            return NextResponse.json({ error: "Target user workspace not found" }, { status: 404 });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { isVerified },
        });

        return NextResponse.json({ success: true, workspace: updatedWorkspace });
    } catch (error) {
        console.error("Error verifying user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
