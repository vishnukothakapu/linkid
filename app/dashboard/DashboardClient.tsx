"use client";
import { useState } from "react";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";
import { getCsrfToken } from "@/lib/csrfClient";
import toast, { Toaster } from "react-hot-toast";
import { LinksSection } from "./LinksSection";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import { LinkIdCard } from "./LinkIdCard";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { isValidHttpUrl } from "@/lib/url"; // Importing our fix from #270

export default function DashboardClient({
    username,
    initialLinks,
    qrCode,
}: {
    username: string;
    initialLinks: ProfileLink[];
    qrCode?: React.ReactNode;
}) {
    const [links, setLinks] = useState(initialLinks);
    const [showAdd, setShowAdd] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * PRO-LEVEL VALIDATION: Ensures we don't save empty junk to the DB.
     * This directly addresses issue #267.
     */
    async function validateAndAddLink(link: { url: string; label: string }) {
        const trimmedUrl = link.url.trim();
        const trimmedLabel = link.label.trim();

        if (!trimmedUrl || !trimmedLabel) {
            toast.error("URL and Label fields cannot be empty");
            return false;
        }

        if (!isValidHttpUrl(trimmedUrl)) {
            toast.error("Please provide a valid URL (must start with http/https)");
            return false;
        }

        return true;
    }

    async function addLink(link: ProfileLink) {
        setIsProcessing(true);
        
        const isValid = await validateAndAddLink({ url: link.url, label: link.label });
        
        if (!isValid) {
            setIsProcessing(false);
            return;
        }

        // Proceed with adding the link if valid
        setLinks((prev) => [...prev, link]);
        setShowAdd(false);
        toast.success("Link added successfully!");
        setIsProcessing(false);
    }

    async function updateLink(id: string, url: string) {
        if (!url.trim()) {
            toast.error("URL cannot be empty");
            return;
        }

        const csrfToken = await getCsrfToken();
        await fetch(`/api/links/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
            },
            body: JSON.stringify({ url }),
        });
        
        toast.success("Link updated successfully");
        setLinks((prev) =>
            prev.map((l) => (l.id === id ? { ...l, url } : l))
        );
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
            prev.map((l) => (l.id === id ? { ...l, isPublic } : l))
        );
    }

    async function exportCsv() {
        const response = await fetch("/api/links/export");
        if (!response.ok) {
            toast.error("Unable to export CSV data");
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `linkid-links-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
    }

    async function deleteLink(id: string) {
        if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) return;

        const csrfToken = await getCsrfToken();
        const res = await fetch(`/api/links/${id}`, {
            headers: { "x-csrf-token": csrfToken },
            method: "DELETE",
        });

        if (res.ok) {
            toast.success("Link removed");
            setLinks((prev) => prev.filter((l) => l.id !== id));
        } else {
            toast.error("Failed to delete link");
        }
    }

    return (
        <>
            <DashboardNavbar />
            <Toaster position="bottom-center" />

            <main className="mx-auto max-w-6xl px-6 py-10 space-y-10 animate-in fade-in duration-500">
                <section>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {username}</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your professional links, track analytics, and customize your profile.
                    </p>
                </section>

                <LinkIdCard username={username} qrCode={qrCode} />

                <AnalyticsOverview />

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

                <footer className="pt-10 mt-10 border-t border-border text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} LinkID. All rights reserved.</p>
                    <p className="mt-1">Built with passion for the developer community.</p>
                </footer>
            </main>
        </>
    );
}