import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { presetAvatars } from "@/lib/presetAvatars";
import { hasSupportedImageMagicBytes } from "@/lib/imageValidation";
import { invalidateProfileCache } from "@/lib/profileCache";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate declared MIME type (first-pass, client-supplied but cheap to check).
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Only JPG, PNG and WebP allowed" }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "File size must be under 2MB" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate actual file content via magic bytes.
    // file.type is the MIME type declared by the client in the multipart
    // Content-Type field, which is entirely attacker-controlled.
    // This check reads the first 12 bytes of the buffer to verify that
    // the payload is genuinely a JPEG, PNG, or WebP image.
    if (!hasSupportedImageMagicBytes(buffer)) {
        return NextResponse.json(
            { error: "File content does not match a supported image format (JPG, PNG or WebP)" },
            { status: 400 },
        );
    }

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: "linkid/avatars",
                transformation: [{ width: 200, height: 200, crop: "fill" }],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("Upload failed with no result"));
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });

    // Save URL to database
    await prisma.user.update({
        where: { id: session.user.id },
        data: { image: result.secure_url },
    });

    // Avatar is rendered on the public profile — purge the cache.
    await invalidateProfileCache(session.user.id);

    return NextResponse.json({ success: true, imageUrl: result.secure_url });
}

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { image: null },
    });

    // Avatar removal is reflected on the public profile — purge the cache.
    await invalidateProfileCache(session.user.id);

    return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatar } = await req.json();

    if (!avatar || typeof avatar !== "string") {
        return NextResponse.json(
            { error: "Avatar is required" },
            { status: 400 }
        );
    }

    const isPresetAvatar = presetAvatars.some(
        (preset) => preset.src === avatar
    );

    if (!isPresetAvatar) {
        return NextResponse.json(
            { error: "Invalid avatar preset" },
            { status: 400 }
        );
    }

    await prisma.user.update({
        where: { email: session.user.email },
        data: { image: avatar },
    });

    return NextResponse.json({ success: true });
}