import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await req.json();

    if (!linkId) {
        return NextResponse.json({ error: "Missing linkId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Atomically claim the link by setting abTestVariant = "A" and abTestParentId = id
            // only if abTestParentId is currently null.
            const updateCount = await tx.link.updateMany({
                where: {
                    id: linkId,
                    userId: user.id,
                    abTestParentId: null,
                },
                data: {
                    abTestVariant: "A",
                    abTestParentId: linkId,
                },
            });

            if (updateCount.count !== 1) {
                const existing = await tx.link.findUnique({
                    where: { id: linkId },
                });
                if (!existing) {
                    throw new ApiError("Link not found", 404);
                }
                if (existing.userId !== user.id) {
                    throw new ApiError("Unauthorized", 403);
                }
                if (existing.abTestParentId) {
                    throw new ApiError("Link is already part of an A/B test", 409);
                }
                throw new ApiError("Failed to initialize A/B test", 400);
            }

            const originalLink = await tx.link.findUnique({
                where: { id: linkId },
            });

            if (!originalLink) {
                throw new ApiError("Link not found", 404);
            }

            // Shift subsequent links' positions to avoid position duplication
            await tx.link.updateMany({
                where: {
                    userId: user.id,
                    position: { gte: originalLink.position + 1 },
                },
                data: {
                    position: { increment: 1 },
                },
            });

            // Create variant B directly after original link
            const newLink = await tx.link.create({
                data: {
                    workspaceId: originalLink.workspaceId,
                    userId: user.id,
                    platform: `${originalLink.platform}__ab_b`,
                    alias: originalLink.alias ? `${originalLink.alias}-b` : null,
                    label: `${originalLink.label} (Variant B)`,
                    url: originalLink.url,
                    position: originalLink.position + 1,
                    isPublic: originalLink.isPublic,
                    isGroup: originalLink.isGroup,
                    parentId: originalLink.parentId,
                    pinCode: originalLink.pinCode,
                    isSocialIcon: originalLink.isSocialIcon,
                    startDate: originalLink.startDate,
                    endDate: originalLink.endDate,
                    abTestVariant: "B",
                    abTestParentId: originalLink.id,
                },
            });

            return { variantA: originalLink, variantB: newLink };
        });

        return NextResponse.json(result);
    } catch (err: unknown) {
        if (err instanceof ApiError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.status }
            );
        }

        if (err instanceof Error) {
            if (err.message === "Link not found") {
                return NextResponse.json({ error: err.message }, { status: 404 });
            }
            if (err.message === "Unauthorized") {
                return NextResponse.json({ error: err.message }, { status: 403 });
            }
            if (err.message.includes("already part of")) {
                return NextResponse.json({ error: err.message }, { status: 409 });
            }
        }

        console.error("A/B test creation error:", err);
        return NextResponse.json(
            { error: "Failed to create A/B test" },
            { status: 500 }
        );
    }
}

