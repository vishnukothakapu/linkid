"use client";

import { useState } from "react";
import { DashboardNavbar } from "@/app/components/DashboardNavbar";
import { Toaster } from "react-hot-toast";
import { LinkIdCard } from "./LinkIdCard";
import { LinksSection } from "./LinksSection";

export default function DashboardClient({ username, initialLinks }: any) {
    const [links, setLinks] = useState(initialLinks);
    const [showAdd, setShowAdd] = useState(false);

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
                    links={links}
                    username={username}
                    showAdd={showAdd}
                    setShowAdd={setShowAdd}
                    onAdd={(l: any) => setLinks((p: any) => [...p, l])}
                    onUpdate={(id: string, url: string) =>
                        setLinks((p: any) => p.map((l: any) => (l.id === id ? { ...l, url } : l)))
                    }
                    onDelete={(id: string) =>
                        setLinks((p: any) => p.filter((l: any) => l.id !== id))
                    }
                />

                <footer className="pt-10 border-t text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} LinkID · Built for developers
                </footer>
            </main>
        </>
    );
}
