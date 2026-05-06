import { computeSummary, fetchMilwaukeePermits } from "@/lib/milwaukee-open-data";
import { PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import type { DataStatus, Permit, PermitSummary } from "@/lib/types";

export interface DashboardData {
  initialPermits: Permit[];
  initialTotal: number;
  summary: PermitSummary;
  initialDataStatus: DataStatus;
}

const EMPTY_SUMMARY: PermitSummary = {
  totalPermits: 0,
  issuedCount: 0,
  residentialCount: 0,
  commercialCount: 0,
  addedGainedUnits: 0,
  lostEliminatedUnits: 0,
  totalConstructionValue: 0,
  averageValue: 0,
  statusOptions: [],
  permitsByType: [],
  permitsByUse: [],
  dwellingImpact: { maintain: 0, added: 0, lost: 0 },
  monthlyTrend: [],
};

const ERROR_STATUS = (message: string): DataStatus => ({
  source: "Milwaukee Open Data – Building Permits",
  resourceId: "828e9630-d7cb-42e4-960e-964eae916397",
  appLastChecked: new Date().toISOString(),
  totalRecords: 0,
  loadedRecords: 0,
  error: message,
});

export async function loadDashboardData(): Promise<DashboardData> {
  try {
    const { permits: allPermits, dataStatus } = await fetchMilwaukeePermits();
    return {
      summary: computeSummary(allPermits),
      initialPermits: allPermits.slice(0, PERMIT_PAGE_SIZE),
      initialTotal: allPermits.length,
      initialDataStatus: dataStatus,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      summary: EMPTY_SUMMARY,
      initialPermits: [],
      initialTotal: 0,
      initialDataStatus: ERROR_STATUS(message),
    };
  }
}
