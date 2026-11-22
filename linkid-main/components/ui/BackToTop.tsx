"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopProps {
  threshold?: number;
  scrollTo?: number;
}

export default function BackToTop({
  threshold = 300,
  scrollTo = 0,
}: BackToTopProps) {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({ top: scrollTo, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={[
        "fixed bottom-6 right-6 z-50",
        "h-10 w-10 rounded-full",
        "bg-primary text-primary-foreground",
        "border border-border",
        "shadow-md",
        "hover:opacity-90 hover:shadow-lg",
        "focus:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-background",
        "active:scale-95",
        "flex items-center justify-center",
        "transition-all duration-300 ease-in-out",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}