"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="flex items-center gap-1">
            <Button
                size="icon"
                variant={theme === "light" ? "secondary" : "ghost"}
                onClick={() => setTheme("light")}
            >
                <Sun className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant={theme === "dark" ? "secondary" : "ghost"}
                onClick={() => setTheme("dark")}
            >
                <Moon className="h-4 w-4" />
            </Button>

            <Button
                size="icon"
                variant={theme === "system" ? "secondary" : "ghost"}
                onClick={() => setTheme("system")}
            >
                <Laptop className="h-4 w-4" />
            </Button>
        </div>
    );
}
