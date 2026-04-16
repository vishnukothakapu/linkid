import prisma from "@/lib/prisma";
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

    if (!exists) {
        return NextResponse.json({ available: true });
    }

    const suggestions: string[] = [];
    let counter = 1;
    const batchSize = 10;

    while (suggestions.length < 3 && counter <= 100) {
        const candidates: string[] = [];

        // Mix in a couple of random stylish suffixes on the first pass
        if (counter === 1) {
            const styleSuffixes = ["_dev", "_pro", "_link", "HQ", "_me", "_hub"]
                .sort(() => 0.5 - Math.random());
            candidates.push(username + styleSuffixes[0]);
            candidates.push(username + styleSuffixes[1]);
        }

        // Generate sequential suffixes (e.g., username1, username2...)
        for (let i = 0; i < batchSize; i++) {
            candidates.push(`${username}${counter + i}`);
        }

        const existingUsers = await prisma.user.findMany({
            where: { username: { in: candidates } },
            select: { username: true }
        });

        const existingUsernames = new Set(existingUsers.map(u => u.username));

        for (const candidate of candidates) {
            if (!existingUsernames.has(candidate) && !suggestions.includes(candidate)) {
                suggestions.push(candidate);
                if (suggestions.length === 3) break;
            }
        }

        counter += batchSize;
    }

    return NextResponse.json({ available: false, suggestions });
}
