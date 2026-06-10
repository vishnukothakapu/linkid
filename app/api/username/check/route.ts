import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateUsername } from "@/lib/validations/username";

async function isAvailable(username: string): Promise<boolean> {
    const [user, alias] = await Promise.all([
        prisma.user.findUnique({ where: { username } }),
        prisma.userAlias.findUnique({ where: { username } }),
    ]);

    return !user && !alias;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.toLowerCase();

    if (!username) {
        return NextResponse.json({ available: false, error: "Username is required" });
    }

    const validation = validateUsername(username);
    if (!validation.valid) {
        return NextResponse.json({ available: false, error: validation.error });
    }

    const available = await isAvailable(username);

    if (available) {
        return NextResponse.json({ available: true });
    }

    const year = new Date().getFullYear().toString().slice(-2);
    const short = username.slice(0, 5);
    const abbr = username.replace(/[aeiou]/gi, "").slice(0, 6) || short;
    const rand = Math.floor(10 + Math.random() * 90);

    const candidates = [...new Set([
        abbr !== username ? abbr : null,
        `${username}dev`,
        `the${username}`,
        `${username}hq`,
        `i${username}`,
        `${short}${year}`,
        `${username}${year}`,
        `${username}${rand}`,
    ].filter(Boolean) as string[])].filter((candidate) => validateUsername(candidate).valid);

    const suggestions: string[] = [];
    for (const candidate of candidates) {
        if (await isAvailable(candidate)) suggestions.push(candidate);
        if (suggestions.length === 5) break;
    }

    return NextResponse.json({ available: false, suggestions });
}
