import { cookies } from "next/headers";
import { teamRoute } from "@/lib/teamRoute";
import { getWorkspaceMembership } from "@/lib/workspace";
import { TeamError } from "@/lib/workspaceTeam";
export async function POST(req: Request) {
  return teamRoute(req, async (userId) => {
    const { workspaceId } = await req.json();
    if (
      typeof workspaceId !== "string" ||
      !(await getWorkspaceMembership(userId, workspaceId))
    )
      throw new TeamError("Workspace access denied", 403);
    (await cookies()).set("activeWorkspaceId", workspaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return { success: true };
  });
}
