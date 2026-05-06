"use client";

import type { DataStatus } from "@/lib/types";

interface DataStatusProps {
  status: DataStatus | null;
}

function formatDateTime(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DataStatusBanner({ status }: DataStatusProps) {
  if (!status) return null;

  if (status.error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        <span className="font-semibold">Data unavailable:</span> {status.error}
      </div>
    );
  }

  const sourceLastModified = formatDateTime(status.sourceLastModified);
  const appLastChecked = formatDateTime(status.appLastChecked);
  const fullyLoaded = status.loadedRecords >= status.totalRecords;

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-400"
      aria-label="Data status"
    >
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
        <span className="font-medium text-zinc-300">Source:</span>&nbsp;{status.source}
      </span>
      {sourceLastModified ? (
        <span>
          <span className="font-medium text-zinc-300">Source updated:</span>
          &nbsp;{sourceLastModified}
        </span>
      ) : null}
      {appLastChecked ? (
        <span>
          <span className="font-medium text-zinc-300">Generated:</span>
          &nbsp;{appLastChecked}
        </span>
      ) : null}
      <span>
        <span className="font-medium text-zinc-300">Records:</span>&nbsp;
        {status.loadedRecords.toLocaleString()} of{" "}
        {status.totalRecords.toLocaleString()} loaded
        {!fullyLoaded ? (
          <span className="ml-1 text-amber-400">(partial)</span>
        ) : null}
      </span>
    </div>
  );
}
