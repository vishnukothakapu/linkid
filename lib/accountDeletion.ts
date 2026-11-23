import { Prisma, type PrismaClient } from '@prisma/client';

/** Delete the user and personal workspace graphs in one serializable commit.
 * Sorted row locks prevent concurrent membership changes from racing cleanup.
 * Return cache identities captured before cascading deletion removes aliases.
 */
export async function deleteAccountWorkspaces(client: PrismaClient, userId: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
        const memberships = await tx.workspaceMember.findMany({ where: { userId }, select: { workspaceId: true } });
        const ids = memberships.map(member => member.workspaceId).sort();
        if (ids.length) await tx.$queryRaw(Prisma.sql`SELECT id FROM "Workspace" WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`);
        const workspaces = await tx.workspace.findMany({
          where: { id: { in: ids } },
          select: { id: true, username: true, aliases: { select: { username: true } },
            members: { select: { id: true, userId: true, role: true, createdAt: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
        });
        for (const workspace of workspaces) {
          const remaining = workspace.members.filter(member => member.userId !== userId);
          if (!remaining.length) {
            await tx.workspace.delete({ where: { id: workspace.id } });
          } else if (!remaining.some(member => member.role === 'OWNER')) {
            // Existing shared data survives with a deterministic new owner.
            await tx.workspaceMember.update({ where: { id: remaining[0].id }, data: { role: 'OWNER' } });
          }
        }
        // Session invalidation and OTP cleanup commit with deletion, not before
        // it: a rolled-back deletion must not leave a half-completed account.
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await tx.invalidatedSession.upsert({ where: { userId }, update: { expiresAt }, create: { userId, expiresAt } });
        await tx.deleteOtp.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
        return workspaces.map(({ id, username, aliases }) => ({ id, usernames: [username, ...aliases.map(alias => alias.username)].filter((name): name is string => Boolean(name)) }));
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (attempt >= 2 || !(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
    }
  }
}
