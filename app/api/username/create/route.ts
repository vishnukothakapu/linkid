import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateUsername } from "@/lib/validations/username";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username } = body;
    const userId = session.user.id;

    const validation = validateUsername(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const [existingUser, existingAlias] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.userAlias.findUnique({ where: { username } }),
    ]);

    if (existingUser || existingAlias) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Username create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
