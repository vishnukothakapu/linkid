import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { hasSupportedImageMagicBytes } from "@/lib/imageValidation";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
        return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate declared MIME type (first-pass, client-supplied but cheap to check).
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        return Response.json({ error: "Only JPG, PNG and WebP allowed" }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        return Response.json({ error: "File size must be under 2MB" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate actual file content via magic bytes.
    // file.type is the MIME type declared by the client in the multipart
    // Content-Type field, which is entirely attacker-controlled.
    // This check reads the first 12 bytes of the buffer to verify that the
    // payload is genuinely a JPEG, PNG, or WebP image regardless of what
    // the client declared.
    if (!hasSupportedImageMagicBytes(buffer)) {
        return Response.json(
            { error: "File content does not match a supported image format (JPG, PNG or WebP)" },
            { status: 400 },
        );
    }

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: "linkid/avatars", transformation: [{ width: 200, height: 200, crop: "fill" }] },
            (error, result) => {
                if (error || !result) reject(error);
                else resolve(result);
            }
        ).end(buffer);
    });

    // Save URL to database
    await prisma.user.update({
        where: { email: session.user.email },
        data: { image: result.secure_url },
    });

    return Response.json({ success: true, imageUrl: result.secure_url });
}
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
        where: { email: session.user.email },
        data: { image: null },
    });

    return Response.json({ success: true });
}