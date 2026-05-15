"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LifecycleMetrics } from "@/lib/lifecycle-metrics";
import type { PermitProjectCategory } from "@/lib/types";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BLUE = "#019cf2";
const BLUE_LIGHT = "#bfdffc";
const GRID = "#f3f4f6";
const AXIS = "#9ca3af";
const LABEL = "#374151";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

// ── Category display config ───────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  PermitProjectCategory,
  { label: string; shortLabel: string }
> = {
  residential_single_duplex: {
    label: "1-2 Unit Residential New Construction / Alteration",
    shortLabel: "1-2 Unit",
  },
  multi_family: {
    label: "3+ Unit Residential / Multi-Family",
    shortLabel: "3+ Unit",
  },
  commercial: {
    label: "Commercial New Construction / Alteration",
    shortLabel: "Commercial",
  },
  other: {
    label: "Other / Unclassified",
    shortLabel: "Other",
  },
};

const CATEGORY_ORDER: PermitProjectCategory[] = [
  "residential_single_duplex",
  "multi_family",
  "commercial",
  "other",
];

// ── Component ─────────────────────────────────────────────────────────────────

interface PermitBarChartProps {
  metrics: LifecycleMetrics;
}

export default function PermitBarChart({ metrics }: PermitBarChartProps) {
  const data = CATEGORY_ORDER.map((cat) => {
    const cfg = CATEGORY_CONFIG[cat];
    const catData = metrics.byCategory[cat];
    return {
      category: cat,
      label: cfg.shortLabel,
      fullLabel: cfg.label,
      applications: catData?.applications ?? 0,
      issued: catData?.issued ?? 0,
      avgDays: catData?.avgDays,
    };
  }).filter((d) => d.applications > 0 || d.issued > 0);

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        No permit data for selected period
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
            Permit Volume by Category
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Records with Date Opened vs. permits issued · source: Permit Type + Use of Building
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ left: 8, right: 16, top: 20, bottom: 4 }}
          barCategoryGap="28%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: LABEL }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: unknown, name: unknown) => {
              const displayName = name === "applications" ? "Records with Date Opened" : "Issued";
              return [(v as number).toLocaleString(), displayName];
            }}
            labelFormatter={(_label: unknown, payload: ReadonlyArray<{ payload?: { fullLabel?: string } }>) => {
              return payload?.[0]?.payload?.fullLabel ?? String(_label);
            }}
          />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(v: string) => (v === "applications" ? "Records Opened" : "Permits Issued")}
          />

          {/* Applications bar — lighter fill */}
          <Bar dataKey="applications" name="applications" fill={BLUE_LIGHT} radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey="applications"
              position="top"
              style={{ fontSize: 10, fill: AXIS }}
            />
            {data.map((d) => (
              <Cell key={d.category} fill={BLUE_LIGHT} />
            ))}
          </Bar>

          {/* Issued bar — solid TFH blue */}
          <Bar dataKey="issued" name="issued" fill={BLUE} radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey="issued"
              position="top"
              style={{ fontSize: 10, fill: AXIS }}
            />
            {data.map((d) => (
              <Cell key={d.category} fill={BLUE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
