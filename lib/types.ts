// ── Report navigation ────────────────────────────────────────────────────────

export type ReportSection =
  | "hub"
  | "residential"
  | "multi_family"
  | "commercial"
  | "units"
  | "records";

/** Sections that map to a project-category filter (i.e. not hub or records). */
export type SectionKey = Exclude<ReportSection, "hub" | "records">;

/** Time-window options for the lifecycle aggregate metric cards. */
export type TimeWindow = "30" | "90" | "12m";

// ── Enum-like string union types ─────────────────────────────────────────────

export type PermitStatus =
  | "issued"
  | "open"
  | "closed"
  | "expired"
  | "pending";

export type PermitType =
  | "new_construction"
  | "renovation"
  | "demolition"
  | "electrical"
  | "plumbing"
  | "mechanical"
  | "other";

/**
 * Derived from "Use of Building" and raw "Permit Type".
 * Used for housing-production analytics slicing.
 */
export type PermitProjectCategory =
  | "residential_single_duplex" // 1–2 unit residential
  | "multi_family"               // 3+ unit residential / apartments
  | "commercial"                 // commercial, industrial, office, retail
  | "other";

/**
 * Where this permit sits in the Milwaukee development lifecycle.
 *
 * Note: "completed_unavailable" is the third stage (Certificate of Occupancy /
 * project completion). The current CKAN feed does not include CO data, so this
 * stage is tracked only as a label in the UI, never assigned from data.
 */
export type PermitLifecycleStage =
  | "application_received"  // "Date Opened" present; no "Date Issued"
  | "permit_issued"         // "Date Issued" present
  | "completed_unavailable"; // CO stage — not available in current CKAN source

// ── Core permit record ────────────────────────────────────────────────────────

export interface Permit {
  id: string;
  address: string;
  displayAddress?: string;
  zipCode?: string;

  // Normalized permit type slug
  permitType: PermitType;
  /** Raw "Permit Type" string from CKAN (canonical name: permitTypeDescription) */
  permitTypeRaw?: string;
  /** Raw "Permit Type" string from CKAN — same value as permitTypeRaw */
  permitTypeDescription?: string;

  status: PermitStatus;
  /** Raw "Status" value from CKAN — currently always "Issued" */
  rawStatus?: string;

  // Dates — both the legacy names and the canonical packet-1 names are kept
  /** "Date Opened" from CKAN (canonical: applicationDate) */
  openedDate?: string;
  /** "Date Opened" from CKAN — same value as openedDate */
  applicationDate?: string;

  /** "Date Issued" from CKAN (canonical: issueDate) */
  issuedDate: string;
  /** "Date Issued" from CKAN — same value as issuedDate */
  issueDate?: string;

  expirationDate?: string;

  // Valuation — both the legacy name and the canonical name are kept
  /** "Construction Total Cost" from CKAN (canonical: valuation) */
  value?: number;
  /** "Construction Total Cost" from CKAN — same value as value */
  valuation?: number;

  /** "Use of Building" from CKAN */
  useOfBuilding?: string;
  /** "Dwelling units impact" from CKAN: "Maintain Current Units" | "Added or Gained" | "Lost or Eliminated" */
  dwellingUnitsImpact?: string;

  // Computed classification fields
  projectCategory: PermitProjectCategory;
  lifecycleStage: PermitLifecycleStage;

  lat?: number;
  lng?: number;
}

// ── Filter input ──────────────────────────────────────────────────────────────

export interface PermitFilters {
  type?: PermitType | "all";
  projectCategory?: PermitProjectCategory | "all";
  status?: string;
  zipCode?: string;
  /**
   * Which date field the dateFrom/dateTo range is applied against.
   * "application" → "Date Opened" (applicationDate)
   * "issue"       → "Date Issued"  (issueDate)
   * undefined     → issueDate with applicationDate fallback (legacy default)
   */
  dateBasis?: "application" | "issue";
  dateFrom?: string;
  dateTo?: string;
  /** General full-text search: address + useOfBuilding + permitTypeDescription */
  search?: string;
  /** Targeted filter on the "Use of Building" field specifically */
  useOfBuilding?: string;
}

