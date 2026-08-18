import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildVCard } from "@/lib/buildVCard";
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
          include: {
            user: {
              select: {
                name: true,
                image: true,
                email: true,
              },
            },
          },
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

    const owner = workspaceData.members[0]?.user ?? null;
    const user = {
      name: owner?.name ?? workspaceData.name ?? workspaceData.username ?? "",
      username: workspaceData.username ?? null,
      email: owner?.email ?? null,
      bio: workspaceData.bio ?? null,
      image: owner?.image ?? null,
    };

    const vcard = buildVCard({ user, links: workspaceData.links });

    const safeBase =
      ((user.name || user.username) ?? "profile")
        .replace(/[^\w.-]+/g, "_")
        .replace(/^_+|_+$/g, "") || "profile";
    return new Response(vcard, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeBase}_profile.vcf"`,
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("VCard export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
