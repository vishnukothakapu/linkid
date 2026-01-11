"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function AddLinkBox({
    onAdded,
}: {
    onAdded: (link: any) => void;
}) {
    const [url, setUrl] = useState("");
    const [label, setLabel] = useState("");
    const [needsLabel, setNeedsLabel] = useState(false);
    const [loading, setLoading] = useState(false);

    async function submit() {
        if (!url.trim()) {
            return toast.error("Please enter a URL");
        }

        if (needsLabel && !label.trim()) {
            return toast.error("Please enter a name for this link");
        }

        setLoading(true);

        const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url,
                label: needsLabel ? label : undefined,
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            if (data.error?.toLowerCase().includes("name")) {
                setNeedsLabel(true);
            }
            return toast.error(data.error ?? "Failed to add link");
        }

        toast.success("Link added");
        onAdded(data.link);

        setUrl("");
        setLabel("");
        setNeedsLabel(false);
    }

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <Input
                placeholder="Paste your link (GitHub, LinkedIn, website, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            {needsLabel && (
                <Input
                    placeholder="Name this link (e.g. ChatGPT, Blog, Docs)"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                />
            )}

            <Button onClick={submit} disabled={loading}>
                {loading ? "Adding…" : "Add link"}
            </Button>
        </div>
    );
}
