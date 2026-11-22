import type { ProfileHeader } from "./types/type";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";

export function ProfileHeader(props: ProfileHeader) {
    const { name, username, bio, image, isVerified } = props;
    return (
        <div className="text-center space-y-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold overflow-hidden">
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
                <h1 className="text-2xl font-bold flex items-center justify-center gap-1">
                    {name ?? username}
                    {isVerified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />}
                </h1>
                <p className="text-sm text-muted-foreground">@{username}</p>
                {bio && (
                    <p className="text-sm text-balance mt-3">
                        {bio}
                    </p>
                )}
            </div>
        </div>
    );
}