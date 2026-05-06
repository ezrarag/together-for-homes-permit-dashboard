"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import DataStatusBanner from "@/components/DataStatus";
import FilterSidebar from "@/components/FilterSidebar";
import StatBar from "@/components/StatBar";
import { PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import type {
  DataStatus,
  Permit,
  PermitFilters,
  PermitSummary,
} from "@/lib/types";

const PermitMap = dynamic(() => import("@/components/PermitMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-400 shadow-sm">
      Loading map…
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

interface ApiResult {
  permits: Permit[];
  total: number;
  page: number;
  pageCount: number;
}

interface DashboardClientProps {
  initialPermits: Permit[];
  initialTotal: number;
  summary: PermitSummary;
  initialDataStatus: DataStatus;
}

export default function DashboardClient({
  initialPermits,
  initialTotal,
  summary,
  initialDataStatus,
}: DashboardClientProps) {
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
        if (nextFilters.status) params.set("status", nextFilters.status);
        if (nextFilters.zipCode) params.set("zipCode", nextFilters.zipCode);
        if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
        if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);
        if (nextFilters.search) params.set("search", nextFilters.search);

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

  // Reset to page 1 and fetch when filters change
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

  function handleFiltersChange(next: PermitFilters) {
    setFilters(next);
  }

  return (
    <main className="min-h-screen font-sans">
      {/* ── Gold campaign header band ── */}
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
                Track how permit activity reflects housing production,
                implementation progress, and neighborhood-level change.
              </p>
            </div>
            <p className="text-sm font-medium text-tfh-navy/60">
              {loading
                ? "Loading…"
                : `${total.toLocaleString()} ${isFiltered ? "matching" : "total"} permits`}
            </p>
          </div>
        </div>
      </div>

      {/* ── White content panel — floats over gold band ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-8 min-h-[80vh] rounded-t-[28px] bg-white px-4 py-6 shadow-xl sm:px-6">
          <div className="flex flex-col gap-5">
            <DataStatusBanner status={initialDataStatus} />

            <StatBar summary={summary} />

            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <FilterSidebar
                filters={filters}
                onChange={handleFiltersChange}
                statusOptions={summary.statusOptions}
              />
              <section className="flex flex-col gap-5">
                <PermitMap
                  permits={permits}
                  loading={loading}
                  selectedPermit={selectedPermit}
                  onSelectPermit={setSelectedPermit}
                />
                <PermitTable
                  permits={permits}
                  loading={loading}
                  page={page}
                  pageCount={pageCount}
                  total={total}
                  selectedPermit={selectedPermit}
                  onSelectPermit={setSelectedPermit}
                  onPageChange={handlePageChange}
                  onClearFilters={() => handleFiltersChange({})}
                  currentFilters={filters}
                />
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
