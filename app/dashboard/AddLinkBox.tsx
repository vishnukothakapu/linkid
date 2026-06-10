"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

import { validateUrl } from "@/lib/urlValidation";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import { formatLabel, POPULAR_PLATFORMS } from "@/lib/platformHelpers";

/**
 * AddLinkBox Component
 * Renders a form to add a new link to the user's profile.
 * It includes inputs for platform selection, custom display name, and URL.
 *
 * @param {Object} props - The component props.
 * @param {function} props.onAdded - Callback function triggered when a new link is successfully added.
 */
export default function AddLinkBox({
    onAdded,
    onCancel,
}: {
    onAdded: (link: ProfileLink) => void;
    onCancel?: () => void;
}) {
    const [url, setUrl] = useState("");
    const [label, setLabel] = useState("");
    const [platform, setPlatform] = useState("");
    const [loading, setLoading] = useState(false);

    function handleCancel() {
        setUrl("");
        setLabel("");
        setPlatform("");
        onCancel?.();
    }

    /**
     * Handles the form submission to add a link.
     * Validates input fields and sends a POST request to the API.
     */
    async function submit() {
        const validation = validateUrl(url);
        if (!validation.valid) {
            return toast.error(validation.error);
        }

        if (!platform) {
            return toast.error("Please select a platform");
        }

        const finalLabel = label.trim();
        if (platform === "website" && !finalLabel) {
            return toast.error("Please enter a name for this link");
        }

        setLoading(true);
        try {
            const csrfToken = await getCsrfToken();

            const res = await fetch("/api/links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({
                    url,
                    label: finalLabel,
                    platform,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return toast.error(data.error ?? "Failed to add link");
            }

            toast.success("Link added");
            onAdded(data.link);

            setUrl("");
            setLabel("");
            setPlatform("");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to add link";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <Select value={platform} onValueChange={setPlatform}>
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

            <Input
                placeholder={
                    !platform
                        ? "Link Display Name"
                        : platform === "website"
                        ? "Link Display Name (Required)"
                        : "Link Display Name (Optional)"
                }
                value={label}
                onChange={(e) => setLabel(e.target.value)}
            />

            <Input
                placeholder="Paste your link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" disabled={loading} className="flex-1">
                    Cancel
                </Button>
                <Button onClick={submit} disabled={loading} className="flex-1">
                    {loading ? "Adding…" : "Add link"}
                </Button>
            </div>
        </div>
    );
}
