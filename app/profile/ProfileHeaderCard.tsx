import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditProfileModal from "./EditProfileModal";

export function ProfileHeaderCard({
    user,
    sessionImage,
}: {
    user: {
        name?: string | null;
        username?: string | null;
        createdAt: string | Date;
    };
    sessionImage?: string | null;
}) {
    return (
        <Card className="shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={sessionImage ?? ""} />
                    <AvatarFallback className="text-lg sm:text-xl">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-0.5 sm:space-y-1">
                    <h1 className="text-xl sm:text-2xl font-semibold">
                        {user.name ?? user.username}
                    </h1>

                    {user.username && (
                        <code className="text-xs sm:text-sm text-muted-foreground">
                            linkid.me/{user.username}
                        </code>
                    )}

                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Joined{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </p>
                </div>

                <EditProfileModal
                    initialName={user.name ?? ""}
                    initialUsername={user.username ?? ""}
                />
            </CardContent>
        </Card>
    );
}
