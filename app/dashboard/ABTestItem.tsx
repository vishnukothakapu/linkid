"use client";

import { LinkItem } from "./LinkItem";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

export function ABTestItem({
    variantA,
    variantB,
    username,
    onUpdate,
    onToggleVisibility,
    onDelete,
    dragListeners,
    dragAttributes,
}: {
    variantA: ProfileLink;
    variantB: ProfileLink;
    username: string;
    onUpdate: (id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null, pinCode?: string | null, isSocialIcon?: boolean) => Promise<boolean>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    dragListeners?: SyntheticListenerMap;
    dragAttributes?: DraggableAttributes;
}) {
    return (
        <div className="flex flex-col border-2 border-dashed border-primary/30 rounded-md p-4 bg-primary/5 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-sm text-primary">A/B Test Group</div>
                <div
                    {...dragListeners}
                    {...dragAttributes}
                    role="button"
                    aria-label="Drag to reorder"
                    tabIndex={0}
                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5h6M9 12h6M9 19h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-2 relative">
                    <div className="absolute -top-3 -left-2 bg-background border px-2 py-0.5 text-xs font-bold rounded shadow-sm text-primary z-10">Variant A</div>
                    <LinkItem 
                        link={variantA} 
                        username={username} 
                        onUpdate={onUpdate}
                        onToggleVisibility={onToggleVisibility}
                        onDelete={onDelete}
                    />
                </div>
                <div className="flex-1 space-y-2 relative">
                    <div className="absolute -top-3 -left-2 bg-background border px-2 py-0.5 text-xs font-bold rounded shadow-sm text-primary z-10">Variant B</div>
                    <LinkItem 
                        link={variantB} 
                        username={username} 
                        onUpdate={onUpdate}
                        onToggleVisibility={onToggleVisibility}
                        onDelete={onDelete}
                    />
                </div>
            </div>
        </div>
    );
}
