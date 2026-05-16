"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <Button
            size="icon"
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-8 right-8 z-50 h-11 w-11 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:bg-violet-700 hover:shadow-xl active:scale-90 md:h-12 md:w-12",
                isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-50 pointer-events-none"
            )}
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
    );
}
