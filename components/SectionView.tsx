"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { FilteredSummary, MonthlyMetrics, PermitProjectCategory, SectionKey } from "@/lib/types";

// SectionCharts uses recharts — must be client-only
const SectionCharts = dynamic(() => import("@/components/SectionCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid animate-pulse gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-52 rounded-xl bg-gray-100" />
      ))}
    </div>
  ),
});

// ── Section configuration ─────────────────────────────────────────────────────

interface SectionConfig {
  label: string;
  description: string;
  category: PermitProjectCategory | null;
  accentColor: string;
}

const SECTION_CONFIGS: Record<SectionKey, SectionConfig> = {
  residential: {
    label: "Residential (1–2 Unit)",
    description:
      "Single-family homes and duplexes. Tracks new construction, renovations, and other permit activity for 1–2 unit residential buildings.",
    category: "residential_single_duplex",
    accentColor: "#019cf2",
  },
  multi_family: {
    label: "Multi-Family (3+ Units)",
    description:
      "Apartments, condos, townhomes, and other 3+ unit residential buildings. Key indicator of housing production capacity.",
    category: "multi_family",
    accentColor: "#f0a41a",
  },
  commercial: {
    label: "Commercial / Industrial",
    description:
      "Commercial, office, retail, restaurant, warehouse, and industrial buildings. Reflects non-residential construction investment.",
    category: "commercial",
    accentColor: "#00304c",
  },
  units: {
    label: "Permit Unit-Impact Flags",
    description:
      'Permit-count proxy for housing impact. Counts records where "Dwelling units impact" indicates added, lost, or maintained; it does not count numeric housing units.',
    category: null,
    accentColor: "#10b981",
  },
};

// ── API response shape ────────────────────────────────────────────────────────

interface SectionApiResult {
  summary: FilteredSummary;
  monthlyData: MonthlyMetrics[];
  total: number;
}

// ── Lifecycle KPI card ────────────────────────────────────────────────────────

function LifecycleCard({
  stage,
  label,
  value,
  note,
  accentColor,
}: {
  stage: "application" | "issued" | "completed";
  label: string;
  value: string;
  note?: string;
  accentColor: string;
}) {
  const isUnavailable = stage === "completed";

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        isUnavailable ? "border-dashed border-gray-200" : "border-gray-200"
      }`}
    >
      {/* Stage dot + label */}
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: isUnavailable ? "#d1d5db" : accentColor }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </span>
        {isUnavailable && (
          <span className="ml-auto flex-shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
            Not in CKAN
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className={`mt-2 font-bold ${
          isUnavailable
            ? "text-sm font-normal text-gray-400"
            : "text-2xl text-tfh-navy"
        }`}
      >
        {value}
      </p>

      {/* Source note */}
      {note && <p className="mt-0.5 text-xs text-gray-400">{note}</p>}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-4 w-3/4 rounded bg-gray-100" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-52 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface SectionViewProps {
  section: SectionKey;
}

export default function SectionView({ section }: SectionViewProps) {
  const config = SECTION_CONFIGS[section];
  const [data, setData] = useState<SectionApiResult | null>(null);
  const [loadingSection, setLoadingSection] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingSection(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({ limit: "1" });
    if (config.category) params.set("projectCategory", config.category);

    fetch(`/api/permits?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json() as Promise<SectionApiResult>;
      })
      .then((result) => {
        setData(result);
        setLoadingSection(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load section data");
        setLoadingSection(false);
      });
  }, [section, config.category]);

  if (loadingSection) return <SectionSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load section data: {error}
      </div>
    );
  }

  const summary = data?.summary;
  const monthlyData = data?.monthlyData ?? [];

  return (
    <div className="space-y-6">
      {/* Section description */}
      <p className="max-w-3xl text-sm leading-relaxed text-gray-500">{config.description}</p>

      {/* ── Lifecycle KPI cards ──────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          CKAN Archive Overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <LifecycleCard
            stage="application"
            label="Records with Date Opened"
            value={summary ? summary.applicationsReceived.toLocaleString() : "—"}
            note="Source: Date Opened"
            accentColor={config.accentColor}
          />
          <LifecycleCard
            stage="issued"
            label="Permits Issued"
            value={summary ? summary.permitsIssued.toLocaleString() : "—"}
            note="Source: Date Issued"
            accentColor={config.accentColor}
          />
          <LifecycleCard
            stage="completed"
            label="Completed / Occupancy"
            value="Not available in current CKAN feed"
            accentColor={config.accentColor}
          />
        </div>
      </div>

      {/* ── 12-month activity charts ─────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          12-Month Activity
        </h3>
        <SectionCharts data={monthlyData} accentColor={config.accentColor} />
      </div>
    </div>
  );
}
