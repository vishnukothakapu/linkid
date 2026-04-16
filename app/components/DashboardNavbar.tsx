"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {ThemeToggle} from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DashboardNavbar() {
    const { data: session } = useSession();
    const user = session?.user;

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/dashboard" className="text-xl font-bold">
                    LinkID
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {mounted ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 px-2 "
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.image ?? ""} />
                                        <AvatarFallback>
                                            {user?.name?.[0] ?? "U"}
                                        </AvatarFallback>
                                    </Avatar>

                                    <span className="hidden text-sm font-medium md:block">
                                        {user?.name ?? "User"}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Your Profile</Link>
                                </DropdownMenuItem>

                               
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-red-600 cursor-pointer"
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant="ghost" className="flex items-center gap-2 px-2 invisible">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
