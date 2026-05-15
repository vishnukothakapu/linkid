"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsSummary = {
    rangeDays: number;
    totals: {
        totalClicks: number;
        uniqueClicks: number;
        botClicks: number;
    };
};

export function AnalyticsOverview() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadSummary() {
            try {
                const response = await fetch("/api/analytics/summary?days=30");
                if (!response.ok) return;

                const payload = (await response.json()) as { summary?: AnalyticsSummary };
                if (!cancelled && payload.summary) {
                    setSummary(payload.summary);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadSummary();

        return () => {
            cancelled = true;
        };
    }, []);

    const cards = useMemo(() => {
        if (!summary) {
            return [
                { label: "Total Clicks", value: 0 },
                { label: "Unique Visitors", value: 0 },
                { label: "Filtered Bot Hits", value: 0 },
            ];
        }

        return [
            { label: "Total Clicks", value: summary.totals.totalClicks },
            { label: "Unique Visitors", value: summary.totals.uniqueClicks },
            { label: "Filtered Bot Hits", value: summary.totals.botClicks },
        ];
    }, [summary]);

    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold">Analytics (last 30 days)</h2>
                <p className="text-sm text-muted-foreground">
                    Bot traffic is filtered from totals and unique visitor counts.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {loading ? "..." : card.value.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
