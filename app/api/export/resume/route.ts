import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateResumePDF } from "@/lib/generateResumePDF";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const allowed = await checkRateLimit(
      `export-resume:${session.user.email}`,
      2,
      60 * 1000
    );

    if (!allowed) {
      return new Response("Too many requests. Please slow down.", { status: 429 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { links: true },
    });
    if (!user) {
      return new Response("User not found", { status: 404 });
    }
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
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Resume export error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
