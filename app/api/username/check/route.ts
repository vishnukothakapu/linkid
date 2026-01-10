import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.toLowerCase();

    if (!username) {
        return NextResponse.json({ available: false });
    }

    const exists = await prisma.user.findUnique({
        where: { username },
    });

    return NextResponse.json({ available: !exists });
}
