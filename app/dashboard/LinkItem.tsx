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
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { PLATFORM_ICONS } from "@/lib/platformIcons";

export function LinkItem({
    link,
    username,
    onUpdate,
    onDelete,
}: {
    link: { id: string; platform: string; url: string };
    username: string;
    onUpdate: (id: string, url: string) => Promise<void>;
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
                    </div>
                </div>

                <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={copy}>
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>

                    <a href={link.url} target="_blank">
                        <Button size="icon" variant="ghost">
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
