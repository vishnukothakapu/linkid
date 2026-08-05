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
    isGroup: boolean;
    parentId?: string | null;
    pinCode?: string | null;
    children?: Link[];
    startDate?: Date | null;
    endDate?: Date | null;
    updatedAt?: Date;
    userId: string;
}

export type PlatformParams = {
    platform: string;
    username: string;
}

export type LayoutStyle = "LIST" | "GRID";

export type User = {
    user: {
        name: string | null;
        username: string;
        bio: string | null;
        image: string | null;
        links?: Link[];
        resumeUrl?: string | null;
        enableEmailCapture?: boolean;
        layoutStyle?: LayoutStyle | string;
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
    layoutStyle?: LayoutStyle | string;
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
    layoutStyle?: LayoutStyle | string;
}

