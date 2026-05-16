"use client";
import { Button } from "@/components/ui/button";
import { Plus, Github, Linkedin, Globe, Youtube, Link2 } from "lucide-react";

export function EmptyLinksState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-12 text-center transition-all hover:bg-muted/50">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-violet-600 shadow-inner">
                <Link2 className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-bold tracking-tight">Your LinkID is empty</h3>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Build your professional identity by adding links to your social profiles, portfolio, or personal website.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <PlatformChip icon={Github} label="GitHub" />
                <PlatformChip icon={Linkedin} label="LinkedIn" />
                <PlatformChip icon={Globe} label="Portfolio" />
                <PlatformChip icon={Youtube} label="YouTube" />
            </div>

            <Button className="mt-8 rounded-xl bg-violet-600 px-8 font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 active:scale-95 transition-all" onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first link
            </Button>
        </div>
    );
}

function PlatformChip({
    icon: Icon,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <div className="group flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700">
            <Icon className="h-3.5 w-3.5" />
            {label}
        </div>
    );
}
