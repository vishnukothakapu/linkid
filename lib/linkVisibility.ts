import type { Prisma } from "@prisma/client";

/**
 * Link scheduling rule.
 *
 * A link is visible only while `now` is inside its `startDate` / `endDate`
 * window. Both bounds are inclusive and `null` means "no bound". The public
 * profile page has always enforced this in memory; the export routes and the
 * extension API must apply the same rule, otherwise scheduled or expired links
 * leak through those endpoints.
 */
export type LinkSchedule = {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
};

export function isLinkActive(link: LinkSchedule, now: Date = new Date()): boolean {
    if (link.startDate && new Date(link.startDate) > now) return false;
    if (link.endDate && new Date(link.endDate) < now) return false;
    return true;
}

export function filterActiveLinks<T extends LinkSchedule>(
    links: T[],
    now: Date = new Date()
): T[] {
    return links.filter((link) => isLinkActive(link, now));
}

/**
 * Prisma `where` fragment for the same rule, so routes that already query the
 * database can filter there instead of loading every link and filtering in
 * memory. Combine with `isPublic: true` for public read paths.
 */
export function activeLinkWhere(now: Date = new Date()): Prisma.LinkWhereInput {
    return {
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    };
}
