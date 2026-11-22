import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspace";
import TeamPanel from "./team-panel";
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const workspaces = await getUserWorkspaces(session.user.id),
    requested = (await searchParams).workspaceId;
  const selected = workspaces.find((w) => w.id === requested) ?? workspaces[0];
  return (
    <TeamPanel
      key={selected?.id}
      workspaces={workspaces.map((w) => ({
        id: w.id,
        name: w.name ?? w.username ?? "Workspace",
      }))}
      workspaceId={selected?.id ?? ""}
    />
  );
}
