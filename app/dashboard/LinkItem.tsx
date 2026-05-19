"use client";

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
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { PLATFORM_ICONS } from "@/lib/platformIcons";
import { validateUrl } from "@/lib/urlValidation";
import type { Link as ProfileLink } from "@/app/[username]/types/type";

export function LinkItem({
    link,
    username,
    onUpdate,
    onToggleVisibility,
    onDelete,
}: {
    link: ProfileLink;
    username: string;
    onUpdate: (id: string, url: string) => Promise<void>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const Icon = PLATFORM_ICONS[link.platform] ?? Globe;
    const [editing, setEditing] = useState(false);
    const [url, setUrl] = useState(link.url);
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(
            `linkid.qzz.io/${username}/${link.platform}`
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

        await onUpdate(link.id, url);
        setEditing(false);
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
                            {link.platform}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                            {link.url}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                            {link.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {link.isPublic ? "Public" : "Private"}
                        </p>
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
                        onClick={() => setEditing((v) => !v)}
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
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 px-2 py-4 text-sm"
                    />

                    <div className="flex gap-2 justify-end">
                        <Button size="icon" onClick={save}>
                            <Check className="h-4 w-4" />
                        </Button>

                        <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => onDelete(link.id)}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
