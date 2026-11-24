import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { checkRateLimit } from "./rateLimit";
import { TeamError } from "./workspaceTeam";

export async function teamRoute(
  req: Request,
  action: (userId: string) => Promise<unknown>,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (
      req.method !== "GET" &&
      !(await checkRateLimit(
        `workspace-team:${session.user.id}`,
        20,
        60 * 60 * 1000,
      ))
    )
      return NextResponse.json(
        { error: "Too many team requests. Try again later." },
        { status: 429 },
      );
    return NextResponse.json(await action(session.user.id));
  } catch (error) {
    if (error instanceof TeamError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    console.error("Workspace team request failed");
    return NextResponse.json(
      { error: "Team request failed. Please retry." },
      { status: 500 },
    );
  }
}
