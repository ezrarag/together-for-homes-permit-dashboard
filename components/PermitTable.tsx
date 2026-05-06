"use client";

import { useState } from "react";
import PermitCard from "@/components/PermitCard";
import type { Permit, PermitFilters } from "@/lib/types";

interface PermitTableProps {
  permits: Permit[];
  loading?: boolean;
  page: number;
  pageCount: number;
  total: number;
  selectedPermit?: Permit | null;
  onSelectPermit: (permit: Permit) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  currentFilters: PermitFilters;
}

type SortKey = "address" | "permitType" | "status" | "issuedDate" | "value" | "useOfBuilding";

const columns: Array<{ label: string; key: SortKey; align?: "right" }> = [
  { label: "Address", key: "address" },
  { label: "Type", key: "permitType" },
  { label: "Status", key: "status" },
  { label: "Issued", key: "issuedDate" },
  { label: "Value", key: "value", align: "right" },
  { label: "Use of Building", key: "useOfBuilding" },
];

const statusClassName: Record<Permit["status"], string> = {
  issued: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  open: "border-green-500/30 bg-green-500/10 text-green-400",
  closed: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  expired: "border-red-500/30 bg-red-500/10 text-red-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "-";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function PermitTable({
  permits,
  loading,
  page,
  pageCount,
  total,
  selectedPermit,
  onSelectPermit,
  onPageChange,
  onClearFilters,
  currentFilters,
}: PermitTableProps) {
  const [csvLoading, setCsvLoading] = useState(false);

  async function exportCsv() {
    setCsvLoading(true);
    try {
      const params = new URLSearchParams({ export: "csv" });
      if (currentFilters.type && currentFilters.type !== "all")
        params.set("type", currentFilters.type);
      if (currentFilters.status) params.set("status", currentFilters.status);
      if (currentFilters.zipCode) params.set("zipCode", currentFilters.zipCode);
      if (currentFilters.dateFrom) params.set("dateFrom", currentFilters.dateFrom);
      if (currentFilters.dateTo) params.set("dateTo", currentFilters.dateTo);
      if (currentFilters.search) params.set("search", currentFilters.search);

      const res = await fetch(`/api/permits?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `permits-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setCsvLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Permit Records</h2>
          <span className="text-xs text-zinc-500">
            {total.toLocaleString()} records · page {page} of {pageCount}
          </span>
        </div>
        <button
          type="button"
          disabled={csvLoading || total === 0}
          onClick={exportCsv}
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-green-500 hover:enabled:text-green-400"
        >
          {csvLoading ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-950/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              : permits.map((permit) => (
                  <tr
                    key={permit.id}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedPermit?.id === permit.id}
                    onClick={() => onSelectPermit(permit)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onSelectPermit(permit);
                    }}
                    className={`cursor-pointer transition hover:bg-zinc-800/70 focus:outline-none focus:ring-1 focus:ring-green-500 ${
                      selectedPermit?.id === permit.id ? "bg-green-500/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">
                      {permit.displayAddress || permit.address}
                      {permit.zipCode ? (
                        <span className="ml-2 text-xs text-zinc-500">{permit.zipCode}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize text-zinc-400">
                      {formatLabel(permit.permitType)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName[permit.status]}`}
                      >
                        {permit.rawStatus || permit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{permit.issuedDate || "-"}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {formatCurrency(permit.value)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{permit.useOfBuilding || "-"}</td>
                  </tr>
                ))}
            {!loading && permits.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={6}>
                  <div className="flex flex-col items-center gap-3">
                    <span>No permits match the active filters.</span>
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 hover:border-green-500 hover:text-green-400"
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 p-4 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-zinc-800" />
            ))
          : permits.map((permit) => (
              <PermitCard
                key={permit.id}
                permit={permit}
                selected={selectedPermit?.id === permit.id}
                onClick={() => onSelectPermit(permit)}
              />
            ))}
        {!loading && permits.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-zinc-500">
            <p>No permits match the active filters.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-md border border-zinc-700 px-3 py-2 font-medium text-zinc-300 hover:border-green-500 hover:text-green-400"
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-sm">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-zinc-700 px-3 py-2 font-medium text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-green-500 hover:enabled:text-green-400"
        >
          Prev
        </button>
        <span className="text-zinc-500">
          {total.toLocaleString()} permits
        </span>
        <button
          type="button"
          disabled={page === pageCount || loading}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-zinc-700 px-3 py-2 font-medium text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-green-500 hover:enabled:text-green-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}
