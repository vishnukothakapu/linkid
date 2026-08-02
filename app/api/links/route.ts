import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import {
    detectPlatform,
    validatePlatformUrl,
} from "@/lib/platforms";
import { PLATFORMS } from "@/lib/constants";
import { nestLinks } from "@/lib/linkTree";

import { validateUrlBackend } from "@/lib/urlValidation";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { rateLimit } from "@/lib/rateLimit";

// Maximum number of links a single user can add to their profile.
// Prevents unbounded database growth and degraded public profile performance.
const MAX_LINKS_PER_USER = 20;

// Rate limiter for link creation: 30 requests per minute per IP
const linksLimiter = rateLimit(30, 60_000);

export async function POST(req: NextRequest) {
    // Apply IP‑based rate limiting first
    const limited = await linksLimiter(req);
    if (limited) return limited;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const isGroup = body?.isGroup === true;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
        );
    }

    // --- Group creation ---
    if (isGroup) {
        const groupLabel = body?.label?.trim();
        if (!groupLabel) {
            return NextResponse.json(
                { error: "Please enter a name for this group" },
                { status: 400 }
            );
        }

        try {
            const link = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const maxOrder = await tx.link.aggregate({
                    where: { userId: user.id, parentId: null },
                    _max: { position: true },
                    _count: { id: true },
                });

                const totalCount = await tx.link.count({ where: { userId: user.id } });
                if (totalCount >= MAX_LINKS_PER_USER) {
                    throw Object.assign(new Error("LINK_LIMIT_REACHED"), { code: "LINK_LIMIT_REACHED" });
                }

                return tx.link.create({
                    data: {
                        userId: user.id,
                        platform: "system_group",
                        label: groupLabel,
                        url: "",
                        isGroup: true,
                        position: (maxOrder._max.position ?? 0) + 1,
                    },
                });
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });

            return NextResponse.json({ link: { ...link, children: [] } });
        } catch (err: unknown) {
            const error = err as { code?: string };
            if (error?.code === "LINK_LIMIT_REACHED") {
                return NextResponse.json(
                    { error: `You can add a maximum of ${MAX_LINKS_PER_USER} links.` },
                    { status: 400 }
                );
            }
            console.error(err);
            return NextResponse.json(
                { error: "Something went wrong" },
                { status: 500 }
            );
        }
    }

    // --- Regular link creation ---
    const rawUrl = body?.url?.trim();
    const customLabel = body?.label?.trim();
    const rawAlias = body?.alias?.trim();
    const customAlias = rawAlias ? rawAlias.toLowerCase().replace(/[^a-z0-9-]/g, "") : undefined;
    const parentId = body?.parentId || null;
    
    if (rawAlias && !customAlias) {
        return NextResponse.json(
            { error: "Please enter a valid alphanumeric custom alias" },
            { status: 400 }
        );
    }
    
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

    if (detectedPlatform === PLATFORMS.WEBSITE) {
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

    const proposedRoute = customAlias || finalPlatform;

    try {
        const link = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const existingLink = await tx.link.findFirst({
                where: {
                    userId: user.id,
                    OR: [
                        { alias: proposedRoute },
                        { platform: proposedRoute, alias: null }
                    ]
                }
            });

            if (existingLink) {
                throw Object.assign(new Error("ROUTE_ALREADY_EXISTS"), { code: "ROUTE_ALREADY_EXISTS" });
            }

            // Validate parentId if provided
            if (parentId) {
                const parentGroup = await tx.link.findFirst({
                    where: { id: parentId, userId: user.id, isGroup: true },
                });
                if (!parentGroup) {
                    throw Object.assign(new Error("INVALID_GROUP"), { code: "INVALID_GROUP" });
                }
            }

            const totalCount = await tx.link.count({ where: { userId: user.id } });

            // Enforce per-user link limit atomically inside the transaction
            // to prevent race conditions where concurrent requests bypass the check.
            if (totalCount >= MAX_LINKS_PER_USER) {
                throw Object.assign(new Error("LINK_LIMIT_REACHED"), { code: "LINK_LIMIT_REACHED" });
            }

            // Position within parent scope (top-level or inside group)
            const maxOrder = await tx.link.aggregate({
                where: { userId: user.id, parentId: parentId },
                _max: { position: true },
            });

            return tx.link.create({
                data: {
                    userId: user.id,
                    platform: finalPlatform,
                    alias: customAlias || null,
                    label: finalLabel,
                    url: finalUrl,
                    position: (maxOrder._max.position ?? 0) + 1,
                    parentId: parentId,
                },
            });
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });

        return NextResponse.json({ link });
    } catch (err: unknown) {
        const error = err as { code?: string };

        if (error?.code === "ROUTE_ALREADY_EXISTS") {
            return NextResponse.json(
                { error: `The route '/${proposedRoute}' is already in use. Please provide a unique custom alias.` },
                { status: 409 }
            );
        }

        if (error?.code === "INVALID_GROUP") {
            return NextResponse.json(
                { error: "The specified group does not exist." },
                { status: 400 }
            );
        }

        if (error?.code === "LINK_LIMIT_REACHED") {
            return NextResponse.json(
                { error: `You can add a maximum of ${MAX_LINKS_PER_USER} links.` },
                { status: 400 }
            );
        }

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

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ links: [] });

    const allLinks = await prisma.link.findMany({
        where: { userId: user.id },
        orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' }
        ],
    });

    const links = nestLinks(allLinks);

    return NextResponse.json({ links });
}