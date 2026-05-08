/**
 * TFH Permit Type Taxonomy
 *
 * Maps the Milwaukee CKAN "Permit Type" field values to the client's
 * preferred reporting taxonomy. Unavailable categories (plumbing,
 * mechanical, electrical) are defined here so the UI can surface them
 * with honest "not in current CKAN resource" labels.
 *
 * ── Current CKAN "Permit Type" values ───────────────────────────────────────
 *   "Commercial Alteration Permit"
 *   "Residential Alteration Permit"
 *   "Residential New Construction Permit"
 *   "Commercial New Construction Permit"
 *
 * ── Not in CKAN ─────────────────────────────────────────────────────────────
 *   Plumbing, Mechanical/HVAC, Electrical, and Residential Addition permits
 *   exist in Milwaukee's permitting system but are published in a separate
 *   city data resource not yet integrated here.
 */

// ── Taxonomy types ────────────────────────────────────────────────────────────

export type TfhPermitTypeId =
  | "residential_new_construction"
  | "residential_addition"
  | "residential_alteration"
  | "commercial_new_construction"
  | "commercial_alteration"
  | "plumbing"
  | "mechanical_hvac"
  | "electrical"
  | "other";

export interface TfhPermitTypeInfo {
  id: TfhPermitTypeId;
  label: string;
  description: string;
  /**
   * Whether this permit type is present in the Milwaukee CKAN Building
   * Permits resource (resource_id 828e9630-d7cb-42e4-960e-964eae916397).
   */
  availableInCkan: boolean;
  /**
   * The raw "Permit Type" strings from CKAN that map to this TFH category.
   * Case-insensitive substring match.
   */
  ckanPermitTypes: string[];
  /**
   * Note shown in the UI when this category is not available in the
   * current data source.
   */
  unavailableNote?: string;
}

// ── Full taxonomy definition ──────────────────────────────────────────────────

export const TFH_PERMIT_TAXONOMY: TfhPermitTypeInfo[] = [
  {
    id: "residential_new_construction",
    label: "Residential New Construction",
    description: "Permits for new single-family or two-family homes.",
    availableInCkan: true,
    ckanPermitTypes: ["Residential New Construction Permit"],
  },
  {
    id: "residential_alteration",
    label: "Residential Alteration",
    description: "Permits for alterations, repairs, or improvements to existing residential structures.",
    availableInCkan: true,
    ckanPermitTypes: ["Residential Alteration Permit"],
  },
  {
    id: "residential_addition",
    label: "Residential Addition",
    description: "Permits for additions that expand the footprint or floor area of a residential structure.",
    availableInCkan: false,
    ckanPermitTypes: [],
    unavailableNote:
      "Residential additions are a subset of Residential Alteration in the current CKAN feed — they cannot be distinguished without the full permit-detail records.",
  },
  {
    id: "commercial_new_construction",
    label: "Commercial New Construction",
    description: "Permits for new commercial, industrial, or multi-unit residential buildings.",
    availableInCkan: true,
    ckanPermitTypes: ["Commercial New Construction Permit"],
  },
  {
    id: "commercial_alteration",
    label: "Commercial Alteration",
    description: "Permits for alterations or improvements to existing commercial/industrial structures.",
    availableInCkan: true,
    ckanPermitTypes: ["Commercial Alteration Permit"],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    description: "Permits for plumbing installation, repair, or replacement.",
    availableInCkan: false,
    ckanPermitTypes: [],
    unavailableNote:
      "Plumbing permits exist in Milwaukee's system but are not published in the current CKAN Building Permits resource. A separate data pull or city API endpoint is required.",
  },
  {
    id: "mechanical_hvac",
    label: "Mechanical / HVAC",
    description: "Permits for HVAC, furnaces, air conditioning, and mechanical systems.",
    availableInCkan: false,
    ckanPermitTypes: [],
    unavailableNote:
      "Mechanical/HVAC permits exist in Milwaukee's system but are not published in the current CKAN Building Permits resource.",
  },
  {
    id: "electrical",
    label: "Electrical",
    description: "Permits for electrical panel upgrades, wiring, and service changes.",
    availableInCkan: false,
    ckanPermitTypes: [],
    unavailableNote:
      "Electrical permits exist in Milwaukee's system but are not published in the current CKAN Building Permits resource.",
  },
  {
    id: "other",
    label: "Other / Unclassified",
    description: "Permit types not matching any of the above categories.",
    availableInCkan: true,
    ckanPermitTypes: [],
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

const TAXONOMY_BY_ID = new Map(TFH_PERMIT_TAXONOMY.map((t) => [t.id, t]));
const AVAILABLE = TFH_PERMIT_TAXONOMY.filter((t) => t.availableInCkan);
const UNAVAILABLE = TFH_PERMIT_TAXONOMY.filter((t) => !t.availableInCkan);

export function getTaxonomyById(id: TfhPermitTypeId): TfhPermitTypeInfo | undefined {
  return TAXONOMY_BY_ID.get(id);
}

/** Categories present in the current CKAN feed. */
export function getAvailableCategories(): TfhPermitTypeInfo[] {
  return AVAILABLE;
}

/** Categories defined in the TFH taxonomy but absent from CKAN. */
export function getUnavailableCategories(): TfhPermitTypeInfo[] {
  return UNAVAILABLE;
}

/**
 * Map a raw CKAN "Permit Type" string to the closest TFH taxonomy entry.
 * Returns "other" when no match is found.
 */
export function mapCkanPermitType(rawType: string | undefined): TfhPermitTypeId {
  if (!rawType) return "other";
  const lower = rawType.toLowerCase();
  for (const entry of AVAILABLE) {
    if (entry.ckanPermitTypes.some((t) => lower.includes(t.toLowerCase()))) {
      return entry.id;
    }
  }
  return "other";
}
