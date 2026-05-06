"use client";

import type { PermitSummary } from "@/lib/types";

function formatCurrency(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

interface StatBarProps {
  summary: PermitSummary;
  /** Compact mode: show only 4 key stats in a 2×2 → 4-col grid (for embed). */
  compact?: boolean;
}

export default function StatBar({ summary, compact = false }: StatBarProps) {
  const allStats = [
    {
      label: "Total Permits",
      value: summary.totalPermits.toLocaleString(),
      key: "total",
    },
    {
      label: "Issued",
      value: summary.issuedCount.toLocaleString(),
      key: "issued",
    },
    {
      label: "Residential",
      value: summary.residentialCount.toLocaleString(),
      key: "residential",
    },
    {
      label: "Commercial",
      value: summary.commercialCount.toLocaleString(),
      key: "commercial",
    },
    {
      label: "Permits Adding Units",
      value: summary.addedGainedUnits.toLocaleString(),
      key: "adding",
    },
    {
      label: "Permits Losing Units",
      value: summary.lostEliminatedUnits.toLocaleString(),
      key: "losing",
    },
    {
      label: "Avg Value",
      value: formatCurrency(summary.averageValue),
      key: "avg",
    },
  ];

  // Compact mode: the 4 most actionable stats for advocates (fits 360px+).
  const compactKeys = new Set(["total", "issued", "adding", "avg"]);
  const stats = compact
    ? allStats.filter((s) => compactKeys.has(s.key))
    : allStats;

  const gridCls = compact
    ? "grid grid-cols-2 gap-2 sm:grid-cols-4"
    : "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7";

  const cardCls = compact
    ? "rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 shadow-sm"
    : "rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm";

  const valueCls = compact
    ? "mt-0.5 text-lg font-semibold text-white"
    : "mt-1 text-xl font-semibold text-white";

  return (
    <section className={gridCls} aria-label="Permit summary statistics">
      {stats.map((stat) => (
        <div key={stat.label} className={cardCls}>
          <p className="text-xs text-zinc-400">{stat.label}</p>
          <p className={valueCls}>{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
