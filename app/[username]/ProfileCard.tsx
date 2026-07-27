import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLinks } from "./ProfileLinks";
import { ProfileCTA } from "./ProfileCTA";
import { ProfileCardProps } from "./types/type";
import { NewsletterSubscribeBlock } from "./NewsletterSubscribeBlock";

export function ProfileCard(props: ProfileCardProps) {
    const { user, username, showCTA, isOwner, themeType } = props;

    const cardClassName = 
      themeType === "glassmorphism" ? "bg-white/5 border border-white/10 backdrop-blur-md text-white shadow-2xl" :
      themeType === "retro" ? "bg-black border-2 border-green-500 text-green-500 font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:-translate-y-2 transition-all duration-300" :
      themeType === "cyberpunk" ? "bg-zinc-950 border border-pink-500 text-cyan-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:-translate-y-2 transition-all duration-300" :
      "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl";

    return (
        <Card className={cardClassName}>
            <CardHeader className="pb-2">
                <ProfileHeader
                    name={user.name}
                    username={username}
                    bio={user.bio}
                    image={user.image}
                />
            </CardHeader>

            <CardContent className="space-y-3">
                {user.enableEmailCapture && (
                    <NewsletterSubscribeBlock username={username} />
                )}

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
