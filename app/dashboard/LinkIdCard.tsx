import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function LinkIdCard({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);

    function copyProfile() {
        navigator.clipboard.writeText(`linkid.io/${username}`);
        setCopied(true);
        toast.success("Profile link copied");
        setTimeout(() => setCopied(false), 1200);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Your LinkID
                </CardTitle>
            </CardHeader>

            <CardContent className="flex justify-between items-center">
                <code className="flex items-center bg-muted px-3 py-1 rounded-md text-sm">
                    linkid.me/{username}
                    <Button size="icon" variant="ghost" onClick={copyProfile}>
                        {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </code>

                <Button variant="outline" asChild>
                    <a href={`/${username}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        Open
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
