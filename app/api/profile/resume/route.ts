import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateUrlBackend } from "@/lib/urlValidation";
import { resolveActiveWorkspace } from "@/lib/workspace";
import { revalidateTag } from "next/cache";
import { invalidateProfileCache } from "@/lib/profileCache";

// Allowed file extensions for resume URLs
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_URL_LENGTH = 2048;

/**
 * Validate that a URL points to an allowed resume file type
 */
function validateResumeUrl(url: string): { valid: true } | { valid: false; error: string } {
    if (url.length > MAX_URL_LENGTH) {
        return { valid: false, error: "URL is too long" };
    }

    try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname.toLowerCase();
        const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => pathname.endsWith(ext));

        if (!hasAllowedExtension) {
            return {
                valid: false,
                error: `Resume URL must point to a file with one of these extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
            };
        }
    } catch {
        return { valid: false, error: "Invalid URL format" };
    }

    return { valid: true };
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId");
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        const workspaceData = await prisma.workspace.findUnique({
            where: { id: workspace.id },
            select: {
                resumeUrl: true,
                resumeDownloadCount: true,
            },
        });

        if (!workspaceData) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json({
            resumeUrl: workspaceData.resumeUrl,
            resumeDownloadCount: workspaceData.resumeDownloadCount,
        });
    } catch (error) {
        console.error("Error fetching resume:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { resumeUrl, workspaceId: bodyWorkspaceId } = body;

        const preferredWorkspaceId = req.headers.get("x-workspace-id") || req.nextUrl?.searchParams?.get("workspaceId") || bodyWorkspaceId;
        const workspace = await resolveActiveWorkspace(session.user.id, preferredWorkspaceId);
        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        if (resumeUrl) {
            const urlValidation = validateUrlBackend(resumeUrl);
            if (!urlValidation.valid) {
                return NextResponse.json({ error: urlValidation.error }, { status: 400 });
            }

            const fileValidation = validateResumeUrl(urlValidation.normalizedUrl);
            if (!fileValidation.valid) {
                return NextResponse.json({ error: fileValidation.error }, { status: 400 });
            }

            await prisma.workspace.update({
                where: { id: workspace.id },
                data: { resumeUrl: urlValidation.normalizedUrl },
            });
        } else {
            await prisma.workspace.update({
                where: { id: workspace.id },
                data: {
                    resumeUrl: null,
                    resumeDownloadCount: 0,
                },
            });
        }

        // The resume URL renders on the public profile (via both cache layers).
        await invalidateProfileCache(workspace.id);
        revalidateTag("public-profile", "default");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating resume:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
