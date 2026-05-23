import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateResumePDF } from "@/lib/generateResumePDF";

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

  const buffer = await renderToBuffer(
    generateResumePDF({
      user,
      links: user.links,
    }),
  );
  const uint8 = new Uint8Array(buffer);

  return new Response(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${((user.name || user.username) ?? "profile").replace(/\s+/g, "_")}_profile.pdf"`,
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}
