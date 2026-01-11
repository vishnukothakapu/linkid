import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json([], { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return NextResponse.json([]);

    const links = await prisma.link.findMany({
        where: { userId: user.id },
        orderBy: { order: "asc" },
    });
}
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();

    await prisma.user.update({
        where: { email: session.user.email },
        data: { username: username.toLowerCase() },
    });

    return NextResponse.json({ success: true });
}