// ── Per-request filtered summary (returned by /api/permits) ──────────────────

/**
 * Aggregate metrics computed from the currently-filtered permit set.
 * Matches the six KPIs in the Power BI layout.
 */
export interface FilteredSummary {
  /** Count of permits where applicationDate ("Date Opened") is present */
  applicationsReceived: number;
  /** Count of permits where issueDate ("Date Issued") is present */
  permitsIssued: number;
  /**
   * Certificate of Occupancy / completion stage.
   * Always "Not available in current CKAN feed" because the source
   * does not publish CO records.
   */
  completedOccupancy: string;
  /** Sum of valuation ("Construction Total Cost") for the filtered set */
  totalValuation: number;
  /** Count where "Dwelling units impact" includes "Added or Gained" */
  unitsAdded: number;
  /** Count where "Dwelling units impact" includes "Lost or Eliminated" */
  unitsLost: number;
}

// ── Monthly time-series (returned by /api/permits for the filtered set) ───────

/**
 * One row per calendar month, derived from the filtered permit set.
 * Applications use "Date Opened"; permits/valuation/units use "Date Issued".
 */
export interface MonthlyMetrics {
  /** ISO year-month, e.g. "2024-03" — for sorting */
  month: string;
  /** Human label, e.g. "Mar '24" */
  label: string;
  applicationsReceived: number;
  permitsIssued: number;
  /** Sum of Construction Total Cost for permits issued in this month */
  valuation: number;
  unitsAdded: number;
  unitsLost: number;
}

// ── Full-dataset summary (server-computed at page load, not filter-aware) ─────

export interface PermitTypeBreakdown {
  type: PermitType;
  label: string;
  count: number;
  totalValue: number;
}

export interface UseOfBuildingBreakdown {
  use: string;
  count: number;
}

export interface DwellingImpactBreakdown {
  maintain: number;
  added: number;
  lost: number;
}

export interface MonthlyDataPoint {
  /** ISO year-month, e.g. "2024-03" — for sorting */
  month: string;
  /** Human label, e.g. "Mar '24" */
  label: string;
  count: number;
  totalValue: number;
}

/**
 * Per-project-category aggregates computed from the full dataset.
 * Included in PermitSummary to power the Report Hub cards without extra API calls.
 */
export interface ProjectCategoryBreakdown {
  category: PermitProjectCategory;
  /** Human-readable label for this category */
  label: string;
  /** Total permit records in this category */
  count: number;
  /** Permits where issueDate is present */
  permitsIssued: number;
  /** Sum of Construction Total Cost for this category */
  totalValuation: number;
  /** Permits where "Dwelling units impact" includes "Added or Gained" */
  unitsAdded: number;
  /** Permits where "Dwelling units impact" includes "Lost or Eliminated" */
  unitsLost: number;
}

/**
 * Aggregate statistics and chart breakdowns for the full dataset.
 * Computed server-side at build/revalidation time; not filter-aware.
 */
export interface PermitSummary {
  totalPermits: number;
  issuedCount: number;
  residentialCount: number;
  commercialCount: number;
  addedGainedUnits: number;
  lostEliminatedUnits: number;
  totalConstructionValue: number;
  averageValue: number;
  statusOptions: string[];
  // Chart breakdowns
  permitsByType: PermitTypeBreakdown[];
  permitsByUse: UseOfBuildingBreakdown[];   // top 12
  dwellingImpact: DwellingImpactBreakdown;
  monthlyTrend: MonthlyDataPoint[];         // last 24 months, chronological
  // Report Hub card data — per-category aggregates
  projectCategoryBreakdown: ProjectCategoryBreakdown[];
}

export interface DataStatus {
  source: string;
  resourceId: string;
  sourceLastModified?: string;
  latestApplicationDate?: string;
  latestIssueDate?: string;
  appLastChecked: string;
  totalRecords: number;
  loadedRecords: number;
  error?: string;
}
