"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AnalyticsSummary = {
    rangeDays: number | null;
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

    const exportToCSV = async () => {
        const res = await fetch("/api/analytics/export?format=csv");
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "analytics-export.csv";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const rangeLabel =
            summary?.rangeDays != null ? `Last ${summary.rangeDays} Days` : "All time";
        const win = window.open("", "_blank");
        if (!win || !summary) return;
        win.document.write(`
            <html>
            <head>
                <title>Analytics Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { font-size: 24px; margin-bottom: 4px; }
                    p { color: #666; margin-top: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
                    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
                    th { background: #f5f5f5; font-weight: 600; }
                </style>
            </head>
            <body>
                <h1>Analytics Report</h1>
                <p>${rangeLabel}</p>
                <table>
                    <thead>
                        <tr><th>Metric</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Total Clicks</td><td>${summary.totals.totalClicks}</td></tr>
                        <tr><td>Unique Visitors</td><td>${summary.totals.uniqueClicks}</td></tr>
                        <tr><td>Filtered Bot Hits</td><td>${summary.totals.botClicks}</td></tr>
                    </tbody>
                </table>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        win.print();
    };

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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Analytics Overview</h2>
                <div className="flex items-center gap-2">
                    <Select value={days} onValueChange={(v) => setDays(v as typeof days)}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                    </Select>
                    {!loading && summary && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <Download className="h-4 w-4" />
                                    Export
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={exportToCSV}>
                                    Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToPDF}>
                                    Export PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {cards.map((card) => (
                    <Card key={card.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {loading ? "—" : card.value.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
