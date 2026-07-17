"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type DailyData = {
  date: string;
  clicks: number;
  uniqueClicks: number;
  botClicks: number;
};

type DimensionData = {
  name: string;
  value: number;
};

type AnalyticsDetails = {
  dailyData: DailyData[];
  referrers: DimensionData[];
  devices: DimensionData[];
  countries: DimensionData[];
};

interface AnalyticsChartsProps {
  days: "7" | "30" | "90" | "all";
}

export function AnalyticsCharts({ days }: AnalyticsChartsProps) {
  const [data, setData] = useState<AnalyticsDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchDetails() {
      try {
        const res = await fetch(`/api/analytics?days=${days}`);
        if (!res.ok) return;
        const json = await res.json() as AnalyticsDetails;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        console.error("Error loading analytics details:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [days]);

  // Calculations for SVG Line Chart
  const lineChartData = useMemo(() => {
    if (!data || !data.dailyData || data.dailyData.length === 0) return null;
    const daily = data.dailyData;

    const maxClicks = Math.max(...daily.map((d) => Math.max(d.clicks, d.uniqueClicks, 1)));
    
    const width = 600;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = daily.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, daily.length - 1)) * chartWidth;
      const yClicks = height - paddingBottom - (d.clicks / maxClicks) * chartHeight;
      const yUnique = height - paddingBottom - (d.uniqueClicks / maxClicks) * chartHeight;
      return { x, yClicks, yUnique, d };
    });

    // Create SVG paths
    const clicksPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yClicks}`).join(" ");
    const uniquePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yUnique}`).join(" ");

    // Area paths
    const clicksArea = `${clicksPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    const uniqueArea = `${uniquePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartWidth,
      chartHeight,
      points,
      clicksPath,
      uniquePath,
      clicksArea,
      uniqueArea,
      maxClicks,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-64 w-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.dailyData || data.dailyData.length === 0) {
    return (
      <div className="flex h-64 w-100 items-center justify-center rounded-xl border border-dashed border-border bg-card text-muted-foreground">
        No traffic data available for the selected period.
      </div>
    );
  }

  // Calculate totals for dimensions to display percentages
  const totalReferrerClicks = data.referrers.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const totalDeviceClicks = data.devices.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const totalCountryClicks = data.countries.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Click Progression Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Traffic History</CardTitle>
        </CardHeader>
        <CardContent>
          {lineChartData && (
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`}
                className="w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = lineChartData.paddingTop + val * lineChartData.chartHeight;
                  const labelVal = Math.round(lineChartData.maxClicks * (1 - val));
                  return (
                    <g key={idx}>
                      <line
                        x1={lineChartData.paddingLeft}
                        y1={y}
                        x2={lineChartData.width - lineChartData.paddingRight}
                        y2={y}
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={lineChartData.paddingLeft - 10}
                        y={y + 4}
                        fill="hsl(var(--muted-foreground))"
                        fontSize="10"
                        textAnchor="end"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Areas */}
                <path d={lineChartData.clicksArea} fill="url(#clicksGrad)" />
                <path d={lineChartData.uniqueArea} fill="url(#uniqueGrad)" />

                {/* Trend Lines */}
                <path
                  d={lineChartData.clicksPath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={lineChartData.uniquePath}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive X Axis Labels and Hover Bars */}
                {lineChartData.points.map((p, idx) => {
                  // Show max 8 date labels
                  const showLabel =
                    lineChartData.points.length <= 10 ||
                    idx === 0 ||
                    idx === lineChartData.points.length - 1 ||
                    idx === Math.floor(lineChartData.points.length / 2) ||
                    idx === Math.floor(lineChartData.points.length / 4) ||
                    idx === Math.floor((3 * lineChartData.points.length) / 4);

                  return (
                    <g key={idx}>
                      {showLabel && (
                        <text
                          x={p.x}
                          y={lineChartData.height - 10}
                          fill="hsl(var(--muted-foreground))"
                          fontSize="9"
                          textAnchor="middle"
                        >
                          {p.d.date.slice(5)}
                        </text>
                      )}

                      {/* Transparent interactive trigger area for hover */}
                      <rect
                        x={p.x - 10}
                        y={lineChartData.paddingTop}
                        width={20}
                        height={lineChartData.chartHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />

                      {/* Hover Indicator Bar */}
                      {hoveredIndex === idx && (
                        <line
                          x1={p.x}
                          y1={lineChartData.paddingTop}
                          x2={p.x}
                          y2={lineChartData.height - lineChartData.paddingBottom}
                          stroke="#64748b"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Tooltip circles on hover */}
                      {hoveredIndex === idx && (
                        <>
                          <circle cx={p.x} cy={p.yClicks} r="4" fill="#06b6d4" stroke="#fff" strokeWidth="1.5" />
                          <circle cx={p.x} cy={p.yUnique} r="4" fill="#a855f7" stroke="#fff" strokeWidth="1.5" />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend & Tooltip Overlay */}
              <div className="mt-4 flex items-center justify-between px-2 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-cyan-500" />
                    <span className="text-muted-foreground">Total Clicks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">Unique Visitors</span>
                  </div>
                </div>

                {hoveredIndex !== null && lineChartData.points[hoveredIndex] && (
                  <div className="rounded-lg border border-border bg-popover px-3 py-1.5 text-popover-foreground shadow-sm">
                    <div className="font-medium">{lineChartData.points[hoveredIndex].d.date}</div>
                    <div className="flex gap-4 mt-0.5">
                      <span className="text-cyan-500">Clicks: {lineChartData.points[hoveredIndex].d.clicks}</span>
                      <span className="text-purple-500">Unique: {lineChartData.points[hoveredIndex].d.uniqueClicks}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Dimensions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Referrers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {data.referrers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No referrer data</div>
            ) : (
              data.referrers.map((ref) => {
                const percentage = Math.round((ref.value / totalReferrerClicks) * 100);
                return (
                  <div key={ref.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[150px]">{ref.name}</span>
                      <span className="text-muted-foreground">{ref.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Countries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {data.countries.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No location data</div>
            ) : (
              data.countries.map((c) => {
                const percentage = Math.round((c.value / totalCountryClicks) * 100);
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[150px]">{c.name}</span>
                      <span className="text-muted-foreground">{c.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Devices Used</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {data.devices.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No device data</div>
            ) : (
              data.devices.map((d) => {
                const percentage = Math.round((d.value / totalDeviceClicks) * 100);
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{d.name}</span>
                      <span className="text-muted-foreground">{d.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
