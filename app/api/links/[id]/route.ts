import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { validatePlatformUrl, detectPlatform } from "@/lib/platforms";
import { validateUrlBackend } from "@/lib/urlValidation";

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const url = body?.url;
    const isPublic = body?.isPublic;

    const link = await prisma.link.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!link || link.user.email !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: { url?: string; isPublic?: boolean } = {};

    if (typeof url === "string") {
        const validation = validateUrlBackend(url);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const finalUrl = validation.normalizedUrl;

        // Derive platform from the final URL for validation so custom user-defined
        // platform slugs (e.g. when platform was stored as a custom label) don't
        // cause a runtime exception in `validatePlatformUrl`.
        const platformForValidation = detectPlatform(finalUrl);

        if (!validatePlatformUrl(platformForValidation, finalUrl)) {
            return NextResponse.json(
                { error: "Please enter a valid public link" },
                { status: 400 }
            );
        }

        data.url = finalUrl;
    }

    if (typeof isPublic === "boolean") {
        data.isPublic = isPublic;
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await prisma.link.update({
        where: { id },
        data,
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