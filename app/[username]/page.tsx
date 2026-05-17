import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";
import { resolveUserByUsername } from "@/lib/userLookup";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const resolved = await resolveUserByUsername(username);

    if (!resolved) {
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

    const canonicalUsername = resolved.canonicalUsername ?? username;

    return {
        title: `${canonicalUsername} | LinkID`,
        description: `Check out ${canonicalUsername}'s LinkID profile.`,
        openGraph: {
            title: `${canonicalUsername} | LinkID`,
            description: `Check out ${canonicalUsername}'s LinkID profile.`,
            url: `https://linkid.vercel.app/${canonicalUsername}`,
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
    let resolved;

    try {
        resolved = await resolveUserByUsername(username);
    } catch {
        // If the DB isn't reachable in local OSS setups, fall back to 404 instead of a huge error page.
        notFound();
    }

    if (!resolved) notFound();

    const user = resolved.user;

    return (
        <main className="min-h-screen px-4 py-16">
            <div className="mx-auto max-w-md">
                <ProfileCard
                    user={{ name: user.name, username: user.username ?? resolved.canonicalUsername, bio: user.bio, image: user.image, links: user.links }}
                    username={resolved.canonicalUsername}
                    showCTA={!session}
                />
                <ProfileFooter />
            </div>
        </main>
    );
}
