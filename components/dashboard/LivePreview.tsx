import React from "react";
import { ProfileCard } from "@/app/[locale]/[username]/ProfileCard";
import type { Link as ProfileLink } from "@/app/[locale]/[username]/types/type";
import { LayoutStyle } from "@/app/[locale]/[username]/types/type";

interface LivePreviewProps {
    username: string;
    links: ProfileLink[];
    theme: string;
    layoutStyle: LayoutStyle;
    backgroundImage: string | null;
    name: string | null;
    bio: string | null;
    image: string | null;
    isVerified: boolean;
    enableEmailCapture: boolean;
    themeType: string;
    themeColor: string;
    themeCustom: string | null;
}

export function LivePreview({
    username,
    links,
    theme,
    layoutStyle,
    backgroundImage,
    name,
    bio,
    image,
    isVerified,
    enableEmailCapture,
    themeType,
    themeColor,
    themeCustom,
}: LivePreviewProps) {
    const bgStyle: React.CSSProperties = {};
    if (themeType === "solid") {
        bgStyle.backgroundColor = themeColor || "#0f172a";
    } else if (themeType === "gradient") {
        if (themeColor === "custom" && themeCustom) {
            const parts = themeCustom.split(",");
            bgStyle.backgroundImage = `linear-gradient(135deg, ${parts[0] || "#0f172a"}, ${parts[1] || "#0369a1"})`;
        } else {
            bgStyle.backgroundColor = "#0f172a";
        }
    } else if (themeType === "glassmorphism") {
        bgStyle.backgroundColor = "#030712";
        bgStyle.backgroundImage = "radial-gradient(ellipse at top, #1e293b, transparent)";
    } else if (themeType === "retro") {
        bgStyle.backgroundColor = "#000000";
        bgStyle.fontFamily = "monospace";
    } else if (themeType === "cyberpunk") {
        bgStyle.backgroundColor = "#050505";
        bgStyle.backgroundImage = "linear-gradient(180deg, #09090b 0%, #1e1b4b 100%)";
    }

    const now = new Date();
    const filterLinks = (linksToFilter: ProfileLink[]): ProfileLink[] => {
        return linksToFilter.reduce<ProfileLink[]>((acc, link) => {
            if (!link.isPublic) return acc;
            if (link.startDate && new Date(link.startDate) > now) return acc;
            if (link.endDate && new Date(link.endDate) < now) return acc;

            if (link.isGroup && link.children) {
                const filteredChildren = filterLinks(link.children);
                if (filteredChildren.length > 0) {
                    acc.push({ ...link, children: filteredChildren });
                }
            } else if (!link.isGroup) {
                acc.push(link);
            }
            return acc;
        }, []);
    };
    const activeLinks = filterLinks(links || []);

    return (
        <div 
            className={`w-full h-full overflow-y-auto overflow-x-hidden relative scrollbar-hide theme-${theme || "default"}`}
            style={bgStyle}
        >
            {backgroundImage && (
                <>
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundAttachment: "fixed",
                        }}
                    />
                    <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />
                </>
            )}
            
            <div className="relative z-10 px-4 py-12 flex justify-center">
                <div className="w-full max-w-sm">
                    <ProfileCard
                        user={{
                            name: name,
                            username: username,
                            bio: bio,
                            image: image,
                            links: activeLinks,
                            resumeUrl: null, // Omitted for live preview
                            enableEmailCapture: enableEmailCapture,
                            layoutStyle: layoutStyle,
                            isVerified: isVerified,
                        }}
                        username={username}
                        showCTA={false}
                        isOwner={true}
                        themeType={themeType}
                    />
                </div>
            </div>
        </div>
    );
}
