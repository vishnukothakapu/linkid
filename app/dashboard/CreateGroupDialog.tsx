"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";
import type { Link as ProfileLink } from "@/app/[username]/types/type";

export default function CreateGroupDialog({
    onCreated,
    onCancel,
}: {
    onCreated: (group: ProfileLink) => void;
    onCancel?: () => void;
}) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    function handleCancel() {
        setName("");
        onCancel?.();
    }

    async function submit() {
        if (loading) return;
        const trimmed = name.trim();
        if (!trimmed) {
            return toast.error("Please enter a name for this group");
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
                body: JSON.stringify({ isGroup: true, label: trimmed }),
            });

            const data = await res.json();

            if (!res.ok) {
                return toast.error(data.error ?? "Failed to create group");
            }

            toast.success("Group created");
            onCreated(data.link);
            setName("");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create group";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-lg border border-dashed border-primary/40 p-4 space-y-3 bg-primary/5">
            <p className="text-sm font-medium">Create a new group</p>
            <Input
                disabled={loading}
                placeholder="Group name (e.g. Socials, My Projects)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) submit();
                }}
                autoFocus
            />
            <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" disabled={loading} className="flex-1">
                    Cancel
                </Button>
                <Button onClick={submit} disabled={loading} className="flex-1">
                    {loading ? "Creating…" : "Create Group"}
                </Button>
            </div>
        </div>
    );
}
