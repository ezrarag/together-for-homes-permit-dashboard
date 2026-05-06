import DashboardClient from "@/components/DashboardClient";
import { computeSummary, fetchMilwaukeePermits } from "@/lib/milwaukee-open-data";
import { PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import type { DataStatus, Permit, PermitSummary } from "@/lib/types";

export const revalidate = 60 * 60 * 12;

export default async function DashboardPage() {
  let initialPermits: Permit[] = [];
  let initialTotal = 0;
  let summary: PermitSummary;
  let initialDataStatus: DataStatus;

  try {
    const { permits: allPermits, dataStatus } = await fetchMilwaukeePermits();
    // Compute summary from full dataset server-side; send only first page to client
    summary = computeSummary(allPermits);
    initialPermits = allPermits.slice(0, PERMIT_PAGE_SIZE);
    initialTotal = allPermits.length;
    initialDataStatus = dataStatus;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    summary = {
      totalPermits: 0,
      issuedCount: 0,
      residentialCount: 0,
      commercialCount: 0,
      addedGainedUnits: 0,
      lostEliminatedUnits: 0,
      totalConstructionValue: 0,
      averageValue: 0,
      statusOptions: [],
    };
    initialDataStatus = {
      source: "Milwaukee Open Data – Building Permits",
      resourceId: "828e9630-d7cb-42e4-960e-964eae916397",
      appLastChecked: new Date().toISOString(),
      totalRecords: 0,
      loadedRecords: 0,
      error: message,
    };
  }

  return (
    <DashboardClient
      initialPermits={initialPermits}
      initialTotal={initialTotal}
      summary={summary}
      initialDataStatus={initialDataStatus}
    />
  );
}
