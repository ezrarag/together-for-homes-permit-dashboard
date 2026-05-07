"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyLifecycle } from "@/lib/lifecycle-metrics";

const BLUE = "#019cf2";
const BLUE_LIGHT = "#bfdffc";
const GRID = "#f3f4f6";
const AXIS = "#9ca3af";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

interface SubmittedVsIssuedChartProps {
  data: MonthlyLifecycle[];
}

export default function SubmittedVsIssuedChart({ data }: SubmittedVsIssuedChartProps) {
  // Show last 12 months
  const recent = data.slice(-12);

  if (!recent.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
        No monthly data for selected period
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
        Submitted vs. Issued
      </h3>
      <p className="mt-0.5 text-xs text-gray-400">
        Monthly applications (Date Opened) vs. permits issued (Date Issued)
      </p>
      <div className="mt-3">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={recent}
            margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
            barCategoryGap="30%"
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
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
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: unknown, name: unknown) => [
                (v as number).toLocaleString(),
                name === "applications" ? "Applications" : "Issued",
              ]}
            />
            <Legend
              iconType="square"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v: string) =>
                v === "applications" ? "Applications Received" : "Permits Issued"
              }
            />
            <Bar
              dataKey="applications"
              name="applications"
              fill={BLUE_LIGHT}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="issued"
              name="issued"
              fill={BLUE}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
