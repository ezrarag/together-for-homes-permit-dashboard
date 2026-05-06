"use client";

import { useState, type ChangeEvent } from "react";
import type { PermitFilters, PermitType } from "@/lib/types";

const permitTypeOptions: Array<{ label: string; value: PermitType | "all" }> = [
  { label: "All Types", value: "all" },
  { label: "New Construction", value: "new_construction" },
  { label: "Renovation", value: "renovation" },
  { label: "Demolition", value: "demolition" },
  { label: "Electrical", value: "electrical" },
  { label: "Plumbing", value: "plumbing" },
  { label: "Mechanical", value: "mechanical" },
  { label: "Other", value: "other" },
];

interface ReportSlicersProps {
  filters: PermitFilters;
  onChange: (filters: PermitFilters) => void;
  statusOptions: string[];
}

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-tfh-blue focus:ring-1 focus:ring-tfh-blue";

const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

/**
 * Horizontal Power BI-style slicer bar for the main report page.
 * Collapses to a single "Filters" button on mobile.
 */
export default function ReportSlicers({
  filters,
  onChange,
  statusOptions,
}: ReportSlicersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "" && v !== "all",
  );

  function update(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value || undefined });
  }

  const activeCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== "" && v !== "all",
  ).length;

  // ── Inline slicer controls (shared between desktop bar and mobile drawer) ──
  const controls = (
    <div className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <label className="flex min-w-[160px] flex-1 flex-col">
        <span className={labelCls}>Search</span>
        <input
          name="search"
          value={filters.search ?? ""}
          onChange={update}
          className={inputCls}
          placeholder="Address, use of building…"
        />
      </label>

      {/* Permit Type */}
      <label className="flex min-w-[150px] flex-1 flex-col">
        <span className={labelCls}>Permit Type</span>
        <select
          name="type"
          value={filters.type ?? "all"}
          onChange={update}
          className={inputCls}
        >
          {permitTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {/* Status */}
      {statusOptions.length > 0 && (
        <label className="flex min-w-[120px] flex-1 flex-col">
          <span className={labelCls}>Status</span>
          <select
            name="status"
            value={filters.status ?? ""}
            onChange={update}
            className={inputCls}
          >
            <option value="">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* ZIP */}
      <label className="flex w-24 flex-col">
        <span className={labelCls}>ZIP</span>
        <input
          name="zipCode"
          value={filters.zipCode ?? ""}
          onChange={update}
          className={inputCls}
          placeholder="53204"
          inputMode="numeric"
          maxLength={5}
        />
      </label>

      {/* Date range */}
      <label className="flex min-w-[120px] flex-col">
        <span className={labelCls}>From (Issued)</span>
        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom ?? ""}
          onChange={update}
          className={inputCls}
        />
      </label>
      <label className="flex min-w-[120px] flex-col">
        <span className={labelCls}>To</span>
        <input
          type="date"
          name="dateTo"
          value={filters.dateTo ?? ""}
          onChange={update}
          className={inputCls}
        />
      </label>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="self-end rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-tfh-blue hover:text-tfh-blue"
        >
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop horizontal slicer bar ── */}
      <div className="hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:block">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
            Filters
            {activeCount > 0 && (
              <span className="ml-2 rounded-full bg-tfh-blue px-2 py-0.5 text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-xs text-gray-400">
            Charts show all permits · table reflects active filters
          </span>
        </div>
        {controls}
      </div>

      {/* ── Mobile trigger ── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-tfh-navy shadow-sm"
        >
          <span>
            Filters
            {activeCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-tfh-blue text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .707 1.707L13 11.414V20a1 1 0 0 1-1.447.894l-4-2A1 1 0 0 1 7 18v-6.586L3.293 4.707A1 1 0 0 1 3 4Z"
            />
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/40 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white p-5 shadow-2xl">
            <p className="mb-3 text-xs text-gray-400">
              Charts show all permits · table reflects active filters
            </p>
            {controls}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-5 w-full rounded-xl bg-tfh-blue-btn px-4 py-3 text-sm font-bold text-white hover:bg-tfh-blue"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}
