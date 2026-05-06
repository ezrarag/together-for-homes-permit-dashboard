"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DwellingImpactBreakdown,
  MonthlyDataPoint,
  PermitSummary,
  PermitTypeBreakdown,
  UseOfBuildingBreakdown,
} from "@/lib/types";

// ── Brand tokens (duplicated here to keep chart file self-contained) ─────────
const BLUE = "#019cf2";
const GOLD = "#f0a41a";
const NAVY = "#00304c";
const GRID = "#f3f4f6";
const AXIS_COLOR = "#9ca3af";
const LABEL_COLOR = "#374151";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

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
      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: NAVY }}>
        {title}
      </h3>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

// ── Chart 1: Permits by Type ─────────────────────────────────────────────────

function PermitsByTypeChart({ data }: { data: PermitTypeBreakdown[] }) {
  if (!data.length) return null;
  return (
    <ChartCard
      title="Permits by Type"
      subtitle="Count by normalized permit category — source field: Permit Type"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 28, top: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fontSize: 11, fill: LABEL_COLOR }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: unknown) => [(v as number).toLocaleString(), "Permits"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="count" name="Permits" fill={BLUE} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Chart 2: Monthly Trend ───────────────────────────────────────────────────

function MonthlyTrendChart({ data }: { data: MonthlyDataPoint[] }) {
  if (!data.length) return null;
  return (
    <ChartCard
      title="Permit Activity"
      subtitle={`Monthly permit issuances — source field: Date Issued (last ${data.length} months)`}
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
        >
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
          />
          <Tooltip
            formatter={(v: unknown) => [(v as number).toLocaleString(), "Permits"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Permits"
            stroke={BLUE}
            fill={BLUE}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Chart 3: Top Uses of Building ────────────────────────────────────────────

// Custom tooltip shows full use-of-building label even when YAxis is truncated
function UseTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { fullUse: string; count: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const { fullUse, count } = payload[0].payload;
  return (
    <div
      className="max-w-[220px] rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg"
      style={TOOLTIP_STYLE}
    >
      <p className="font-medium text-gray-800">{fullUse}</p>
      <p className="mt-0.5" style={{ color: GOLD }}>
        {count.toLocaleString()} permits
      </p>
    </div>
  );
}

function PermitsByUseChart({ data }: { data: UseOfBuildingBreakdown[] }) {
  if (!data.length) return null;
  const display = data.map((d) => ({
    count: d.count,
    use: d.use.length > 32 ? `${d.use.slice(0, 30)}…` : d.use,
    fullUse: d.use,
  }));
  return (
    <ChartCard
      title="Top Uses of Building"
      subtitle="Permit count by use category (top 12) — source field: Use of Building"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={display}
          layout="vertical"
          margin={{ left: 4, right: 28, top: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="use"
            width={160}
            tick={{ fontSize: 10, fill: LABEL_COLOR }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<UseTooltip />} />
          <Bar dataKey="count" name="Permits" fill={GOLD} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Chart 4: Dwelling Units Impact ───────────────────────────────────────────

const DWELLING_COLORS: [string, string, string] = [AXIS_COLOR, BLUE, "#ef4444"];

function DwellingImpactChart({ data }: { data: DwellingImpactBreakdown }) {
  const chartData = [
    { name: "Maintain Current Units", value: data.maintain },
    { name: "Added or Gained", value: data.added },
    { name: "Lost or Eliminated", value: data.lost },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="Dwelling Units Impact"
      subtitle={`Source field: Dwelling units impact — ${total.toLocaleString()} permits with data`}
    >
      {total === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
          No dwelling units impact data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={DWELLING_COLORS[i % DWELLING_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: unknown, name: unknown) => [
                (v as number).toLocaleString(),
                name as string,
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface ReportChartsProps {
  summary: PermitSummary;
}

export default function ReportCharts({ summary }: ReportChartsProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PermitsByTypeChart data={summary.permitsByType} />
      <MonthlyTrendChart data={summary.monthlyTrend} />
      <PermitsByUseChart data={summary.permitsByUse} />
      <DwellingImpactChart data={summary.dwellingImpact} />
    </div>
  );
}
