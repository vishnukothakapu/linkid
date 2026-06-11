export type Link = {
    label: string;
    id: string;
    createdAt: Date;
    platform: string;
    url: string;
    position: number;
    clicks: number;
    isPublic: boolean;
    updatedAt?: Date;
    userId: string;
}

export type PlatformParams = {
    platform: string;
    username: string;
}

export type User = {
    user: {
        name: string | null;
        username: string;
        bio: string | null;
        image: string | null;
        links?: Link[];
        resumeUrl?: string | null;
    };
    username: string;
    showCTA: boolean;
}

export type ProfileCardProps = User & {
    isOwner: boolean;
};

export type ProfileLinksProps = {
    links?: Link[];
    username: string;
    isOwner: boolean;
};

export type ProfileHeader = {
    name: string | null;
    username: string;
    bio?: string | null;
    image?: string | null;
}

export type ProfileLinks = {
    link: Link;
    username: string;
}

