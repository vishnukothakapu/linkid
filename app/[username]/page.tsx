import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";
import { resolveUserByUsername } from "@/lib/userLookup";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
    try {
        const { username } = await params;
        const resolved = await resolveUserByUsername(username);

        if (!resolved) {
            return {
                title: `${username} | LinkID`,
                description: `Check out ${username}'s LinkID profile.`,
            };
        }

        const canonicalUsername = resolved.canonicalUsername ?? username;

        return {
            title: `${canonicalUsername} | LinkID`,
            description: `Check out ${canonicalUsername}'s LinkID profile.`,
        };
    } catch {
        return {
            title: "LinkID",
            description: "Check out profiles on LinkID.",
        };
    }
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
    notFound();
  }

  if (!resolved) {
    notFound();
  }

  const user = resolved.user;

  // Fetch resume URL separately (not included in links query)
  const { getPublicUserData } = await import("@/lib/userLookup");
  const publicUserData = await getPublicUserData(resolved.canonicalUsername);

  const isOwner =
    session?.user?.email?.toLowerCase() === user.email?.toLowerCase();

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-md">
        <ProfileCard
          user={{
            name: user.name,
            username:
              user.username ??
              resolved.canonicalUsername,
            bio: user.bio,
            image: user.image,
            links: user.links || [],
            resumeUrl: publicUserData?.resumeUrl ?? null,
          }}
          username={resolved.canonicalUsername}
          showCTA={!session}
          isOwner={isOwner}
        />

        <div className="mt-4 flex justify-center gap-2">
          {publicUserData?.resumeUrl && (
            <a
              href={`/api/resume/download/${encodeURIComponent(
                resolved.canonicalUsername
              )}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
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
              <span>Download Resume</span>
            </a>
          )}
          <a
            href={`/api/export/vcard/${encodeURIComponent(
              resolved.canonicalUsername
            )}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
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

            <span>Save Contact</span>
          </a>
        </div>
        <ProfileFooter />
      </div>
    </main>
  );
}
