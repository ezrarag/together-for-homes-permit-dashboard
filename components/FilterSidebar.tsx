"use client";

import { useState, type ChangeEvent } from "react";
import type { PermitFilters, PermitStatus, PermitType } from "@/lib/types";

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

const statusOptions: Array<{ label: string; value: PermitStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Expired", value: "expired" },
  { label: "Pending", value: "pending" },
];

interface FilterSidebarProps {
  filters: PermitFilters;
  onChange: (filters: PermitFilters) => void;
}

export default function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function updateFilter(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    onChange({
      ...filters,
      [name]: value || undefined,
    });
  }

  function clearFilters() {
    onChange({});
  }

  const controls = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Filters</h2>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-green-500 hover:text-green-400"
        >
          Clear Filters
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm">
        <label className="block">
          <span className="font-medium text-zinc-300">Search</span>
          <input
            name="search"
            value={filters.search ?? ""}
            onChange={updateFilter}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-green-500"
            placeholder="Address, contractor, description"
          />
        </label>

        <label className="block">
          <span className="font-medium text-zinc-300">Permit Type</span>
          <select
            name="type"
            value={filters.type ?? "all"}
            onChange={updateFilter}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-green-500"
          >
            {permitTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-medium text-zinc-300">Status</span>
          <select
            name="status"
            value={filters.status ?? "all"}
            onChange={updateFilter}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-green-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-medium text-zinc-300">ZIP Code</span>
          <input
            name="zipCode"
            value={filters.zipCode ?? ""}
            onChange={updateFilter}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-green-500"
            placeholder="53204"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-medium text-zinc-300">From</span>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom ?? ""}
              onChange={updateFilter}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-green-500"
            />
          </label>
          <label className="block">
            <span className="font-medium text-zinc-300">To</span>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo ?? ""}
              onChange={updateFilter}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-green-500"
            />
          </label>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-white"
        >
          Filters
        </button>
      </div>

      <aside className="hidden rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm md:block">
        {controls}
      </aside>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
            {controls}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-4 w-full rounded-md bg-green-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-green-400"
            >
              Apply Filters
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
