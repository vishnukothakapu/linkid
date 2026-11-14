import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { generateResumePDF } from "@/lib/generateResumePDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        name: true,
        username: true,
        headline: true,
        bio: true,
        location: true,
        website: true,
        skills: true,
        links: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
          select: {
            title: true,
            url: true,
            platform: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(generateResumePDF(user));

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${user.username}-resume.pdf"`,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("Failed to generate resume PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate resume PDF" },
      { status: 500 }
    );
  }
}