"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import DataStatusBanner from "@/components/DataStatus";
import EmbedFilters from "@/components/EmbedFilters";
import StatBar from "@/components/StatBar";
import { PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import type {
  DataStatus,
  Permit,
  PermitFilters,
  PermitSummary,
} from "@/lib/types";

const PermitTable = dynamic(() => import("@/components/PermitTable"), {
  loading: () => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="h-5 w-36 animate-pulse rounded bg-zinc-800" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-zinc-800/80" />
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

interface EmbedClientProps {
  initialPermits: Permit[];
  initialTotal: number;
  summary: PermitSummary;
  initialDataStatus: DataStatus;
}

export default function EmbedClient({
  initialPermits,
  initialTotal,
  summary,
  initialDataStatus,
}: EmbedClientProps) {
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

  return (
    <div className="flex flex-col gap-3 bg-zinc-950 p-3 text-zinc-100">
      {/* Compact header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-green-500">
            Together For Homes
          </span>
          <span className="text-zinc-700">·</span>
          <h1 className="text-sm font-semibold text-white">
            Milwaukee Permit Dashboard
          </h1>
        </div>
        <span className="text-xs text-zinc-500">
          {loading
            ? "Loading…"
            : `${total.toLocaleString()} ${isFiltered ? "matching" : "total"} permits`}
        </span>
      </header>

      {/* Summary stats */}
      <StatBar summary={summary} />

      {/* Inline filters */}
      <EmbedFilters
        filters={filters}
        onChange={setFilters}
        statusOptions={summary.statusOptions}
      />

      {/* Table — full width, no map */}
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

      {/* Compact data status footer */}
      <DataStatusBanner status={initialDataStatus} />
    </div>
  );
}
