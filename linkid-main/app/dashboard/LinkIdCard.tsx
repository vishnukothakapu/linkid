import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function LinkIdCard({ username, qrCode }: { username: string; qrCode?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  function copyProfile() {
    navigator.clipboard.writeText(`linkid.qzz.io/${username}`);
    setCopied(true);
    toast.success("Profile link copied successfully!");
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border bg-card p-2 shadow-sm">
      <div className="flex items-center w-full sm:w-auto px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mr-3 shrink-0">
            <Link2 className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm font-mono truncate hover:bg-muted/50 rounded px-2 py-1 transition-colors cursor-default">
            linkid.qzz.io/{username}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end sm:pr-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={copyProfile}
          className="gap-2 shrink-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
          Copy
        </Button>
        
        <div className="h-5 w-px bg-border hidden sm:block mx-1"></div>
        
        {qrCode && (
            <div className="shrink-0">
                {qrCode}
            </div>
        )}
        
        <Button
          variant="default"
          size="sm"
          asChild
          className="gap-2 shrink-0"
        >
          <a href={`/${username}`} target="_blank" rel="noopener noreferrer">
            Open <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
