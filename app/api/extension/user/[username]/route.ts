import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;
        const normalizedUsername = username.toLowerCase();

        const user = await prisma.user.findUnique({
            where: { username: normalizedUsername },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                links: {
                    where: {
                        isPublic: true,
                    },
                    select: {
                        id: true,
                        platform: true,
                        url: true,
                        label: true,
                        pinCode: true,
                    },
                    orderBy: {
                        position: 'asc'
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                name: user.name,
                username: user.username,
                image: user.image,
            },
            // PIN-locked links must not expose their destination here (same as
            // the public profile, which hides it behind PIN verification).
            links: user.links.map(({ pinCode, url, ...link }) => ({
                ...link,
                url: pinCode ? null : url,
                locked: Boolean(pinCode),
            }))
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
