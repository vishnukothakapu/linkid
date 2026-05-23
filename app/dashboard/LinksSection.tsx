"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyLinksState } from "./EmptyLinksState";
import { LinkItem } from "./LinkItem";
import AddLinkBox from "./AddLinkBox";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import React from "react";

// dnd-kit
import { DndContext, DragEndEvent, DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useDebounce from "@/hooks/useDebounce";

type LinksSectionProps = {
    username: string;
    links: ProfileLink[];
    showAdd: boolean;
    setShowAdd: React.Dispatch<React.SetStateAction<boolean>>;
    onExport: () => void;
    onAdd: (link: ProfileLink) => void | Promise<void>;
    onUpdate: (id: string, url: string) => Promise<void>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onReorder: (links: ProfileLink[]) => void;
};

function SortableLinkWrapper({ link, children }: { link: ProfileLink; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-testid="link-item"
            data-link-id={link.id}
        >
            {React.isValidElement(children)
                ? React.cloneElement(children as React.ReactElement<{ dragAttributes?: DraggableAttributes; dragListeners?: SyntheticListenerMap }>, {
                      dragListeners: listeners,
                      dragAttributes: attributes,
                  })
                : children}
        </div>
    );
}

export function LinksSection({
    username,
    links,
    showAdd,
    setShowAdd,
    onExport,
    onAdd,
    onUpdate,
    onToggleVisibility,
    onDelete,
    onReorder,
}: LinksSectionProps) {
    const [localLinks, setLocalLinks] = React.useState<ProfileLink[]>(links);
    const localLinksRef = React.useRef(localLinks);
    const [isSaving, setIsSaving] = React.useState(false);

    // Actually, let me just keep it simple:
    const updateLocalLinks = React.useCallback((newLinks: ProfileLink[] | ((prev: ProfileLink[]) => ProfileLink[])) => {
        setLocalLinks(prev => {
            const next = typeof newLinks === "function" ? newLinks(prev) : newLinks;
            localLinksRef.current = next;
            return next;
        });
    }, []);

    // Track optimistic reorder state to avoid clobbering local optimistic changes
    const isReorderingRef = React.useRef(false);

    // Serialize concurrent saves
    const inFlightRef = React.useRef(false);
    const pendingOrderedIdsRef = React.useRef<string[] | null>(null);

    React.useEffect(() => {
        // Only sync from props if not actively reordering
        if (!isReorderingRef.current) {
            if (JSON.stringify(links) !== JSON.stringify(localLinksRef.current)) {
                localLinksRef.current = links;
                setLocalLinks(links);
            }
        }
    }, [links]);

    const saveOrder = React.useCallback(async () => {
        // Ensure only one in-flight request at a time and properly handle state
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        isReorderingRef.current = true;

        while (pendingOrderedIdsRef.current) {
            const ids = pendingOrderedIdsRef.current;
            pendingOrderedIdsRef.current = null;
            setIsSaving(true);
            
            try {
                const res = await fetch("/api/links/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderedIds: ids }),
                });

                if (!res.ok) {
                    // On error, re-fetch authoritative order and apply locally
                    const refresh = await fetch("/api/links");
                    const data = await refresh.json();
                    updateLocalLinks(data.links || []);
                    onReorder(data.links || []);
                }
            } catch (e) {
                // Network error: refetch to reconcile
                try {
                    const refresh = await fetch("/api/links");
                    const data = await refresh.json();
                    updateLocalLinks(data.links || []);
                    onReorder(data.links || []);
                } catch (_) {
                    // ignore
                }
            }
        }
        
        inFlightRef.current = false;
        setIsSaving(false);
        isReorderingRef.current = false;
    }, [updateLocalLinks, onReorder]);

    const debouncedSave = useDebounce(() => saveOrder(), 500);

    const handleDragEnd = React.useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = localLinks.findIndex((l) => l.id === String(active.id));
            const newIndex = localLinks.findIndex((l) => l.id === String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;

            const newList = arrayMove(localLinks, oldIndex, newIndex);
            updateLocalLinks(newList);
            onReorder(newList); // Synchronize parent state immediately
            // Queue the latest order and kick off the save loop
            isReorderingRef.current = true;
            pendingOrderedIdsRef.current = newList.map((l) => l.id);
            debouncedSave();
        },
        [localLinks, debouncedSave, onReorder, updateLocalLinks]
    );

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Your Links</CardTitle>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onExport}>
                        Export CSV
                    </Button>
                    <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Link
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {showAdd && <AddLinkBox onAdded={onAdd} />}

                {localLinks.length === 0 && !showAdd && (
                    <EmptyLinksState onAdd={() => setShowAdd(true)} />
                )}

                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={localLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {localLinks.map((link) => (
                                <SortableLinkWrapper key={link.id} link={link}>
                                    <LinkItem
                                        link={link}
                                        username={username}
                                        onUpdate={onUpdate}
                                        onToggleVisibility={onToggleVisibility}
                                        onDelete={onDelete}
                                    />
                                </SortableLinkWrapper>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {isSaving && <p className="mt-4 text-sm text-gray-500">Saving order...</p>}
            </CardContent>
        </Card>
    );
}
