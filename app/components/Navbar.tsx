"use client";
import Link from "next/link";
import { useState, useEffect  } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Link2 } from "lucide-react";

export function Navbar() {
    const [activeSection, setActiveSection] = useState("");
    useEffect(() => {
    const sectionIds = ["features", "how", "demo"];

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        },
        { threshold: 0.6 }
    );

    sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    return () => observer.disconnect();
}, []);
    return (
        <header className="sticky top-0 z-50 border-b border-violet-200/60 bg-white/70 shadow-sm shadow-violet-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-black/20">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-zinc-950 transition-opacity hover:opacity-80 dark:text-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                        <Link2 className="h-4 w-4 text-white" />
                    </span>
                    Link<span className="text-violet-600 dark:text-violet-300">ID</span>
                </Link>

                {/* Center nav */}
                <nav className="hidden items-center gap-2 rounded-full border border-violet-200/60 bg-white/55 p-1 text-sm text-zinc-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 md:flex">
                    <a href="#features" className={activeSection === "features" ? "rounded-full bg-violet-600 px-4 py-2 font-medium text-white shadow-sm shadow-violet-500/25" : "rounded-full px-4 py-2 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-white/10 dark:hover:text-violet-200"}>
                        Features
                    </a>
                    <a href="#how" className={activeSection === "how" ? "rounded-full bg-violet-600 px-4 py-2 font-medium text-white shadow-sm shadow-violet-500/25" : "rounded-full px-4 py-2 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-white/10 dark:hover:text-violet-200"}>
                        How it works
                    </a>
                    <a href="#demo" className={activeSection === "demo" ? "rounded-full bg-violet-600 px-4 py-2 font-medium text-white shadow-sm shadow-violet-500/25" : "rounded-full px-4 py-2 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-white/10 dark:hover:text-violet-200"}>
                        Demo
                    </a>
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    <Button asChild className="hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 sm:inline-flex">
                        <Link href="/login">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
