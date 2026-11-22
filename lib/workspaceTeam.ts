import { createHash, randomBytes } from "node:crypto";
import { Prisma, type PrismaClient, type WorkspaceRole } from "@prisma/client";

export class TeamError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const hashInvitation = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function normalizeInviteEmail(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new TeamError("A valid email is required");
  return value.trim().toLowerCase();
}
export async function teamTransaction<T>(
  client: PrismaClient,
  workspaceId: string,
  userId: string,
  operation: (tx: Prisma.TransactionClient, role: WorkspaceRole) => Promise<T>,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${workspaceId} FOR UPDATE`;
          const member = await tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
          });
          if (!member) throw new TeamError("Workspace access denied", 403);
          return operation(tx, member.role);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        attempt >= 2 ||
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034"
      )
        throw error;
    }
  }
}
export function requireOwner(role: WorkspaceRole) {
  if (role !== "OWNER")
    throw new TeamError("Only workspace owners can manage the team", 403);
}

export async function inviteMember(
  client: PrismaClient,
  workspaceId: string,
  userId: string,
  rawEmail: unknown,
) {
  const email = normalizeInviteEmail(rawEmail),
    token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await teamTransaction(
    client,
    workspaceId,
    userId,
    async (tx, role) => {
      requireOwner(role);
      if (
        await tx.workspaceMember.findFirst({
          where: {
            workspaceId,
            user: { email: { equals: email, mode: "insensitive" } },
          },
        })
      )
        throw new TeamError("This person is already a member", 409);
      // Resend rotates the secret and invalidates every previous link.
      return tx.workspaceInvitation.upsert({
        where: { workspaceId_email: { workspaceId, email } },
        create: {
          workspaceId,
          email,
          inviterId: userId,
          role: "EDITOR",
          tokenHash: hashInvitation(token),
          expiresAt,
        },
        update: {
          inviterId: userId,
          role: "EDITOR",
          tokenHash: hashInvitation(token),
          expiresAt,
        },
      });
    },
  );
  return { invitation, token };
}

export async function acceptInvitation(
  client: PrismaClient,
  userId: string,
  token: unknown,
) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token))
    throw new TeamError("Invalid invitation", 410);
  const tokenHash = hashInvitation(token);
  const found = await client.workspaceInvitation.findUnique({
    where: { tokenHash },
  });
  if (!found)
    throw new TeamError(
      "Invitation expired, revoked, or already accepted",
      410,
    );
  return client.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Workspace" WHERE id = ${found.workspaceId} FOR UPDATE`;
    const invitation = await tx.workspaceInvitation.findUnique({
      where: { tokenHash },
    });
    if (!invitation || invitation.expiresAt <= new Date())
      throw new TeamError(
        "Invitation expired, revoked, or already accepted",
        410,
      );
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });
    if (!user?.emailVerified || user.email.toLowerCase() !== invitation.email)
      throw new TeamError(
        "Sign in with the invited, verified email address",
        403,
      );
    const inviter = await tx.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: invitation.inviterId,
        },
      },
    });
    if (inviter?.role !== "OWNER")
      throw new TeamError("The inviter no longer owns this workspace", 410);
    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
      },
      create: {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      },
      update: {},
    });
    await tx.workspaceInvitation.delete({ where: { id: invitation.id } });
    return invitation.workspaceId;
  });
}

export async function changeMember(
  client: PrismaClient,
  workspaceId: string,
  userId: string,
  memberId: string,
  nextRole: unknown,
) {
  if (nextRole !== null && nextRole !== "OWNER" && nextRole !== "EDITOR")
    throw new TeamError("Role must be OWNER or EDITOR");
  return teamTransaction(client, workspaceId, userId, async (tx, actorRole) => {
    const member = await tx.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new TeamError("Member not found", 404);
    const leaving =
      nextRole === null && member.userId === userId && member.role === "EDITOR";
    if (!leaving) requireOwner(actorRole);
    if (
      member.role === "OWNER" &&
      nextRole !== "OWNER" &&
      (await tx.workspaceMember.count({
        where: { workspaceId, role: "OWNER" },
      })) <= 1
    )
      throw new TeamError(
        "Promote another owner before removing or demoting the sole owner",
      );
    if (nextRole === null) {
      await tx.workspaceInvitation.deleteMany({
        where: { workspaceId, inviterId: member.userId },
      });
      await tx.workspaceMember.delete({ where: { id: memberId } });
    } else {
      await tx.workspaceMember.update({
        where: { id: memberId },
        data: { role: nextRole },
      });
      if (nextRole !== "OWNER")
        await tx.workspaceInvitation.deleteMany({
          where: { workspaceId, inviterId: member.userId },
        });
    }
  });
}
