"use client";
import { useState } from "react";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";
import { getCsrfToken } from "@/lib/csrfClient";
import toast, { Toaster } from "react-hot-toast";
import { LinksSection } from "./LinksSection";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import { LinkIdCard } from "./LinkIdCard";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { VersionHistory } from "@/components/dashboard/VersionHistory";
import { AppearanceSection } from "./AppearanceSection";

export default function DashboardClient({
    username,
    initialLinks,
    initialTheme,
    qrCode,
    enableEmailCapture,
    subscribers = [],
}: {
    username: string;
    initialLinks: ProfileLink[];
    initialTheme?: string;
    qrCode?: React.ReactNode;
    enableEmailCapture?: boolean;
    subscribers?: { id: string; email: string; createdAt: Date }[];
}) {
    const [links, setLinks] = useState(initialLinks);
    const [theme, setTheme] = useState(initialTheme || "default");
    const [activeTab, setActiveTab] = useState<"links" | "appearance">("links");
    const [showAdd, setShowAdd] = useState(false);
    const [isEmailCaptureEnabled, setIsEmailCaptureEnabled] = useState(enableEmailCapture ?? false);
    const [isPendingEmailCapture, setIsPendingEmailCapture] = useState(false);

    async function toggleEmailCapture() {
        if (isPendingEmailCapture) return;
        const newValue = !isEmailCaptureEnabled;
        setIsPendingEmailCapture(true);
        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                },
                body: JSON.stringify({ enableEmailCapture: newValue }),
            });
            if (!response.ok) throw new Error();
            const data = await response.json();
            setIsEmailCaptureEnabled(data.enableEmailCapture);
            toast.success(data.enableEmailCapture ? "Email capture enabled" : "Email capture disabled");
        } catch {
            toast.error("Failed to update email capture settings");
        } finally {
            setIsPendingEmailCapture(false);
        }
    }

    async function addLink(link: ProfileLink) {
        setLinks((prev) => [...prev, link]);
        setShowAdd(false);
    }

    async function updateLink(id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null): Promise<boolean> {
        const csrfToken = await getCsrfToken();

        try {
            const response = await fetch(`/api/links/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify({ url, label, platform, startDate, endDate }),
            });

            if (!response.ok) {
                try {
                    const data = await response.json();
                    toast.error(data.error ?? "Failed to update link");
                } catch {
                    toast.error("Failed to update link");
                }
                return false;
            }

            const responseData = await response.json();
            toast.success("Link updated");

            setLinks((prev) =>
                prev.map((l) =>
                    l.id === id ? { ...l, ...responseData.link } : l
                )
            );
            return true;
        } catch (error) {
            console.error("Link update failed:", error);
            toast.error("Failed to update link");
            return false;
        }
    }

    async function updateVisibility(id: string, isPublic: boolean) {
        const csrfToken = await getCsrfToken();

        const response = await fetch(`/api/links/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
            },
            body: JSON.stringify({ isPublic }),
        });

        if (!response.ok) {
            toast.error("Unable to update visibility");
            return;
        }

        toast.success(isPublic ? "Link set to public" : "Link set to private");

        setLinks((prev) =>
            prev.map((l) =>
                l.id === id ? { ...l, isPublic } : l
            )
        );
    }

    async function exportCsv() {
        const response = await fetch("/api/links/export");

        if (!response.ok) {
            toast.error("Unable to export CSV");
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `linkid-links-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async function exportSubscribersCsv() {
        try {
            const response = await fetch("/api/subscribers/export");
            if (!response.ok) throw new Error();

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `linkid-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error("Unable to export subscribers");
        }
    }

    async function deleteLink(id: string) {
        if (!confirm("Delete this link?")) return;

        const csrfToken = await getCsrfToken();

        await fetch(`/api/links/${id}`, {
            headers: {
                "x-csrf-token": csrfToken,
            },
            method: "DELETE",
        });
        toast.success("Link deleted");
        setLinks((prev) => prev.filter((l) => l.id !== id));
    }

    return (
        <>
            <DashboardNavbar />
            <Toaster position="bottom-center" />

            <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
                <section>
                    <h1 className="text-3xl font-bold">Welcome, {username}</h1>
                    <p className="text-muted-foreground">
                        Manage and share your professional links
                    </p>
                </section>

                <LinkIdCard username={username} qrCode={qrCode} />

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <AnalyticsOverview />
                    </div>
                    <div>
                        <VersionHistory />
                    </div>
                </div>

                <div className="flex gap-4 border-b">
                    <button 
                        className={`pb-2 px-1 text-sm font-medium ${activeTab === 'links' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('links')}
                    >
                        Links
                    </button>
                    <button 
                        className={`pb-2 px-1 text-sm font-medium ${activeTab === 'appearance' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        Appearance
                    </button>
                </div>

                {activeTab === 'links' ? (
                    <div className="space-y-6">
                        <section className="bg-card p-6 rounded-xl border shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Email Subscribers</h2>
                                    <p className="text-sm text-muted-foreground">Collect emails directly from your LinkID page.</p>
                                </div>
                                <label className={`flex items-center cursor-pointer ${isPendingEmailCapture ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={isEmailCaptureEnabled} onChange={toggleEmailCapture} disabled={isPendingEmailCapture} />
                                        <div className={`block w-14 h-8 rounded-full ${isEmailCaptureEnabled ? 'bg-primary' : 'bg-muted'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-background w-6 h-6 rounded-full transition ${isEmailCaptureEnabled ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                            {isEmailCaptureEnabled && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium">Total Subscribers: {subscribers.length}</p>
                                        {subscribers.length > 0 && (
                                            <button 
                                                onClick={exportSubscribersCsv}
                                                className="text-xs font-medium px-3 py-1.5 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                                            >
                                                Export CSV
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border rounded-md">
                                        {subscribers.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No subscribers yet.</p>
                                        ) : (
                                            <ul className="divide-y text-sm">
                                                {subscribers.map(sub => (
                                                    <li key={sub.id} className="p-2 px-4 flex justify-between">
                                                        <span>{sub.email}</span>
                                                        <span className="text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>

                        <LinksSection
                            username={username}
                            links={links}
                            showAdd={showAdd}
                            setShowAdd={setShowAdd}
                            onExport={exportCsv}
                            onAdd={addLink}
                            onUpdate={updateLink}
                            onToggleVisibility={updateVisibility}
                            onDelete={deleteLink}
                            onReorder={setLinks}
                        />
                    </div>
                ) : (
                    <AppearanceSection 
                        initialTheme={theme} 
                        onUpdateTheme={setTheme} 
                    />
                )}

                <footer className="pt-10 border-t text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} LinkID · Built for developers
                </footer>
            </main>
        </>
    );
}
