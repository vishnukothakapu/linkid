import type { Link as ProfileLink } from "@/app/[username]/types/type";

/**
 * Filters dashboard links by their visible title (label) or destination URL.
 * Groups are kept only when at least one child link matches.
 * Only matching children are shown while a search is active.
 */
export function filterLinksBySearch(links: ProfileLink[], searchText: string): ProfileLink[] {
    const query = searchText.trim().toLocaleLowerCase();
    if (!query) return links;

    return links.reduce<ProfileLink[]>((matches, link) => {
        const linkMatches = [link.label, link.url]
            .some((value) => value?.toLocaleLowerCase().includes(query));

        if (link.isGroup) {
            const matchingChildren = (link.children || []).filter((child) =>
                [child.label, child.url].some((value) => value?.toLocaleLowerCase().includes(query))
            );

            if (matchingChildren.length > 0) {
                matches.push({ ...link, children: matchingChildren });
            }
        } else if (linkMatches) {
            matches.push(link);
        }

        return matches;
    }, []);
}
