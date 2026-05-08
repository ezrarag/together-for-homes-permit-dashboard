/**
 * Permit Lifecycle Metrics
 *
 * Computes "opened-to-issued" timing and status breakdown from the Milwaukee
 * CKAN permit feed.
 *
 * ── What the current CKAN feed provides ─────────────────────────────────────
 *   Date Opened  →  applicationDate (application submission date)
 *   Date Issued  →  issueDate       (permit approval date)
 *   Status       →  always "Issued" in the current feed (all 16,187 records)
 *
 * ── What it does NOT provide ────────────────────────────────────────────────
 *   • Processing-status history (who has the ball: city vs. applicant)
 *   • "Pending Client" events (fee due, corrections requested, etc.)
 *   • Certificate of Occupancy / completion events
 *   • Council District, Ward, or lat/lng
 *
 * DaysToIssue measures application-to-approval, NOT "city review time"
 * (a permit can sit waiting for applicant corrections for months before
 * being re-submitted or approved). The MethodologyNote component surfaces
 * this caveat in the UI.
 */

import type { Permit, PermitProjectCategory } from "@/lib/types";

// ── Public types ──────────────────────────────────────────────────────────────

/**
 * Three-bucket lifecycle status derived purely from date presence.
 *
 * Issued       → issueDate is populated
 * In Progress  → applicationDate present, no issueDate
 * Pending Client → cannot be derived from current CKAN source; always 0
 */
export type LifecycleStatus = "issued" | "in_progress" | "pending_client";

/** Time-window options for the aggregate metric cards. */
export type TimeWindow = "30" | "90" | "12m";

export interface CategoryLifecycle {
  applications: number;
  issued: number;
  avgDays: number | null;
  totalValuation: number;
}

export interface MonthlyLifecycle {
  month: string;
  label: string;
  applications: number;
  issued: number;
  /** Average days-to-issue for permits issued in this month; null if none. */
  avgDays: number | null;
}

