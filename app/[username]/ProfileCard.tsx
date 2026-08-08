"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLinks } from "./ProfileLinks";
import { ProfileCTA } from "./ProfileCTA";
import { ProfileCardProps } from "./types/type";
import { NewsletterSubscribeBlock } from "./NewsletterSubscribeBlock";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { Globe, Search } from "lucide-react";

export function ProfileCard(props: ProfileCardProps) {
    const { user, username, showCTA, isOwner, themeType } = props;
    const [searchQuery, setSearchQuery] = useState("");

    const cardClassName = 
      themeType === "glassmorphism" ? "bg-white/5 border border-white/10 backdrop-blur-md text-white shadow-2xl" :
      themeType === "retro" ? "bg-black border-2 border-green-500 text-green-500 font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:-translate-y-2 transition-all duration-300" :
      themeType === "cyberpunk" ? "bg-zinc-950 border border-pink-500 text-cyan-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:-translate-y-2 transition-all duration-300" :
      "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl";

    const query = searchQuery.trim().toLowerCase();

    const socialLinks = (user.links ?? []).flatMap((link) =>
        link.isGroup ? (link.children ?? []).filter((c) => c.isSocialIcon) : (link.isSocialIcon ? [link] : [])
    ).filter(link => {
        if (!query) return true;
        const label = (link.label || "").toLowerCase();
        const platform = (link.platform || "").toLowerCase();
        return label.includes(query) || platform.includes(query);
    });

    const regularLinks = (user.links ?? []).flatMap((link) => {
        if (link.isGroup) {
            const regularChildren = (link.children ?? []).filter((c) => !c.isSocialIcon);
            if (regularChildren.length === 0) return [];
            
            if (!query) return [{ ...link, children: regularChildren }];

            const groupLabelMatch = (link.label || "").toLowerCase().includes(query);
            if (groupLabelMatch) return [{ ...link, children: regularChildren }];

            const matchingChildren = regularChildren.filter(c => {
                const cLabel = (c.label || "").toLowerCase();
                const cPlatform = (c.platform || "").toLowerCase();
                return cLabel.includes(query) || cPlatform.includes(query);
            });

            if (matchingChildren.length > 0) {
                return [{ ...link, children: matchingChildren }];
            }
            return [];
        }
        
        if (link.isSocialIcon) return [];

        if (!query) return [link];
        
        const label = (link.label || "").toLowerCase();
        const platform = (link.platform || "").toLowerCase();
        if (label.includes(query) || platform.includes(query)) {
            return [link];
        }
        return [];
    });

    const noLinksFound = query.length > 0 && socialLinks.length === 0 && regularLinks.length === 0;

    return (
        <Card className={cardClassName}>
            <CardHeader className="pb-2">
                <ProfileHeader
                    name={user.name}
                    username={username}
                    bio={user.bio}
                    image={user.image}
                    isVerified={user.isVerified}
                />
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search links..."
                        aria-label="Search links"
                        className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

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

                {noLinksFound ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                        No links found
                    </div>
                ) : (
                    (regularLinks.length > 0 || socialLinks.length === 0) && (
                        <ProfileLinks
                            links={regularLinks}
                            username={username}
                            isOwner={isOwner}
                            layoutStyle={user.layoutStyle}
                        />
                    )
                )}

                {showCTA && <ProfileCTA />}
            </CardContent>
        </Card>
    );
}
