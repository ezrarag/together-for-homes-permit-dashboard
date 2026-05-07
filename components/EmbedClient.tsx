"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import DataStatusBanner from "@/components/DataStatus";
import EmbedFilters from "@/components/EmbedFilters";
import ReportHub from "@/components/ReportHub";
import StatBar from "@/components/StatBar";
import { PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import type {
  DataStatus,
  Permit,
  PermitFilters,
  PermitSummary,
  ReportSection,
  SectionKey,
} from "@/lib/types";

// ── Dynamic imports ───────────────────────────────────────────────────────────

const SectionView = dynamic(() => import("@/components/SectionView"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-44 rounded-xl bg-gray-100" />)}
      </div>
    </div>
  ),
});

const PermitTable = dynamic(() => import("@/components/PermitTable"), {
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  ),
});

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem {
  section: ReportSection;
  label: string;
  accentColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { section: "hub", label: "Hub", accentColor: "#9ca3af" },
  { section: "residential", label: "Residential", accentColor: "#019cf2" },
  { section: "multi_family", label: "Multi-Family", accentColor: "#f0a41a" },
  { section: "commercial", label: "Commercial", accentColor: "#00304c" },
  { section: "units", label: "Units", accentColor: "#10b981" },
  { section: "records", label: "Records", accentColor: "#6b7280" },
];

const SECTION_KEYS = new Set<ReportSection>(["residential", "multi_family", "commercial", "units"]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiResult {
  permits: Permit[];
  total: number;
  page: number;
  pageCount: number;
}

interface EmbedClientProps {
  initialPermits: Permit[];
  initialTotal: number;
  summary: PermitSummary;
  initialDataStatus: DataStatus;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmbedClient({
  initialPermits,
  initialTotal,
  summary,
  initialDataStatus,
}: EmbedClientProps) {
  const [section, setSection] = useState<ReportSection>("hub");

  // Records-section state
  const [filters, setFilters] = useState<PermitFilters>({});
  const [page, setPage] = useState(1);
  const [permits, setPermits] = useState<Permit[]>(initialPermits);
  const [total, setTotal] = useState(initialTotal);
  const [pageCount, setPageCount] = useState(
    Math.max(1, Math.ceil(initialTotal / PERMIT_PAGE_SIZE)),
  );
  const [loading, setLoading] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

  const isFiltered = useMemo(
    () =>
      Object.values(filters).some(
        (v) => v !== undefined && v !== "" && v !== "all",
      ),
    [filters],
  );

  const fetchPage = useCallback(
    async (nextFilters: PermitFilters, nextPage: number) => {
      setLoading(true);
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
        setLoading(false);
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

  return (
    <div className="flex flex-col gap-3 bg-[#f0f4f8] p-3 font-sans">

      {/* ── Compact brand header ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-tfh-gold/40 bg-tfh-gold/10 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-tfh-navy/60">
            Together For Homes
          </span>
          <span className="text-gray-300">·</span>
          <h1 className="text-sm font-bold text-tfh-navy">
            Milwaukee Permit Dashboard
          </h1>
        </div>
        {section === "records" && (
          <span className="text-xs text-gray-500">
            {loading
              ? "Loading…"
              : `${total.toLocaleString()} ${isFiltered ? "matching" : "total"} permits`}
          </span>
        )}
      </header>

      {/* ── KPI row (compact 4-stat) ─────────────────────────────────────── */}
      <StatBar summary={summary} compact />

      {/* ── Section nav tabs ─────────────────────────────────────────────── */}
      <nav
        className="scrollbar-none -mx-0.5 flex items-center gap-1 overflow-x-auto px-0.5"
        aria-label="Report sections"
      >
        {NAV_ITEMS.map((item) => {
          const active = section === item.section;
          return (
            <button
              key={item.section}
              type="button"
              onClick={() => setSection(item.section)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tfh-blue ${
                active
                  ? "text-white shadow-sm"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              style={active ? { backgroundColor: item.accentColor } : undefined}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Hub ──────────────────────────────────────────────────────────── */}
      {section === "hub" && (
        <ReportHub summary={summary} onNavigate={setSection} />
      )}

      {/* ── Category section views ────────────────────────────────────────── */}
      {isSectionView && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <SectionView section={section as SectionKey} />
        </div>
      )}

      {/* ── Records ──────────────────────────────────────────────────────── */}
      {section === "records" && (
        <>
          {/* Inline filters */}
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-tfh-navy">
              Filters
            </p>
            <EmbedFilters
              filters={filters}
              onChange={setFilters}
              statusOptions={summary.statusOptions}
            />
          </div>

          {/* Permit table */}
          <PermitTable
            permits={permits}
            loading={loading}
            page={page}
            pageCount={pageCount}
            total={total}
            selectedPermit={selectedPermit}
            onSelectPermit={setSelectedPermit}
            onPageChange={handlePageChange}
            onClearFilters={() => setFilters({})}
            currentFilters={filters}
          />
        </>
      )}

      {/* ── Data provenance footer ────────────────────────────────────────── */}
      <DataStatusBanner status={initialDataStatus} />
    </div>
  );
}
