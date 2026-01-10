import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";

export async function generateMetadata({ params }: any) {
    const { username } = await params;

    return {
        title: `${username} | LinkID`,
        description: `Check out ${username}'s LinkID profile.`,
        openGraph: {
            title: `${username} | LinkID`,
            description: `Check out ${username}'s LinkID profile.`,
            url: `https://linkid.vercel.app/${username}`,
        },
    };
}

export default async function PublicProfile({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    const user = await prisma.user.findUnique({
        where: { username },
        include: { links: { orderBy: { order: "asc" } } },
    });

    if (!user) notFound();

    return (
        <main className="min-h-screen bg-muted/40 px-4 py-16">
            <div className="mx-auto max-w-md">
                <ProfileCard
                    user={user}
                    username={username}
                    showCTA={!session}
                />
                <ProfileFooter />
            </div>
        </main>
    );
}
