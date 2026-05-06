import type { Permit, PermitFilters } from "@/lib/types";

export function filterPermits(
  permits: Permit[],
  filters: PermitFilters = {},
): Permit[] {
  return permits.filter((permit) => {
    if (filters.type && filters.type !== "all" && permit.permitType !== filters.type) {
      return false;
    }

    if (filters.status && filters.status !== "all" && permit.status !== filters.status) {
      return false;
    }

    if (filters.zipCode && !(permit.zipCode ?? "").includes(filters.zipCode)) {
      return false;
    }

    if (filters.neighborhood && permit.neighborhood !== filters.neighborhood) {
      return false;
    }

    const dateField = permit.issuedDate || permit.openedDate || "";

    if (filters.dateFrom && dateField < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && dateField > filters.dateTo) {
      return false;
    }

    if (filters.search) {
      const haystack = [permit.address, permit.useOfBuilding]
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
