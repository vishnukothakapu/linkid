"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Link2, Menu, X } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

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

    /* Scroll Progress */
    const { scrollYProgress } = useScroll();

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 180,
        damping: 28,
        mass: 0.3,
    });

    return (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6">
            <div ref={menuRef} className="pointer-events-auto w-full max-w-4xl">
                {/* Pill navbar */}
                <div
                    className={`flex h-14 items-center justify-between gap-4 rounded-full border px-4 transition-all duration-300 sm:px-6 ${
                        scrolled
                            ? "bg-background/80 backdrop-blur-md shadow-sm border-border"
                            : "bg-background/50 backdrop-blur-sm border-transparent"
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
                                ${
                                    activeSection === id
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop right actions */}
                    <div className="hidden items-center gap-3 md:flex">
                        <ThemeToggle />
                        <Button asChild className="h-9 rounded-full px-5 text-sm font-medium">
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </div>

                    {/* Mobile: theme toggle + hamburger */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileOpen((o) => !o)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            className="flex h-9 w-9 items-center justify-center rounded-full border bg-background/50 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted"
                        >
                            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown — floats below the pill */}
                <div
                    className={`mt-2 overflow-hidden rounded-2xl border transition-all duration-300 ease-in-out md:hidden ${
                        mobileOpen
                            ? "max-h-80 border-border opacity-100 shadow-lg"
                            : "max-h-0 border-transparent opacity-0"
                    } bg-background/95 backdrop-blur-3xl`}
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
                                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                                        activeSection === id
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                        <Button
                            asChild
                            className="w-full rounded-xl font-semibold"
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
