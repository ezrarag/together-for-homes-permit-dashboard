import samplePermits from "@/data/sample-permits.json";
import { fetchMilwaukeePermits } from "@/lib/milwaukee-open-data";
import type { Permit, PermitFilters } from "@/lib/types";

export async function getPermits(): Promise<Permit[]> {
  try {
    const permits = await fetchMilwaukeePermits();
    return permits.length > 0 ? permits : (samplePermits as Permit[]);
  } catch {
    return samplePermits as Permit[];
  }
}

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

    if (filters.zipCode && !permit.zipCode.includes(filters.zipCode)) {
      return false;
    }

    if (filters.neighborhood && permit.neighborhood !== filters.neighborhood) {
      return false;
    }

    if (filters.dateFrom && permit.issuedDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && permit.issuedDate > filters.dateTo) {
      return false;
    }

    if (filters.search) {
      const haystack = [
        permit.address,
        permit.contractor,
        permit.description,
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
