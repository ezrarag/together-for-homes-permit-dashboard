"use client";

import { type ChangeEvent, useId } from "react";
import type { PermitFilters, PermitProjectCategory } from "@/lib/types";

const CATEGORY_OPTIONS: Array<{ label: string; value: PermitProjectCategory | "all" }> = [
  { label: "All categories", value: "all" },
  { label: "Residential (1–2 unit)", value: "residential_single_duplex" },
  { label: "Multi-Family (3+)", value: "multi_family" },
  { label: "Commercial", value: "commercial" },
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

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-tfh-blue focus:ring-1 focus:ring-tfh-blue";

  const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

  const dateBasis = filters.dateBasis ?? "issue";
  const dateFromLabel = dateBasis === "application" ? "From (Opened)" : "From (Issued)";

  function patch(updates: Partial<PermitFilters>) {
    onChange({ ...filters, ...updates });
  }

  function handleField(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    patch({ [name]: value || undefined });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Project Category */}
      <label className="flex flex-col gap-1">
        <span className={labelCls}>Project Category</span>
        <select
          id={`${id}-category`}
          name="projectCategory"
          value={filters.projectCategory ?? "all"}
          onChange={handleField}
          className={inputCls}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {/* Row 2: text filters */}
      <div className="flex flex-wrap items-end gap-2">
        {/* Address search */}
        <label className="flex min-w-[130px] flex-1 flex-col gap-1">
          <span className={labelCls}>Search</span>
          <input
            id={`${id}-search`}
            name="search"
            value={filters.search ?? ""}
            onChange={handleField}
            placeholder="Address or use…"
            className={inputCls}
          />
        </label>

        {/* ZIP */}
        <label className="flex w-24 flex-col gap-1">
          <span className={labelCls}>ZIP</span>
          <input
            id={`${id}-zip`}
            name="zipCode"
            value={filters.zipCode ?? ""}
            onChange={handleField}
            placeholder="53204"
            inputMode="numeric"
            maxLength={5}
            className={inputCls}
          />
        </label>
      </div>

      {/* Row 3: Date Basis + From */}
      <div className="flex flex-wrap items-end gap-2">
        {/* Date basis toggle */}
        <div className="flex flex-col gap-1">
          <span className={labelCls}>Date Basis</span>
          <div className="flex overflow-hidden rounded-lg border border-gray-300">
            {(["application", "issue"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => patch({ dateBasis: opt })}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  dateBasis === opt
                    ? "bg-tfh-blue text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt === "application" ? "Opened" : "Issued"}
              </button>
            ))}
          </div>
        </div>

        {/* Date From */}
        <label className="flex min-w-[120px] flex-1 flex-col gap-1">
          <span className={labelCls}>{dateFromLabel}</span>
          <input
            type="date"
            id={`${id}-dateFrom`}
            name="dateFrom"
            value={filters.dateFrom ?? ""}
            onChange={handleField}
            className={inputCls}
          />
        </label>

        {/* Date To */}
        <label className="flex min-w-[120px] flex-1 flex-col gap-1">
          <span className={labelCls}>To</span>
          <input
            type="date"
            id={`${id}-dateTo`}
            name="dateTo"
            value={filters.dateTo ?? ""}
            onChange={handleField}
            className={inputCls}
          />
        </label>
      </div>

      {/* Status + Clear row */}
      <div className="flex flex-wrap items-end gap-2">
        {statusOptions.length > 1 ? (
          <label className="flex min-w-[120px] flex-1 flex-col gap-1">
            <span className={labelCls}>Status</span>
            <select
              id={`${id}-status`}
              name="status"
              value={filters.status ?? ""}
              onChange={handleField}
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
        ) : statusOptions.length === 1 ? (
          <div className="flex flex-col gap-1">
            <span className={labelCls}>Status</span>
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500">
              {statusOptions[0]} only in source
            </span>
          </div>
        ) : null}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="self-end rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-tfh-blue hover:text-tfh-blue"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
