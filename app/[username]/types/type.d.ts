export type Link = {
    label: string;
    id: string;
    createdAt: Date;
    platform: string;
    url: string;
    order: number;
    clickCount: number;
    isPublic: boolean;
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
        links: Link[]
    };
    username: string;
    showCTA: boolean;
}


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

