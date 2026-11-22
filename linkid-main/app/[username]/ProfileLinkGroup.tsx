"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileLinkItem } from "./ProfileLinkItem";
import type { Link, LayoutStyle } from "./types/type";

export function ProfileLinkGroup({
    group,
    username,
    layoutStyle,
}: {
    group: Link;
    username: string;
    layoutStyle?: LayoutStyle | string;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const children = group.children || [];

    if (children.length === 0) return null;

    const isGrid = layoutStyle === "GRID";

    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors hover:bg-muted/50 group"
                aria-expanded={isOpen}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
                <span className="font-semibold text-sm">{group.label}</span>
                <span className="text-xs text-muted-foreground">
                    ({children.length})
                </span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className={
                                isGrid
                                    ? "grid grid-cols-2 md:grid-cols-4 gap-4 pl-4 border-l-2 border-muted ml-2"
                                    : "space-y-2 pl-4 border-l-2 border-muted ml-2"
                            }
                        >
                            {children.map((link) => (
                                <ProfileLinkItem
                                    key={link.id}
                                    link={link}
                                    username={username}
                                    layoutStyle={layoutStyle}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
