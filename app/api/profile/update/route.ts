import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { name, username } = await req.json();

    await prisma.user.update({
        where: { email: session.user.email },
        data: {
            name,
            username,
        },
    });

    return Response.json({ success: true });
}
