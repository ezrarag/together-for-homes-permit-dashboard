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
  neighborhood: string;
  zipCode: string;
  permitType: PermitType;
  status: PermitStatus;
  issuedDate: string;
  expirationDate?: string;
  contractor?: string;
  owner?: string;
  description?: string;
  value?: number;
  lat: number;
  lng: number;
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
