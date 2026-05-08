"use client";

import { MapPin } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { DISTRICT_ENRICHMENT_AVAILABLE } from "@/lib/district-enrichment";
import type { PermitFilters, PermitProjectCategory } from "@/lib/types";

// ── Project-category options ──────────────────────────────────────────────────

const CATEGORY_OPTIONS: Array<{ label: string; value: PermitProjectCategory | "all" }> = [
  { label: "All", value: "all" },
  { label: "Residential", value: "residential_single_duplex" },
  { label: "Multi-Family", value: "multi_family" },
  { label: "Commercial", value: "commercial" },
  { label: "Other", value: "other" },
];

// ── Shared style tokens ───────────────────────────────────────────────────────

const inputCls =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-tfh-blue focus:ring-1 focus:ring-tfh-blue";

const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

// ── Helpers ───────────────────────────────────────────────────────────────────

function countActiveFilters(filters: PermitFilters): number {
  return Object.entries(filters).filter(([key, v]) => {
    if (v === undefined || v === "" || v === "all") return false;
    // dateBasis on its own doesn't change the result set without dates
    if (key === "dateBasis" && !filters.dateFrom && !filters.dateTo) return false;
    return true;
  }).length;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Segment-button strip for Project Category. */
function CategoryStrip({
  value,
  onChange,
}: {
  value: PermitProjectCategory | "all" | undefined;
  onChange: (v: PermitProjectCategory | "all") => void;
}) {
  const active = value ?? "all";
  return (
    <div className="flex flex-wrap gap-1">
      {CATEGORY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
            active === opt.value
              ? "bg-tfh-blue text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** 2-option date-basis toggle. */
function DateBasisToggle({
  value,
  onChange,
}: {
  value: "application" | "issue" | undefined;
  onChange: (v: "application" | "issue") => void;
}) {
  const active = value ?? "issue";
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
      {(["application", "issue"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-xs font-semibold transition-all ${
            active === opt
              ? "bg-tfh-blue text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {opt === "application" ? "Date Opened" : "Date Issued"}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReportSlicersProps {
  filters: PermitFilters;
  onChange: (filters: PermitFilters) => void;
  statusOptions: string[];
}

/**
 * Horizontal Power BI-style slicer bar for the main report page.
 * Collapses to a drawer on mobile.
 */
export default function ReportSlicers({
  filters,
  onChange,
  statusOptions,
}: ReportSlicersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const hasActiveFilters = activeCount > 0;

  const dateBasis = filters.dateBasis ?? "issue";
  const dateFromLabel = dateBasis === "application" ? "From (Opened)" : "From (Issued)";
  const dateToLabel = dateBasis === "application" ? "To (Opened)" : "To (Issued)";

  function patch(patch: Partial<PermitFilters>) {
    onChange({ ...filters, ...patch });
  }

  function handleField(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    patch({ [name]: value || undefined });
  }

  // ── Controls shared by desktop and mobile drawer ──────────────────────────

  const controls = (
    <div className="flex flex-col gap-3">
      {/* Row 1: Project Category + Date Basis */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className={labelCls}>Project Category</span>
          <CategoryStrip
            value={filters.projectCategory}
            onChange={(v) => patch({ projectCategory: v })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className={labelCls}>Date Basis</span>
          <DateBasisToggle
            value={filters.dateBasis}
            onChange={(v) => patch({ dateBasis: v })}
          />
        </div>
      </div>

      {/* Row 2: Text / date / ZIP / status filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Address search */}
        <label className="flex min-w-[140px] flex-1 flex-col">
          <span className={labelCls}>Address</span>
          <input
            name="search"
            value={filters.search ?? ""}
            onChange={handleField}
            className={inputCls}
            placeholder="Street, ZIP, building type…"
          />
        </label>

        {/* Use of Building */}
        <label className="flex min-w-[140px] flex-1 flex-col">
          <span className={labelCls}>Use of Building</span>
          <input
            name="useOfBuilding"
            value={filters.useOfBuilding ?? ""}
            onChange={handleField}
            className={inputCls}
            placeholder="Residential, office…"
          />
        </label>

        {/* ZIP */}
        <label className="flex w-24 flex-col">
          <span className={labelCls}>ZIP</span>
          <input
            name="zipCode"
            value={filters.zipCode ?? ""}
            onChange={handleField}
            className={inputCls}
            placeholder="53204"
            inputMode="numeric"
            maxLength={5}
          />
        </label>

        {/* Date From */}
        <label className="flex min-w-[120px] flex-col">
          <span className={labelCls}>{dateFromLabel}</span>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom ?? ""}
            onChange={handleField}
            className={inputCls}
          />
        </label>

        {/* Date To */}
        <label className="flex min-w-[120px] flex-col">
          <span className={labelCls}>{dateToLabel}</span>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo ?? ""}
            onChange={handleField}
            className={inputCls}
          />
        </label>

        {/* Council District — disabled until geocoding pipeline is implemented */}
        {!DISTRICT_ENRICHMENT_AVAILABLE && (
          <div className="flex flex-col gap-1 self-end">
            <span className={`${labelCls} flex items-center gap-1`}>
              <MapPin className="h-3 w-3" />
              Council District
            </span>
            <div
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-xs text-gray-400"
              title="District filtering requires geocoding permit addresses — not yet available in the current CKAN data source. See lib/district-enrichment.ts for the implementation roadmap."
            >
              <MapPin className="h-3 w-3 shrink-0" />
              Not yet available
            </div>
          </div>
        )}

        {/* Status — show dropdown only when source has >1 distinct value */}
        {statusOptions.length > 1 ? (
          <label className="flex min-w-[120px] flex-1 flex-col">
            <span className={labelCls}>Status</span>
            <select
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
          <div className="flex flex-col gap-1 self-end">
            <span className={labelCls}>Status</span>
            <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
              {statusOptions[0]} only in source
            </span>
          </div>
        ) : null}

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
    </div>
  );

  return (
    <>
      {/* ── Desktop horizontal slicer bar ── */}
      <div className="hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:block">
        <div className="mb-3 flex items-center justify-between">
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
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
          />
          {/* Drawer panel */}
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white p-5 shadow-2xl">
            <p className="mb-4 text-xs text-gray-400">
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
