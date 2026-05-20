"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Link2, Menu, X } from "lucide-react";

const NAV_LINKS = [
    { href: "#features", label: "Features", id: "features" },
    { href: "#how", label: "How it works", id: "how" },
    { href: "#demo", label: "Demo", id: "demo" },
];

export function Navbar() {
    const [activeSection, setActiveSection] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sectionIds = NAV_LINKS.map((l) => l.id);
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveSection(entry.target.id);
                });
            },
            { threshold: 0.55 }
        );
        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setMobileOpen(false);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Close on outside click
    useEffect(() => {
        if (!mobileOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMobileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileOpen]);

    const activePill = "rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-violet-500/30";
    const inactivePill = "rounded-full px-4 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-violet-300";

    return (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6">
            <div ref={menuRef} className="pointer-events-auto w-full max-w-4xl">
                {/* Pill navbar */}
                <div
                    className={`flex h-12 items-center justify-between gap-4 rounded-full border px-3 transition-all duration-300 sm:h-13 sm:px-4 ${
                        scrolled
                            ? "border-violet-300/20 bg-white/80 shadow-lg shadow-violet-950/10 backdrop-blur-2xl dark:border-violet-500/15 dark:bg-transparent dark:shadow-violet-950/30 dark:backdrop-blur-2xl"
                            : "border-violet-200/25 bg-white/65 shadow-md shadow-violet-950/[0.06] backdrop-blur-xl dark:border-violet-500/10 dark:bg-transparent dark:shadow-none dark:backdrop-blur-xl"
                    }`}
                >
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex shrink-0 items-center gap-2 text-base font-bold text-zinc-950 transition-opacity hover:opacity-80 dark:text-white"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30">
                            <Link2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                        </span>
                        Link<span className="text-violet-600 dark:text-violet-400">ID</span>
                    </Link>

                    {/* Desktop center nav */}
                    <nav className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map(({ href, label, id }) => (
                            <a
                                key={id}
                                href={href}
                                className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300
                                after:absolute after:left-1/2 after:bottom-0 after:h-[2px] after:w-2/5
                                after:-translate-x-1/2 after:scale-x-0 after:rounded-full
                                after:bg-gradient-to-r after:from-violet-500 after:via-fuchsia-500 after:to-indigo-500
                                after:transition-transform after:duration-300 after:ease-out
                                after:origin-center hover:after:scale-x-100
                                ${
                                    activeSection === id
                                        ? "text-violet-700 dark:text-violet-300 after:scale-x-100"
                                        : "text-zinc-600 hover:text-violet-700 dark:text-zinc-400 dark:hover:text-violet-300"
                                }`}
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop right actions */}
                    <div className="hidden items-center gap-2 md:flex">
                        <ThemeToggle />
                        <Button
                            asChild
                            className="h-8 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-md hover:shadow-violet-500/30"
                        >
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </div>

                    {/* Mobile: theme toggle + hamburger */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileOpen((o) => !o)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200/60 bg-white/80 text-zinc-700 shadow-sm transition-colors hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-violet-300"
                        >
                            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown — floats below the pill */}
                <div
                    className={`mt-2 overflow-hidden rounded-3xl border transition-all duration-300 ease-in-out md:hidden ${
                        mobileOpen
                            ? "max-h-80 border-violet-300/20 opacity-100 shadow-lg shadow-violet-950/20 dark:border-violet-500/20 dark:shadow-violet-950/40"
                            : "max-h-0 border-transparent opacity-0"
                    } bg-white/90 backdrop-blur-2xl dark:bg-violet-950/60`}
                >
                    <div className="px-3 pb-4 pt-3">
                        <nav className="mb-3 flex flex-col gap-1">
                            {NAV_LINKS.map(({ href, label, id }) => (
                                <a
                                    key={id}
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                                        activeSection === id
                                            ? "bg-violet-600 text-white shadow-sm shadow-violet-500/25"
                                            : "text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-violet-300"
                                    }`}
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                        <Button
                            asChild
                            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-sm shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500"
                        >
                            <Link href="/login" onClick={() => setMobileOpen(false)}>
                                Get Started
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
