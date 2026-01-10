import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    detectPlatform,
    normalizeUrl,
    validatePlatformUrl,
} from "@/lib/platforms";
import { isValidHttpUrl } from "@/lib/url";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const rawUrl = body?.url?.trim();

    
    if (!rawUrl) {
        return NextResponse.json(
            { error: "Please enter a URL" },
            { status: 400 }
        );
    }

    if (!isValidHttpUrl(rawUrl)) {
        return NextResponse.json(
            { error: "Please enter a valid URL (https://…)" },
            { status: 400 }
        );
    }

    const finalUrl = normalizeUrl(rawUrl);

    const finalPlatform = body.platform ?? detectPlatform(finalUrl);

    if (!finalPlatform) {
        return NextResponse.json(
            { error: "Unsupported or unknown platform" },
            { status: 400 }
        );
    }

    if (!validatePlatformUrl(finalPlatform, finalUrl)) {
        return NextResponse.json(
            { error: `Invalid ${finalPlatform} URL` },
            { status: 400 }
        );
    }

    
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
// order
    const maxOrder = await prisma.link.aggregate({
        where: { userId: user.id },
        _max: { order: true },
    });

   // create link
    try {
        const link = await prisma.link.create({
            data: {
                userId: user.id,
                platform: finalPlatform,
                url: finalUrl,
                order: (maxOrder._max.order ?? 0) + 1,
            },
        });

        return NextResponse.json({ link });
    } catch (err) {
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            return NextResponse.json(
                { error: `You already added your ${finalPlatform} link.` },
                { status: 409 }
            );
        }

        console.error(err);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
