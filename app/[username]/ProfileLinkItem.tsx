import { ArrowRight } from "lucide-react";
import { PLATFORM_ICONS } from "../../lib/platformIcons";

export function ProfileLinkItem({ link }: { link: any }) {
    const Icon =
        PLATFORM_ICONS[link.platform] ?? PLATFORM_ICONS.default;

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 transition hover:bg-muted"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-5 w-5" />
                </div>

                <span className="font-medium capitalize">
                    {link.platform}
                </span>
            </div>

            <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
        </a>
    );
}
