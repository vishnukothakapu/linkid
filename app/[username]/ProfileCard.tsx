import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLinks } from "./ProfileLinks";
import { ProfileCTA } from "./ProfileCTA";
import { ProfileCardProps } from "./types/type";

export function ProfileCard(props: ProfileCardProps) {
    const { user, username, showCTA, isOwner } = props;

    return (
        <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <CardHeader className="pb-2">
                <ProfileHeader
                    name={user.name}
                    username={username}
                    bio={user.bio}
                    image={user.image}
                />
            </CardHeader>

            <CardContent className="space-y-3">
                <ProfileLinks
                    links={user.links ?? []}
                    username={username}
                    isOwner={isOwner}
                />

                {showCTA && <ProfileCTA />}
            </CardContent>
        </Card>
    );
}
