import { teamRoute } from "@/lib/teamRoute";
import prisma from "@/lib/prisma";
import { inviteMember, TeamError } from "@/lib/workspaceTeam";
import { sendWorkspaceInvitationEmail } from "@/lib/email";
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return teamRoute(req, async (userId) => {
    const body = await req.json(),
      origin = process.env.NEXTAUTH_URL;
    if (!origin)
      throw new TeamError("Invitation origin is not configured", 503);
    const { invitation, token } = await inviteMember(
      prisma,
      id,
      userId,
      body.email,
    );
    try {
      await sendWorkspaceInvitationEmail(
        invitation.email,
        new URL(`/workspaces/accept#${token}`, origin).href,
      );
    } catch {
      throw new TeamError(
        "Invitation saved, but email delivery failed. Resend after checking SMTP.",
        502,
      );
    }
    return { success: true };
  });
}
