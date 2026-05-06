"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import DataStatusBanner from "@/components/DataStatus";
import FilterSidebar from "@/components/FilterSidebar";
import StatBar from "@/components/StatBar";
import { fetchMilwaukeePermits } from "@/lib/milwaukee-open-data";
import { filterPermits } from "@/lib/permits";
import type { DataStatus, Permit, PermitFilters } from "@/lib/types";

const PermitMap = dynamic(() => import("@/components/PermitMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-zinc-400 md:h-[420px]">
      Loading map…
    </div>
  ),
});

const PermitTable = dynamic(() => import("@/components/PermitTable"), {
  loading: () => (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="h-5 w-36 animate-pulse rounded bg-zinc-800" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-md bg-zinc-800/80"
          />
        ))}
      </div>
    </div>
  ),
});

export default function DashboardClient() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [filters, setFilters] = useState<PermitFilters>({});
  const [loading, setLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPermits() {
      try {
        const { permits: livePermits, dataStatus: status } =
          await fetchMilwaukeePermits();
        if (isMounted) {
          setPermits(livePermits);
          setDataStatus(status);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          setDataStatus({
            source: "Milwaukee Open Data – Building Permits",
            resourceId: "828e9630-d7cb-42e4-960e-964eae916397",
            lastFetched: new Date().toISOString(),
            totalRecords: 0,
            error: message,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPermits();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(
    () => filterPermits(permits, filters),
    [permits, filters],
  );

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
                ? "Refreshing data…"
                : `${filtered.length.toLocaleString()} shown`}
            </div>
          </div>
        </header>

        <DataStatusBanner status={dataStatus} loading={loading} />

        <StatBar permits={filtered} />

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <FilterSidebar filters={filters} onChange={setFilters} />
          <section className="flex flex-col gap-5">
            <PermitMap
              permits={filtered}
              loading={loading}
              selectedPermit={selectedPermit}
              onSelectPermit={setSelectedPermit}
            />
            <PermitTable
              permits={filtered}
              loading={loading}
              selectedPermit={selectedPermit}
              onSelectPermit={setSelectedPermit}
              onClearFilters={() => setFilters({})}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
