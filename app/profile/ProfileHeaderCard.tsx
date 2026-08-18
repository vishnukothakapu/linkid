"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditProfileModal from "./EditProfileModal";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { getCsrfToken } from "@/lib/csrfClient";
import { useSession } from "next-auth/react";
import { AvatarCropModal } from "./AvatarCropModal";
import { Camera, Check, Pencil, X } from "lucide-react";
import { presetAvatars } from "../../lib/presetAvatars";

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
    const [pickerOpen, setPickerOpen] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { update } = useSession();
     const [pickerInstance, setPickerInstance] = useState(0);
    const handlePickerOpen= () => {
        setPickerInstance((n) => n + 1);
        setPickerOpen(true);
};

    function openUploadPicker() {
        setPickerOpen(false);
        fileInputRef.current?.click();
    }

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

    async function handlePresetSelect(src: string) {
        setUploading(true);

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/profile/avatar", {
                method: "PATCH",
                headers: {
                    "content-type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ avatar: src }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "Failed to update avatar");
                return;
            }

            setAvatarUrl(src);
            await update({ image: src });
            setPickerOpen(false);
            toast.success("Avatar updated!");
        } catch {
            toast.error("Something went wrong");
        } finally {
            setUploading(false);
        }
    }

    async function handleRemoveAvatar() {
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
            <AvatarPickerModal
                key={`${avatarUrl ?? "none"}-${pickerInstance}`}
                currentAvatar={avatarUrl}
                open={pickerOpen}
                uploading={uploading}
                onOpenChange={setPickerOpen}
                onPresetSelect={handlePresetSelect}
                onUploadClick={openUploadPicker}
            />

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
                                type="button"
                                onClick={handlePickerOpen}
                                disabled={uploading}
                                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                                aria-label="Edit avatar"
                            >
                                {uploading ? (
                                    <span className="text-[10px]">...</span>
                                ) : (
                                    <Pencil className="h-3 w-3" />
                                )}
                            </button>
                            {avatarUrl && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    disabled={uploading}
                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-70"
                                    aria-label="Remove avatar"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
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

function AvatarPickerModal({
    currentAvatar,
    open,
    uploading,
    onOpenChange,
    onPresetSelect,
    onUploadClick,
}: {
    currentAvatar: string | null;
    open: boolean;
    uploading: boolean;
    onOpenChange: (open: boolean) => void;
    onPresetSelect: (src: string) => void;
    onUploadClick: () => void;
}) {
    const categories = Array.from(new Set(presetAvatars.map((avatar) => avatar.category)));
    const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Choose an avatar</DialogTitle>
                    <DialogDescription>
                        Pick a built-in avatar or upload and crop your own photo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center gap-2"
                        onClick={onUploadClick}
                        disabled={uploading}
                    >
                        <Camera className="h-4 w-4" />
                        Upload photo
                    </Button>

                    <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
                        {categories.map((category) => (
                            <section key={category} className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    {category}
                                </h3>
                                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                    {presetAvatars
                                        .filter((avatar) => avatar.category === category)
                                        .map((avatar) => {
                                            const selected = selectedAvatar === avatar.src;

                                            return (
                                                <button
                                                    key={avatar.id}
                                                    type="button"
                                                    onClick={() => setSelectedAvatar(avatar.src)}
                                                    disabled={uploading}
                                                    aria-label={`Select ${avatar.name} avatar`}
                                                    aria-pressed={selected}
                                                    className="group relative flex aspect-square items-center justify-center rounded-lg border bg-background p-1 transition hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70 data-[selected=true]:border-primary data-[selected=true]:ring-2 data-[selected=true]:ring-primary/30"
                                                    data-selected={selected}
                                                >
                                                    <Avatar className="h-full w-full">
                                                        <AvatarImage src={avatar.src} alt="" />
                                                        <AvatarFallback>
                                                            {avatar.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {selected && (
                                                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                            <Check className="h-3.5 w-3.5" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            </section>
                        ))}
                    </div>
                     <div className="flex justify-end gap-2 pt-4">
                    <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    >
                    Cancel
                    </Button>

                    <Button
                    disabled={!selectedAvatar || selectedAvatar === currentAvatar || uploading}
                    onClick={() => {
                        if (selectedAvatar) {
                            onPresetSelect(selectedAvatar);
                        }
                    }}
                    >
                    Save Avatar
                    </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
