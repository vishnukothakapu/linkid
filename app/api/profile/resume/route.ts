import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateUrlBackend } from "@/lib/urlValidation";

// Allowed file extensions for resume URLs
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_URL_LENGTH = 2048;

/**
 * Validate that a URL points to an allowed resume file type
 */
function validateResumeUrl(url: string): { valid: true } | { valid: false; error: string } {
    // Check URL length
    if (url.length > MAX_URL_LENGTH) {
        return { valid: false, error: "URL is too long" };
    }

    // Parse URL and extract pathname for extension validation
    try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname.toLowerCase();
        
        // Check for allowed file extensions in the pathname only
        const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => pathname.endsWith(ext));
        
        if (!hasAllowedExtension) {
            return { 
                valid: false, 
                error: `Resume URL must point to a file with one of these extensions: ${ALLOWED_EXTENSIONS.join(", ")}` 
            };
        }
    } catch {
        return { valid: false, error: "Invalid URL format" };
    }

    return { valid: true };
}

/**
 * GET: Retrieve the current user's resume URL
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { resumeUrl: true, resumeDownloadCount: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            resumeUrl: user.resumeUrl,
            resumeDownloadCount: user.resumeDownloadCount,
        });
    } catch (error) {
        console.error("Error fetching resume:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * PATCH: Update the user's resume URL
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { resumeUrl } = body;

        // If resumeUrl is provided, validate it
        if (resumeUrl) {
            // First validate the URL structure
            const urlValidation = validateUrlBackend(resumeUrl);
            if (!urlValidation.valid) {
                return NextResponse.json({ error: urlValidation.error }, { status: 400 });
            }

            // Then validate it points to an allowed file type
            const fileValidation = validateResumeUrl(urlValidation.normalizedUrl);
            if (!fileValidation.valid) {
                return NextResponse.json({ error: fileValidation.error }, { status: 400 });
            }

            // Update with the normalized URL
            await prisma.user.update({
                where: { id: session.user.id },
                data: { resumeUrl: urlValidation.normalizedUrl },
            });
        } else {
            // If resumeUrl is null/empty, remove the resume and reset download count
            await prisma.user.update({
                where: { id: session.user.id },
                data: { 
                    resumeUrl: null,
                    resumeDownloadCount: 0,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating resume:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
