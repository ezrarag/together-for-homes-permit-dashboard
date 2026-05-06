export type PermitStatus = "open" | "closed" | "expired" | "pending";

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
  neighborhood?: string;
  zipCode?: string;
  permitType: PermitType;
  status: PermitStatus;
  openedDate?: string;
  issuedDate: string;
  expirationDate?: string;
  value?: number;
  useOfBuilding?: string;
  dwellingUnitsImpact?: number;
  lat?: number;
  lng?: number;
}

export interface PermitFilters {
  type?: PermitType | "all";
  status?: PermitStatus | "all";
  zipCode?: string;
  neighborhood?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DataStatus {
  source: string;
  resourceId: string;
  lastFetched: string;
  totalRecords: number;
  error?: string;
}
