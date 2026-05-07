"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyLifecycle } from "@/lib/lifecycle-metrics";

const GOLD = "#f0a41a";
const GRID = "#f3f4f6";
const AXIS = "#9ca3af";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

interface AverageDaysChartProps {
  data: MonthlyLifecycle[];
  /** Overall average line to draw as a reference (optional). */
  overallAvg?: number | null;
}

export default function AverageDaysChart({ data, overallAvg }: AverageDaysChartProps) {
  // Only months that have an avgDays value; show last 12
  const withData = data.filter((d) => d.avgDays !== null).slice(-12);

  if (!withData.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
        Not enough issued permits to calculate average days
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
        Avg Days to Issue — Monthly
      </h3>
      <p className="mt-0.5 text-xs text-gray-400">
        Mean (Date Issued − Date Opened) per month · source: Date Opened + Date Issued
      </p>
      {overallAvg !== null && overallAvg !== undefined && (
        <p className="mt-0.5 text-xs font-semibold" style={{ color: GOLD }}>
          Period average: {overallAvg} days
        </p>
      )}
      <div className="mt-3">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={withData}
            margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: AXIS }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: AXIS }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              unit=" d"
            />
            <Tooltip
              formatter={(v: unknown) => [`${v as number} days`, "Avg Days to Issue"]}
              contentStyle={TOOLTIP_STYLE}
            />
            {overallAvg !== null && overallAvg !== undefined && (
              <ReferenceLine
                y={overallAvg}
                stroke={GOLD}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: `Avg ${overallAvg}d`, position: "insideTopRight", fontSize: 10, fill: GOLD }}
              />
            )}
            <Area
              type="monotone"
              dataKey="avgDays"
              name="Avg Days"
              stroke={GOLD}
              fill={GOLD}
              fillOpacity={0.12}
              strokeWidth={2}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
