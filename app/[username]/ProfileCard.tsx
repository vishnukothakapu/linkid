import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLinks } from "./ProfileLinks";
import { ProfileCTA } from "./ProfileCTA";

export function ProfileCard({
    user,
    username,
    showCTA,
}: {
    user: any;
    username: string;
    showCTA: boolean;
}) {
    return (
        <Card className="shadow-lg">
            <CardHeader className="pb-2">
                <ProfileHeader name={user.name} username={username} />
            </CardHeader>

            <CardContent className="space-y-3">
                <ProfileLinks links={user.links} />
                {showCTA && <ProfileCTA />}
            </CardContent>
        </Card>
    );
}
