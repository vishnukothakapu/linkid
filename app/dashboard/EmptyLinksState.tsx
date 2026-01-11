"use client";
import { Button } from "@/components/ui/button";
import { Plus, Github, Linkedin, Globe, Youtube } from "lucide-react";

export function EmptyLinksState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-4">
            <h3 className="text-lg font-semibold">Add your first link</h3>

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
    icon: any;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" />
            {label}
        </div>
    );
}
