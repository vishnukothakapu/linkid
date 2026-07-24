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
        const user = resolved.user;
        
        const defaultImage = "https://linkid.qzz.io/default-og.png"; 
        const profileImage = user?.image || defaultImage;

        return {
            title: `${canonicalUsername} | LinkID`,
            description: `Check out ${canonicalUsername}'s LinkID profile.`,
            openGraph: {
                title: `${canonicalUsername} | LinkID`,
                description: `Check out ${canonicalUsername}'s LinkID profile.`,
                images: [
                    {
                        url: profileImage,
                        // width and height have been removed
                        alt: `${canonicalUsername}'s profile picture`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: `${canonicalUsername} | LinkID`,
                description: `Check out ${canonicalUsername}'s LinkID profile.`,
                images: [profileImage],
            },
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

  const bgStyle: React.CSSProperties = {};
  if (user.themeType === "solid") {
    bgStyle.backgroundColor = user.themeColor || "#0f172a";
  } else if (user.themeType === "gradient") {
    if (user.themeColor === "custom" && user.themeCustom) {
      const parts = user.themeCustom.split(",");
      bgStyle.backgroundImage = `linear-gradient(135deg, ${parts[0] || "#0f172a"}, ${parts[1] || "#0369a1"})`;
    } else {
      bgStyle.backgroundColor = "#0f172a";
    }
  } else if (user.themeType === "glassmorphism") {
    bgStyle.backgroundColor = "#030712";
    bgStyle.backgroundImage = "radial-gradient(ellipse at top, #1e293b, transparent)";
  } else if (user.themeType === "retro") {
    bgStyle.backgroundColor = "#000000";
    bgStyle.fontFamily = "monospace";
  } else if (user.themeType === "cyberpunk") {
    bgStyle.backgroundColor = "#050505";
    bgStyle.backgroundImage = "linear-gradient(180deg, #09090b 0%, #1e1b4b 100%)";
  }

  const now = new Date();
  const activeLinks = (user.links || []).filter((link) => {
    if (link.startDate && new Date(link.startDate) > now) return false;
    if (link.endDate && new Date(link.endDate) < now) return false;
    return true;
  });

  return (
    <main className={`min-h-screen px-4 py-16 theme-${user.theme || "default"}`}>
      <div className="mx-auto max-w-md">
        <ProfileCard
          user={{
            name: user.name,
            username:
              user.username ??
              resolved.canonicalUsername,
            bio: user.bio,
            image: user.image,
            links: activeLinks,
            resumeUrl: publicUserData?.resumeUrl ?? null,
            enableEmailCapture: user.enableEmailCapture,
          }}
          username={resolved.canonicalUsername}
          showCTA={!session}
          isOwner={isOwner}
          themeType={user.themeType}
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
