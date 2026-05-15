import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { linkId } = await req.json();

  try {
    await prisma.link.update({
      where: { id: linkId },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
