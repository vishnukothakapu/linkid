export type LinkScheduleWindow = {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
};

/**
 * Returns true when a link is inside its configured schedule window.
 * A missing boundary means "no restriction on that side". An invalid date
 * fails closed so a malformed value cannot publish a scheduled link early.
 */
export function isLinkWithinSchedule(
    link: LinkScheduleWindow,
    now: Date = new Date()
): boolean {
    const timestamp = now.getTime();

    if (link.startDate != null) {
        const start = new Date(link.startDate).getTime();
        if (Number.isNaN(start) || start > timestamp) return false;
    }

    if (link.endDate != null) {
        const end = new Date(link.endDate).getTime();
        if (Number.isNaN(end) || end < timestamp) return false;
    }

    return true;
}
