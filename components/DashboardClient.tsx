"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import DataStatusBanner from "@/components/DataStatus";
import FilterSidebar from "@/components/FilterSidebar";
import StatBar from "@/components/StatBar";
import type {
  DataStatus,
  Permit,
  PermitFilters,
  PermitSummary,
} from "@/lib/types";

const PermitMap = dynamic(() => import("@/components/PermitMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-zinc-400">
      Loading map…
    </div>
  ),
});

const PermitTable = dynamic(() => import("@/components/PermitTable"), {
  loading: () => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="h-5 w-36 animate-pulse rounded bg-zinc-800" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-zinc-800/80" />
        ))}
      </div>
    </div>
  ),
});

const PAGE_SIZE = 25;

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
    Math.max(1, Math.ceil(initialTotal / PAGE_SIZE)),
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
        const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) });
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
    // On mount with no filters, initial server data is already set — skip first fetch
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b border-zinc-800 pb-5">
          <p className="text-sm font-medium uppercase tracking-wide text-green-500">
            Together For Homes Coalition
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">
                Milwaukee Permit Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Public permit activity across Milwaukee, sourced live from the
                City of Milwaukee Open Data portal.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              {loading
                ? "Loading…"
                : `${total.toLocaleString()} ${isFiltered ? "matching" : "total"} permits`}
            </div>
          </div>
        </header>

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
    </main>
  );
}
