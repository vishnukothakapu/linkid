import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";
import { resolveUserByUsername } from "@/lib/userLookup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let resolved = null;
  try {
    resolved = await resolveUserByUsername(username);
  } catch {
    resolved = null;
  }

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
          user={{
            name: user.name,
            username: user.username ?? resolved.canonicalUsername,
            bio: user.bio,
            image: user.image,
            links: user.links,
          }}
          username={resolved.canonicalUsername}
          showCTA={!session}
        />
        <div className="mt-4 flex gap-2 justify-center">
          <a
            href={`/api/export/vcard/${encodeURIComponent(resolved.canonicalUsername)}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save Contact
          </a>

          <a
             href={`/api/export/resume/${encodeURIComponent(resolved.canonicalUsername)}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Download PDF
          </a>
        </div>
        <ProfileFooter />
      </div>
    </main>
  );
}
