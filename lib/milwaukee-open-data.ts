import type { DataStatus, Permit, PermitStatus, PermitSummary, PermitType } from "@/lib/types";

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action";
const RESOURCE_ID = "828e9630-d7cb-42e4-960e-964eae916397";
const PACKAGE_ID = "buildingpermits";
const SOURCE_NAME = "Milwaukee Open Data – Building Permits";
const PAGE_SIZE = 5000;
const REVALIDATE_SECONDS = 60 * 60 * 12;

interface CkanRecord {
  _id?: number;
  "Record ID"?: string;
  "Address"?: string;
  "Permit Type"?: string;
  "Status"?: string;
  "Date Opened"?: string;
  "Date Issued"?: string;
  "Construction Total Cost"?: string | number;
  "Use of Building"?: string | null;
  "Dwelling units impact"?: string | null;
}

interface CkanSearchResponse {
  success: boolean;
  result: {
    total: number;
    records: CkanRecord[];
  };
}

interface CkanPackageResponse {
  success: boolean;
  result: {
    metadata_modified?: string;
    resources?: Array<{
      id: string;
      last_modified?: string;
    }>;
  };
}

export interface FetchPermitsResult {
  permits: Permit[];
  dataStatus: DataStatus;
}

function normalizePermitType(value?: string): PermitType {
  const normalized = value?.toLowerCase().trim() ?? "";

  if (normalized.includes("new")) return "new_construction";
  if (normalized.includes("alter") || normalized.includes("reno"))
    return "renovation";
  if (normalized.includes("demo")) return "demolition";
  if (normalized.includes("electric")) return "electrical";
  if (normalized.includes("plumb")) return "plumbing";
  if (normalized.includes("mechanic") || normalized.includes("hvac"))
    return "mechanical";

  return "other";
}

function normalizePermitStatus(value?: string): PermitStatus {
  const normalized = value?.toLowerCase().trim() ?? "";

  if (normalized.includes("issued")) return "issued";
  if (normalized.includes("closed") || normalized.includes("complete"))
    return "closed";
  if (normalized.includes("expired")) return "expired";
  if (normalized.includes("pending") || normalized.includes("review"))
    return "pending";

  return "open";
}

function toIsoDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function toNumber(value?: string | number | null): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : undefined;
}

const ZIP_REGEX = /\b(\d{5})(\d{4})?\b\s*$/;

function parseZipCode(address?: string): string | undefined {
  if (!address) return undefined;
  const match = address.match(ZIP_REGEX);
  return match?.[1];
}

function parseDisplayAddress(address?: string): string | undefined {
  if (!address) return undefined;
  // "1234 W MAIN ST, MILWAUKEE, WI 532153114" -> "1234 W MAIN ST"
  const idx = address.indexOf(",");
  return idx > 0 ? address.slice(0, idx).trim() : address.trim();
}

function normalizeRecord(record: CkanRecord): Permit {
  const rawStatus = record["Status"]?.trim();
  const rawAddress = record["Address"]?.trim() || "Address unavailable";
  const dwelling = record["Dwelling units impact"]?.trim?.() || undefined;

  return {
    id: record["Record ID"]?.trim() || String(record._id ?? crypto.randomUUID()),
    address: rawAddress,
    displayAddress: parseDisplayAddress(rawAddress),
    zipCode: parseZipCode(rawAddress),
    permitType: normalizePermitType(record["Permit Type"]),
    status: normalizePermitStatus(rawStatus),
    rawStatus,
    openedDate: toIsoDate(record["Date Opened"]),
    issuedDate: toIsoDate(record["Date Issued"]) ?? "",
    value: toNumber(record["Construction Total Cost"]),
    useOfBuilding: record["Use of Building"]?.trim() || undefined,
    dwellingUnitsImpact: dwelling,
  };
}

async function fetchPage(offset: number, limit: number): Promise<CkanSearchResponse["result"]> {
  const url = new URL(`${CKAN_BASE}/datastore_search`);
  url.searchParams.set("resource_id", RESOURCE_ID);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", '"Date Issued" desc');

  const res = await fetch(url.toString(), {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`CKAN page fetch failed at offset ${offset}: ${res.status}`);
  }

  const json = (await res.json()) as CkanSearchResponse;
  if (!json.success) {
    throw new Error(`CKAN returned success: false at offset ${offset}`);
  }
  return json.result;
}

async function fetchPackageMetadata(): Promise<string | undefined> {
  try {
    const url = new URL(`${CKAN_BASE}/package_show`);
    url.searchParams.set("id", PACKAGE_ID);

    const res = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return undefined;

    const json = (await res.json()) as CkanPackageResponse;
    if (!json.success) return undefined;

    const resourceMeta = json.result.resources?.find((r) => r.id === RESOURCE_ID);
    return resourceMeta?.last_modified ?? json.result.metadata_modified;
  } catch {
    return undefined;
  }
}

export function computeSummary(permits: Permit[]): PermitSummary {
  const RESIDENTIAL_KEYWORDS = ["residential", "res-", "single family", "duplex"];
  const COMMERCIAL_KEYWORDS = ["commercial", "com-", "multi-family", "industrial"];

  let totalConstructionValue = 0;
  let valuedCount = 0;
  let issuedCount = 0;
  let residentialCount = 0;
  let commercialCount = 0;
  let addedGainedUnits = 0;
  let lostEliminatedUnits = 0;
  const statusSet = new Set<string>();

  for (const p of permits) {
    if (p.rawStatus) statusSet.add(p.rawStatus);
    if (p.status === "issued") issuedCount++;

    const typeStr = p.permitType.toLowerCase();
    const idStr = p.id.toLowerCase();
    if (
      RESIDENTIAL_KEYWORDS.some((k) => typeStr.includes(k) || idStr.includes(k))
    ) {
      residentialCount++;
    } else if (
      COMMERCIAL_KEYWORDS.some((k) => typeStr.includes(k) || idStr.includes(k))
    ) {
      commercialCount++;
    }

    const dwelling = p.dwellingUnitsImpact?.toLowerCase() ?? "";
    if (dwelling.includes("added") || dwelling.includes("gained")) {
      addedGainedUnits++;
    } else if (dwelling.includes("lost") || dwelling.includes("eliminated")) {
      lostEliminatedUnits++;
    }

    if (typeof p.value === "number" && p.value > 0) {
      totalConstructionValue += p.value;
      valuedCount++;
    }
  }

  return {
    totalPermits: permits.length,
    issuedCount,
    residentialCount,
    commercialCount,
    addedGainedUnits,
    lostEliminatedUnits,
    totalConstructionValue,
    averageValue: valuedCount > 0 ? totalConstructionValue / valuedCount : 0,
    statusOptions: Array.from(statusSet).sort(),
  };
}

export async function fetchMilwaukeePermits(): Promise<FetchPermitsResult> {
  const appLastChecked = new Date().toISOString();

  const [first, sourceLastModified] = await Promise.all([
    fetchPage(0, PAGE_SIZE),
    fetchPackageMetadata(),
  ]);

  const total = first.total;
  const records: CkanRecord[] = [...first.records];

  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) {
    const page = await fetchPage(offset, PAGE_SIZE);
    records.push(...page.records);
    if (page.records.length < PAGE_SIZE) break;
  }

  const permits = records.map(normalizeRecord);

  return {
    permits,
    dataStatus: {
      source: SOURCE_NAME,
      resourceId: RESOURCE_ID,
      sourceLastModified,
      appLastChecked,
      totalRecords: total,
      loadedRecords: permits.length,
    },
  };
}
