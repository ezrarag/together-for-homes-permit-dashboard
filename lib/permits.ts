import type {
  FilteredSummary,
  MonthlyMetrics,
  Permit,
  PermitFilters,
} from "@/lib/types";

/** Apply the client-supplied filter set to a full permit list. */
export function filterPermits(
  permits: Permit[],
  filters: PermitFilters = {},
): Permit[] {
  return permits.filter((permit) => {
    if (filters.type && filters.type !== "all" && permit.permitType !== filters.type) {
      return false;
    }

    if (
      filters.projectCategory &&
      filters.projectCategory !== "all" &&
      permit.projectCategory !== filters.projectCategory
    ) {
      return false;
    }

    if (filters.status && (permit.rawStatus ?? permit.status) !== filters.status) {
      return false;
    }

    if (filters.zipCode && (permit.zipCode ?? "") !== filters.zipCode) {
      return false;
    }

    // Date range uses issueDate ("Date Issued") as the primary axis.
    // Falls back to applicationDate ("Date Opened") when issueDate is absent.
    const dateField = permit.issueDate || permit.applicationDate || "";

    if (filters.dateFrom && dateField < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && dateField > filters.dateTo) {
      return false;
    }

    if (filters.search) {
      const haystack = [
        permit.address,
        permit.displayAddress,
        permit.useOfBuilding,
        permit.permitTypeDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

// ── Per-filter aggregate metrics ─────────────────────────────────────────────

/**
 * Compute the six KPI metrics for a (already-filtered) permit list.
 *
 * - Applications Received: permits with applicationDate ("Date Opened") set
 * - Permits Issued: permits with issueDate ("Date Issued") set
 * - Completed / Occupancy: "Not available in current CKAN feed" — the source
 *   does not publish Certificate of Occupancy records
 * - Total Valuation: sum of "Construction Total Cost"
 * - Units Added: permits where "Dwelling units impact" includes "Added or Gained"
 * - Units Lost: permits where "Dwelling units impact" includes "Lost or Eliminated"
 */
export function computeFilteredSummary(permits: Permit[]): FilteredSummary {
  let applicationsReceived = 0;
  let permitsIssued = 0;
  let totalValuation = 0;
  let unitsAdded = 0;
  let unitsLost = 0;

  for (const p of permits) {
    if (p.applicationDate) applicationsReceived++;
    if (p.issueDate) permitsIssued++;
    if (typeof p.valuation === "number" && p.valuation > 0) {
      totalValuation += p.valuation;
    }

    const dwelling = p.dwellingUnitsImpact?.toLowerCase() ?? "";
    if (dwelling.includes("added") || dwelling.includes("gained")) unitsAdded++;
    if (dwelling.includes("lost") || dwelling.includes("eliminated")) unitsLost++;
  }

  return {
    applicationsReceived,
    permitsIssued,
    // The CO/completion stage is not in the CKAN source.
    completedOccupancy: "Not available in current CKAN feed",
    totalValuation,
    unitsAdded,
    unitsLost,
  };
}

// ── Monthly time series ───────────────────────────────────────────────────────

/**
 * Build a monthly time series from a (already-filtered) permit list.
 *
 * - applicationsReceived grouped by applicationDate ("Date Opened")
 * - permitsIssued, valuation, unitsAdded, unitsLost grouped by issueDate ("Date Issued")
 *
 * Returns all months present in the data, sorted chronologically.
 * The caller is responsible for truncating to a display window if needed.
 */
export function computeMonthlyData(permits: Permit[]): MonthlyMetrics[] {
  const applicationMap = new Map<string, number>();
  const issuedMap = new Map<
    string,
    { count: number; valuation: number; unitsAdded: number; unitsLost: number }
  >();

  for (const p of permits) {
    // Applications received — keyed by "Date Opened" month
    if (p.applicationDate) {
      const month = p.applicationDate.slice(0, 7);
      if (month.length === 7) {
        applicationMap.set(month, (applicationMap.get(month) ?? 0) + 1);
      }
    }

    // Permits issued / valuation / units — keyed by "Date Issued" month
    if (p.issueDate) {
      const month = p.issueDate.slice(0, 7);
      if (month.length === 7) {
        const existing = issuedMap.get(month) ?? {
          count: 0,
          valuation: 0,
          unitsAdded: 0,
          unitsLost: 0,
        };
        const dwelling = p.dwellingUnitsImpact?.toLowerCase() ?? "";
        issuedMap.set(month, {
          count: existing.count + 1,
          valuation:
            existing.valuation +
            (typeof p.valuation === "number" && p.valuation > 0 ? p.valuation : 0),
          unitsAdded:
            existing.unitsAdded +
            (dwelling.includes("added") || dwelling.includes("gained") ? 1 : 0),
          unitsLost:
            existing.unitsLost +
            (dwelling.includes("lost") || dwelling.includes("eliminated") ? 1 : 0),
        });
      }
    }
  }

  // Union of all months across both date axes, sorted chronologically
  const allMonths = new Set(
    Array.from(applicationMap.keys()).concat(Array.from(issuedMap.keys())),
  );

  return Array.from(allMonths)
    .sort()
    .map((month) => {
      const [yearStr, monthStr] = month.split("-");
      const label = new Date(
        Number(yearStr),
        Number(monthStr) - 1,
        1,
      ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const issued = issuedMap.get(month) ?? {
        count: 0,
        valuation: 0,
        unitsAdded: 0,
        unitsLost: 0,
      };

      return {
        month,
        label,
        applicationsReceived: applicationMap.get(month) ?? 0,
        permitsIssued: issued.count,
        valuation: issued.valuation,
        unitsAdded: issued.unitsAdded,
        unitsLost: issued.unitsLost,
      };
    });
}
