"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from "lucide-react";
import { EmptyLinksState } from "./EmptyLinksState";
import { LinkItem } from "./LinkItem";
import { GroupItem } from "./GroupItem";
import { ABTestItem } from "./ABTestItem";
import AddLinkBox from "./AddLinkBox";
import CreateGroupDialog from "./CreateGroupDialog";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import React from "react";

// dnd-kit
import { DndContext, DragEndEvent, DragOverEvent, DraggableAttributes, DragOverlay, DragStartEvent, pointerWithin } from "@dnd-kit/core";
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
    showGroupAdd: boolean;
    setShowGroupAdd: React.Dispatch<React.SetStateAction<boolean>>;
    onExport: () => void;
    onAdd: (link: ProfileLink) => void | Promise<void>;
    onAddGroup: (group: ProfileLink) => void | Promise<void>;
    onUpdate: (id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null, pinCode?: string | null, isSocialIcon?: boolean) => Promise<boolean>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onDeleteGroup: (groupId: string, deleteChildren: boolean) => Promise<void>;
    onRenameGroup: (groupId: string, newName: string) => Promise<void>;
    onReorder: (links: ProfileLink[]) => void;
    onCreateABTest?: (id: string) => Promise<void>;
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

function SortableGroupWrapper({ group, children }: { group: ProfileLink; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-testid="group-item"
            data-group-id={group.id}
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

/**
 * Flatten the nested link structure to get all IDs for reorder payload
 */
function buildReorderPayload(links: ProfileLink[]) {
    const orderedIds: string[] = [];
    const groupOrders: Record<string, string[]> = {};

    for (const item of links) {
        orderedIds.push(item.id);
        if (item.isGroup && item.children) {
            groupOrders[item.id] = item.children.map((c) => c.id);
        }
    }

    return { orderedIds, groupOrders };
}

/**
 * Find a link by ID in the nested structure
 */
function findLinkById(links: ProfileLink[], id: string): { link: ProfileLink; parentId: string | null } | null {
    for (const item of links) {
        if (item.id === id) return { link: item, parentId: null };
        if (item.isGroup && item.children) {
            for (const child of item.children) {
                if (child.id === id) return { link: child, parentId: item.id };
            }
        }
    }
    return null;
}

export function LinksSection({
    username,
    links,
    showAdd,
    setShowAdd,
    showGroupAdd,
    setShowGroupAdd,
    onExport,
    onAdd,
    onAddGroup,
    onUpdate,
    onToggleVisibility,
    onDelete,
    onDeleteGroup,
    onRenameGroup,
    onReorder,
    onCreateABTest,
}: LinksSectionProps) {
    const [localLinks, setLocalLinks] = React.useState<ProfileLink[]>(links);
    const localLinksRef = React.useRef(localLinks);
    const [isSaving, setIsSaving] = React.useState(false);
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const updateLocalLinks = React.useCallback((newLinks: ProfileLink[] | ((prev: ProfileLink[]) => ProfileLink[])) => {
        setLocalLinks(prev => {
            const next = typeof newLinks === "function" ? newLinks(prev) : newLinks;
            localLinksRef.current = next;
            return next;
        });
    }, []);

    const isReorderingRef = React.useRef(false);
    const inFlightRef = React.useRef(false);
    const pendingPayloadRef = React.useRef<{ orderedIds: string[]; groupOrders: Record<string, string[]> } | null>(null);

    React.useEffect(() => {
        if (!isReorderingRef.current) {
            if (JSON.stringify(links) !== JSON.stringify(localLinksRef.current)) {
                localLinksRef.current = links;
                setLocalLinks(links);
            }
        }
    }, [links]);

    const saveOrder = React.useCallback(async () => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        isReorderingRef.current = true;

        while (pendingPayloadRef.current) {
            const payload = pendingPayloadRef.current;
            pendingPayloadRef.current = null;
            setIsSaving(true);

            try {
                const res = await fetch("/api/links/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const refresh = await fetch("/api/links");
                    const data = await refresh.json();
                    updateLocalLinks(data.links || []);
                    onReorder(data.links || []);
                }
            } catch {
                try {
                    const refresh = await fetch("/api/links");
                    const data = await refresh.json();
                    updateLocalLinks(data.links || []);
                    onReorder(data.links || []);
                } catch {
                    // ignore
                }
            }
        }

        inFlightRef.current = false;
        setIsSaving(false);
        isReorderingRef.current = false;
    }, [updateLocalLinks, onReorder]);

    const debouncedSave = useDebounce(() => saveOrder(), 500);

    const triggerReorder = React.useCallback((newList: ProfileLink[]) => {
        updateLocalLinks(newList);
        onReorder(newList);
        isReorderingRef.current = true;
        pendingPayloadRef.current = buildReorderPayload(newList);
        debouncedSave();
    }, [debouncedSave, onReorder, updateLocalLinks]);

    const handleDragStart = React.useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragOver = React.useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        const activeFound = findLinkById(localLinks, activeIdStr);
        if (!activeFound) return;
        if (activeFound.link.isGroup) return; // Don't allow groups into groups

        let targetParentId: string | null = null;
        if (overIdStr.startsWith("group-drop-")) {
            targetParentId = overIdStr.replace("group-drop-", "");
        } else {
            const overFound = findLinkById(localLinks, overIdStr);
            if (overFound) {
                targetParentId = overFound.parentId;
            }
        }

        if (activeFound.parentId !== targetParentId) {
            const newLinks = [...localLinks];
            
            // Remove from old location
            let movingLink: ProfileLink | null = null;
            if (activeFound.parentId === null) {
                const idx = newLinks.findIndex(l => l.id === activeIdStr);
                if (idx !== -1) {
                    movingLink = newLinks[idx];
                    newLinks.splice(idx, 1);
                }
            } else {
                const groupIdx = newLinks.findIndex(l => l.id === activeFound.parentId);
                if (groupIdx !== -1 && newLinks[groupIdx].children) {
                    const group = { ...newLinks[groupIdx] };
                    const children = [...(group.children || [])];
                    const childIdx = children.findIndex(c => c.id === activeIdStr);
                    if (childIdx !== -1) {
                        movingLink = { ...children[childIdx] };
                        children.splice(childIdx, 1);
                        group.children = children;
                        newLinks[groupIdx] = group;
                    }
                }
            }

            if (!movingLink) return;
            movingLink.parentId = targetParentId;

            // Insert into new location
            if (targetParentId === null) {
                const overIdx = newLinks.findIndex(l => l.id === overIdStr);
                if (overIdx !== -1) {
                    newLinks.splice(overIdx, 0, movingLink);
                } else {
                    newLinks.push(movingLink);
                }
            } else {
                const groupIdx = newLinks.findIndex(l => l.id === targetParentId);
                if (groupIdx !== -1) {
                    const group = { ...newLinks[groupIdx] };
                    const children = [...(group.children || [])];
                    
                    if (overIdStr.startsWith("group-drop-")) {
                        children.push(movingLink);
                    } else {
                        const overIdx = children.findIndex(c => c.id === overIdStr);
                        if (overIdx !== -1) {
                            children.splice(overIdx, 0, movingLink);
                        } else {
                            children.push(movingLink);
                        }
                    }
                    group.children = children;
                    newLinks[groupIdx] = group;
                }
            }
            updateLocalLinks(newLinks);
        }
    }, [localLinks, updateLocalLinks]);

    const handleDragEnd = React.useCallback(
        (event: DragEndEvent) => {
            setActiveId(null);
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const activeIdStr = String(active.id);
            const overIdStr = String(over.id);

            // If dropping over a group drop zone, the move was handled in handleDragOver
            if (overIdStr.startsWith("group-drop-")) {
                triggerReorder(localLinks);
                return;
            }

            // Check if both items are at the same level
            const activeFound = findLinkById(localLinks, activeIdStr);
            const overFound = findLinkById(localLinks, overIdStr);
            if (!activeFound || !overFound) return;

            if (activeFound.parentId === overFound.parentId) {
                // Same level reorder
                if (activeFound.parentId === null) {
                    // Top level
                    const oldIndex = localLinks.findIndex(l => l.id === activeIdStr);
                    const newIndex = localLinks.findIndex(l => l.id === overIdStr);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const newList = arrayMove(localLinks, oldIndex, newIndex);
                    triggerReorder(newList);
                } else {
                    // Within a group
                    const newList = localLinks.map(item => {
                        if (item.id === activeFound.parentId && item.children) {
                            const oldIndex = item.children.findIndex(c => c.id === activeIdStr);
                            const newIndex = item.children.findIndex(c => c.id === overIdStr);
                            if (oldIndex === -1 || newIndex === -1) return item;
                            return { ...item, children: arrayMove(item.children, oldIndex, newIndex) };
                        }
                        return item;
                    });
                    triggerReorder(newList);
                }
            } else {
                // Moving between levels — link is being moved out of a group to top level
                // or between groups. The drag-over handler already handled this.
                triggerReorder(localLinks);
            }
        },
        [localLinks, triggerReorder]
    );

    // Get all sortable IDs (top-level + all children for nested contexts)
    const abTestSecondaryIds = new Set<string>();
    const seenAbTestParents = new Set<string>();
    for (const l of localLinks) {
        if (!l.abTestParentId || l.isGroup) continue;
        if (seenAbTestParents.has(l.abTestParentId)) {
            abTestSecondaryIds.add(l.id);
        } else {
            seenAbTestParents.add(l.abTestParentId);
        }
    }
    const topLevelIds = localLinks
        .filter(l => !abTestSecondaryIds.has(l.id))
        .map(l => l.id);

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Your Links</CardTitle>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onExport}>
                        Export CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowGroupAdd((v) => !v); setShowAdd(false); }}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Add Group
                    </Button>
                    <Button size="sm" onClick={() => { setShowAdd((v) => !v); setShowGroupAdd(false); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Link
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {showAdd && <AddLinkBox onAdded={onAdd} onCancel={() => setShowAdd(false)} />}
                {showGroupAdd && <CreateGroupDialog onCreated={onAddGroup} onCancel={() => setShowGroupAdd(false)} />}

                {localLinks.length === 0 && !showAdd && !showGroupAdd && (
                    <EmptyLinksState onAdd={() => setShowAdd(true)} />
                )}

                <DndContext
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    collisionDetection={pointerWithin}
                >
                    <SortableContext items={topLevelIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {(() => {
                                const groupedRender: React.ReactNode[] = [];
                                const skipIds = new Set<string>();

                                for (let i = 0; i < localLinks.length; i++) {
                                    const item = localLinks[i];
                                    if (skipIds.has(item.id)) continue;

                                    if (item.isGroup) {
                                        groupedRender.push(
                                            <SortableGroupWrapper key={item.id} group={item}>
                                                <GroupItem
                                                    group={item}
                                                    username={username}
                                                    onUpdate={onUpdate}
                                                    onToggleVisibility={onToggleVisibility}
                                                    onDeleteLink={onDelete}
                                                    onDeleteGroup={onDeleteGroup}
                                                    onRenameGroup={onRenameGroup}
                                                />
                                            </SortableGroupWrapper>
                                        );
                                        continue;
                                    }

                                    if (item.abTestParentId) {
                                        const sibling = localLinks.find(l => l.abTestParentId === item.abTestParentId && l.id !== item.id);
                                        if (sibling) {
                                            skipIds.add(sibling.id);
                                            const pair = item.abTestVariant === "B" || sibling.abTestVariant === "A"
                                                ? { a: sibling, b: item }
                                                : { a: item, b: sibling };
                                            const variantA = pair.a;
                                            const variantB = pair.b;
                                            
                                            groupedRender.push(
                                                <SortableLinkWrapper key={item.id} link={item}>
                                                    <ABTestItem
                                                        variantA={variantA}
                                                        variantB={variantB}
                                                        username={username}
                                                        onUpdate={onUpdate}
                                                        onToggleVisibility={onToggleVisibility}
                                                        onDelete={onDelete}
                                                    />
                                                </SortableLinkWrapper>
                                            );
                                            continue;
                                        }
                                    }

                                    groupedRender.push(
                                        <SortableLinkWrapper key={item.id} link={item}>
                                            <LinkItem
                                                link={item}
                                                username={username}
                                                onUpdate={onUpdate}
                                                onToggleVisibility={onToggleVisibility}
                                                onDelete={onDelete}
                                                onCreateABTest={onCreateABTest}
                                            />
                                        </SortableLinkWrapper>
                                    );
                                }
                                return groupedRender;
                            })()}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-70 pointer-events-none bg-background rounded-md border p-4 shadow-lg">
                                {(() => {
                                    const found = findLinkById(localLinks, activeId);
                                    return found ? <span className="font-medium text-sm">{found.link.label || found.link.platform}</span> : null;
                                })()}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {isSaving && <p className="mt-4 text-sm text-gray-500">Saving order...</p>}
            </CardContent>
        </Card>
    );
}
