import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Toaster } from "react-hot-toast";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";
import { resolveUserByUsername } from "@/lib/userLookup";
import { ShareProfileButton } from "./ShareProfileButton";
import { cookies } from "next/headers";
import type { Link } from "./types/type";

interface ABTestSlot {
  __abTestSlot: string;
}

function getDeterministicVariant(visitorId: string, parentId: string): "A" | "B" {
  let hash = 0;
  const str = visitorId + parentId;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2 === 0 ? "A" : "B";
}

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

        const pageTitle = user?.seoTitle || `${canonicalUsername} | LinkID`;
        const pageDescription = user?.seoDescription || `Check out ${canonicalUsername}'s LinkID profile.`;

        return {
            title: pageTitle,
            description: pageDescription,
            openGraph: {
                title: pageTitle,
                description: pageDescription,
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
                title: pageTitle,
                description: pageDescription,
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

  // Compare against the owner's email fetched separately (server-side, uncached)
  // so credential/PII fields never enter the public profile cache.
  let isOwner = false;
  if (session?.user?.email) {
    const owner = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    isOwner =
      owner?.email?.toLowerCase() === session.user.email.toLowerCase();
  }

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

  const cookieStore = await cookies();

  const now = new Date();
  const isActive = (l: Link) => {
    if (l.startDate && new Date(l.startDate) > now) return false;
    if (l.endDate && new Date(l.endDate) < now) return false;
    return true;
  };

  const selectVariant = (parentId: string, variants: Link[], visitorId: string): Link => {
    const cookieVal = cookieStore.get(`abTest_${parentId}`)?.value;
    if (cookieVal === "A" || cookieVal === "B") {
      const picked = variants.find((v) => v.abTestVariant === cookieVal);
      if (picked) return picked;
    }
    const chosenVariant = getDeterministicVariant(visitorId, parentId);
    return variants.find((v) => v.abTestVariant === chosenVariant) || variants[0];
  };

  const visitorId = cookieStore.get("visitor_id")?.value || "default-visitor";

  const rawLinks = (user.links || []) as Link[];
  const abTestGroups = new Map<string, Link[]>();
  const preFilteredLinks: (Link | ABTestSlot)[] = [];

  for (const link of rawLinks) {
    if (link.abTestParentId) {
      if (!abTestGroups.has(link.abTestParentId)) {
        abTestGroups.set(link.abTestParentId, []);
        preFilteredLinks.push({ __abTestSlot: link.abTestParentId });
      }
      abTestGroups.get(link.abTestParentId)!.push(link);
    } else if (link.isGroup) {
      const children = (link.children || []) as Link[];
      const newChildren: (Link | ABTestSlot)[] = [];
      const childrenGroups = new Map<string, Link[]>();
      
      for (const child of children) {
        if (child.abTestParentId) {
          if (!childrenGroups.has(child.abTestParentId)) {
            childrenGroups.set(child.abTestParentId, []);
            newChildren.push({ __abTestSlot: child.abTestParentId });
          }
          childrenGroups.get(child.abTestParentId)!.push(child);
        } else {
          newChildren.push(child);
        }
      }
      
      for (const [parentId, variants] of childrenGroups.entries()) {
        const activeVariants = variants.filter(isActive);
        const slot = newChildren.findIndex((l) => "__abTestSlot" in l && (l as any).__abTestSlot === parentId);
        if (activeVariants.length === 0) {
          if (slot !== -1) {
            newChildren.splice(slot, 1);
          }
        } else {
          const picked = selectVariant(parentId, activeVariants, visitorId);
          if (slot !== -1) {
            newChildren.splice(slot, 1, picked);
          } else {
            newChildren.push(picked);
          }
        }
      }
      
      preFilteredLinks.push({ ...link, children: newChildren as Link[] });
    } else {
      preFilteredLinks.push(link);
    }
  }

  for (const [parentId, variants] of abTestGroups.entries()) {
    const activeVariants = variants.filter(isActive);
    const slot = preFilteredLinks.findIndex((l) => "__abTestSlot" in l && (l as any).__abTestSlot === parentId);
    if (activeVariants.length === 0) {
      if (slot !== -1) {
        preFilteredLinks.splice(slot, 1);
      }
    } else {
      const picked = selectVariant(parentId, activeVariants, visitorId);
      if (slot !== -1) {
        preFilteredLinks.splice(slot, 1, picked);
      } else {
        preFilteredLinks.push(picked);
      }
    }
  }

  const activeLinks = (preFilteredLinks as Link[]).filter(isActive);

  return (
    <main className={`min-h-screen relative px-4 py-16 theme-${user.theme || "default"}`}>
      <Toaster position="bottom-center" />
      {user.backgroundImage && (
        <>
          <div
            className="fixed inset-0 z-[-2]"
            style={{
              backgroundImage: `url(${user.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="fixed inset-0 z-[-1] bg-black/40 backdrop-blur-[2px]" />
        </>
      )}
      <ShareProfileButton />
      <div className="mx-auto max-w-md relative z-10">
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
            layoutStyle: user.layoutStyle,
            isVerified: user.isVerified,
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
