"use client";

import type { DataStatus } from "@/lib/types";

interface DataStatusProps {
  status: DataStatus | null;
  loading?: boolean;
}

export default function DataStatusBanner({ status, loading }: DataStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Fetching live data from Milwaukee Open Data…
      </div>
    );
  }

  if (!status) return null;

  if (status.error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        <span className="font-semibold">Data unavailable:</span> {status.error}
      </div>
    );
  }

  const formattedDate = new Date(status.lastFetched).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-400"
      aria-label="Data status"
    >
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
        <span className="font-medium text-zinc-300">Source:</span>&nbsp;{status.source}
      </span>
      <span>
        <span className="font-medium text-zinc-300">Last fetched:</span>&nbsp;{formattedDate}
      </span>
      <span>
        <span className="font-medium text-zinc-300">Total records:</span>&nbsp;
        {status.totalRecords.toLocaleString()}
      </span>
    </div>
  );
}
