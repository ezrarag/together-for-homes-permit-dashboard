"use client";

import {
  ArrowRight,
  Building2,
  ClipboardList,
  HardHat,
  Home,
  Layers3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  PermitProjectCategory,
  PermitSummary,
  ProjectCategoryBreakdown,
  ReportSection,
} from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ── Card configuration ────────────────────────────────────────────────────────

interface CardConfig {
  section: ReportSection;
  category: PermitProjectCategory | null;
  title: string;
  subtitle: string;
  accentColor: string;
  bgColor: string;
  icon: LucideIcon;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    section: "residential",
    category: "residential_single_duplex",
    title: "1-2 Unit Residential Permits",
    subtitle: "Single-family and duplex records",
    accentColor: "#019cf2",
    bgColor: "#019cf208",
    icon: Home,
  },
  {
    section: "multi_family",
    category: "multi_family",
    title: "3+ Unit Residential Permits",
    subtitle: "Apartments, condos, and other 3+ unit records",
    accentColor: "#f0a41a",
    bgColor: "#f0a41a08",
    icon: Building2,
  },
  {
    section: "commercial",
    category: "commercial",
    title: "Commercial Building Applications",
    subtitle: "Commercial, office, retail & industrial",
    accentColor: "#00304c",
    bgColor: "#00304c08",
    icon: HardHat,
  },
  {
    section: "units",
    category: null,
    title: "Permit Unit-Impact Flags",
    subtitle: "Permit records flagged added, lost, or maintained",
    accentColor: "#10b981",
    bgColor: "#10b98108",
    icon: Layers3,
  },
  {
    section: "records",
    category: null,
    title: "All Permit Records",
    subtitle: "Full database with search, filter & export",
    accentColor: "#6b7280",
    bgColor: "#6b728008",
    icon: ClipboardList,
  },
];

// ── Bullet metric builder ─────────────────────────────────────────────────────

function getBullets(
  config: CardConfig,
  breakdown: ProjectCategoryBreakdown | undefined,
  summary: PermitSummary,
): Array<{ label: string; value: string }> {
  if (config.section === "residential" || config.section === "multi_family") {
    if (!breakdown) return [];
    return [
      { label: "Records with Date Opened", value: fmt(breakdown.count) },
      { label: "Permits Issued", value: fmt(breakdown.permitsIssued) },
      { label: "Permits Marked Added", value: fmt(breakdown.unitsAdded) },
    ];
  }

  if (config.section === "commercial") {
    if (!breakdown) return [];
    return [
      { label: "Records with Date Opened", value: fmt(breakdown.count) },
      { label: "Permits Issued", value: fmt(breakdown.permitsIssued) },
      { label: "Total Valuation", value: fmtCurrency(breakdown.totalValuation) },
    ];
  }

  if (config.section === "units") {
    return [
      { label: "Permits Marked Added/Gained", value: fmt(summary.addedGainedUnits) },
      { label: "Permits Marked Lost/Eliminated", value: fmt(summary.lostEliminatedUnits) },
      {
        label: "Permits with Impact Data",
        value: fmt(
          summary.dwellingImpact.maintain +
            summary.dwellingImpact.added +
            summary.dwellingImpact.lost,
        ),
      },
    ];
  }

  // records
  return [
    { label: "Total Permits", value: fmt(summary.totalPermits) },
    { label: "Permits Issued", value: fmt(summary.issuedCount) },
    { label: "Total Valuation", value: fmtCurrency(summary.totalConstructionValue) },
  ];
}

// ── Single hub card ───────────────────────────────────────────────────────────

function HubCard({
  config,
  breakdown,
  summary,
  onNavigate,
}: {
  config: CardConfig;
  breakdown: ProjectCategoryBreakdown | undefined;
  summary: PermitSummary;
  onNavigate: (s: ReportSection) => void;
}) {
  const bullets = getBullets(config, breakdown, summary);
  const Icon = config.icon;

  return (
    <button
      onClick={() => onNavigate(config.section)}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tfh-blue"
    >
      {/* Icon + arrow row */}
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="h-5 w-5" color={config.accentColor} aria-hidden="true" />
        </div>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ backgroundColor: `${config.accentColor}18` }}
        >
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
            color={config.accentColor}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Title */}
      <div className="mt-3">
        <h3 className="text-sm font-bold leading-snug text-tfh-navy">{config.title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{config.subtitle}</p>
      </div>

      {/* Color accent line — animates wider on hover */}
      <div
        className="mt-3 h-0.5 w-10 rounded-full transition-all duration-300 group-hover:w-16"
        style={{ backgroundColor: config.accentColor }}
      />

      {/* Bullet metrics */}
      {bullets.length > 0 && (
        <ul className="mt-3 w-full space-y-1.5">
          {bullets.map((b) => (
            <li key={b.label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">{b.label}</span>
              <span className="text-xs font-semibold tabular-nums text-tfh-navy">
                {b.value}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <div
        className="mt-auto flex items-center gap-1 pt-4 text-xs font-semibold"
        style={{ color: config.accentColor }}
      >
        <span>View report</span>
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
          color={config.accentColor}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ReportHub({
  summary,
  onNavigate,
}: {
  summary: PermitSummary;
  onNavigate: (s: ReportSection) => void;
}) {
  function getBreakdown(cat: PermitProjectCategory | null) {
    if (!cat) return undefined;
    return summary.projectCategoryBreakdown?.find((b) => b.category === cat);
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
          Report Hub
        </h2>
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-400">Select a report section to explore</span>
      </div>

      {/* Top 3 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_CONFIGS.slice(0, 3).map((cfg) => (
          <HubCard
            key={cfg.section}
            config={cfg}
            breakdown={getBreakdown(cfg.category)}
            summary={summary}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Bottom 2 cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {CARD_CONFIGS.slice(3).map((cfg) => (
          <HubCard
            key={cfg.section}
            config={cfg}
            breakdown={getBreakdown(cfg.category)}
            summary={summary}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
