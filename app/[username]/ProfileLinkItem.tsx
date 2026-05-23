import { ArrowRight,Globe } from "lucide-react";
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
export function ProfileLinkItem({ link, username }: ProfileLinks) {
    const Icon =
        PLATFORM_ICONS[link.platform] ?? Globe;

    return (
        <a
            href={`/${username}/${link.platform}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 transition hover:bg-muted"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-5 w-5" />
                </div>

                <span className="font-medium capitalize">
                    {link.label}
                </span>
            </div>

            <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
        </a>
    );
}
