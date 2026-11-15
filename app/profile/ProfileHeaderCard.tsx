"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AVATAR_PRESETS } from "@/lib/avatarPresets";
import EditProfileModal from "./EditProfileModal";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { getCsrfToken } from "@/lib/csrfClient";
import { useSession } from "next-auth/react";
import { AvatarCropModal } from "./AvatarCropModal";
import { Check, Pencil, Trash2, Upload } from "lucide-react";

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
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { update } = useSession();

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            toast.error("Only JPG, PNG and WebP allowed");
            e.target.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be under 2MB");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            setRawImageSrc(reader.result as string);
            setCropModalOpen(true);
        };

        reader.onerror = () => {
            toast.error("Unable to read the selected image");
        };

        reader.readAsDataURL(file);
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

    async function handlePresetSelect(presetId: string) {
        if (uploading) return;

        setUploading(true);

        try {
            const csrfToken = await getCsrfToken();

            const res = await fetch("/api/profile/avatar", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ presetId }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "Unable to select avatar");
                return;
            }

            setAvatarUrl(data.imageUrl);
            await update({ image: data.imageUrl });
            setAvatarDialogOpen(false);
            toast.success("Avatar updated!");
        } catch {
            toast.error("Something went wrong");
        } finally {
            setUploading(false);
        }
    }

    async function handleRemoveAvatar() {
        if (uploading) return;

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
            setAvatarDialogOpen(false);
            toast.success("Avatar removed!");
        } catch {
            toast.error("Something went wrong");
        } finally {
            setUploading(false);
        }
    }

    function handleUploadClick() {
        setAvatarDialogOpen(false);
        window.setTimeout(() => fileInputRef.current?.click(), 100);
    }

    return (
        <>
            <AvatarCropModal
                open={cropModalOpen}
                imageSrc={rawImageSrc}
                onClose={() => setCropModalOpen(false)}
                onCropComplete={handleCropComplete}
            />

            <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Choose Your Avatar</DialogTitle>
                        <DialogDescription>
                            Select a preset avatar or upload your own photo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-4 gap-3 py-4">
                        {AVATAR_PRESETS.map((preset) => {
                            const selected = avatarUrl === preset.src;

                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handlePresetSelect(preset.id)}
                                    disabled={uploading}
                                    aria-label={`Select ${preset.name} avatar`}
                                    aria-pressed={selected}
                                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                                        selected
                                            ? "border-primary bg-primary/5"
                                            : "border-transparent"
                                    }`}
                                >
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage
                                            src={preset.src}
                                            alt={`${preset.name} avatar`}
                                        />
                                        <AvatarFallback>
                                            {preset.name[0]}
                                        </AvatarFallback>
                                    </Avatar>

                                    <span className="text-xs font-medium">
                                        {preset.name}
                                    </span>

                                    {selected && (
                                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadClick}
                            disabled={uploading}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Photo
                        </Button>

                        {avatarUrl && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleRemoveAvatar}
                                disabled={uploading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Avatar
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="shadow-sm">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                    <div className="relative group w-fit">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                            <AvatarImage src={avatarUrl ?? undefined} />
                            <AvatarFallback className="text-lg sm:text-xl">
                                {user.name?.[0]?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="absolute bottom-0 right-0">
                            <button
                                type="button"
                                onClick={() => setAvatarDialogOpen(true)}
                                disabled={uploading}
                                aria-label="Edit profile avatar"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {uploading ? (
                                    <span className="text-[10px]">...</span>
                                ) : (
                                    <Pencil className="h-3.5 w-3.5" />
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
                        <h1 className="text-xl font-semibold sm:text-2xl">
                            {user.name ?? user.username}
                        </h1>

                        {user.username && (
                            <code className="text-xs text-muted-foreground sm:text-sm">
                                linkid.qzz.io/{user.username}
                            </code>
                        )}

                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>

                        {user.bio && (
                            <p className="mt-2 text-sm text-muted-foreground wrap-break-word">
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