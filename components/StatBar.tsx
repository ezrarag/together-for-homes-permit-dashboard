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
      accent: "bg-tfh-blue",
    },
    {
      label: "Issued",
      value: summary.issuedCount.toLocaleString(),
      key: "issued",
      accent: "bg-tfh-blue-btn",
    },
    {
      label: "Residential",
      value: summary.residentialCount.toLocaleString(),
      key: "residential",
      accent: "bg-tfh-gold",
    },
    {
      label: "Commercial",
      value: summary.commercialCount.toLocaleString(),
      key: "commercial",
      accent: "bg-tfh-gold-dk",
    },
    {
      label: "Permits Adding Units",
      value: summary.addedGainedUnits.toLocaleString(),
      key: "adding",
      accent: "bg-tfh-blue",
    },
    {
      label: "Permits Losing Units",
      value: summary.lostEliminatedUnits.toLocaleString(),
      key: "losing",
      accent: "bg-red-400",
    },
    {
      label: "Avg Value",
      value: formatCurrency(summary.averageValue),
      key: "avg",
      accent: "bg-tfh-gold",
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

  const cardPad = compact ? "px-3 py-2.5" : "p-4";
  const valueCls = compact
    ? "mt-0.5 text-lg font-bold text-tfh-navy"
    : "mt-1 text-xl font-bold text-tfh-navy";

  return (
    <section className={gridCls} aria-label="Permit summary statistics">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border border-gray-200 bg-white shadow-sm ${cardPad}`}
        >
          {/* Colored accent stripe */}
          <div className={`mb-2 h-1 w-8 rounded-full ${stat.accent}`} />
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {stat.label}
          </p>
          <p className={valueCls}>{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