export interface LifecycleMetrics {
  applicationsReceived: number;
  permitsIssued: number;
  /** Permits with applicationDate but no issueDate. Always ~0 in current feed. */
  inProgress: number;
  /**
   * "Pending Client" — not derivable from current CKAN source.
   * Always 0; surfaced so the UI can label it honestly.
   */
  pendingClient: number;
  /** Integer days, mean of (issueDate − applicationDate). Null when no data. */
  averageDaysToIssue: number | null;
  /** Median days-to-issue. Null when no data. */
  medianDaysToIssue: number | null;
  /** Count of permits where "Dwelling units impact" includes "Added or Gained". */
  unitsApproved: number;
  totalValuation: number;
  /** All individual day values (for distribution / box-plot use). */
  daysToIssueDistribution: number[];
  /** Breakdown by projectCategory. */
  byCategory: Record<PermitProjectCategory, CategoryLifecycle>;
  /** One row per calendar month, sorted chronologically. */
  monthly: MonthlyLifecycle[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Days between two ISO-8601 date strings (positive or zero).
 * Returns null if either date is missing or invalid.
 */
export function computeDaysToIssue(
  applicationDate: string | undefined,
  issueDate: string | undefined,
): number | null {
  if (!applicationDate || !issueDate) return null;
  const a = new Date(applicationDate);
  const b = new Date(issueDate);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/**
 * Map a permit to a three-bucket lifecycle status.
 *
 * Because the current CKAN Status field is always "Issued", the "in_progress"
 * bucket will only be non-empty if the feed is ever backfilled with pre-issue
 * records. "pending_client" is always 0 from this source.
 */
export function categorizeLifecycleStatus(permit: Permit): LifecycleStatus {
  if (permit.issueDate) return "issued";
  if (permit.applicationDate) return "in_progress";
  return "in_progress"; // fallback
}

/**
 * Filter permits to those with at least one date field inside the time window.
 * A permit belongs in the window when either submission or issuance happened
 * during the period.
 */
export function filterToTimeWindow(permits: Permit[], window: TimeWindow): Permit[] {
  const now = new Date();
  const cutoff = new Date(now);
  if (window === "30") cutoff.setDate(now.getDate() - 30);
  else if (window === "90") cutoff.setDate(now.getDate() - 90);
  else cutoff.setMonth(now.getMonth() - 12); // "12m"

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return permits.filter((p) => {
    const applicationInWindow = p.applicationDate ? p.applicationDate >= cutoffStr : false;
    const issuedInWindow = p.issueDate ? p.issueDate >= cutoffStr : false;
    return applicationInWindow || issuedInWindow;
  });
}

// ── Core computation ──────────────────────────────────────────────────────────

const CATEGORY_ORDER: PermitProjectCategory[] = [
  "residential_single_duplex",
  "multi_family",
  "commercial",
  "other",
];

function emptyCategory(): CategoryLifecycle {
  return { applications: 0, issued: 0, avgDays: null, totalValuation: 0 };
}

/** Compute full lifecycle metrics from an (already-filtered) permit list. */
export function computeLifecycleMetrics(permits: Permit[]): LifecycleMetrics {
  let applicationsReceived = 0;
  let permitsIssued = 0;
  let inProgress = 0;
  let unitsApproved = 0;
  let totalValuation = 0;
  const allDays: number[] = [];

  // Per-category accumulators
  const catApps = new Map<PermitProjectCategory, number>();
  const catIssued = new Map<PermitProjectCategory, number>();
  const catDays = new Map<PermitProjectCategory, number[]>();
  const catValuation = new Map<PermitProjectCategory, number>();

  // Monthly accumulators
  const monthlyApp = new Map<string, number>();
  const monthlyIssuedCount = new Map<string, number>();
  const monthlyDaysSum = new Map<string, number>();
  const monthlyDaysN = new Map<string, number>();

  for (const p of permits) {
    const cat = p.projectCategory;
    const dwelling = (p.dwellingUnitsImpact ?? "").toLowerCase();
    const val = typeof p.valuation === "number" && p.valuation > 0 ? p.valuation : 0;
    const days = computeDaysToIssue(p.applicationDate, p.issueDate);

    // Applications
    if (p.applicationDate) {
      applicationsReceived++;
      const month = p.applicationDate.slice(0, 7);
      if (month.length === 7) {
        monthlyApp.set(month, (monthlyApp.get(month) ?? 0) + 1);
      }
    }

    // Status
    if (p.issueDate) {
      permitsIssued++;
      const month = p.issueDate.slice(0, 7);
      if (month.length === 7) {
        monthlyIssuedCount.set(month, (monthlyIssuedCount.get(month) ?? 0) + 1);
        if (days !== null) {
          monthlyDaysSum.set(month, (monthlyDaysSum.get(month) ?? 0) + days);
          monthlyDaysN.set(month, (monthlyDaysN.get(month) ?? 0) + 1);
        }
      }
    } else if (p.applicationDate) {
      inProgress++;
    }

    // Days to issue (global)
    if (days !== null) {
      allDays.push(days);
    }

    // Units
    if (dwelling.includes("added") || dwelling.includes("gained")) unitsApproved++;

    // Valuation
    totalValuation += val;

    // Category
    catApps.set(cat, (catApps.get(cat) ?? 0) + (p.applicationDate ? 1 : 0));
    catIssued.set(cat, (catIssued.get(cat) ?? 0) + (p.issueDate ? 1 : 0));
    if (days !== null) {
      const existing = catDays.get(cat) ?? [];
      existing.push(days);
      catDays.set(cat, existing);
    }
    catValuation.set(cat, (catValuation.get(cat) ?? 0) + val);
  }

  // Average / median (global)
  const averageDaysToIssue =
    allDays.length > 0
      ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length)
      : null;

  const sorted = Array.from(allDays).sort((a, b) => a - b);
  const medianDaysToIssue =
    sorted.length > 0
      ? sorted.length % 2 === 0
        ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
        : sorted[Math.floor(sorted.length / 2)]
      : null;

  // Per-category
  const byCategory = Object.fromEntries(
    CATEGORY_ORDER.map((cat) => {
      const dArr = catDays.get(cat) ?? [];
      const avg =
        dArr.length > 0
          ? Math.round(dArr.reduce((a, b) => a + b, 0) / dArr.length)
          : null;
      return [
        cat,
        {
          applications: catApps.get(cat) ?? 0,
          issued: catIssued.get(cat) ?? 0,
          avgDays: avg,
          totalValuation: catValuation.get(cat) ?? 0,
        },
      ];
    }),
  ) as Record<PermitProjectCategory, CategoryLifecycle>;

  // Monthly series (union of applicationDate months and issueDate months)
  const allMonths = new Set(
    Array.from(monthlyApp.keys()).concat(Array.from(monthlyIssuedCount.keys())),
  );

  const monthly: MonthlyLifecycle[] = Array.from(allMonths)
    .sort()
    .map((month) => {
      const [yearStr, monthStr] = month.split("-");
      const label = new Date(
        Number(yearStr),
        Number(monthStr) - 1,
        1,
      ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const n = monthlyDaysN.get(month) ?? 0;
      const avgDays =
        n > 0 ? Math.round((monthlyDaysSum.get(month) ?? 0) / n) : null;

      return {
        month,
        label,
        applications: monthlyApp.get(month) ?? 0,
        issued: monthlyIssuedCount.get(month) ?? 0,
        avgDays,
      };
    });

  return {
    applicationsReceived,
    permitsIssued,
    inProgress,
    pendingClient: 0, // not derivable from current CKAN source
    averageDaysToIssue,
    medianDaysToIssue,
    unitsApproved,
    totalValuation,
    daysToIssueDistribution: allDays,
    byCategory,
    monthly,
  };
}
