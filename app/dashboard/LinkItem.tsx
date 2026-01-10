import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    ExternalLink,
    Pencil,
    X,
    Trash,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { PLATFORM_ICONS } from "../../lib/platformIcons";

export function LinkItem({
    link,
    username,
    onUpdate,
    onDelete,
}: any) {
    const Icon = PLATFORM_ICONS[link.platform];
    const [editing, setEditing] = useState(false);
    const [url, setUrl] = useState(link.url);
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(`linkid.me/${username}/${link.platform}`);
        setCopied(true);
        toast.success("Copied");
        setTimeout(() => setCopied(false), 1200);
    }

    return (
        <div className="rounded-md border p-4 space-y-3">
            <div className="flex  justify-between items-center">
                <div className="flex gap-2 items-center">
                    <div className="h-9 w-9 bg-muted rounded-md flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium capitalize">{link.platform}</p>
                        <p className="text-sm text-muted-foreground">
                            linkid.me/{username}/{link.platform}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-1">
                    <Button size="icon" variant="ghost" onClick={copy}>
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>

                    <a href={link.url} target="_blank">
                        <Button size="icon" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </a>

                    <Button size="icon" variant="ghost" onClick={() => setEditing(!editing)}>
                        {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {editing && (
                <div className="flex gap-2">
                    <Input value={url} onChange={(e) => setUrl(e.target.value)} />
                    <Button size="icon" onClick={() => onUpdate(link.id, url)}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => onDelete(link.id)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
