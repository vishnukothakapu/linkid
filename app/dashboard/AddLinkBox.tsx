"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import { Link2, Sparkles, Plus } from "lucide-react";

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
        if (!url.trim()) {
            return toast.error("Please enter a URL");
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
                toast(data.error, { icon: "🏷️" });
            } else {
                toast.error(data.error ?? "Failed to add link");
            }
            return;
        }

        toast.success("Link added successfully!", { icon: "✨" });
        onAdded(data.link);

        setUrl("");
        setLabel("");
        setNeedsLabel(false);
    }

    return (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-violet-600" />
                Quick Add
            </div>
            
            <div className="space-y-3">
                <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Paste URL (e.g. github.com/yourname)"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background transition-colors"
                    />
                </div>

                {needsLabel && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <Input
                            placeholder="Give this link a name (e.g. My Blog)"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="h-11 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background transition-colors"
                            autoFocus
                        />
                    </div>
                )}

                <Button 
                    onClick={submit} 
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-violet-600 font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 active:scale-[0.98] transition-all"
                >
                    {loading ? (
                        "Adding link..."
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add to LinkID
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
