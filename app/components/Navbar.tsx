"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Link2, Menu, X } from "lucide-react";

// Page section order (must match DOM order on app/page.tsx)
const SECTION_IDS = ["features", "demo", "how"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const NAV_LINKS: { href: string; label: string; id: SectionId }[] = [
    { href: "/#features", label: "Features", id: "features" },
    { href: "/#demo", label: "Demo", id: "demo" },
    { href: "/#how", label: "How it works", id: "how" },
];

const ACTIVATION_OFFSET = 140;

function resolveActiveSection(pendingId: SectionId | null): SectionId | "" {
    if (pendingId) return pendingId;

    for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const id = SECTION_IDS[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= ACTIVATION_OFFSET && bottom > ACTIVATION_OFFSET) return id;
    }

    let current: SectionId | "" = "";
    for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ACTIVATION_OFFSET) current = id;
    }
    return current;
}

export function Navbar() {
    const [activeSection, setActiveSection] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pendingSectionRef = useRef<SectionId | null>(null);
    const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectSection = (id: SectionId) => {
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        pendingSectionRef.current = id;
        setActiveSection(id);
        pendingTimerRef.current = setTimeout(() => {
            pendingSectionRef.current = null;
            setActiveSection(resolveActiveSection(null));
        }, 500);
    };

    useEffect(() => {
        const syncActiveSection = () => {
            setActiveSection(resolveActiveSection(pendingSectionRef.current));
        };

        const onScroll = () => {
            setScrolled(window.scrollY > 20);
            syncActiveSection();
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("hashchange", syncActiveSection);
        window.addEventListener("resize", syncActiveSection);
        syncActiveSection();
        requestAnimationFrame(syncActiveSection);

        const hash = window.location.hash.slice(1) as SectionId;
        const hashTimer =
            hash && SECTION_IDS.includes(hash)
                ? window.setTimeout(syncActiveSection, 150)
                : undefined;

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("hashchange", syncActiveSection);
            window.removeEventListener("resize", syncActiveSection);
            if (hashTimer !== undefined) window.clearTimeout(hashTimer);
            if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        };
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
                            ? "border-white/20 bg-white/10 shadow-xl shadow-violet-500/10 ring-1 ring-white/15 backdrop-blur-3xl dark:border-violet-500/15 dark:bg-transparent dark:shadow-violet-950/30 dark:ring-0 dark:backdrop-blur-2xl"
                            : "border-white/15 bg-white/8 shadow-lg shadow-violet-500/[0.07] ring-1 ring-white/10 backdrop-blur-2xl dark:border-violet-500/10 dark:bg-transparent dark:shadow-none dark:ring-0 dark:backdrop-blur-xl"
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
                        <span>Link<span className="text-violet-600 dark:text-violet-400">ID</span></span>
                    </Link>

                    {/* Desktop center nav */}
                    <nav className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map(({ href, label, id }) => (
                            <Link
                                key={id}
                                href={href}
                                onClick={() => selectSection(id)}
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
                            </Link>
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
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-200/50 bg-white/30 text-zinc-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/50 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-violet-300"
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
                    } bg-white/15 backdrop-blur-3xl dark:bg-violet-950/60`}
                >
                    <div className="px-3 pb-4 pt-3">
                        <nav className="mb-3 flex flex-col gap-1">
                            {NAV_LINKS.map(({ href, label, id }) => (
                                <Link
                                    key={id}
                                    href={href}
                                    onClick={() => {
                                        selectSection(id);
                                        setMobileOpen(false);
                                    }}
                                    className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                                        activeSection === id
                                            ? "bg-violet-600 text-white shadow-sm shadow-violet-500/25"
                                            : "text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-violet-300"
                                    }`}
                                >
                                    {label}
                                </Link>
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
