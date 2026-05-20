"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

import { validateUrl } from "@/lib/urlValidation";
import type { Link as ProfileLink } from "@/app/[username]/types/type";

export default function AddLinkBox({
    onAdded,
}: {
    onAdded: (link: ProfileLink) => void;
}) {
    const [url, setUrl] = useState("");
    const [label, setLabel] = useState("");
    const [needsLabel, setNeedsLabel] = useState(false);
    const [loading, setLoading] = useState(false);

    async function submit() {
        const validation = validateUrl(url);
        if (!validation.valid) {
            return toast.error(validation.error);
        }

        if (needsLabel && !label.trim()) {
            return toast.error("Please enter a name for this link");
        }

        setLoading(true);
        const csrfToken = await getCsrfToken();

        const res = await fetch("/api/links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
            },
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
