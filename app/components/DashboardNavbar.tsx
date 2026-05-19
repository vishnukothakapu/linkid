"use client";

import { signOut, useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Link2,
    LayoutDashboard,
    BarChart3,
    User,
    LogOut,
    ChevronDown,
    ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard#analytics", label: "Analytics", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: User },
];

export function DashboardNavbar() {
    const { data: session } = useSession();
    const user = session?.user;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : "U";

    return (
        <header
            className={`sticky top-0 z-50 w-full border-b transition-shadow duration-300 ${
                scrolled
                    ? "border-violet-200/70 bg-white/85 shadow-md shadow-violet-950/[0.07] dark:border-white/10 dark:bg-zinc-950/85 dark:shadow-black/30"
                    : "border-violet-200/40 bg-white/70 shadow-sm dark:border-white/[0.06] dark:bg-zinc-950/70"
            } backdrop-blur-xl`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 text-xl font-bold text-zinc-950 transition-opacity hover:opacity-80 dark:text-white"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                        <Link2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="hidden sm:block">
                        Link<span className="text-violet-600 dark:text-violet-400">ID</span>
                    </span>
                </Link>

                {/* Center nav links — hidden on small screens */}
                <nav className="hidden items-center gap-1 rounded-full border border-violet-200/60 bg-white/55 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] lg:flex">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-violet-300"
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />

                    {/* User dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex h-9 items-center gap-2 rounded-xl border border-violet-200/60 bg-white/65 px-2 shadow-sm transition-all hover:bg-violet-50 hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/10 sm:px-3"
                            >
                                <Avatar className="h-7 w-7 ring-2 ring-violet-200 dark:ring-violet-800">
                                    <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User"} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-semibold text-white">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden max-w-[120px] truncate text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:block">
                                    {user?.name ?? "User"}
                                </span>
                                <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 sm:block" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-56 rounded-2xl border border-violet-200/60 bg-white/90 shadow-lg shadow-violet-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/90"
                        >
                            {/* User info header */}
                            <DropdownMenuLabel className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 ring-2 ring-violet-200 dark:ring-violet-800">
                                        <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User"} />
                                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-semibold text-white">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {user?.name ?? "User"}
                                        </p>
                                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                            {user?.email ?? ""}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator className="bg-violet-200/50 dark:bg-white/10" />

                            {/* Mobile nav items (shown on < lg) */}
                            <div className="lg:hidden">
                                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                                    <DropdownMenuItem key={href} asChild>
                                        <Link
                                            href={href}
                                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300"
                                        >
                                            <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            {label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-violet-200/50 dark:bg-white/10" />
                            </div>

                            <DropdownMenuItem asChild>
                                <Link
                                    href="/profile"
                                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300"
                                >
                                    <ExternalLink className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    View public profile
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-violet-200/50 dark:bg-white/10" />

                            <DropdownMenuItem
                                className="mx-1 mb-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
