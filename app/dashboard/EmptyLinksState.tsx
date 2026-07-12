"use client";
import { Button } from "@/components/ui/button";
import { Plus, Github, Linkedin, Globe, Youtube } from "lucide-react";

export function EmptyLinksState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/10 p-12 text-center space-y-5 transition-all hover:border-violet-300 dark:hover:border-violet-800">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Add your first link</h3>

            <p className="text-sm text-muted-foreground">
                Start building your LinkID by adding your most important profile.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
                <PlatformChip icon={Github} label="GitHub" />
                <PlatformChip icon={Linkedin} label="LinkedIn" />
                <PlatformChip icon={Globe} label="Portfolio" />
                <PlatformChip icon={Youtube} label="YouTube" />
            </div>

            <Button className="mt-4" onClick={onAdd}>
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
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" />
            {label}
        </div>
    );
}
