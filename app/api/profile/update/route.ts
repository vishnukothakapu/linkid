import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateUsername } from "@/lib/validations/username";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { username, ...otherFields } = body;

    if (username !== undefined) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Save old username to history if username is changing
    if (username !== undefined) {
    const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
    });

    if (currentUser?.username && currentUser.username !== username) {
     // Check if new username is a previously used one (prevent reuse)
     const reserved = await prisma.usernameHistory.findUnique({
      where: { previousUsername: username },
     });

    if (reserved) {
      return NextResponse.json(
        { error: "This username was previously used and is reserved." },
        { status: 409 }
      );
    }

       // Save old username to history
      await prisma.usernameHistory.create({
       data: {
        previousUsername: currentUser.username,
        userId,
         },
       });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(username && { username }), ...otherFields },
    });

    return NextResponse.json({ success: true, user }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err.code === "P2002" && err.meta?.target?.includes("username")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
