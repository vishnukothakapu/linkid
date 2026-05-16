import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";

import type { Link } from "./types/type";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      name: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    return {
      title: 'Profile not found | LinkID',
      description: 'This profile does not exist.',
    };
  }

  return {
    title: `${user.name} | LinkID`,
    description: user.bio || `Check out ${user.name}'s LinkID profile`,
    openGraph: {
      title: `${user.name} | LinkID`,
      description: user.bio || `Check out ${user.name}'s LinkID profile`,
      url: `https://linkid.qzz.io/${username}`,
      siteName: 'LinkID',
      images: user.image ? [{ url: user.image, width: 400, height: 400 }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${user.name} | LinkID`,
      description: user.bio || `Check out ${user.name}'s LinkID profile`,
      images: user.image ? [user.image] : [],
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

    let user:
        | {
              name: string | null;
              username: string | null;
              bio: string | null;
              image: string | null;
              links: Link[];
          }
        | null = null;

    try {
        user = await prisma.user.findUnique({
            where: { username },
            select: {
                name: true,
                username: true,
                bio: true,
                image: true,
                links: {
                    where: { isPublic: true },
                    orderBy: { order: "asc" },
                },
            },
        });
    } catch {
        // If the DB isn't reachable in local OSS setups, fall back to 404 instead of a huge error page.
        notFound();
    }

    if (!user) {
        // Check username history for redirect
        const history = await prisma.usernameHistory.findUnique({
            where: { previousUsername: username },
            include: { user: { select: { username: true } } },
        });

        if (history?.user?.username) {
            redirect(`/${history.user.username}`);
        }

        notFound();
    }

    return (
        <main className="min-h-screen px-4 py-16">
            <div className="mx-auto max-w-md">
                <ProfileCard
                    user={{ name: user.name, username: username, bio: user.bio, image: user.image, links: user.links }}
                    username={username}
                    showCTA={!session}
                />
                <ProfileFooter />
            </div>
        </main>
    );
}
