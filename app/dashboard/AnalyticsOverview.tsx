"use client";

import { ChevronDown, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type LinkAnalytics = {
    id: string;
    platform: string;
    label: string;
    url: string;
    isPublic: boolean;
    totalClicks: number;
    uniqueClicks: number;
    botClicks: number;
};

type ClicksOverTimePoint = {
    date: string;
    totalClicks: number;
    uniqueClicks: number;
    botClicks: number;
};

type PlatformPerformanceEntry = {
    platform: string;
    totalClicks: number;
    uniqueClicks: number;
    linkCount: number;
};

type RecentActivity = {
    id: string;
    linkId: string;
    platform: string;
    label: string;
    country: string | null;
    deviceType: string | null;
    isBot: boolean;
    createdAt: string;
} | null;

type AnalyticsSummary = {
    rangeDays: number | null;
    totals: {
        totalClicks: number;
        uniqueClicks: number;
        botClicks: number;
    };
    links: LinkAnalytics[];
    clicksOverTime: ClicksOverTimePoint[];
    platformPerformance: PlatformPerformanceEntry[];
    recentActivity: RecentActivity;
};

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7", "#ef4444"];

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

    const downloadExport = async (url: string, filename: string) => {
        const res = await fetch(url);
        if (!res.ok) return;
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(objectUrl);
        document.body.removeChild(link);
    };

    const exportToCSV = () =>
        downloadExport("/api/analytics/export?format=csv", "analytics-export.csv");

    const exportToJSON = () =>
        downloadExport(
            `/api/analytics/export?format=json&days=${days}`,
            "analytics-export.json"
        );

    const exportToPDF = () =>
        downloadExport(
            `/api/analytics/export?format=pdf&days=${days}`,
            "analytics-export.pdf"
        );

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

    const topLink = summary?.links?.[0] ?? null;

    const clicksOverTimeData = useMemo(() => {
        if (!summary) return [];

        return summary.clicksOverTime.map((point) => ({
            ...point,
            label: new Date(point.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            }),
        }));
    }, [summary]);

    const clicksPerLinkData = useMemo(() => {
        if (!summary) return [];

        return summary.links.map((link) => ({
            label: link.label.length > 18 ? `${link.label.slice(0, 18)}…` : link.label,
            totalClicks: link.totalClicks,
            uniqueClicks: link.uniqueClicks,
        }));
    }, [summary]);

    const recentActivityLabel = summary?.recentActivity
        ? new Date(summary.recentActivity.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : null;

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
                                <DropdownMenuItem onClick={exportToJSON}>
                                    Export JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToPDF}>
                                    Export PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
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
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Top Performing Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-2xl font-bold">—</p>
                        ) : topLink ? (
                            <>
                                <p className="truncate text-2xl font-bold">{topLink.label}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {topLink.platform} · {topLink.totalClicks.toLocaleString()} clicks
                                </p>
                            </>
                        ) : (
                            <p className="text-2xl font-bold">—</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Clicks Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : clicksOverTimeData.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No click data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={clicksOverTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" fontSize={12} />
                                    <YAxis allowDecimals={false} fontSize={12} />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="totalClicks"
                                        name="Total Clicks"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="uniqueClicks"
                                        name="Unique Clicks"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Platform Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : !summary || summary.platformPerformance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No platform data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={summary.platformPerformance}
                                        dataKey="totalClicks"
                                        nameKey="platform"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label={(entry) => String(entry.name ?? "")}
                                    >
                                        {summary.platformPerformance.map((entry, index) => (
                                            <Cell
                                                key={entry.platform}
                                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Clicks Per Link
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : clicksPerLinkData.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No links yet.</p>
                    ) : (
                        <ResponsiveContainer
                            width="100%"
                            height={Math.max(240, clicksPerLinkData.length * 40)}
                        >
                            <BarChart data={clicksPerLinkData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    width={140}
                                    fontSize={12}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="totalClicks" name="Total Clicks" fill="#6366f1" />
                                <Bar dataKey="uniqueClicks" name="Unique Clicks" fill="#22c55e" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : !summary?.recentActivity ? (
                        <p className="text-sm text-muted-foreground">No recent activity.</p>
                    ) : (
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium">
                                    {summary.recentActivity.label}{" "}
                                    <span className="text-muted-foreground">
                                        ({summary.recentActivity.platform})
                                    </span>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {summary.recentActivity.country ?? "Unknown location"} ·{" "}
                                    {summary.recentActivity.deviceType ?? "Unknown device"}
                                    {summary.recentActivity.isBot ? " · Bot" : ""}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {recentActivityLabel}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}