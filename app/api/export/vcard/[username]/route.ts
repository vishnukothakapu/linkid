import prisma from "@/lib/prisma";
import { buildVCard } from "@/lib/buildVCard";
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
      bio: workspace.bio ?? null,
      image: owner?.image ?? null,
      email: null,
    };

    const vcard = buildVCard({ user, links: workspace.links });

    return new Response(vcard, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${((user.name || user.username) ?? "profile").replace(/\s+/g, "_")}_profile.vcf"`,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Public vcard export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
