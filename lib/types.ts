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

export interface Permit {
  id: string;
  address: string;
  displayAddress?: string;
  zipCode?: string;
  permitType: PermitType;
  /** Raw "Permit Type" string from CKAN (e.g. "Building - New") */
  permitTypeRaw?: string;
  status: PermitStatus;
  /** Raw "Status" string from CKAN — currently always "Issued" */
  rawStatus?: string;
  /** "Date Opened" from CKAN */
  openedDate?: string;
  /** "Date Issued" from CKAN */
  issuedDate: string;
  expirationDate?: string;
  /** "Construction Total Cost" from CKAN */
  value?: number;
  /** "Use of Building" from CKAN */
  useOfBuilding?: string;
  /** "Dwelling units impact" from CKAN */
  dwellingUnitsImpact?: string;
  lat?: number;
  lng?: number;
}

export interface PermitFilters {
  type?: PermitType | "all";
  status?: string;
  zipCode?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ── Chart / breakdown types (computed server-side in computeSummary) ──

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
  /** ISO year-month, e.g. "2024-03" — used for sorting */
  month: string;
  /** Display label, e.g. "Mar 2024" */
  label: string;
  count: number;
  totalValue: number;
}

// ── Aggregate summary ──

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
  permitsByUse: UseOfBuildingBreakdown[];   // top 12 by count
  dwellingImpact: DwellingImpactBreakdown;
  monthlyTrend: MonthlyDataPoint[];         // last 24 months, chronological
}

export interface DataStatus {
  source: string;
  resourceId: string;
  sourceLastModified?: string;
  appLastChecked: string;
  totalRecords: number;
  loadedRecords: number;
  error?: string;
}
