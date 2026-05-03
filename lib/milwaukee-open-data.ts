import type { Permit, PermitStatus, PermitType } from "@/lib/types";

const DEFAULT_OPEN_DATA_URL =
  "https://data.milwaukee.gov/resource/4uui-hhe4.json";

interface SocrataPermitRecord {
  permit_no?: string;
  address?: string;
  permit_type?: string;
  status?: string;
  issue_date?: string;
  expire_date?: string;
  estimated_value?: string;
  latitude?: string;
  longitude?: string;
  neighborhood?: string;
  zip?: string;
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

function toNumber(value?: string): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeRecord(record: SocrataPermitRecord): Permit | null {
  const lat = Number(record.latitude);
  const lng = Number(record.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: record.permit_no?.trim() || crypto.randomUUID(),
    address: record.address?.trim() || "Address unavailable",
    neighborhood: record.neighborhood?.trim() || "Unknown",
    zipCode: record.zip?.trim() || "",
    permitType: normalizePermitType(record.permit_type),
    status: normalizePermitStatus(record.status),
    issuedDate: toIsoDate(record.issue_date) ?? "",
    expirationDate: toIsoDate(record.expire_date),
    value: toNumber(record.estimated_value),
    lat,
    lng,
  };
}

export async function fetchMilwaukeePermits(limit = 500): Promise<Permit[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_MILWAUKEE_OPEN_DATA_URL ?? DEFAULT_OPEN_DATA_URL;
  const url = new URL(baseUrl);

  url.searchParams.set("$limit", String(limit));
  url.searchParams.set("$order", "issue_date DESC");

  const response = await fetch(url, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Milwaukee permits: ${response.status}`);
  }

  const records = (await response.json()) as SocrataPermitRecord[];
  return records
    .map(normalizeRecord)
    .filter((permit): permit is Permit => permit !== null);
}
