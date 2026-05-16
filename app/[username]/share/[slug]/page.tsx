// app/[username]/share/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username, slug } = await params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return {};
  const variant = await prisma.shareVariant.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  });
  if (!variant) return {};
  return {
    title: `${variant.title} — ${username} | LinkID`,
    description: variant.description ?? `${username}'s curated link collection`,
  };
}

export default async function ShareVariantPage({ params }: Props) {
  const { username, slug } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) notFound();

  const variant = await prisma.shareVariant.findUnique({
    where: { userId_slug: { userId: user!.id, slug } },
  });

  if (!variant || !variant.isActive || !variant.isPublic) notFound();

  // Increment view count (fire-and-forget)
  prisma.shareVariant
    .update({ where: { id: variant.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // Fetch only the links included in this variant
  const links =
    variant.linkIds.length > 0
      ? await prisma.link.findMany({
          where: { id: { in: variant.linkIds }, userId: user!.id },
          orderBy: { order: "asc" },
        })
      : [];

  // Preserve the order defined in linkIds
  const orderedLinks = variant.linkIds
    .map((id) => links.find((l) => l.id === id))
    .filter(Boolean) as typeof links;

  const accent = variant.accentColor ?? "#6366f1";

  return (
    <>
      {/* TODO: Implement CSS validation/sanitization before enabling customCss rendering */}
      <main 
        className="min-h-screen bg-background flex flex-col items-center justify-start py-16 px-4"
        style={{
          ...(variant.backgroundColor ? { backgroundColor: variant.backgroundColor } : {}),
          ...(variant.backgroundImage ? { backgroundImage: `url(${variant.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
        }}
      >
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            {variant.logo && (
              <div className="flex justify-center mb-4">
                <Image
                  src={variant.logo}
                  alt="Logo"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-lg object-contain"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">@{username}</p>
            <h1 className="text-2xl font-bold">{variant.title}</h1>
            {variant.description && (
              <p className="text-muted-foreground text-sm">{variant.description}</p>
            )}
            <div
              className="mx-auto mt-2 h-1 w-16 rounded-full"
              style={{ backgroundColor: accent }}
            />
          </div>

          {/* Links */}
          <ul className="space-y-3">
            {orderedLinks.length === 0 && (
              <li className="text-center text-sm text-muted-foreground">
                No links in this collection.
              </li>
            )}
            {orderedLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border bg-card px-5 py-3.5 shadow-sm transition hover:shadow-md hover:border-primary/30 group"
                >
                  <span className="font-medium capitalize">{link.label ?? link.platform}</span>
                  <ExternalLink
                    size={16}
                    className="text-muted-foreground group-hover:text-primary transition"
                  />
                </a>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            Powered by{" "}
            <a
              href="https://linkid.qzz.io"
              className="underline underline-offset-2 hover:text-foreground"
            >
              LinkID
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
