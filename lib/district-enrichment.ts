/**
 * District Enrichment — Feasibility Assessment
 *
 * Goal: attach a Milwaukee Common Council district (or aldermanic ward) to each
 * permit record so users can slice the dashboard by Council District.
 *
 * ── What exists ──────────────────────────────────────────────────────────────
 *
 * Milwaukee publishes aldermanic district boundaries via ArcGIS REST:
 *   https://gis.milwaukee.gov/arcgis/rest/services/MapMKE_Public/
 *     AldermanicDistricts/MapServer/0
 *
 * A spatial query to identify the district for a lat/lng pair looks like:
 *   GET .../query?geometry={x,y}&geometryType=esriGeometryPoint
 *         &inSR=4326&spatialRel=esriSpatialRelIntersects
 *         &outFields=DISTRICT&f=json
 *
 * ── Why it is not implemented in this sprint ────────────────────────────────
 *
 * 1. The CKAN permit feed has NO lat/lng fields — only a raw address string
 *    in the form "1234 W MAIN ST, MILWAUKEE, WI 532153114".
 *
 * 2. Geocoding 16,000+ addresses requires either:
 *    a) Milwaukee's own geocoder (mapservice.milwaukeecounty.gov) — rate-limited
 *    b) Google Maps / Mapbox Geocoding API — paid per lookup
 *    c) Census TIGER geocoder — free but slower and less accurate
 *
 * 3. Even after geocoding, each point requires a separate ArcGIS spatial query
 *    to determine which district polygon it falls in.
 *
 * 4. This two-step (geocode → spatial query) process at 16K records scale needs
 *    a persistent cache (database or KV store). The current architecture is
 *    stateless ISR with no such cache.
 *
 * ── Recommended implementation path ─────────────────────────────────────────
 *
 * Phase 1 — one-time enrichment batch:
 *   1. Export permit IDs + addresses from CKAN.
 *   2. Geocode addresses using Milwaukee County geocoder or Census TIGER.
 *   3. Spatial-join against ArcGIS aldermanic district layer.
 *   4. Store result as a static JSON lookup: { [permitId]: district }.
 *   5. Bundle the lookup with the app or serve from a KV/CDN.
 *
 * Phase 2 — incremental enrichment:
 *   1. On each CKAN fetch, identify new permits (IDs not in lookup).
 *   2. Geocode + spatial-join new IDs.
 *   3. Append to the lookup.
 *
 * ── Current UI behavior ──────────────────────────────────────────────────────
 *
 * The district filter in the UI is rendered as disabled with a tooltip
 * explaining the missing data dependency. This file provides the type
 * definitions and the stub enrichment interface for when Phase 1 is built.
 */

// ── Public types ──────────────────────────────────────────────────────────────

/** Milwaukee Common Council aldermanic district (1–15). */
export type CouncilDistrict =
  | "1" | "2" | "3" | "4" | "5"
  | "6" | "7" | "8" | "9" | "10"
  | "11" | "12" | "13" | "14" | "15";

export interface DistrictEnrichment {
  /** The CKAN Record ID this enrichment applies to. */
  permitId: string;
  district: CouncilDistrict;
  /** Lat/lng used for the spatial join (from geocoding the permit address). */
  lat: number;
  lng: number;
  /** ISO timestamp when this enrichment was computed. */
  enrichedAt: string;
}

export interface DistrictEnrichmentResult {
  district: CouncilDistrict | null;
  lat: number | null;
  lng: number | null;
  /** Null if enrichment succeeded or was skipped; error message otherwise. */
  error: string | null;
}

// ── ArcGIS REST endpoint reference ───────────────────────────────────────────

export const ARCGIS_DISTRICT_LAYER =
  "https://gis.milwaukee.gov/arcgis/rest/services/MapMKE_Public/AldermanicDistricts/MapServer/0";

export const DISTRICT_QUERY_TEMPLATE = (lat: number, lng: number) =>
  `${ARCGIS_DISTRICT_LAYER}/query?` +
  `geometry=${lng},${lat}` +
  `&geometryType=esriGeometryPoint` +
  `&inSR=4326` +
  `&spatialRel=esriSpatialRelIntersects` +
  `&outFields=DISTRICT` +
  `&returnGeometry=false` +
  `&f=json`;

// ── Stub enrichment function (Phase 1 placeholder) ────────────────────────────

/**
 * NOT IMPLEMENTED — placeholder for the Phase 1 enrichment pipeline.
 *
 * When implemented, this function should:
 *   1. Geocode `address` using the Milwaukee County or Census geocoder.
 *   2. Query ARCGIS_DISTRICT_LAYER with the resulting lat/lng.
 *   3. Return the matching DISTRICT value.
 *
 * @throws {Error} Always throws until the geocoding pipeline is implemented.
 */
export async function enrichPermitWithDistrict(
  _permitId: string,
  _address: string,
): Promise<DistrictEnrichmentResult> {
  throw new Error(
    "District enrichment is not yet implemented. " +
      "See lib/district-enrichment.ts for the implementation roadmap.",
  );
}

/**
 * Returns true when the district enrichment pipeline is operational.
 * Set to true once Phase 1 (batch geocoding + spatial join) is complete.
 */
export const DISTRICT_ENRICHMENT_AVAILABLE = false;

export const ALL_DISTRICTS: CouncilDistrict[] = [
  "1", "2", "3", "4", "5", "6", "7", "8",
  "9", "10", "11", "12", "13", "14", "15",
];
