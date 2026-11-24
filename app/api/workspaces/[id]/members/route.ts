import { teamRoute } from "@/lib/teamRoute";
import prisma from "@/lib/prisma";
import { teamTransaction } from "@/lib/workspaceTeam";
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return teamRoute(req, (userId) =>
    teamTransaction(prisma, id, userId, async (tx, role) => ({
      role,
      userId,
      members: await tx.workspaceMember.findMany({
        where: { workspaceId: id },
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,
          user: { select: { name: true, email: true, image: true } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
      invitations:
        role === "OWNER"
          ? await tx.workspaceInvitation.findMany({
              where: { workspaceId: id },
              select: { id: true, email: true, role: true, expiresAt: true },
              orderBy: { createdAt: "desc" },
              take: 100,
            })
          : [],
    })),
  );
}
