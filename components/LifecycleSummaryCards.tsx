"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
import type { LifecycleMetrics } from "@/lib/lifecycle-metrics";
import type { PermitFilters } from "@/lib/types";

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;          // Tailwind bg class for accent bar
  icon: React.ReactNode;
  featured?: boolean;      // larger card + gold ring (Avg Days)
  clickable?: boolean;
  onClick?: () => void;
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon,
  featured,
  clickable,
  onClick,
}: KpiCardProps) {
  const Tag = clickable ? "button" : "div";
  return (
    <Tag
      {...(clickable
        ? {
            type: "button" as const,
            onClick,
            className: `group flex w-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-150 hover:border-tfh-blue hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tfh-blue ${
              featured ? "p-5 ring-2 ring-tfh-gold/40" : "p-4"
            }`,
          }
        : {
            className: `flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm ${
              featured ? "p-5 ring-2 ring-tfh-gold/40" : "p-4"
            }`,
          })}
    >
      <div className="flex items-start justify-between">
        <div className={`mb-2 h-1 w-8 rounded-full ${accent}`} />
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`font-bold text-tfh-navy ${
          featured ? "mt-1 text-4xl" : "mt-1 text-2xl"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      {clickable && (
        <p className="mt-2 text-xs font-semibold text-tfh-blue opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          View records →
        </p>
      )}
    </Tag>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

interface StatusPillProps {
  label: string;
  count: number;
  color: string;
  note?: string;
}

function StatusPill({ label, count, color, note }: StatusPillProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold text-tfh-navy">{count.toLocaleString()}</span>
      {note && <span className="text-xs italic text-gray-400">{note}</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LifecycleSummaryCardsProps {
  metrics: LifecycleMetrics;
  /**
   * Called when a clickable KPI card is activated.
   * Receives the filter set to apply and navigates to the Records section.
   * Pass undefined to disable all click behaviour (embed / read-only mode).
   */
  onKpiClick?: (filter: Partial<PermitFilters>) => void;
}

export default function LifecycleSummaryCards({
  metrics,
  onKpiClick,
}: LifecycleSummaryCardsProps) {
  const avgLabel =
    metrics.averageDaysToIssue !== null
      ? `${metrics.averageDaysToIssue} days`
      : "No data";

  const medianSub =
    metrics.medianDaysToIssue !== null
      ? `Median: ${metrics.medianDaysToIssue} days`
      : undefined;

  return (
    <div className="space-y-3">
      {/* ── 4 KPI metric cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Applications Received */}
        <KpiCard
          label="Applications Received"
          value={metrics.applicationsReceived.toLocaleString()}
          sub="Source: Date Opened"
          accent="bg-tfh-blue"
          icon={<FileText className="h-4 w-4" />}
          clickable={!!onKpiClick}
          onClick={() => onKpiClick?.({})}
        />

        {/* Permits Issued */}
        <KpiCard
          label="Permits Issued"
          value={metrics.permitsIssued.toLocaleString()}
          sub="Source: Date Issued"
          accent="bg-tfh-blue-btn"
          icon={<CheckCircle2 className="h-4 w-4" />}
          clickable={!!onKpiClick}
          onClick={() => onKpiClick?.({})}
        />

        {/* Avg Days to Issue — featured card */}
        <KpiCard
          label="Avg Days to Issue"
          value={avgLabel}
          sub={medianSub}
          accent="bg-tfh-gold"
          icon={<Clock className="h-4 w-4" />}
          featured
          clickable={!!onKpiClick}
          onClick={() => onKpiClick?.({})}
        />

        {/* Units Approved — filters to dwellingImpact=added */}
        <KpiCard
          label="Units Approved"
          value={metrics.unitsApproved.toLocaleString()}
          sub="Dwelling units impact: Added/Gained"
          accent="bg-green-400"
          icon={<TrendingUp className="h-4 w-4" />}
          clickable={!!onKpiClick}
          onClick={() => onKpiClick?.({ dwellingImpact: "added" })}
        />
      </div>

      {/* ── Lifecycle status row ── */}
      <div className="flex flex-wrap items-start gap-2">
        <span className="self-center text-xs font-semibold uppercase tracking-wide text-gray-500">
          Status buckets
        </span>
        <StatusPill
          label="Issued"
          count={metrics.permitsIssued}
          color="bg-tfh-blue"
        />
        <StatusPill
          label="In Progress"
          count={metrics.inProgress}
          color="bg-amber-400"
          note="has applicationDate, no issueDate"
        />
        <StatusPill
          label="Pending Client"
          count={metrics.pendingClient}
          color="bg-gray-300"
          note="not in current CKAN feed"
        />
        <div className="self-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Total Valuation:{" "}
          <span className="font-semibold text-tfh-navy">
            {formatCurrency(metrics.totalValuation)}
          </span>
        </div>
      </div>
    </div>
  );
}
