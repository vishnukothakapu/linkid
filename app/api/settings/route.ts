import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { invalidateProfileCache } from "@/lib/profileCache";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { enableEmailCapture, workspaceId: bodyWorkspaceId, webhookUrl } = body;

    const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
    const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let updateData: any = {};
    if (enableEmailCapture !== undefined) {
      if (typeof enableEmailCapture !== "boolean") {
        return NextResponse.json({ error: "enableEmailCapture must be a boolean" }, { status: 400 });
      }
      updateData.enableEmailCapture = enableEmailCapture;
    }

    if (webhookUrl !== undefined) {
      if (webhookUrl === "") {
        updateData.webhookUrl = null;
        updateData.webhookSecret = null;
      } else {
        updateData.webhookUrl = webhookUrl;
        
        const existingWorkspace = await prisma.workspace.findUnique({ where: { id: workspace.id }, select: { webhookSecret: true }});
        if (!existingWorkspace?.webhookSecret) {
          updateData.webhookSecret = require('crypto').randomBytes(32).toString('hex');
        }
      }
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: updateData,
    });

    // enableEmailCapture renders on the public profile — purge the cache.
    if (enableEmailCapture !== undefined) {
      await invalidateProfileCache(workspace.id);
    }

    return NextResponse.json({ 
      success: true, 
      enableEmailCapture: updatedWorkspace.enableEmailCapture,
      webhookUrl: updatedWorkspace.webhookUrl,
      webhookSecret: updatedWorkspace.webhookSecret 
    }, { status: 200 });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
