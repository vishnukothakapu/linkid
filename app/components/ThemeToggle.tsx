"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const base =
        "transition-all duration-200 ease-out hover:scale-105 active:scale-95";

    return (
        <div className="flex items-center gap-1 rounded-xl border bg-background p-1">
            <Button
                size="icon"
                variant={theme === "light" ? "secondary" : "ghost"}
                onClick={() => setTheme("light")}
                className={clsx(base, {
                    "scale-105": theme === "light",
                })}
            >
                <Sun className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant={theme === "dark" ? "secondary" : "ghost"}
                onClick={() => setTheme("dark")}
                className={clsx(base, {
                    "scale-105": theme === "dark",
                })}
            >
                <Moon className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant={theme === "system" ? "secondary" : "ghost"}
                onClick={() => setTheme("system")}
                className={clsx(base, {
                    "scale-105": theme === "system",
                })}
            >
                <Laptop className="h-4 w-4" />
            </Button>
        </div>
    );
}
