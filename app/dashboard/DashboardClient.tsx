"use client";
import { useState } from "react";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";
import toast, { Toaster } from "react-hot-toast";
import { LinksSection } from "./LinksSection";
import { LinkIdCard } from "./LinkIdCard";

export default function DashboardClient({
    username,
    initialLinks,
}: {
    username: string;
    initialLinks: any[];
}) {
    const [links, setLinks] = useState(initialLinks);
    const [showAdd, setShowAdd] = useState(false);

    async function addLink(link: any) {
        setLinks((prev) => [...prev, link]);
        setShowAdd(false);
    }

    async function updateLink(id: string, url: string) {
        await fetch(`/api/links/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
        toast.success("Link updated");

        setLinks((prev) =>
            prev.map((l) =>
                l.id === id ? { ...l, url } : l
            )
        );
    }

    async function deleteLink(id: string) {
        if (!confirm("Delete this link?")) return;
        await fetch(`/api/links/${id}`, { method: "DELETE" });
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

                <LinkIdCard username={username} />

                <LinksSection
                    username={username}
                    links={links}
                    showAdd={showAdd}
                    setShowAdd={setShowAdd}
                    onAdd={addLink}
                    onUpdate={updateLink}
                    onDelete={deleteLink}
                />

                <footer className="pt-10 border-t text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} LinkID · Built for developers
                </footer>
            </main>
        </>
    );
}
