import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function LinkIdCard({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  function copyProfile() {
    navigator.clipboard.writeText(`linkid.qzz.io/${username}`);
    setCopied(true);
    toast.success("Profile link copied");
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />
          Your LinkID
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Link box */}
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm font-mono w-full sm:w-auto">
          <code className="truncate">
            linkid.qzz.io/{username}
          </code>

          <Button
            size="icon"
            variant="ghost"
            onClick={copyProfile}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Open button */}
        <Button
          variant="outline"
          asChild
          className="w-full sm:w-auto justify-center gap-2"
        >
          <a href={`/${username}`} target="_blank">
            <ExternalLink className="h-4 w-4" />
            Open
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
