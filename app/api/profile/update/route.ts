import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertProfileDraft } from "@/lib/profileWorkflow";
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
    const { username, name, bio, image } = body;

    // Save to draft using the workflow function
    const draft = await upsertProfileDraft(userId, {
      username,
      name,
      bio,
      image,
    });

    return NextResponse.json({ success: true, draft }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message?.includes("Username not available") || err.message?.includes("Username already taken")) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
