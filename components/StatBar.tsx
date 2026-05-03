"use client";

import { useMemo } from "react";
import type { Permit } from "@/lib/types";

export default function StatBar({ permits }: { permits: Permit[] }) {
  const stats = useMemo(() => {
    const openCount = permits.filter((permit) => permit.status === "open").length;
    const closedCount = permits.filter(
      (permit) => permit.status === "closed",
    ).length;
    const riskCount = permits.filter((permit) =>
      ["expired", "pending"].includes(permit.status),
    ).length;
    const totalValue = permits.reduce(
      (sum, permit) => sum + (permit.value ?? 0),
      0,
    );
    const valuedPermits = permits.filter(
      (permit) => typeof permit.value === "number",
    );
    const averageValue =
      valuedPermits.length > 0 ? totalValue / valuedPermits.length : 0;

    return [
      { label: "Total Permits", value: permits.length.toLocaleString() },
      { label: "Open", value: openCount.toLocaleString() },
      { label: "Closed", value: closedCount.toLocaleString() },
      { label: "Expired/Pending", value: riskCount.toLocaleString() },
      {
        label: "Average Value",
        value: averageValue.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }),
      },
    ];
  }, [permits]);

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm last:col-span-2 lg:last:col-span-1"
        >
          <p className="text-sm text-zinc-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
