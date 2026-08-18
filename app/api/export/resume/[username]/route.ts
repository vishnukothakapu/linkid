import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateResumePDF } from "@/lib/generateResumePDF";
import { resolveWorkspaceByUsernameOrAlias } from "@/lib/userLookup";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const resolved = await resolveWorkspaceByUsernameOrAlias(username);
    if (!resolved) return new Response("Not found", { status: 404 });

    const workspace = await prisma.workspace.findUnique({
      where: { id: resolved.workspaceId },
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

    if (!workspace) return new Response("Not found", { status: 404 });

    const owner = workspace.members[0]?.user;
    const user = {
      name: owner?.name ?? workspace.name ?? workspace.username ?? "",
      username: workspace.username ?? null,
      image: owner?.image ?? null,
      bio: workspace.bio ?? null,
      email: null,
    };

    const buffer = await renderToBuffer(
      generateResumePDF({
        user,
        links: workspace.links,
      }),
    );
    const uint8 = new Uint8Array(buffer);

    return new Response(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${((user.name || user.username) ?? "profile").replace(/\s+/g, "_")}_profile.pdf"`,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Public resume export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
