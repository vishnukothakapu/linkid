import { Button } from "@/components/ui/button";
import { Plus, Github, Linkedin, Globe, Youtube } from "lucide-react";

export function EmptyLinksState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-4">
            <h3 className="text-lg font-semibold">Add your first link</h3>

            <p className="text-sm text-muted-foreground">
                Start building your LinkID by adding your most important profile.
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2 text-muted-foreground">
                <Chip icon={Github} label="GitHub" />
                <Chip icon={Linkedin} label="LinkedIn" />
                <Chip icon={Globe} label="Portfolio" />
                <Chip icon={Youtube} label="YouTube" />
            </div>

            <Button onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first link
            </Button>
        </div>
    );
}

function Chip({ icon: Icon, label }: any) {
    return (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
            <Icon className="h-4 w-4" />
            {label}
        </div>
    );
}
