import { ProfileLinkItem } from "./ProfileLinkItem";
import { ProfileLinkGroup } from "./ProfileLinkGroup";
import { EmptyProfileState } from "./EmptyProfileState";
import { ProfileLinksProps } from "./types/type";

export function ProfileLinks({
    links,
    username,
    isOwner,
    layoutStyle,
}: ProfileLinksProps) {
    const safeLinks = (links ?? []).filter((item) => {
        if (item.isGroup) {
            return (item.children?.length ?? 0) > 0;
        }
        return true;
    });

    if (safeLinks.length === 0) {
        return <EmptyProfileState isOwner={isOwner} />;
    }

    const isGrid = layoutStyle === "GRID";

    return (
        <div className={isGrid ? "grid grid-cols-2 md:grid-cols-4 gap-4" : "space-y-3"}>
            {safeLinks.map((item) => {
                if (item.isGroup) {
                    return (
                        <div key={item.id} className={isGrid ? "col-span-full" : ""}>
                            <ProfileLinkGroup
                                group={item}
                                username={username}
                                layoutStyle={layoutStyle}
                            />
                        </div>
                    );
                }

                return (
                    <ProfileLinkItem
                        key={item.id}
                        link={item}
                        username={username}
                        layoutStyle={layoutStyle}
                    />
                );
            })}
        </div>
    );
}
