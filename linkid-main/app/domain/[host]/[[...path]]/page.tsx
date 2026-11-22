import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PublicProfile from "@/app/[username]/page";

// Custom-domain handler. middleware.ts rewrites requests on a pointed custom
// domain to /domain/{host}{path}; resolve the owner workspace by customDomain
// and render the same public profile the /{username} route renders.
export default async function DomainProfile({
    params,
}: {
    params: Promise<{ host: string; path?: string[] }>;
}) {
    const { host } = await params;

    const workspace = await prisma.workspace.findUnique({
        where: { customDomain: host },
        select: { username: true },
    });

    if (!workspace?.username) {
        notFound();
    }

    return <PublicProfile params={Promise.resolve({ username: workspace.username })} />;
}
