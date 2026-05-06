import type { DataStatus, Permit, PermitStatus, PermitType } from "@/lib/types";

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";
const RESOURCE_ID = "828e9630-d7cb-42e4-960e-964eae916397";
const SOURCE_NAME = "Milwaukee Open Data – Building Permits";

interface CkanRecord {
  _id?: number;
  "Record ID"?: string;
  "Address"?: string;
  "Permit Type"?: string;
  "Status"?: string;
  "Date Opened"?: string;
  "Date Issued"?: string;
  "Construction Total Cost"?: string | number;
  "Use of Building"?: string;
  "Dwelling units impact"?: string | number;
}

interface CkanResponse {
  success: boolean;
  result: {
    total: number;
    records: CkanRecord[];
  };
}

export interface FetchPermitsResult {
  permits: Permit[];
  dataStatus: DataStatus;
}

function normalizePermitType(value?: string): PermitType {
  const normalized = value?.toLowerCase().trim() ?? "";

  if (normalized.includes("new")) return "new_construction";
  if (normalized.includes("reno") || normalized.includes("alter")) return "renovation";
  if (normalized.includes("demo")) return "demolition";
  if (normalized.includes("electric")) return "electrical";
  if (normalized.includes("plumb")) return "plumbing";
  if (normalized.includes("mechanic") || normalized.includes("hvac")) return "mechanical";

  return "other";
}

function normalizePermitStatus(value?: string): PermitStatus {
  const normalized = value?.toLowerCase().trim() ?? "";

  if (normalized.includes("closed") || normalized.includes("complete")) return "closed";
  if (normalized.includes("expired")) return "expired";
  if (normalized.includes("pending") || normalized.includes("review")) return "pending";

  return "open";
}

function toIsoDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function toNumber(value?: string | number): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : undefined;
}

function normalizeRecord(record: CkanRecord): Permit {
  return {
    id: record["Record ID"]?.trim() || String(record._id ?? crypto.randomUUID()),
    address: record["Address"]?.trim() || "Address unavailable",
    permitType: normalizePermitType(record["Permit Type"]),
    status: normalizePermitStatus(record["Status"]),
    openedDate: toIsoDate(record["Date Opened"]),
    issuedDate: toIsoDate(record["Date Issued"]) ?? "",
    value: toNumber(record["Construction Total Cost"]),
    useOfBuilding: record["Use of Building"]?.trim() || undefined,
    dwellingUnitsImpact: toNumber(record["Dwelling units impact"]),
  };
}

export async function fetchMilwaukeePermits(limit = 1000): Promise<FetchPermitsResult> {
  const url = new URL(CKAN_BASE);
  url.searchParams.set("resource_id", RESOURCE_ID);
  url.searchParams.set("limit", String(limit));

  const fetchedAt = new Date().toISOString();

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`CKAN request failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as CkanResponse;

  if (!json.success) {
    throw new Error("CKAN API returned success: false");
  }

  const permits = json.result.records.map(normalizeRecord);

  return {
    permits,
    dataStatus: {
      source: SOURCE_NAME,
      resourceId: RESOURCE_ID,
      lastFetched: fetchedAt,
      totalRecords: json.result.total,
    },
  };
}
