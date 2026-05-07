"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyMetrics } from "@/lib/types";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const GOLD = "#f0a41a";
const GREEN = "#10b981";
const RED = "#ef4444";
const GRID = "#f3f4f6";
const AXIS_COLOR = "#9ca3af";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrencyK(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

// ── Shared card shell ─────────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">{title}</h4>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

// ── Chart components ──────────────────────────────────────────────────────────

/** Chart 1: Applications Received (bar, keyed by applicationDate month) */
function ApplicationsChart({
  data,
  accentColor,
}: {
  data: MonthlyMetrics[];
  accentColor: string;
}) {
  return (
    <ChartCard
      title="Applications Received"
      subtitle="Monthly count — source field: Date Opened"
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(v: unknown) => [(v as number).toLocaleString(), "Applications"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar
            dataKey="applicationsReceived"
            name="Applications"
            fill={accentColor}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Chart 2: Permits Issued (area, keyed by issueDate month) */
function IssuedChart({
  data,
  accentColor,
}: {
  data: MonthlyMetrics[];
  accentColor: string;
}) {
  return (
    <ChartCard
      title="Permits Issued"
      subtitle="Monthly count — source field: Date Issued"
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(v: unknown) => [(v as number).toLocaleString(), "Permits Issued"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Area
            type="monotone"
            dataKey="permitsIssued"
            name="Permits Issued"
            stroke={accentColor}
            fill={accentColor}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Chart 3: Construction Valuation (area, keyed by issueDate month) */
function ValuationChart({ data }: { data: MonthlyMetrics[] }) {
  return (
    <ChartCard
      title="Construction Valuation"
      subtitle="Monthly total — source field: Construction Total Cost"
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtCurrencyK}
            width={52}
          />
          <Tooltip
            formatter={(v: unknown) => [fmtCurrencyK(v as number), "Valuation"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Area
            type="monotone"
            dataKey="valuation"
            name="Valuation"
            stroke={GOLD}
            fill={GOLD}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Chart 4: Units Added vs Lost (dual line, keyed by issueDate month) */
function UnitsImpactChart({ data }: { data: MonthlyMetrics[] }) {
  const hasData = data.some((d) => d.unitsAdded > 0 || d.unitsLost > 0);

  return (
    <ChartCard
      title="Dwelling Units Impact"
      subtitle="Monthly count — source field: Dwelling units impact"
    >
      {!hasData ? (
        <div className="flex h-[200px] items-center justify-center text-xs text-gray-400">
          No dwelling units impact data for this section
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: AXIS_COLOR }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="unitsAdded"
              name="Units Added"
              stroke={GREEN}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="unitsLost"
              name="Units Lost"
              stroke={RED}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface SectionChartsProps {
  data: MonthlyMetrics[];
  /** Accent color for this section (Applications + Issued charts). */
  accentColor?: string;
}

export default function SectionCharts({
  data,
  accentColor = "#019cf2",
}: SectionChartsProps) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
        No monthly data available for this section
      </div>
    );
  }

  // Show last 12 months only
  const recent = data.slice(-12);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ApplicationsChart data={recent} accentColor={accentColor} />
      <IssuedChart data={recent} accentColor={accentColor} />
      <ValuationChart data={recent} />
      <UnitsImpactChart data={recent} />
    </div>
  );
}
