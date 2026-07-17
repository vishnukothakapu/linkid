import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserAnalyticsDetails } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const daysQuery = request.nextUrl.searchParams.get("days");
    const isAllTime = daysQuery === "all";
    const days = isAllTime ? null : (daysQuery ? Number.parseInt(daysQuery, 10) : 30);

    if (!isAllTime && days) {
      if (Number.isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
          { error: "days must be between 1 and 365, or 'all'" },
          { status: 400 }
        );
      }
    }

    const details = await getUserAnalyticsDetails({
      userId: user.id,
      days,
    });

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    console.error("Get analytics details error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics details" },
      { status: 500 }
    );
  }
}
