"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditProfileModal from "./EditProfileModal";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { getCsrfToken } from "@/lib/csrfClient";
import { useSession } from "next-auth/react";
import { AvatarCropModal } from "./AvatarCropModal";

export function ProfileHeaderCard({
    user,
    sessionImage,
    workspaceId,
}: {
    user: {
        name?: string | null;
        username?: string | null;
        bio?: string | null;
        createdAt: string | Date;
        image?: string | null;
    };
    sessionImage?: string | null;
    workspaceId?: string;
}) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(
        user.image ?? sessionImage ?? null
    );
    const [uploading, setUploading] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { update } = useSession();

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Only JPG, PNG and WebP allowed");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be under 2MB");
            return;
        }

        // Open crop modal with image preview
        const reader = new FileReader();
        reader.onload = () => {
            setRawImageSrc(reader.result as string);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset file input
        e.target.value = "";
    }

    async function handleCropComplete(blob: Blob) {
        setCropModalOpen(false);
        setUploading(true);

        const formData = new FormData();
        formData.append("avatar", blob, "avatar.jpg");

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
                headers: {
                    "x-csrf-token": csrfToken,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "Upload failed");
                return;
            }

            setAvatarUrl(data.imageUrl);
            await update({ image: data.imageUrl });
            toast.success("Avatar updated!");
        } catch {
            toast.error("Something went wrong");
        } finally {
            setUploading(false);
        }
    }
    async function handleRemoveAvatar() {
    console.log("Remove avatar clicked!");
    setUploading(true);
    try {
        const csrfToken = await getCsrfToken();
        const res = await fetch("/api/profile/avatar", {
            method: "DELETE",
            headers: {
                "x-csrf-token": csrfToken,
            },
        });

        if (!res.ok) {
            toast.error("Failed to remove avatar");
            return;
        }

        setAvatarUrl(null);
        await update({ image: null });
        toast.success("Avatar removed!");
    } catch {
        toast.error("Something went wrong");
    } finally {
        setUploading(false);
    }
}

    return (
        <>
            <AvatarCropModal
                open={cropModalOpen}
                imageSrc={rawImageSrc}
                onClose={() => setCropModalOpen(false)}
                onCropComplete={handleCropComplete}
            />

            <Card className="shadow-sm">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">

                    {/* Avatar with upload button */}
                    <div className="relative group w-fit">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                            <AvatarImage src={avatarUrl ?? undefined} />
                            <AvatarFallback className="text-lg sm:text-xl">
                                {user.name?.[0]?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                        </Avatar>

                        {/* Pencil icon at bottom right */}
                        <div className="absolute bottom-0 right-0 flex gap-1">
                            <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                                {uploading ? (
                                    <span className="text-[10px]">...</span>
                                ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                )}
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="flex-1 space-y-0.5 sm:space-y-1">
                        <h1 className="text-xl sm:text-2xl font-semibold">
                            {user.name ?? user.username}
                        </h1>

                        {user.username && (
                            <code className="text-xs sm:text-sm text-muted-foreground">
                                linkid.qzz.io/{user.username}
                            </code>
                        )}

                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                        {user.bio && (
                            <p className="text-sm text-muted-foreground mt-2 wrap-break-word">
                                {user.bio}
                            </p>
                        )}
                    </div>

                    <EditProfileModal
                        workspaceId={workspaceId}
                        initialName={user.name ?? ""}
                        initialUsername={user.username ?? ""}
                        initialBio={user.bio ?? ""}
                    />
                </CardContent>
            </Card>
        </>
    );
}