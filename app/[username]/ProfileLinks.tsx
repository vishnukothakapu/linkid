import { ProfileLinkItem } from "./ProfileLinkItem";
import { EmptyProfileState } from "./EmptyProfileState";
import { ProfileLinksProps } from "./types/type";

export function ProfileLinks({
    links,
    username,
    isOwner,
}: ProfileLinksProps) {
    const safeLinks = links ?? [];

    if (safeLinks.length === 0) {
        return <EmptyProfileState isOwner={isOwner} />;
    }

    return (
        <div className="space-y-3">
            {safeLinks.map((link) => (
                <ProfileLinkItem
                    key={link.id}
                    link={link}
                    username={username}
                />
            ))}
        </div>
    );
}
