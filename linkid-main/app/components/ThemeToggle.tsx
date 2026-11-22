"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);
    if (!mounted) return null;

    const base =
        "h-8 w-8 rounded-lg transition-all duration-200 ease-out hover:scale-105 active:scale-95";

    return (
        <div className="flex items-center gap-1 rounded-xl border border-violet-200/60 bg-white/65 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
           <Button
                size="icon"
                variant={theme === "light" ? "secondary" : "ghost"}
                onClick={() => setTheme("light")}
                aria-label="Use light theme"
                className={clsx(base, {
                    "scale-105 bg-violet-100 text-violet-700 dark:bg-white/10 dark:text-violet-200": theme === "light",
                })}
            >
                <Sun className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant={theme === "dark" ? "secondary" : "ghost"}
                onClick={() => setTheme("dark")}
                aria-label="Use dark theme"
                className={clsx(base, {
                    "scale-105 bg-violet-100 text-violet-700 dark:bg-white/10 dark:text-violet-200": theme === "dark",
                })}
            >
                <Moon className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant={theme === "system" ? "secondary" : "ghost"}
                onClick={() => setTheme("system")}
                aria-label="Use system theme"
                className={clsx(base, {
                    "scale-105 bg-violet-100 text-violet-700 dark:bg-white/10 dark:text-violet-200": theme === "system",
                })}
            >
                <Laptop className="h-4 w-4" />
            </Button>
        </div>
    );
}
