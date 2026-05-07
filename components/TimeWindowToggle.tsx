"use client";

import type { TimeWindow } from "@/lib/types";

const OPTIONS: Array<{ value: TimeWindow; label: string }> = [
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "12m", label: "Last 12 Months" },
];

interface TimeWindowToggleProps {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
  loading?: boolean;
}

export default function TimeWindowToggle({
  value,
  onChange,
  loading = false,
}: TimeWindowToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Period
      </span>
      <div className="flex overflow-hidden rounded-lg border border-gray-300">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={loading}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-60 ${
                active
                  ? "bg-tfh-navy text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {loading && (
        <span className="text-xs text-gray-400">Updating…</span>
      )}
    </div>
  );
}
