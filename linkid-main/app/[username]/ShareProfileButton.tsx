"use client";

import { Share } from "lucide-react";
import toast from "react-hot-toast";

export function ShareProfileButton() {
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my links",
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="absolute top-4 right-4 p-2.5 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm border border-border text-muted-foreground transition-all duration-200 z-50 hover:text-foreground"
      aria-label="Share Profile"
    >
      <Share className="w-5 h-5" />
    </button>
  );
}
