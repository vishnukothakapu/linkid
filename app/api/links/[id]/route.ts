import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import {
    validatePlatformUrl,
    normalizeUrl,
} from "@/lib/platforms";

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const link = await prisma.link.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!link || link.user.email !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const finalUrl = normalizeUrl(url);

    if (!validatePlatformUrl(link.platform as any, finalUrl)) {
        return NextResponse.json(
            { error: `Invalid ${link.platform} URL` },
            { status: 400 }
        );
    }

    await prisma.link.update({
        where: { id },
        data: { url: finalUrl },
    });

    return NextResponse.json({ success: true });
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const link = await prisma.link.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!link || link.user.email !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.link.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}