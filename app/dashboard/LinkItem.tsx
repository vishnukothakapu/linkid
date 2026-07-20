"use client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    ExternalLink,
    Pencil,
    X,
    Globe,
    Trash,
    Eye,
    EyeOff,
    Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { validateUrl } from "@/lib/urlValidation";
import { validatePlatformUrl, isKnownPlatform } from "@/lib/platforms";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatLabel, POPULAR_PLATFORMS } from "@/lib/platformHelpers";
import { PLATFORMS } from "@/lib/constants";
export function LinkItem({
    dragListeners,
    dragAttributes,
    link,
    username,
    onUpdate,
    onToggleVisibility,
    onDelete,
}: {
    dragListeners?: SyntheticListenerMap;
    dragAttributes?: DraggableAttributes;
    link: ProfileLink;
    username: string;
    onUpdate: (id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null) => Promise<boolean>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [url, setUrl] = useState(link.url);
    const [label, setLabel] = useState(link.label || "");
    const isStandardPlatform = Object.keys(PLATFORM_ICONS).includes(link.platform);
    const initialPlatform = isStandardPlatform ? link.platform : PLATFORMS.WEBSITE;
    const [platform, setPlatform] = useState(initialPlatform);
    const [startDate, setStartDate] = useState<Date | null>(link.startDate ? new Date(link.startDate) : null);
    const [endDate, setEndDate] = useState<Date | null>(link.endDate ? new Date(link.endDate) : null);
    const [copied, setCopied] = useState(false);
    const Icon = PLATFORM_ICONS[editing ? platform : link.platform] ?? Globe;

    const toDatetimeLocal = (date?: Date | string | null) => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handlePlatformChange = (newPlatform: string) => {
        setPlatform(newPlatform);

        // We intentionally read the stale 'platform' state here (the state before this change)
        // because setPlatform's state update is scheduled for the next render. This allows us
        // to check if the user had left the label as the default/previous platform name,
        // and if so, auto-update the display name to the new platform label.
        const prevPlatformLabel = formatLabel(platform);
        if (
            !label.trim() ||
            label.trim().toLowerCase() === platform.toLowerCase() ||
            label.trim() === prevPlatformLabel
        ) {
            setLabel(formatLabel(newPlatform));
        }
    };

    function copy() {
        navigator.clipboard.writeText(
            `linkid.qzz.io/${username}/${link.alias || link.platform}`
        );
        setCopied(true);
        toast.success("Copied");
        setTimeout(() => setCopied(false), 1200);
    }

    async function save() {
        const validation = validateUrl(url);
        if (!validation.valid) {
            return toast.error(validation.error);
        }

        if (isKnownPlatform(platform) && !validatePlatformUrl(platform, url)) {
            return toast.error(`Enter a valid link for ${formatLabel(platform)}`);
        }

        const trimmedLabel = label.trim();
        if (!trimmedLabel) {
            return toast.error("Please enter a display name for this link");
        }

        if (startDate && endDate && startDate > endDate) {
            return toast.error("Start date cannot be later than end date");
        }

        const success = await onUpdate(link.id, url, trimmedLabel, platform, startDate, endDate);
        if (success) {
            setEditing(false);
        }
    }

    return (
        <div className="rounded-md border p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3 items-center min-w-0">
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <p className="font-medium capitalize">
                            {editing ? (label || platform) : (link.label || link.platform)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                            {editing ? url : link.url}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                        </p>
                        {link.updatedAt && (
                        <p className="text-xs text-muted-foreground">
                                Updated{" "}
                                {formatDistanceToNow(new Date(link.updatedAt), {
                                    addSuffix: true,
                                })}
                        </p>
                    )}
                        <div className="mt-1 flex items-center gap-2">
                            <p className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                {link.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                {link.isPublic ? "Public" : "Private"}
                            </p>
                            {(link.startDate || link.endDate) && (
                                <p className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    Scheduled
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 justify-end">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onToggleVisibility(link.id, !link.isPublic)}
                        aria-label={link.isPublic ? "Make link private" : "Make link public"}
                        title={link.isPublic ? "Make link private" : "Make link public"}
                    >
                        {link.isPublic ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </Button>

                    <Button size="icon" variant="ghost" onClick={copy}>
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>

                    <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${link.label ?? link.platform} in new tab`}> 
                        <Button size="icon" variant="ghost" title={`Open ${link.label ?? link.platform}`}>
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </a>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            if (editing) {
                                setUrl(link.url);
                                setLabel(link.label || "");
                                setPlatform(initialPlatform);
                                setStartDate(link.startDate ? new Date(link.startDate) : null);
                                setEndDate(link.endDate ? new Date(link.endDate) : null);
                            }
                            setEditing((v) => !v);
                        }}
                        aria-label={editing ? "Cancel editing" : "Edit link"}
                    >
                        {editing ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Pencil className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            <div
                {...dragListeners}
                {...dragAttributes}
                role="button"
                aria-label="Drag to reorder"
                tabIndex={0}
                className="cursor-grab active:cursor-grabbing p-2 w-fit mx-auto text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5h6M9 12h6M9 19h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>

            {editing && (
                <div className="flex flex-col gap-3">
                    <Select value={platform} onValueChange={handlePlatformChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                        <SelectContent>
                            {POPULAR_PLATFORMS.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex flex-col gap-2 sm:flex-row flex-1">
                        <Input
                            placeholder="Link Display Name"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="flex-1 px-2 py-4 text-sm"
                        />
                        <Input
                            placeholder="Paste your link here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 px-2 py-4 text-sm"
                        />
                    </div>

                    <details className="group border rounded-md p-3 [&_summary::-webkit-details-marker]:hidden">
                        <summary className="flex cursor-pointer items-center justify-between font-medium text-sm text-muted-foreground">
                            Advanced Settings
                            <span className="transition group-open:rotate-180">
                                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                            </span>
                        </summary>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row text-sm">
                            <div className="flex-1">
                                <label className="block text-xs text-muted-foreground mb-1">Visible From</label>
                                <Input
                                    type="datetime-local"
                                    value={toDatetimeLocal(startDate)}
                                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                                    className="w-full text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-muted-foreground mb-1">Visible Until</label>
                                <Input
                                    type="datetime-local"
                                    value={toDatetimeLocal(endDate)}
                                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                                    className="w-full text-sm"
                                />
                            </div>
                        </div>
                    </details>

                    <div className="flex gap-2 justify-end">
                        <Button size="icon" onClick={save} aria-label="Save changes">
                            <Check className="h-4 w-4" />
                        </Button>

                        <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => onDelete(link.id)}
                            aria-label="Delete link"
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
