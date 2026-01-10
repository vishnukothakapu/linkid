"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { detectPlatform, normalizeUrl } from "@/lib/platforms";

export default function AddLinkBox({ onAdded }: { onAdded: (link:any) => void }) {
    const [url, setUrl] = useState("");
    const [platform, setPlatform] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function handleUrlChange(v: string) {
        setUrl(v);
        if (v.trim()) {
            setPlatform(detectPlatform(v));
        } else {
            setPlatform(null);
        }
    }

    async function submit() {
        if (!url.trim()) return;

        setLoading(true);

        const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: normalizeUrl(url),
                platform,
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            toast.error(data.error || "Invalid URL");
            return;
        }

        toast.success("Link added");
        setUrl("");
        setPlatform(null);
        onAdded(data.link);
    }

    return (
        <div className="rounded-md border p-4 space-y-3">
            <Input
                placeholder="Paste your link (GitHub, LinkedIn, etc.)"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
            />

            {platform && (
                <p className="text-sm text-muted-foreground">
                    Detected as <span className="font-medium capitalize">{platform}</span>
                </p>
            )}

            <Button disabled={!url || loading} onClick={submit} className="cursor-pointer">
                Add Link
            </Button>
        </div>
    );
}
