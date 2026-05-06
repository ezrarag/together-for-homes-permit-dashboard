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

export default function StatBar({ summary }: { summary: PermitSummary }) {
  const stats = [
    {
      label: "Total Permits",
      value: summary.totalPermits.toLocaleString(),
    },
    {
      label: "Issued",
      value: summary.issuedCount.toLocaleString(),
    },
    {
      label: "Residential",
      value: summary.residentialCount.toLocaleString(),
    },
    {
      label: "Commercial",
      value: summary.commercialCount.toLocaleString(),
    },
    {
      label: "Permits Adding Units",
      value: summary.addedGainedUnits.toLocaleString(),
    },
    {
      label: "Permits Losing Units",
      value: summary.lostEliminatedUnits.toLocaleString(),
    },
    {
      label: "Avg Value",
      value: formatCurrency(summary.averageValue),
    },
  ];

  return (
    <section
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
      aria-label="Permit summary statistics"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm"
        >
          <p className="text-xs text-zinc-400">{stat.label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
