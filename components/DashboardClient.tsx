"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import DataStatusBanner from "@/components/DataStatus";
import LifecycleSummaryCards from "@/components/LifecycleSummaryCards";
import MethodologyNote from "@/components/MethodologyNote";
import ReportHub from "@/components/ReportHub";
import ReportSlicers from "@/components/ReportSlicers";
import StatBar from "@/components/StatBar";
import TimeWindowToggle from "@/components/TimeWindowToggle";
import type { LifecycleMetrics } from "@/lib/lifecycle-metrics";
import { PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import type {
  DataStatus,
  Permit,
  PermitFilters,
  PermitSummary,
  ReportSection,
  SectionKey,
  TimeWindow,
} from "@/lib/types";

// ── Dynamic imports (recharts + heavy components) ─────────────────────────────

const PermitBarChart = dynamic(() => import("@/components/PermitBarChart"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-gray-100" />,
});

const SubmittedVsIssuedChart = dynamic(
  () => import("@/components/SubmittedVsIssuedChart"),
  {
    ssr: false,
    loading: () => <div className="h-56 animate-pulse rounded-xl bg-gray-100" />,
  },
);

const AverageDaysChart = dynamic(() => import("@/components/AverageDaysChart"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-xl bg-gray-100" />,
});

const ReportCharts = dynamic(() => import("@/components/ReportCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid animate-pulse gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-64 rounded-xl bg-gray-100" />
      ))}
    </div>
  ),
});

const SectionView = dynamic(() => import("@/components/SectionView"), {
  ssr: false,
  loading: () => (
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
  ),
});

const PermitTable = dynamic(() => import("@/components/PermitTable"), {
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  ),
});

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem {
  section: ReportSection;
  label: string;
  shortLabel: string;
  accentColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { section: "hub", label: "Lifecycle Hub", shortLabel: "Hub", accentColor: "#00304c" },
  { section: "residential", label: "Residential", shortLabel: "Residential", accentColor: "#019cf2" },
  { section: "multi_family", label: "Multi-Family", shortLabel: "Multi-Fam", accentColor: "#f0a41a" },
  { section: "commercial", label: "Commercial", shortLabel: "Commercial", accentColor: "#00304c" },
  { section: "units", label: "Units Impact", shortLabel: "Units", accentColor: "#10b981" },
  { section: "records", label: "All Records", shortLabel: "Records", accentColor: "#6b7280" },
];

