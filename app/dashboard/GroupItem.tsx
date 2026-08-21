"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ChevronDown,
    ChevronRight,
    Pencil,
    Trash,
    Check,
    X,
    FolderOpen,
    GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCsrfToken } from "@/lib/csrfClient";
import type { Link as ProfileLink } from "@/app/[username]/types/type";
import { LinkItem } from "./LinkItem";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import React from "react";

function SortableChildWrapper({ link, children }: { link: ProfileLink; children: React.ReactNode }) {
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

export function GroupItem({
    group,
    username,
    dragListeners,
    dragAttributes,
    onUpdate,
    onToggleVisibility,
    onDeleteLink,
    onDeleteGroup,
    onRenameGroup,
}: {
    group: ProfileLink;
    username: string;
    dragListeners?: SyntheticListenerMap;
    dragAttributes?: DraggableAttributes;
    onUpdate: (id: string, url: string, label?: string, platform?: string, startDate?: Date | null, endDate?: Date | null, pinCode?: string | null) => Promise<boolean>;
    onToggleVisibility: (id: string, isPublic: boolean) => Promise<void>;
    onDeleteLink: (id: string) => Promise<void>;
    onDeleteGroup: (groupId: string, deleteChildren: boolean) => Promise<void>;
    onRenameGroup: (groupId: string, newName: string) => Promise<void>;
}) {
    const [expanded, setExpanded] = useState(true);
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState(group.label);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const children = group.children || [];

    // Make the group body a droppable area
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `group-drop-${group.id}`,
        data: { type: "group", groupId: group.id },
    });

    async function handleRename() {
        const trimmed = newName.trim();
        if (!trimmed) {
            return toast.error("Group name cannot be empty");
        }
        await onRenameGroup(group.id, trimmed);
        setEditing(false);
    }

    return (
        <div className={`rounded-xl border transition-colors bg-card text-card-foreground shadow-sm overflow-hidden mb-3 ${isOver ? "border-primary ring-1 ring-primary/50" : "hover:border-primary/50"}`}>
            {/* Group header */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 border-b">
                <div
                    {...dragListeners}
                    {...dragAttributes}
                    role="button"
                    aria-label="Drag to reorder group"
                    tabIndex={0}
                    className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM5.5 9.5C4.67157 9.5 4 10.1716 4 11C4 11.8284 4.67157 12.5 5.5 12.5C6.32843 12.5 7 11.8284 7 11C7 10.1716 6.32843 9.5 5.5 9.5ZM9.5 3C8.67157 3 8 3.67157 8 4.5C8 5.32843 8.67157 6 9.5 6C10.3284 6 11 5.32843 11 4.5C11 3.67157 10.3284 3 9.5 3ZM9.5 9.5C8.67157 9.5 8 10.1716 8 11C8 11.8284 8.67157 12.5 9.5 12.5C10.3284 12.5 11 11.8284 11 11C11 10.1716 10.3284 9.5 9.5 9.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                </div>

                <div className="flex items-center gap-2 flex-1">
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex items-center gap-2"
                        aria-label={expanded ? "Collapse group" : "Expand group"}
                    >
                        {expanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <FolderOpen className="h-4 w-4 text-primary" />
                    </button>

                    {editing ? (
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") {
                                    setNewName(group.label);
                                    setEditing(false);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 text-sm max-w-[200px]"
                            autoFocus
                        />
                    ) : (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="flex items-center text-left"
                        >
                            <span className="font-medium text-sm">{group.label}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                                ({children.length} {children.length === 1 ? "link" : "links"})
                            </span>
                        </button>
                    )}
                </div>

                <div className="flex gap-1">
                    {editing ? (
                        <>
                            <Button size="icon" variant="ghost" onClick={handleRename} className="h-7 w-7">
                                <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                    setNewName(group.label);
                                    setEditing(false);
                                }}
                                className="h-7 w-7"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditing(true)}
                                className="h-7 w-7"
                                aria-label="Rename group"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                aria-label="Delete group"
                            >
                                <Trash className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Delete confirmation */}
            {showDeleteConfirm && (
                <div className="p-3 bg-destructive/5 border-t flex flex-col gap-2">
                    <p className="text-sm font-medium">Delete this group?</p>
                    <p className="text-xs text-muted-foreground">
                        Choose what happens to the {children.length} link{children.length !== 1 ? "s" : ""} inside:
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                onDeleteGroup(group.id, false);
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Ungroup links
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                onDeleteGroup(group.id, true);
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Delete all
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Group children */}
            {expanded && (
                <div
                    ref={setDroppableRef}
                    className={`p-3 space-y-3 min-h-[48px] transition-colors rounded-b-lg ${
                        isOver ? "bg-primary/5" : ""
                    } ${children.length === 0 ? "flex items-center justify-center" : ""}`}
                >
                    {children.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                            Drag links here to add them to this group
                        </p>
                    ) : (
                        <SortableContext items={children.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                            {children.map((link) => (
                                <SortableChildWrapper key={link.id} link={link}>
                                    <LinkItem
                                        link={link}
                                        username={username}
                                        onUpdate={onUpdate}
                                        onToggleVisibility={onToggleVisibility}
                                        onDelete={onDeleteLink}
                                    />
                                </SortableChildWrapper>
                            ))}
                        </SortableContext>
                    )}
                </div>
            )}
        </div>
    );
}
