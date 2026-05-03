"use client";

import Papa from "papaparse";
import { useMemo, useState } from "react";
import PermitCard from "@/components/PermitCard";
import type { Permit } from "@/lib/types";

type SortKey =
  | "address"
  | "permitType"
  | "status"
  | "issuedDate"
  | "value"
  | "neighborhood"
  | "zipCode";

interface PermitTableProps {
  permits: Permit[];
  loading?: boolean;
  selectedPermit?: Permit | null;
  onSelectPermit: (permit: Permit) => void;
  onClearFilters: () => void;
}

const pageSize = 25;

const columns: Array<{ label: string; key: SortKey; align?: "right" }> = [
  { label: "Address", key: "address" },
  { label: "Type", key: "permitType" },
  { label: "Status", key: "status" },
  { label: "Issued Date", key: "issuedDate" },
  { label: "Value", key: "value", align: "right" },
  { label: "Neighborhood", key: "neighborhood" },
  { label: "ZIP", key: "zipCode" },
];

const statusClassName = {
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
  selectedPermit,
  onSelectPermit,
  onClearFilters,
}: PermitTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("issuedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sortedPermits = useMemo(() => {
    return [...permits].sort((a, b) => {
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue));

      return sortDirection === "asc" ? result : -result;
    });
  }, [permits, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sortedPermits.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visiblePermits = sortedPermits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function updateSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function exportCsv() {
    const csv = Papa.unparse(
      permits.map((permit) => ({
        id: permit.id,
        address: permit.address,
        type: permit.permitType,
        status: permit.status,
        issuedDate: permit.issuedDate,
        expirationDate: permit.expirationDate ?? "",
        value: permit.value ?? "",
        neighborhood: permit.neighborhood,
        zipCode: permit.zipCode,
        contractor: permit.contractor ?? "",
        owner: permit.owner ?? "",
        description: permit.description ?? "",
        latitude: permit.lat,
        longitude: permit.lng,
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `permits-export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const skeletonRows = Array.from({ length: 8 });

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Permit Records</h2>
          <span className="text-xs text-zinc-500">
            Page {currentPage} of {pageCount}
          </span>
        </div>
        <button
          type="button"
          disabled={loading || permits.length === 0}
          onClick={exportCsv}
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-green-500 hover:enabled:text-green-400"
        >
          Export CSV
        </button>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-950/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => updateSort(column.key)}
                    className="inline-flex items-center gap-1 hover:text-green-400"
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      <span>{sortDirection === "asc" ? "^" : "v"}</span>
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading
              ? skeletonRows.map((_, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && visiblePermits.map((permit) => (
              <tr
                key={permit.id}
                onClick={() => onSelectPermit(permit)}
                className={`cursor-pointer transition hover:bg-zinc-800/70 ${
                  selectedPermit?.id === permit.id ? "bg-green-500/10" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-zinc-100">
                  {permit.address}
                </td>
                <td className="px-4 py-3 capitalize text-zinc-400">
                  {formatLabel(permit.permitType)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusClassName[permit.status]}`}
                  >
                    {permit.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{permit.issuedDate || "-"}</td>
                <td className="px-4 py-3 text-right text-zinc-400">
                  {formatCurrency(permit.value)}
                </td>
                <td className="px-4 py-3 text-zinc-400">{permit.neighborhood}</td>
                <td className="px-4 py-3 text-zinc-400">{permit.zipCode}</td>
              </tr>
            ))}
            {!loading && visiblePermits.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={7}>
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
      <div className="grid gap-3 p-4 md:hidden">
        {loading
          ? skeletonRows.slice(0, 4).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg bg-zinc-800"
              />
            ))
          : null}
        {!loading && visiblePermits.map((permit) => (
          <PermitCard
            key={permit.id}
            permit={permit}
            selected={selectedPermit?.id === permit.id}
            onClick={() => onSelectPermit(permit)}
          />
        ))}
        {!loading && visiblePermits.length === 0 ? (
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
      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-sm">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="rounded-md border border-zinc-700 px-3 py-2 font-medium text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-green-500 hover:enabled:text-green-400"
        >
          Prev
        </button>
        <span className="text-zinc-500">
          {sortedPermits.length.toLocaleString()} permits
        </span>
        <button
          type="button"
          disabled={currentPage === pageCount}
          onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          className="rounded-md border border-zinc-700 px-3 py-2 font-medium text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-green-500 hover:enabled:text-green-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}