const SECTION_KEYS = new Set<ReportSection>(["residential", "multi_family", "commercial", "units"]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiResult {
  permits: Permit[];
  total: number;
  page: number;
  pageCount: number;
  lifecycle: LifecycleMetrics;
}

interface DashboardClientProps {
  initialPermits: Permit[];
  initialTotal: number;
  summary: PermitSummary;
  initialLifecycle: LifecycleMetrics;
  initialDataStatus: DataStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardClient({
  initialPermits,
  initialTotal,
  summary,
  initialLifecycle,
  initialDataStatus,
}: DashboardClientProps) {
  // Report navigation
  const [section, setSection] = useState<ReportSection>("hub");

  // Lifecycle tracking state
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("12m");
  const [lifecycle, setLifecycle] = useState<LifecycleMetrics>(initialLifecycle);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

  // Records-section pagination + filter state
  const [filters, setFilters] = useState<PermitFilters>({});
  const [page, setPage] = useState(1);
  const [permits, setPermits] = useState<Permit[]>(initialPermits);
  const [total, setTotal] = useState(initialTotal);
  const [pageCount, setPageCount] = useState(
    Math.max(1, Math.ceil(initialTotal / PERMIT_PAGE_SIZE)),
  );
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

  const isFiltered = useMemo(
    () =>
      Object.values(filters).some(
        (v) => v !== undefined && v !== "" && v !== "all",
      ),
    [filters],
  );

  // ── Fetch lifecycle metrics for a new time window ─────────────────────────

  const fetchLifecycle = useCallback(async (window: TimeWindow) => {
    setLifecycleLoading(true);
    try {
      const params = new URLSearchParams({ limit: "1", timeWindow: window });
      const res = await fetch(`/api/permits?${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json() as { lifecycle: LifecycleMetrics };
      if (data.lifecycle) setLifecycle(data.lifecycle);
    } catch {
      // keep previous metrics on error
    } finally {
      setLifecycleLoading(false);
    }
  }, []);

  useEffect(() => {
    // "12m" is the initial server-rendered default — no refetch needed
    if (timeWindow === "12m") return;
    fetchLifecycle(timeWindow);
  }, [timeWindow, fetchLifecycle]);

  // ── Fetch paginated records (Records section) ─────────────────────────────

  const fetchPage = useCallback(
    async (nextFilters: PermitFilters, nextPage: number) => {
      setTableLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PERMIT_PAGE_SIZE),
        });
        if (nextFilters.type && nextFilters.type !== "all")
          params.set("type", nextFilters.type);
        if (nextFilters.projectCategory && nextFilters.projectCategory !== "all")
          params.set("projectCategory", nextFilters.projectCategory);
        if (nextFilters.status) params.set("status", nextFilters.status);
        if (nextFilters.zipCode) params.set("zipCode", nextFilters.zipCode);
        if (nextFilters.dateBasis) params.set("dateBasis", nextFilters.dateBasis);
        if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
        if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);
        if (nextFilters.search) params.set("search", nextFilters.search);
        if (nextFilters.useOfBuilding) params.set("useOfBuilding", nextFilters.useOfBuilding);

        const res = await fetch(`/api/permits?${params}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: ApiResult = await res.json();
        setPermits(data.permits);
        setTotal(data.total);
        setPageCount(data.pageCount);
        setPage(data.page);
      } catch {
        // keep previous results on error
      } finally {
        setTableLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isFiltered && page === 1) return;
    fetchPage(filters, 1);
    setPage(1);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePageChange(next: number) {
    const target = Math.max(1, Math.min(pageCount, next));
    setPage(target);
    fetchPage(filters, target);
  }

  const isSectionView = SECTION_KEYS.has(section);

  // ── Label for time window context ─────────────────────────────────────────

  const windowLabel =
    timeWindow === "30"
      ? "Last 30 Days"
      : timeWindow === "90"
        ? "Last 90 Days"
        : "Last 12 Months";

  return (
    <main className="min-h-screen font-sans">
      {/* ── Gold campaign header band ────────────────────────────────────── */}
      <div className="bg-tfh-gold pb-16 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-tfh-navy/60">
            Together For Homes Coalition
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wide text-tfh-navy sm:text-4xl">
                Milwaukee Permit Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tfh-navy/75">
                Permit lifecycle tracking — application-to-issuance timing,
                housing production metrics, and advocacy analytics.
              </p>
            </div>
            {section === "records" && (
              <p className="text-sm font-medium text-tfh-navy/60">
                {tableLoading
                  ? "Loading…"
                  : `${total.toLocaleString()} ${isFiltered ? "matching" : "total"} permits`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── White report panel ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-8 min-h-[80vh] rounded-t-[28px] bg-white px-4 py-6 shadow-xl sm:px-6">
          <div className="flex flex-col gap-5">

            {/* Data provenance */}
            <DataStatusBanner status={initialDataStatus} />

            {/* KPI summary bar (always visible) */}
            <StatBar summary={summary} />

            {/* ── Section navigation tabs ──────────────────────────────── */}
            <nav
              className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1"
              aria-label="Report sections"
            >
              {NAV_ITEMS.map((item) => {
                const active = section === item.section;
                return (
                  <button
                    key={item.section}
                    onClick={() => setSection(item.section)}
                    className={`flex-shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tfh-blue ${
                      active
                        ? "text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                    }`}
                    style={active ? { backgroundColor: item.accentColor } : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* ════════════════════════════════════════════════════════════
                HUB — Lifecycle tracking + Report Hub cards
            ════════════════════════════════════════════════════════════ */}
            {section === "hub" && (
              <>
                {/* ── Lifecycle analytics header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
                      Permit Lifecycle Analytics
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Application-to-issuance timing · {windowLabel}
                    </p>
                  </div>
                  <TimeWindowToggle
                    value={timeWindow}
                    onChange={setTimeWindow}
                    loading={lifecycleLoading}
                  />
                </div>

                {/* ── 4 advocacy KPI cards (avg days featured) ── */}
                <LifecycleSummaryCards metrics={lifecycle} />

                {/* ── Permit volume by category (Bend-style bar chart) ── */}
                <PermitBarChart metrics={lifecycle} />

                {/* ── Trend charts ── */}
                <div className="grid gap-5 lg:grid-cols-2">
                  <SubmittedVsIssuedChart data={lifecycle.monthly} />
                  <AverageDaysChart
                    data={lifecycle.monthly}
                    overallAvg={lifecycle.averageDaysToIssue}
                  />
                </div>

                {/* ── Methodology disclosure ── */}
                <MethodologyNote />

                {/* Separator */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs text-gray-400">Report Sections</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* ── Report Hub cards (drill-in navigation) ── */}
                <ReportHub summary={summary} onNavigate={setSection} />

                {/* ── Full portfolio overview charts ── */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
                      Portfolio Overview
                    </h2>
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-xs text-gray-400">Full dataset · all permit types</span>
                  </div>
                  <ReportCharts summary={summary} />
                </div>
              </>
            )}

            {/* ════════════════════════════════════════════════════════════
                Category section drill-in views
            ════════════════════════════════════════════════════════════ */}
            {isSectionView && (
              <SectionView section={section as SectionKey} />
            )}

            {/* ════════════════════════════════════════════════════════════
                All Records — filters + paginated table
            ════════════════════════════════════════════════════════════ */}
            {section === "records" && (
              <>
                <ReportSlicers
                  filters={filters}
                  onChange={setFilters}
                  statusOptions={summary.statusOptions}
                />

                <section>
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-tfh-navy">
                    Permit Records
                    {isFiltered && (
                      <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">
                        — filtered view
                      </span>
                    )}
                  </h2>
                  <PermitTable
                    permits={permits}
                    loading={tableLoading}
                    page={page}
                    pageCount={pageCount}
                    total={total}
                    selectedPermit={selectedPermit}
                    onSelectPermit={setSelectedPermit}
                    onPageChange={handlePageChange}
                    onClearFilters={() => setFilters({})}
                    currentFilters={filters}
                  />
                </section>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
