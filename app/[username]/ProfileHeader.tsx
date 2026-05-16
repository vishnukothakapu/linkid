"use client";
import type { ProfileHeader } from "./types/type";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

export function ProfileHeader(props: ProfileHeader) {
    const { name, username, bio, image } = props;

    const handleShare = async () => {
        const shareData = {
            title: `${name ?? username} | LinkID`,
            text: `Check out ${name ?? username}'s professional links on LinkID.`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Profile link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    return (
        <div className="relative text-center space-y-2">
            <div className="absolute right-0 top-0">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleShare}
                    className="rounded-full hover:bg-muted"
                    aria-label="Share profile"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold overflow-hidden border-2 border-background shadow-sm">
                {image ? (
                    <Image
                        src={image}
                        alt={name ?? username}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    (name ?? username)[0]?.toUpperCase()
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold">{name ?? username}</h1>
                <p className="text-sm text-muted-foreground font-medium">@{username}</p>
                {bio && (
                    <p className="text-sm text-balance mt-3 text-muted-foreground/90">
                        {bio}
                    </p>
                )}
            </div>
        </div>
    );
}