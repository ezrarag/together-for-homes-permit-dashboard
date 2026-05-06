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
  issued: "bg-blue-100 text-tfh-blue-btn border border-blue-200",
  open: "bg-green-100 text-green-700 border border-green-200",
  closed: "bg-gray-100 text-gray-500 border border-gray-200",
  expired: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
};

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "–";
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

  const pageBtnCls =
    "rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-tfh-blue hover:enabled:text-tfh-blue";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header row */}
      <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
            Permit Records
          </h2>
          <span className="text-xs text-gray-400">
            {total.toLocaleString()} records · page {page} of {pageCount}
          </span>
        </div>
        <button
          type="button"
          disabled={csvLoading || total === 0}
          onClick={exportCsv}
          className="self-start rounded-lg bg-tfh-blue-btn px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-tfh-blue sm:self-auto"
        >
          {csvLoading ? "Exporting…" : "↓ Export CSV"}
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-tfh-navy">
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
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-gray-200" />
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
                    className={`cursor-pointer transition hover:bg-blue-50/50 focus:outline-none focus:ring-1 focus:ring-tfh-blue ${
                      selectedPermit?.id === permit.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-tfh-navy">
                      {permit.displayAddress || permit.address}
                      {permit.zipCode ? (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {permit.zipCode}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {formatLabel(permit.permitType)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[permit.status]}`}
                      >
                        {permit.rawStatus || permit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {permit.issuedDate || "–"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatCurrency(permit.value)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {permit.useOfBuilding || "–"}
                    </td>
                  </tr>
                ))}
            {!loading && permits.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={6}>
                  <div className="flex flex-col items-center gap-3">
                    <p>No permits match the active filters.</p>
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-tfh-blue hover:text-tfh-blue"
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
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
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
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-gray-500">
            <p>No permits match the active filters.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-600 hover:border-tfh-blue hover:text-tfh-blue"
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className={pageBtnCls}
        >
          ← Prev
        </button>
        <span className="text-xs text-gray-400">
          {total.toLocaleString()} permits
        </span>
        <button
          type="button"
          disabled={page === pageCount || loading}
          onClick={() => onPageChange(page + 1)}
          className={pageBtnCls}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
