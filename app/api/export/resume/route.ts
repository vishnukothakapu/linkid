import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateResumePDF } from "@/lib/generateResumePDF";
import { resolveActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const workspace = await resolveActiveWorkspace(session.user.id);
    if (!workspace) {
      return new Response("Workspace not found", { status: 404 });
    }

    const workspaceData = await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        members: {
          where: { role: "OWNER" },
          include: { user: { select: { name: true, image: true } } },
          take: 1,
        },
        links: {
          where: { isPublic: true },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!workspaceData) {
      return new Response("Workspace not found", { status: 404 });
    }

    const owner = workspaceData.members[0]?.user;
    const user = {
      name: owner?.name ?? workspaceData.name ?? workspaceData.username ?? "",
      username: workspaceData.username ?? null,
      image: owner?.image ?? null,
      bio: workspaceData.bio ?? null,
      email: null,
    };

    const buffer = await renderToBuffer(
      generateResumePDF({
        user,
        links: workspaceData.links,
      }),
    );
    const uint8 = new Uint8Array(buffer);

    return new Response(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${((user.name || user.username) ?? "profile").replace(/\s+/g, "_")}_profile.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Resume export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
