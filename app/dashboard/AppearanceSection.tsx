"use client";
import { useState } from "react";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

const THEMES = [
    { id: "default", label: "Default", color: "#e2e8f0", bg: "#f8fafc" },
    { id: "midnight", label: "Midnight", color: "#1e1b4b", bg: "#0f172a" },
    { id: "forest", label: "Forest", color: "#065f46", bg: "#ecfdf5" },
    { id: "ocean", label: "Ocean", color: "#1e40af", bg: "#eff6ff" },
    { id: "sunset", label: "Sunset", color: "#c2410c", bg: "#fffbeb" },
];

export function AppearanceSection({
    initialTheme,
    onUpdateTheme,
}: {
    initialTheme: string;
    onUpdateTheme: (theme: string) => void;
}) {
    const [selected, setSelected] = useState(initialTheme || "default");
    const [saving, setSaving] = useState(false);

    async function handleSave(themeId: string) {
        setSelected(themeId);
        setSaving(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/user/theme", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ theme: themeId }),
            });
            
            if (!res.ok) {
                throw new Error("Failed to save theme");
            }

            const data = await res.json();
            onUpdateTheme(data.theme);
            toast.success("Theme updated successfully!");
        } catch (error) {
            toast.error("Failed to update theme");
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold">Profile Theme</h2>
                <p className="text-sm text-muted-foreground">
                    Customize the appearance of your public LinkID profile.
                </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {THEMES.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handleSave(theme.id)}
                        disabled={saving}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            selected === theme.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-accent"
                        }`}
                    >
                        <div
                            className="w-16 h-16 rounded-full shadow-sm border border-black/10 flex items-center justify-center transition-transform group-hover:scale-105"
                            style={{ backgroundColor: theme.bg }}
                        >
                            <div 
                                className="w-8 h-8 rounded-full shadow-inner"
                                style={{ backgroundColor: theme.color }}
                            />
                        </div>
                        <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
