"use client";

import { useState, type ChangeEvent } from "react";
import type { PermitFilters, PermitType } from "@/lib/types";

const permitTypeOptions: Array<{ label: string; value: PermitType | "all" }> = [
  { label: "All", value: "all" },
  { label: "New Construction", value: "new_construction" },
  { label: "Renovation", value: "renovation" },
  { label: "Demolition", value: "demolition" },
  { label: "Electrical", value: "electrical" },
  { label: "Plumbing", value: "plumbing" },
  { label: "Mechanical", value: "mechanical" },
  { label: "Other", value: "other" },
];

interface FilterSidebarProps {
  filters: PermitFilters;
  onChange: (filters: PermitFilters) => void;
  statusOptions: string[];
}

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-tfh-blue focus:ring-1 focus:ring-tfh-blue";

const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

export default function FilterSidebar({
  filters,
  onChange,
  statusOptions,
}: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "" && v !== "all",
  );

  function updateFilter(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value || undefined });
  }

  function clearFilters() {
    onChange({});
  }

  const controls = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
          Filters
        </h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-tfh-blue hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className={labelCls}>Search</span>
          <input
            name="search"
            value={filters.search ?? ""}
            onChange={updateFilter}
            className={inputCls}
            placeholder="Address, use of building"
          />
        </label>

        <label className="block">
          <span className={labelCls}>Permit Type</span>
          <select
            name="type"
            value={filters.type ?? "all"}
            onChange={updateFilter}
            className={inputCls}
          >
            {permitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>Status</span>
          <select
            name="status"
            value={filters.status ?? ""}
            onChange={updateFilter}
            className={inputCls}
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>ZIP Code</span>
          <input
            name="zipCode"
            value={filters.zipCode ?? ""}
            onChange={updateFilter}
            className={inputCls}
            placeholder="53204"
            inputMode="numeric"
            maxLength={5}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>From</span>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom ?? ""}
              onChange={updateFilter}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>To</span>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo ?? ""}
              onChange={updateFilter}
              className={inputCls}
            />
          </label>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-tfh-navy shadow-sm"
        >
          <span>Filters</span>
          {hasActiveFilters ? (
            <span className="rounded-full bg-tfh-blue px-2 py-0.5 text-xs font-bold text-white">
              Active
            </span>
          ) : (
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
          )}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:block">
        {controls}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
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
      ) : null}
    </>
  );
}
