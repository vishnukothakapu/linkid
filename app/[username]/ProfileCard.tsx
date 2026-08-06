import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLinks } from "./ProfileLinks";
import { ProfileCTA } from "./ProfileCTA";
import { ProfileCardProps } from "./types/type";
import { NewsletterSubscribeBlock } from "./NewsletterSubscribeBlock";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { Globe } from "lucide-react";

export function ProfileCard(props: ProfileCardProps) {
    const { user, username, showCTA, isOwner, themeType } = props;

    const cardClassName = 
      themeType === "glassmorphism" ? "bg-white/5 border border-white/10 backdrop-blur-md text-white shadow-2xl" :
      themeType === "retro" ? "bg-black border-2 border-green-500 text-green-500 font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:-translate-y-2 transition-all duration-300" :
      themeType === "cyberpunk" ? "bg-zinc-950 border border-pink-500 text-cyan-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:-translate-y-2 transition-all duration-300" :
      "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl";

    const socialLinks = (user.links ?? []).flatMap((link) =>
        link.isGroup ? (link.children ?? []).filter((c) => c.isSocialIcon) : (link.isSocialIcon ? [link] : [])
    );
    const regularLinks = (user.links ?? []).flatMap((link) => {
        if (link.isGroup) {
            const regularChildren = (link.children ?? []).filter((c) => !c.isSocialIcon);
            return regularChildren.length > 0 ? [{ ...link, children: regularChildren }] : [];
        }
        return !link.isSocialIcon ? [link] : [];
    });

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
                {socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 pt-1 pb-3">
                        {socialLinks.map((link) => {
                            const Icon = PLATFORM_ICONS[link.platform] ?? Globe;
                            return (
                                <a
                                    key={link.id}
                                    href={`/${username}/${link.alias || link.platform}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors hover:scale-110"
                                    aria-label={link.label || link.platform}
                                >
                                    <Icon className="h-6 w-6" />
                                </a>
                            );
                        })}
                    </div>
                )}

                {user.enableEmailCapture && (
                    <NewsletterSubscribeBlock username={username} />
                )}

                {(regularLinks.length > 0 || socialLinks.length === 0) && (
                    <ProfileLinks
                        links={regularLinks}
                        username={username}
                        isOwner={isOwner}
                        layoutStyle={user.layoutStyle}
                    />
                )}

                {showCTA && <ProfileCTA />}
            </CardContent>
        </Card>
    );
}
