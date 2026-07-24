"use client";
import { useState } from "react";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

export function SeoSection({
    initialTitle,
    initialDescription,
    onUpdateSeo,
}: {
    initialTitle: string;
    initialDescription: string;
    onUpdateSeo: (title: string, desc: string) => void;
}) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [saving, setSaving] = useState(false);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/user/seo", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ seoTitle: title, seoDescription: description }),
            });
            
            if (!res.ok) {
                throw new Error("Failed to save SEO settings");
            }

            const data = await res.json();
            onUpdateSeo(data.seoTitle || "", data.seoDescription || "");
            toast.success("SEO settings updated successfully!");
        } catch (error) {
            toast.error("Failed to update SEO settings");
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-6 max-w-2xl">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold">SEO Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Customize how your profile appears on search engines like Google.
                </p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 bg-card p-6 rounded-xl border">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label htmlFor="seoTitle" className="text-sm font-medium">Search Engine Title</label>
                        <span className="text-xs text-muted-foreground">{title.length}/60</span>
                    </div>
                    <input
                        id="seoTitle"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. John Doe - Full Stack Developer | Links"
                        maxLength={60}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                        Keep it under 60 characters for best visibility.
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label htmlFor="seoDescription" className="text-sm font-medium">Search Engine Description</label>
                        <span className="text-xs text-muted-foreground">{description.length}/160</span>
                    </div>
                    <textarea
                        id="seoDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A short description about yourself."
                        maxLength={160}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        A summary of your profile. Keep it between 50 and 160 characters.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save SEO Settings"}
                </button>
            </form>
        </section>
    );
}
