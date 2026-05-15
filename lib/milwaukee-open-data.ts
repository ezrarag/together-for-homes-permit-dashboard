import type {
  DataStatus,
  DwellingImpactBreakdown,
  MonthlyDataPoint,
  Permit,
  PermitLifecycleStage,
  PermitProjectCategory,
  PermitStatus,
  PermitSummary,
  PermitType,
  PermitTypeBreakdown,
  ProjectCategoryBreakdown,
  UseOfBuildingBreakdown,
} from "@/lib/types";

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action";
const RESOURCE_ID = "828e9630-d7cb-42e4-960e-964eae916397";
const PACKAGE_ID = "buildingpermits";
const SOURCE_NAME = "Milwaukee Open Data – Building Permits";
const PAGE_SIZE = 5000;
const REVALIDATE_SECONDS = 60 * 60 * 12;

// ── CKAN response shapes ─────────────────────────────────────────────────────

interface CkanRecord {
  _id?: number;
  "Record ID"?: string;
  "Address"?: string;
  /** Actual CKAN field name */
  "Permit Type"?: string;
  /** Actual CKAN field name — currently always "Issued" in this dataset */
  "Status"?: string;
  /** Actual CKAN field name */
  "Date Opened"?: string;
  /** Actual CKAN field name */
  "Date Issued"?: string;
  /** Actual CKAN field name */
  "Construction Total Cost"?: string | number;
  /** Actual CKAN field name */
  "Use of Building"?: string | null;
  /** Actual CKAN field name: "Maintain Current Units" | "Added or Gained" | "Lost or Eliminated" */
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

// ── Normalization helpers ────────────────────────────────────────────────────

/**
 * Classify a permit into a housing-production project category.
 * Inspects "Use of Building" first (more specific), then falls back to
 * the raw "Permit Type" string.
 */
function normalizeProjectCategory(
  useOfBuilding?: string,
  permitTypeRaw?: string,
): PermitProjectCategory {
  const use = (useOfBuilding ?? "").toLowerCase().trim();
  const raw = (permitTypeRaw ?? "").toLowerCase().trim();
  const combined = `${use} ${raw}`;

  // ── Single-family / duplex (1–2 units) ───────────────────────────────────
  if (
    combined.includes("single family") ||
    combined.includes("1-2 family") ||
    combined.includes("1 family") ||
    combined.includes("2 family") ||
    combined.includes("two family") ||
    combined.includes("duplex") ||
    combined.includes("sfr") ||
    combined.includes("sfd") ||
    /\bone[\s-]family/.test(combined) ||
    /\btwo[\s-]family/.test(combined)
  ) {
    return "residential_single_duplex";
  }

  // ── Multi-family (3+ units) ───────────────────────────────────────────────
  if (
    combined.includes("multifamily") ||
    combined.includes("multi-family") ||
    combined.includes("multi family") ||
    combined.includes("apartment") ||
    combined.includes("3 family") ||
    combined.includes("4 family") ||
    combined.includes("5 family") ||
    combined.includes("condo") ||
    combined.includes("townhome") ||
    combined.includes("townhouse") ||
    /\b[3-9]\d*[\s-]family/.test(combined)
  ) {
    return "multi_family";
  }

  // ── Commercial / industrial ───────────────────────────────────────────────
  if (
    combined.includes("commercial") ||
    combined.includes("office") ||
    combined.includes("retail") ||
    combined.includes("industrial") ||
    combined.includes("warehouse") ||
    combined.includes("store") ||
    combined.includes("restaurant") ||
    combined.includes("business") ||
    combined.includes("mercantile") ||
    combined.includes("assembly") ||
    combined.includes("institutional")
  ) {
    return "commercial";
  }

  return "other";
}

/**
 * Determine the lifecycle stage a permit has reached.
 * "completed_unavailable" represents the CO/completion stage that is NOT
 * tracked in the current CKAN source — it is a UI label, never derived from data.
 */
function determineLifecycleStage(
  applicationDate?: string,
  issueDate?: string,
): PermitLifecycleStage {
  if (issueDate) return "permit_issued";
  if (applicationDate) return "application_received";
  // Edge case: record present but both dates absent
  return "application_received";
}

/** Maps raw "Permit Type" values (case-insensitive substring match) to internal slugs. */
function normalizePermitType(value?: string): PermitType {
  const normalized = value?.toLowerCase().trim() ?? "";
  if (normalized.includes("new")) return "new_construction";
  if (normalized.includes("alter") || normalized.includes("reno")) return "renovation";
  if (normalized.includes("demo")) return "demolition";
  if (normalized.includes("electric")) return "electrical";
  if (normalized.includes("plumb")) return "plumbing";
  if (normalized.includes("mechanic") || normalized.includes("hvac")) return "mechanical";
  return "other";
}

/** Maps raw "Status" values to internal slugs. */
function normalizePermitStatus(value?: string): PermitStatus {
  const normalized = value?.toLowerCase().trim() ?? "";
  if (normalized.includes("issued")) return "issued";
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

function toNumber(value?: string | number | null): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : undefined;
}

function maxIsoDate(values: Array<string | undefined>): string | undefined {
  return values.reduce<string | undefined>((latest, value) => {
    if (!value) return latest;
    if (!latest || value > latest) return value;
    return latest;
  }, undefined);
}

const ZIP_REGEX = /\b(\d{5})(\d{4})?\b\s*$/;

function parseZipCode(address?: string): string | undefined {
  if (!address) return undefined;
  const match = address.match(ZIP_REGEX);
  return match?.[1];
}

/** Strips city/state/ZIP suffix: "1234 W MAIN ST, MILWAUKEE, WI 532153114" → "1234 W MAIN ST" */
function parseDisplayAddress(address?: string): string | undefined {
  if (!address) return undefined;
  const idx = address.indexOf(",");
  return idx > 0 ? address.slice(0, idx).trim() : address.trim();
}

function normalizeRecord(record: CkanRecord): Permit {
  const rawStatus = record["Status"]?.trim();
  const rawAddress = record["Address"]?.trim() || "Address unavailable";
  const dwelling = record["Dwelling units impact"]?.trim?.() || undefined;
  const rawPermitType = record["Permit Type"]?.trim() || undefined;
  const useOfBuilding = record["Use of Building"]?.trim() || undefined;

  // Canonical date fields (packet-1 names)
  const applicationDate = toIsoDate(record["Date Opened"]);
  const issueDate = toIsoDate(record["Date Issued"]);
  const valuation = toNumber(record["Construction Total Cost"]);

  return {
    id: record["Record ID"]?.trim() || String(record._id ?? crypto.randomUUID()),
    address: rawAddress,
    displayAddress: parseDisplayAddress(rawAddress),
    zipCode: parseZipCode(rawAddress),

    permitType: normalizePermitType(rawPermitType),
    // Packet-1 canonical name + legacy alias
    permitTypeDescription: rawPermitType,
    permitTypeRaw: rawPermitType,

    status: normalizePermitStatus(rawStatus),
    rawStatus,

    // Packet-1 canonical names + legacy aliases
    applicationDate,
    openedDate: applicationDate,
    issuedDate: issueDate ?? "",
    issueDate: issueDate ?? undefined,

    // Packet-1 canonical name + legacy alias
    valuation,
    value: valuation,

    useOfBuilding,
    dwellingUnitsImpact: dwelling,

    // Computed classification fields
    projectCategory: normalizeProjectCategory(useOfBuilding, rawPermitType),
    lifecycleStage: determineLifecycleStage(applicationDate, issueDate ?? undefined),
  };
}

// ── CKAN fetch helpers ───────────────────────────────────────────────────────

async function fetchPage(
  offset: number,
  limit: number,
): Promise<CkanSearchResponse["result"]> {
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

// ── Summary computation ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<PermitProjectCategory, string> = {
  residential_single_duplex: "Residential (1–2 Unit)",
  multi_family: "Multi-Family (3+ Units)",
  commercial: "Commercial / Industrial",
  other: "Other / Unclassified",
};

const CATEGORY_ORDER: PermitProjectCategory[] = [
  "residential_single_duplex",
  "multi_family",
  "commercial",
  "other",
];

const TYPE_LABELS: Record<PermitType, string> = {
  new_construction: "New Construction",
  renovation: "Renovation",
  demolition: "Demolition",
  electrical: "Electrical",
  plumbing: "Plumbing",
  mechanical: "Mechanical",
  other: "Other",
};

const RESIDENTIAL_KEYWORDS = ["residential", "res-", "single family", "duplex"];
const COMMERCIAL_KEYWORDS = ["commercial", "com-", "multi-family", "industrial"];

/** Computes all summary and chart breakdown data from the full permit list. */
export function computeSummary(permits: Permit[]): PermitSummary {
  let totalConstructionValue = 0;
  let valuedCount = 0;
  let issuedCount = 0;
  let residentialCount = 0;
  let commercialCount = 0;
  let addedGainedUnits = 0;
  let lostEliminatedUnits = 0;
  const statusSet = new Set<string>();

  // Chart accumulators
  const typeMap = new Map<PermitType, { count: number; totalValue: number }>();
  const useMap = new Map<string, number>();
  const monthMap = new Map<string, { count: number; totalValue: number }>();
  const dwellingImpact: DwellingImpactBreakdown = { maintain: 0, added: 0, lost: 0 };

  // Per-category aggregates for Report Hub cards
  const categoryMap = new Map<
    PermitProjectCategory,
    { count: number; permitsIssued: number; totalValuation: number; unitsAdded: number; unitsLost: number }
  >();

  for (const p of permits) {
    // KPI counters
    if (p.rawStatus) statusSet.add(p.rawStatus);
    if (p.status === "issued") issuedCount++;

    const useStr = (p.useOfBuilding ?? "").toLowerCase();
    if (RESIDENTIAL_KEYWORDS.some((k) => useStr.includes(k))) {
      residentialCount++;
    } else if (COMMERCIAL_KEYWORDS.some((k) => useStr.includes(k))) {
      commercialCount++;
    }

    const dwelling = p.dwellingUnitsImpact?.toLowerCase() ?? "";
    if (dwelling.includes("added") || dwelling.includes("gained")) {
      addedGainedUnits++;
      dwellingImpact.added++;
    } else if (dwelling.includes("lost") || dwelling.includes("eliminated")) {
      lostEliminatedUnits++;
      dwellingImpact.lost++;
    } else if (dwelling) {
      // "Maintain Current Units" and any other non-empty value
      dwellingImpact.maintain++;
    }

    const val = p.value ?? 0;
    if (typeof p.value === "number" && p.value > 0) {
      totalConstructionValue += p.value;
      valuedCount++;
    }

    // Category breakdown for Report Hub cards
    {
      const cat = p.projectCategory;
      const catDwelling = dwelling;
      const catExisting = categoryMap.get(cat) ?? {
        count: 0,
        permitsIssued: 0,
        totalValuation: 0,
        unitsAdded: 0,
        unitsLost: 0,
      };
      categoryMap.set(cat, {
        count: catExisting.count + 1,
        permitsIssued: catExisting.permitsIssued + (p.issueDate ? 1 : 0),
        totalValuation:
          catExisting.totalValuation +
          (typeof p.value === "number" && p.value > 0 ? p.value : 0),
        unitsAdded:
          catExisting.unitsAdded +
          (catDwelling.includes("added") || catDwelling.includes("gained") ? 1 : 0),
        unitsLost:
          catExisting.unitsLost +
          (catDwelling.includes("lost") || catDwelling.includes("eliminated") ? 1 : 0),
      });
    }

    // Permit type breakdown
    const existing = typeMap.get(p.permitType) ?? { count: 0, totalValue: 0 };
    typeMap.set(p.permitType, {
      count: existing.count + 1,
      totalValue: existing.totalValue + val,
    });

    // Use of building breakdown (raw "Use of Building" field)
    const useKey = p.useOfBuilding?.trim() || "(not specified)";
    useMap.set(useKey, (useMap.get(useKey) ?? 0) + 1);

    // Monthly trend (from "Date Issued")
    const month = p.issuedDate?.slice(0, 7); // "YYYY-MM"
    if (month && month.length === 7) {
      const me = monthMap.get(month) ?? { count: 0, totalValue: 0 };
      monthMap.set(month, { count: me.count + 1, totalValue: me.totalValue + val });
    }
  }

  // ── Assemble chart arrays ──

  const permitsByType: PermitTypeBreakdown[] = (
    Object.keys(TYPE_LABELS) as PermitType[]
  )
    .map((type) => ({
      type,
      label: TYPE_LABELS[type],
      ...(typeMap.get(type) ?? { count: 0, totalValue: 0 }),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const permitsByUse: UseOfBuildingBreakdown[] = Array.from(useMap.entries())
    .map(([use, count]) => ({ use, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Monthly trend: last 24 months, chronological order
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 24);
  const cutoffStr = cutoffDate.toISOString().slice(0, 7);

  const monthlyTrend: MonthlyDataPoint[] = Array.from(monthMap.entries())
    .filter(([month]) => month >= cutoffStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [yearStr, monthStr] = month.split("-");
      const label = new Date(Number(yearStr), Number(monthStr) - 1, 1).toLocaleDateString(
        "en-US",
        { month: "short", year: "2-digit" },
      );
      return { month, label, ...data };
    });

  const projectCategoryBreakdown: ProjectCategoryBreakdown[] = CATEGORY_ORDER
    .filter((cat) => categoryMap.has(cat))
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      ...(categoryMap.get(cat)!),
    }));

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
    // Chart data
    permitsByType,
    permitsByUse,
    dwellingImpact,
    monthlyTrend,
    // Report Hub card data
    projectCategoryBreakdown,
  };
}

// ── Main export ──────────────────────────────────────────────────────────────

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
  const latestApplicationDate = maxIsoDate(permits.map((permit) => permit.applicationDate));
  const latestIssueDate = maxIsoDate(permits.map((permit) => permit.issueDate));

  return {
    permits,
    dataStatus: {
      source: SOURCE_NAME,
      resourceId: RESOURCE_ID,
      sourceLastModified,
      latestApplicationDate,
      latestIssueDate,
      appLastChecked,
      totalRecords: total,
      loadedRecords: permits.length,
    },
  };
}
