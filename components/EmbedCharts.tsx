"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PermitSummary } from "@/lib/types";

const BLUE = "#019cf2";
const GOLD = "#f0a41a";
const NAVY = "#00304c";
const GRID = "#f3f4f6";
const AXIS_COLOR = "#9ca3af";
const LABEL_COLOR = "#374151";

const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  fontSize: 11,
};

/** Compact 2-chart row for the embed view. */
export default function EmbedCharts({ summary }: { summary: PermitSummary }) {
  const hasTypeData = summary.permitsByType.length > 0;
  const hasTrendData = summary.monthlyTrend.length > 0;

  if (!hasTypeData && !hasTrendData) return null;

  // Last 12 months for the compact trend
  const trendData = summary.monthlyTrend.slice(-12);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Permits by Type — horizontal bar */}
      {hasTypeData && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <h3
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: NAVY }}
          >
            By Type
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={summary.permitsByType}
              layout="vertical"
              margin={{ left: 4, right: 16, top: 6, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                tick={{ fontSize: 9, fill: LABEL_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: unknown) => [(v as number).toLocaleString(), "Permits"]}
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey="count" fill={BLUE} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly activity trend — area chart */}
      {hasTrendData && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <h3
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: NAVY }}
          >
            Activity Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={trendData}
              margin={{ left: 0, right: 12, top: 6, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: AXIS_COLOR }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: unknown) => [(v as number).toLocaleString(), "Permits"]}
                contentStyle={TOOLTIP_STYLE}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Permits"
                stroke={GOLD}
                fill={GOLD}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
