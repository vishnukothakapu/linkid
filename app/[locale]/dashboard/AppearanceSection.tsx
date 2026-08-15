"use client";
import { useState } from "react";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";
import { LayoutList, LayoutGrid } from "lucide-react";

const THEMES = [
    { id: "default", label: "Default", color: "#e2e8f0", bg: "#f8fafc" },
    { id: "midnight", label: "Midnight", color: "#1e1b4b", bg: "#0f172a" },
    { id: "forest", label: "Forest", color: "#065f46", bg: "#ecfdf5" },
    { id: "ocean", label: "Ocean", color: "#1e40af", bg: "#eff6ff" },
    { id: "sunset", label: "Sunset", color: "#c2410c", bg: "#fffbeb" },
];

import { LayoutStyle } from "@/app/[locale]/[username]/types/type";

export function AppearanceSection({
    initialTheme,
    initialLayout,
    initialBackgroundImage,
    onUpdateTheme,
    onUpdateLayout,
    onUpdateBackgroundImage,
    workspaceId,
}: {
    initialTheme: string;
    initialLayout: LayoutStyle;
    initialBackgroundImage?: string;
    onUpdateTheme: (theme: string) => void;
    onUpdateLayout: (layout: LayoutStyle) => void;
    onUpdateBackgroundImage: (url: string | null) => void;
    workspaceId: string;
}) {
    const [selectedTheme, setSelectedTheme] = useState(initialTheme || "default");
    const [selectedLayout, setSelectedLayout] = useState(initialLayout || "LIST");
    const [backgroundImage, setBackgroundImage] = useState(initialBackgroundImage || "");
    const [savingTheme, setSavingTheme] = useState(false);
    const [savingLayout, setSavingLayout] = useState(false);
    const [savingBg, setSavingBg] = useState(false);

    async function handleSaveTheme(themeId: string) {
        setSelectedTheme(themeId);
        setSavingTheme(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/user/theme", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                    "x-workspace-id": workspaceId,
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
            setSavingTheme(false);
        }
    }

    async function handleSaveLayout(layoutId: LayoutStyle) {
        const previousLayout = selectedLayout as LayoutStyle;
        setSelectedLayout(layoutId);
        setSavingLayout(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/user/layout", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                    "x-workspace-id": workspaceId,
                },
                body: JSON.stringify({ layoutStyle: layoutId }),
            });
            
            if (!res.ok) {
                throw new Error("Failed to save layout");
            }

            const data = await res.json();
            onUpdateLayout(data.layoutStyle);
            toast.success("Layout updated successfully!");
        } catch (error) {
            setSelectedLayout(previousLayout);
            toast.error("Failed to update layout");
            console.error(error);
        } finally {
            setSavingLayout(false);
        }
    }

    async function handleSaveBackgroundImage() {
        setSavingBg(true);
        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch("/api/user/background", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                    "x-workspace-id": workspaceId,
                },
                body: JSON.stringify({ backgroundImage: backgroundImage || null }),
            });
            
            if (!res.ok) {
                throw new Error("Failed to save background image");
            }

            const data = await res.json();
            onUpdateBackgroundImage(data.backgroundImage);
            toast.success("Background image updated!");
        } catch (error) {
            toast.error("Failed to update background image");
            console.error(error);
        } finally {
            setSavingBg(false);
        }
    }

    return (
        <section className="space-y-10">
            {/* Layout Section */}
            <div className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Profile Layout</h2>
                    <p className="text-sm text-muted-foreground">
                        Choose how your links are displayed on your profile.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <button
                        onClick={() => handleSaveLayout("LIST")}
                        disabled={savingLayout}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            selectedLayout === "LIST"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-accent"
                        }`}
                    >
                        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <LayoutList size={32} />
                        </div>
                        <span className="text-sm font-medium">List</span>
                    </button>
                    
                    <button
                        onClick={() => handleSaveLayout("GRID")}
                        disabled={savingLayout}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            selectedLayout === "GRID"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-accent"
                        }`}
                    >
                        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <LayoutGrid size={32} />
                        </div>
                        <span className="text-sm font-medium">Grid</span>
                    </button>
                </div>
            </div>

            {/* Theme Section */}
            <div className="space-y-6">
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
                        onClick={() => handleSaveTheme(theme.id)}
                        disabled={savingTheme}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            selectedTheme === theme.id
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
            </div>

            {/* Background Image Section */}
            <div className="space-y-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Custom Background</h2>
                    <p className="text-sm text-muted-foreground">
                        Set a custom background image URL for your public profile.
                    </p>
                </div>
                <div className="max-w-md flex gap-2">
                    <input
                        type="url"
                        aria-label="Background image URL"
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                        value={backgroundImage || ""}
                        onChange={(e) => setBackgroundImage(e.target.value)}
                        disabled={savingBg}
                    />
                    <button
                        onClick={handleSaveBackgroundImage}
                        disabled={savingBg}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
                    >
                        {savingBg ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </section>
    );
}
