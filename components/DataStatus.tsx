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

function formatDateOnly(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DataStatusBanner({ status }: DataStatusProps) {
  if (!status) return null;

  if (status.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <span className="font-semibold">Data unavailable:</span> {status.error}
      </div>
    );
  }

  const sourceLastModified = formatDateTime(status.sourceLastModified);
  const appLastChecked = formatDateTime(status.appLastChecked);
  const latestApplicationDate = formatDateOnly(status.latestApplicationDate);
  const latestIssueDate = formatDateOnly(status.latestIssueDate);
  const fullyLoaded = status.loadedRecords >= status.totalRecords;

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-xs text-gray-600"
      aria-label="Data status"
    >
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="font-semibold text-tfh-navy">Source:</span>
        &nbsp;{status.source}
      </span>
      {sourceLastModified ? (
        <span>
          <span className="font-semibold text-tfh-navy">Source updated:</span>
          &nbsp;{sourceLastModified}
        </span>
      ) : null}
      {appLastChecked ? (
        <span>
          <span className="font-semibold text-tfh-navy">Generated:</span>
          &nbsp;{appLastChecked}
        </span>
      ) : null}
      {latestApplicationDate ? (
        <span>
          <span className="font-semibold text-tfh-navy">Latest Date Opened:</span>
          &nbsp;{latestApplicationDate}
        </span>
      ) : null}
      {latestIssueDate ? (
        <span>
          <span className="font-semibold text-tfh-navy">Latest Date Issued:</span>
          &nbsp;{latestIssueDate}
        </span>
      ) : null}
      <span>
        <span className="font-semibold text-tfh-navy">Records:</span>&nbsp;
        {status.loadedRecords.toLocaleString()} of{" "}
        {status.totalRecords.toLocaleString()} loaded
        {!fullyLoaded ? (
          <span className="ml-1 text-amber-600">(partial)</span>
        ) : null}
      </span>
    </div>
  );
}
