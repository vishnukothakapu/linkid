import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVCard } from "@/lib/buildVCard";

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
        bio: true,
        headline: true,
        location: true,
        website: true,
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

    const vcardContent = buildVCard(user);

    return new NextResponse(vcardContent, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${user.username}.vcf"`,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("Failed to generate vCard:", error);
    return NextResponse.json(
      { error: "Failed to generate vCard" },
      { status: 500 }
    );
  }
}