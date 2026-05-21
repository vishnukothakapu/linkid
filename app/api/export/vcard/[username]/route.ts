import prisma from "@/lib/prisma";
import { buildVCard } from "@/lib/buildVCard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: {
        where: { isPublic: true },
      },
    },
  });

  if (!user) return new Response("Not found", { status: 404 });

  const vcard = buildVCard({ user, links: user.links });

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${((user.name || user.username) ?? "profile").replace(/\s+/g, "_")}_profile.vcf"`,
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}
