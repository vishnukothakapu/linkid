export function computePercentChange(current: number, previous: number): number | "new" | null {
    if (previous === 0) {
        return current === 0 ? null : "new";
    }
    return ((current - previous) / previous) * 100;
}

const TOP_BREAKDOWN_LIMIT = 8;

export type BreakdownEntry = {
    label: string;
    count: number;
};

export function buildTopBreakdown(
    rows: { key: string | null; count: number }[],
    fallbackLabel: string
): BreakdownEntry[] {
    const counts = new Map<string, number>();

    for (const row of rows) {
        const label = row.key && row.key.trim() ? row.key.trim() : fallbackLabel;
        counts.set(label, (counts.get(label) ?? 0) + row.count);
    }

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, TOP_BREAKDOWN_LIMIT);
    const rest = sorted.slice(TOP_BREAKDOWN_LIMIT);
    const otherCount = rest.reduce((sum, [, count]) => sum + count, 0);

    const result: BreakdownEntry[] = top.map(([label, count]) => ({ label, count }));
    if (otherCount > 0) {
        result.push({ label: "Other", count: otherCount });
    }

    return result;
}
