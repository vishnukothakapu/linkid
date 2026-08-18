import type { Link } from "@prisma/client";

/**
 * Transforms a flat list of links into a nested structure.
 * Groups (isGroup=true) get a `children` array of their child links.
 * Top-level links (parentId=null) without isGroup remain unchanged.
 */
export function nestLinks(links: Link[]): (Link & { children?: Link[] })[] {
    const childrenMap = new Map<string, Link[]>();
    const topLevel: Link[] = [];

    for (const link of links) {
        if (link.parentId) {
            const siblings = childrenMap.get(link.parentId) || [];
            siblings.push(link);
            childrenMap.set(link.parentId, siblings);
        } else {
            topLevel.push(link);
        }
    }

    return topLevel.map(link => {
        if (link.isGroup) {
            return { ...link, children: childrenMap.get(link.id) || [] };
        }
        return link;
    });
}
