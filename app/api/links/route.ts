import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import {
    detectPlatform,
    validatePlatformUrl,
} from "@/lib/platforms";

import { validateUrlBackend } from "@/lib/urlValidation";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { checkRateLimit } from "@/lib/rateLimit";

const LINK_CREATE_LIMIT = 10;
const LINK_CREATE_WINDOW_MS = 60 * 1000; // 10 creations per minute per user

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = checkRateLimit(
        `link-create:${session.user.email}`,
        LINK_CREATE_LIMIT,
        LINK_CREATE_WINDOW_MS
    );

    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429 }
        );
    }

    const body = await req.json();
    const rawUrl = body?.url?.trim();
    const customLabel = body?.label?.trim();
    const rawExplicitPlatform = body?.platform?.trim();
    const explicitPlatform = rawExplicitPlatform && Object.keys(PLATFORM_ICONS).includes(rawExplicitPlatform) 
        ? rawExplicitPlatform 
        : null;

    if (!rawUrl) {
        return NextResponse.json(
            { error: "Please enter a URL" },
            { status: 400 }
        );
    }

    const validation = validateUrlBackend(rawUrl);
    if (!validation.valid) {
        return NextResponse.json(
            { error: validation.error },
            { status: 400 }
        );
    }

    const finalUrl = validation.normalizedUrl;
    const detectedPlatform = explicitPlatform || detectPlatform(finalUrl);

    if (!detectedPlatform) {
        return NextResponse.json(
            { error: "Please select a platform" },
            { status: 400 }
        );
    }

    let finalPlatform: string;
    let finalLabel: string;

    if (detectedPlatform === "website") {
        if (!customLabel) {
            return NextResponse.json(
                { error: "Please enter a name for this link" },
                { status: 400 }
            );
        }

        finalLabel = customLabel;
        finalPlatform = customLabel
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        if (!finalPlatform) {
            return NextResponse.json(
                { error: "Please enter a valid alphanumeric name for this link" },
                { status: 400 }
            );
        }
    } else {
        finalPlatform = detectedPlatform;
        finalLabel = customLabel ||
            detectedPlatform.charAt(0).toUpperCase() +
            detectedPlatform.slice(1);
    }

    if (!validatePlatformUrl(detectedPlatform, finalUrl)) {
        return NextResponse.json(
            { error: "Please enter a valid public link" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
        );
    }

    try {
        const link = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const maxOrder = await tx.link.aggregate({
                where: { userId: user.id },
                _max: { position: true },
            });

            return tx.link.create({
                data: {
                    userId: user.id,
                    platform: finalPlatform,
                    label: finalLabel,
                    url: finalUrl,
                    position: (maxOrder._max.position ?? 0) + 1,
                },
            });
        });

        return NextResponse.json({ link });
    } catch (err: unknown) {
        const error = err as { code?: string };
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: `You already added your ${finalLabel} link.` },
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

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ links: [] });

    const links = await prisma.link.findMany({
        where: { userId: user.id },
        orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' }
        ],
    });

    return NextResponse.json({ links });
}

