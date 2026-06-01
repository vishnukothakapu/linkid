"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type AnalyticsSummary = {
    rangeDays: number | null ;
    totals: {
        totalClicks: number;
        uniqueClicks: number;
        botClicks: number;
    };
};

export function AnalyticsOverview() {
    const [days, setDays] = useState<"7" | "30" | "90" | "all">("30");
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        async function loadSummary() {
            try {
                const response = await fetch(`/api/analytics/summary?days=${days}`);
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
    }, [days]);

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
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Analytics</h2>
                    <p className="text-sm text-muted-foreground">
                        Bot traffic is filtered from totals and unique visitor counts.
                    </p>
                </div>
                <Select value={days} onValueChange={(val) => { setDays(val as "7" | "30" | "90" | "all"); setLoading(true); }}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                </Select>
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