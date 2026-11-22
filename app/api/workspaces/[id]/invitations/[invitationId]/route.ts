import { teamRoute } from "@/lib/teamRoute";
import prisma from "@/lib/prisma";
import { teamTransaction, requireOwner } from "@/lib/workspaceTeam";
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string; invitationId: string }> },
) {
  const { id, invitationId } = await context.params;
  return teamRoute(req, (userId) =>
    teamTransaction(prisma, id, userId, async (tx, role) => {
      requireOwner(role);
      await tx.workspaceInvitation.deleteMany({
        where: { id: invitationId, workspaceId: id },
      });
      return { success: true };
    }),
  );
}
