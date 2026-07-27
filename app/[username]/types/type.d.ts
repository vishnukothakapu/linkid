export type Link = {
    label: string;
    id: string;
    createdAt: Date;
    platform: string;
    alias?: string | null;
    url: string;
    position: number;
    clicks: number;
    isPublic: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
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
        enableEmailCapture?: boolean;
    };
    username: string;
    showCTA: boolean;
}

export type ProfileCardProps = User & {
    isOwner: boolean;
    themeType?: string | null;
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

