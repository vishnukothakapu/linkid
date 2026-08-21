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
    onUpdate: (id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null, pinCode?: string | null, isSocialIcon?: boolean) => Promise<boolean>;
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
    const [pinCode, setPinCode] = useState(link.pinCode || "");
    const [isSocialIcon, setIsSocialIcon] = useState(link.isSocialIcon || false);
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

        const success = await onUpdate(link.id, url, trimmedLabel, platform, startDate, endDate, pinCode || null, isSocialIcon);
        if (success) {
            setEditing(false);
        }
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:border-primary/50 group mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center p-3 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Drag Handle */}
                    <div
                        {...dragListeners}
                        {...dragAttributes}
                        role="button"
                        aria-label="Drag to reorder"
                        tabIndex={0}
                        className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                            <path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM5.5 9.5C4.67157 9.5 4 10.1716 4 11C4 11.8284 4.67157 12.5 5.5 12.5C6.32843 12.5 7 11.8284 7 11C7 10.1716 6.32843 9.5 5.5 9.5ZM9.5 3C8.67157 3 8 3.67157 8 4.5C8 5.32843 8.67157 6 9.5 6C10.3284 6 11 5.32843 11 4.5C11 3.67157 10.3284 3 9.5 3ZM9.5 9.5C8.67157 9.5 8 10.1716 8 11C8 11.8284 8.67157 12.5 9.5 12.5C10.3284 12.5 11 11.8284 11 11C11 10.1716 10.3284 9.5 9.5 9.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                    </div>

                    {/* Icon */}
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>

                    {/* Text content */}
                    <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm capitalize truncate">
                                {editing ? (label || platform) : (link.label || link.platform)}
                            </p>
                            {!link.isPublic && (
                                <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium border">Private</span>
                            )}
                            {(link.startDate || link.endDate) && (
                                <span className="inline-flex items-center rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium border">Scheduled</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate transition-colors cursor-default mt-0.5">
                            {editing ? url : link.url}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.14926 7.42435C3.25056 7.37521 3.37682 7.40118 3.44754 7.4912L5.42277 10.0051L9.58988 4.41727C9.65839 4.32537 9.78457 4.29828 9.88636 4.35368L11.8864 5.43987C11.9682 5.48429 12.008 5.58005 11.979 5.6631C11.6429 6.62678 11.236 8.35823 10.7495 10.2393C10.5901 10.8553 10.4286 11.4589 10.2764 11.9691C10.2452 12.0735 10.1493 12.1465 10.0406 12.1465H6.46736C6.35339 12.1465 6.25368 12.0664 6.22353 11.9546C6.11306 11.5451 5.97541 11.0028 5.82657 10.3703L4.99986 6.85802L3.62662 6.94052C3.51862 6.94689 3.41872 6.87763 3.38531 6.77317L3.13531 5.99027C3.11181 5.91662 3.14926 5.83637 3.22067 5.80807L3.92131 5.53051L3.08051 7.27961C3.04259 7.3586 3.07223 7.46169 3.14926 7.42435ZM4.9818 7.37952L5.87768 8.52044C5.97813 8.94827 6.07593 9.38799 6.16104 9.76189L9.46797 5.3243C9.39077 5.23467 9.25595 5.21279 9.15545 5.27581L7.2023 6.49504L8.76185 8.16912L8.02677 8.85521L6.17726 6.86873L4.9818 7.37952Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                            </p>
                            {link.updatedAt && (
                                <p className="text-[10px] text-muted-foreground/60 font-medium">
                                    · Updated {formatDistanceToNow(new Date(link.updatedAt), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-10 sm:ml-0">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onToggleVisibility(link.id, !link.isPublic)}
                        aria-label={link.isPublic ? "Make link private" : "Make link public"}
                        title={link.isPublic ? "Make link private" : "Make link public"}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        {link.isPublic ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </Button>

                    <Button size="icon" variant="ghost" onClick={copy} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>

                    <Button size="icon" variant="ghost" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${link.label ?? link.platform} in new tab`}> 
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>

                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                            if (editing) {
                                setUrl(link.url);
                                setLabel(link.label || "");
                                setPlatform(initialPlatform);
                                setStartDate(link.startDate ? new Date(link.startDate) : null);
                                setEndDate(link.endDate ? new Date(link.endDate) : null);
                                setPinCode(link.pinCode || "");
                                setIsSocialIcon(link.isSocialIcon || false);
                            }
                            setEditing((v) => !v);
                        }}
                        aria-label={editing ? "Cancel editing" : "Edit link"}
                        className="h-8 w-8 ml-1"
                    >
                        {editing ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Pencil className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {editing && (
                <div className="flex flex-col gap-4 px-3 pb-3 pt-1 border-t mt-1">
                    <Select value={platform} onValueChange={handlePlatformChange}>
                        <SelectTrigger suppressHydrationWarning>
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

                    <div className="flex flex-col gap-3 sm:flex-row flex-1">
                        <Input
                            placeholder="Link Display Name"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="flex-1 text-sm h-10"
                        />
                        <Input
                            placeholder="Paste your link here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 text-sm h-10"
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
                        <div className="mt-3 flex flex-col sm:flex-row text-sm">
                            <div className="flex-1">
                                <label className="block text-xs text-muted-foreground mb-1">Lock with PIN/Password</label>
                                <Input
                                    type="text"
                                    placeholder="Leave empty to disable"
                                    value={pinCode}
                                    onChange={(e) => setPinCode(e.target.value)}
                                    className="w-full text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isSocialIcon}
                                    onChange={(e) => setIsSocialIcon(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="text-sm text-muted-foreground">Display as small social icon at top of profile</span>
                            </label>
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
