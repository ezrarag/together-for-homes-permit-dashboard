/**
 * Lifecycle Source Adapter
 *
 * Defines the canonical interface for a "full lifecycle" permit record —
 * the data model needed to track true city-review-time (not just
 * application-to-issuance). Includes a CKAN adapter that populates the
 * subset of fields available from the current Milwaukee Open Data feed.
 *
 * ── True lifecycle fields required ──────────────────────────────────────────
 *
 *   submittedDate           When the applicant submitted the application
 *   completedForReviewDate  When the city deemed it complete (clock starts)
 *   cityFirstResponseDate   When city issued first comments / corrections
 *   applicantResponseDate   When applicant responded to corrections
 *   approvalDate            When city approved (before fee + issue)
 *   feeDueDate              When payment is required
 *   feePaymentDate          When fee was paid
 *   issueDate               When the permit was formally issued
 *   expirationDate          When the permit expires if not used
 *   currentStatus           The current processing bucket
 *
 * ── Data source requirements ─────────────────────────────────────────────────
 *
 *   Source A (current): Milwaukee CKAN Building Permits feed
 *     → Provides: submittedDate (Date Opened), issueDate (Date Issued)
 *     → Missing: everything else
 *
 *   Source B (future): Milwaukee permit-detail system
 *     Options:
 *     1. Milwaukee COMPASS (city's internal permit portal) — screen-scraping
 *        may be feasible for public permit detail pages.
 *     2. AMANDA (city's permitting software) — formal data-sharing agreement
 *        or extract would be needed.
 *     3. Milwaukee Open Data (future resource) — request the dataset from
 *        the city's Open Data team via the public data request process.
 *
 * Contact Montavius / the City's Office of Innovation to identify which
 * source is accessible for a pilot integration.
 */

// ── Full lifecycle record interface ───────────────────────────────────────────

export type LifecycleRecordStatus =
  | "submitted"           // application received, not yet reviewed
  | "in_review"           // city is actively reviewing
  | "corrections_needed"  // city sent back for corrections
  | "awaiting_payment"    // approved, fee due
  | "issued"             // permit issued
  | "expired"             // permit expired before use
  | "withdrawn"           // applicant withdrew the application
  | "denied"              // application denied
  | "unknown";            // status not determinable from source data

export interface LifecycleRecord {
  /** CKAN Record ID — stable cross-source join key. */
  permitId: string;

  // ── Available from current CKAN feed ────────────────────────────────────
  /** Date Opened — when the application was submitted (CKAN: "Date Opened"). */
  submittedDate: string | null;
  /** Date Issued — when the permit was formally issued (CKAN: "Date Issued"). */
  issueDate: string | null;

  // ── Unavailable from current CKAN feed ──────────────────────────────────
  /**
   * When the city determined the application was complete and began the
   * official review clock. The "city review time" metric should use
   * completedForReviewDate → approvalDate, not submittedDate → issueDate.
   */
  completedForReviewDate: string | null;
  /** When the city sent its first response (comments, corrections, approval). */
  cityFirstResponseDate: string | null;
  /** When the applicant last responded to city corrections. */
  applicantResponseDate: string | null;
  /** When the city approved the permit (pre-fee). */
  approvalDate: string | null;
  /** When the permit fee payment was due. */
  feeDueDate: string | null;
  /** When the fee was paid. */
  feePaymentDate: string | null;
  /** When the permit expires if not exercised. */
  expirationDate: string | null;

  /** Processing status — derived from date presence in CKAN adapter. */
  currentStatus: LifecycleRecordStatus;

  // ── Computed timing metrics ──────────────────────────────────────────────
  /**
   * Total days from submission to issuance.
   * Available from CKAN (submittedDate + issueDate).
   */
  daysSubmissionToIssue: number | null;
  /**
   * Days city held the ball (completedForReviewDate → cityFirstResponseDate
   * or approvalDate). NOT available from CKAN.
   */
  daysInCityReview: number | null;
  /**
   * Days applicant held the ball (cityFirstResponseDate →
   * applicantResponseDate). NOT available from CKAN.
   */
  daysWaitingForApplicant: number | null;
}

// ── Source adapter interface ──────────────────────────────────────────────────

export interface LifecycleSourceAdapter {
  /** Human-readable name for this data source. */
  sourceName: string;
  /** Fields this adapter can populate (all others will be null). */
  availableFields: (keyof LifecycleRecord)[];
  /** Fetch lifecycle records for a list of permit IDs. */
  fetchLifecycleRecords(
    permitIds: string[],
  ): Promise<Map<string, LifecycleRecord>>;
}

// ── CKAN adapter (current source) ────────────────────────────────────────────

import type { Permit } from "@/lib/types";
import { computeDaysToIssue } from "@/lib/lifecycle-metrics";

/**
 * Adapter that builds LifecycleRecord objects from the current CKAN permit
 * data. Only submittedDate and issueDate are populated; all other timeline
 * fields are null.
 */
export class CkanLifecycleAdapter implements LifecycleSourceAdapter {
  sourceName = "Milwaukee Open Data – Building Permits (CKAN)";

  availableFields: (keyof LifecycleRecord)[] = [
    "permitId",
    "submittedDate",
    "issueDate",
    "currentStatus",
    "daysSubmissionToIssue",
  ];

  async fetchLifecycleRecords(
    _permitIds: string[],
  ): Promise<Map<string, LifecycleRecord>> {
    // In a real implementation this would re-query CKAN for the given IDs.
    // Since we already have the full permit list in memory via ISR, callers
    // should use fromPermit() directly.
    return new Map();
  }

  static fromPermit(permit: Permit): LifecycleRecord {
    const days = computeDaysToIssue(permit.applicationDate, permit.issueDate);
    const status: LifecycleRecordStatus = permit.issueDate
      ? "issued"
      : permit.applicationDate
        ? "in_review" // best guess — true status not in feed
        : "unknown";

    return {
      permitId: permit.id,
      submittedDate: permit.applicationDate ?? null,
      issueDate: permit.issueDate ?? null,
      // Fields not available from CKAN:
      completedForReviewDate: null,
      cityFirstResponseDate: null,
      applicantResponseDate: null,
      approvalDate: null,
      feeDueDate: null,
      feePaymentDate: null,
      expirationDate: null,
      currentStatus: status,
      daysSubmissionToIssue: days,
      // Unavailable — would require city-review-history data:
      daysInCityReview: null,
      daysWaitingForApplicant: null,
    };
  }
}

// ── Future adapter stub ───────────────────────────────────────────────────────

/**
 * Placeholder for a future AMANDA / COMPASS permit-detail adapter.
 * Replace this stub with a real implementation once a data-sharing
 * agreement or scraping pipeline is in place.
 */
export class FuturePermitDetailAdapter implements LifecycleSourceAdapter {
  sourceName = "Milwaukee Permit Portal (future integration — not yet implemented)";

  availableFields: (keyof LifecycleRecord)[] = [
    "permitId",
    "submittedDate",
    "completedForReviewDate",
    "cityFirstResponseDate",
    "applicantResponseDate",
    "approvalDate",
    "feeDueDate",
    "feePaymentDate",
    "issueDate",
    "expirationDate",
    "currentStatus",
    "daysSubmissionToIssue",
    "daysInCityReview",
    "daysWaitingForApplicant",
  ];

  async fetchLifecycleRecords(
    _permitIds: string[],
  ): Promise<Map<string, LifecycleRecord>> {
    throw new Error(
      "FuturePermitDetailAdapter is not implemented. " +
        "See lib/lifecycle-source-adapter.ts for the integration roadmap.",
    );
  }
}
