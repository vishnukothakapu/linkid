"use client";

import { ArrowRight, Copy, Globe, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { PLATFORM_ICONS } from "../../lib/platformIcons";
import { ProfileLinks } from "./types/type";

/**
 * ProfileLinkItem Component
 * Renders a single link item on a user's public profile page.
 * Displays the appropriate platform icon and custom link label.
 *
 * @param {ProfileLinks} props - The properties object.
 * @param {Object} props.link - The link data from the database.
 * @param {string} props.username - The profile owner's username for routing.
 * @returns {JSX.Element} The rendered link item component.
 */
export function ProfileLinkItem({ link, username, layoutStyle }: ProfileLinks) {
    const Icon = PLATFORM_ICONS[link.platform] ?? Globe;
    const ariaLabel = `Visit ${link.label || link.platform}`;
    const href = `/${username}/${link.alias || link.platform}`;

    const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const copyTarget = link.pinCode
                ? new URL(href, window.location.origin).href
                : link.url;
            await navigator.clipboard.writeText(copyTarget);
            toast.success("Link copied!");
        } catch {
            toast.error("Failed to copy link.");
        }
    };

    const copyButton = (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${link.label || link.platform} link`}
            title="Copy link"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Copy className="h-4 w-4" />
        </button>
    );

    if (layoutStyle === "GRID") {
        return (
            <div className="relative group flex flex-col items-center justify-center rounded-xl border bg-background transition hover:bg-muted hover:scale-105 aspect-square">
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={ariaLabel}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 p-4"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1 font-medium text-xs text-center truncate w-full justify-center">
                        <span className="truncate capitalize">{link.label || link.platform}</span>
                        {link.pinCode && <Lock className="h-3 w-3 flex-shrink-0 opacity-70" />}
                    </div>
                </a>
                <div className="absolute right-2 top-2">{copyButton}</div>
            </div>
        );
    }

    return (
        <div className="group flex items-center rounded-lg border bg-background transition hover:bg-muted pr-3">
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabel}
                className="flex min-w-0 flex-1 items-center justify-between py-3 pl-4 pr-2"
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate font-medium capitalize">
                            {link.label || link.platform}
                        </span>
                        {link.pinCode && <Lock className="h-3.5 w-3.5 shrink-0 opacity-70 ml-1" />}
                    </div>
                </div>

                <ArrowRight className="ml-2 h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </a>
            {copyButton}
        </div>
    );
}
