import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { resolveWorkspaceByUsernameOrAlias } from "@/lib/userLookup";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const resolved = await resolveWorkspaceByUsernameOrAlias(username);
        if (!resolved) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: resolved.workspaceId },
            include: {
                members: {
                    where: { role: "OWNER" },
                    include: { user: true },
                    take: 1,
                },
                links: {
                    where: { isPublic: true },
                    select: {
                        id: true,
                        platform: true,
                        url: true,
                        label: true,
                    },
                    orderBy: { position: 'asc' },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const owner = workspace.members[0]?.user;

        return NextResponse.json({
            user: {
                name: owner?.name ?? workspace.name ?? workspace.username ?? "",
                username: workspace.username ?? null,
                image: owner?.image ?? null,
            },
            links: workspace.links
        }, {
            // Allow CORS for the chrome extension
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error("Extension API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function OPTIONS(req: Request) {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
