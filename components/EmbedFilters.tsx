"use client";

import { type ChangeEvent, useId } from "react";
import type { PermitFilters, PermitType } from "@/lib/types";

const typeOptions: Array<{ label: string; value: PermitType | "all" }> = [
  { label: "All types", value: "all" },
  { label: "New Construction", value: "new_construction" },
  { label: "Renovation", value: "renovation" },
  { label: "Demolition", value: "demolition" },
  { label: "Electrical", value: "electrical" },
  { label: "Plumbing", value: "plumbing" },
  { label: "Mechanical", value: "mechanical" },
  { label: "Other", value: "other" },
];

interface EmbedFiltersProps {
  filters: PermitFilters;
  onChange: (filters: PermitFilters) => void;
  statusOptions: string[];
}

export default function EmbedFilters({
  filters,
  onChange,
  statusOptions,
}: EmbedFiltersProps) {
  const id = useId();
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "" && v !== "all",
  );

  function update(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value || undefined });
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-tfh-blue focus:ring-1 focus:ring-tfh-blue";

  return (
    <div className="flex flex-wrap items-end gap-2">
      {/* Search */}
      <label className="flex min-w-[140px] flex-1 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Search
        </span>
        <input
          id={`${id}-search`}
          name="search"
          value={filters.search ?? ""}
          onChange={update}
          placeholder="Address or use…"
          className={inputCls}
        />
      </label>

      {/* Permit type */}
      <label className="flex min-w-[140px] flex-1 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Type
        </span>
        <select
          id={`${id}-type`}
          name="type"
          value={filters.type ?? "all"}
          onChange={update}
          className={inputCls}
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {/* Status */}
      {statusOptions.length > 0 ? (
        <label className="flex min-w-[120px] flex-1 flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
          </span>
          <select
            id={`${id}-status`}
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
      ) : null}

      {/* ZIP */}
      <label className="flex w-24 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          ZIP
        </span>
        <input
          id={`${id}-zip`}
          name="zipCode"
          value={filters.zipCode ?? ""}
          onChange={update}
          placeholder="53204"
          inputMode="numeric"
          maxLength={5}
          className={inputCls}
        />
      </label>

      {/* Clear */}
      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => onChange({})}
          className="self-end rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-tfh-blue hover:text-tfh-blue"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
