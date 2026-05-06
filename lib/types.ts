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
  status: PermitStatus;
  rawStatus?: string;
  openedDate?: string;
  issuedDate: string;
  expirationDate?: string;
  value?: number;
  useOfBuilding?: string;
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
