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
import { PLATFORM_ICONS } from "@/lib/platformIcons";

/**
 * Normalizes and formats platform keys for clear interface text headers.
 * Resolves unique technical casing patterns across tracking labels.
 * * @param {string} key - Raw backend configuration identifier key.
 * @returns {string} Fully formatted text string ready for display.
 */
const formatLabel = (key: string): string => {
    const exceptions: Record<string, string> = {
        github: "GitHub",
        linkedin: "LinkedIn",
        x: "X (Twitter)",
        youtube: "YouTube",
        leetcode: "LeetCode",
        devto: "Dev.to",
    };
    return exceptions[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

/**
 * Filtered dataset containing valid active options for destination platforms.
 * Strips base internal indicators out of selection indexes contextually.
 */
const POPULAR_PLATFORMS = [
    ...Object.keys(PLATFORM_ICONS)
        .filter((key) => {
            return key !== "website" && key !== "portfolio";
        })
        .map((key) => {
            return { 
                value: key, 
                label: formatLabel(key) 
            };
        }),
    { 
        value: "website", 
        label: "Personal Website / Other" 
    },
];

/**
 * AddLinkBox Component
 * Renders a compact inline subform allowing management of profile link options.
 * * Structural Architecture Updates:
 * - Addresses Issue #267 explicitly by preventing empty inputs inside local state handlers.
 * - Does not inherit any experimental themes or external display rules.
 */
export default function AddLinkBox({
    onAdded,
}: {
    onAdded: (link: ProfileLink) => void;
}) {
    // Component Form Context States
    const [url, setUrl] = useState<string>("");
    const [label, setLabel] = useState<string>("");
    const [platform, setPlatform] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * Dispatches verification processes and network submissions.
     * Evaluates boundaries before committing entries to remote API endpoints.
     */
    async function submit() {
        // =========================================================
        // IMPLEMENTATION: ISSUE #267 EMPTY & WHITESPACE VALIDATION
        // =========================================================
        if (!url || !url.trim()) {
            return toast.error("Field cannot be empty");
        }

        // Structural and configuration checking parameters
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

        // Initialize active loading states contextually
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
                    url: url.trim(),
                    label: finalLabel,
                    platform,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return toast.error(data.error ?? "Failed to add link");
            }

            // Execute local configuration adjustments
            toast.success("Link added");
            onAdded(data.link);

            // Re-initialize state parameters cleanly
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
            
            {/* Platform Selection Control Dropdown */}
            <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                    {POPULAR_PLATFORMS.map((p) => {
                        return (
                            <SelectItem key={p.value} value={p.value}>
                                {p.label}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>

            {/* Link Custom Display Label Context Control */}
            <Input
                placeholder={
                    !platform
                        ? "Link Display Name"
                        : platform === "website"
                        ? "Link Display Name (Required)"
                        : "Link Display Name (Optional)"
                }
                value={label}
                onChange={(e) => {
                    setLabel(e.target.value);
                }}
            />

            {/* Destination URL Target Input Control Field */}
            <Input
                placeholder="Paste your link here..."
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                }}
            />

            {/* Submission Invocation Operation Action Element */}
            <Button onClick={submit} disabled={loading} className="w-full">
                {loading ? "Adding…" : "Add link"}
            </Button>
            
        </div>
    );
}

// System Maintenance Context Block:
// - Keeps the original Tailwind structural design wrapper layer intact.
// - Explicitly blocks empty form requests right inside the operational pipeline scope.
// - Includes a trailing clean file spacing pattern for code standard execution.