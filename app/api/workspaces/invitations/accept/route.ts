import { teamRoute } from "@/lib/teamRoute";
import prisma from "@/lib/prisma";
import { acceptInvitation } from "@/lib/workspaceTeam";
import { invalidateProfileCache } from "@/lib/profileCache";
export async function POST(req: Request) {
  return teamRoute(req, async (userId) => {
    const workspaceId = await acceptInvitation(
      prisma,
      userId,
      (await req.json()).token,
    );
    await invalidateProfileCache(workspaceId);
    return { success: true, workspaceId };
  });
}
