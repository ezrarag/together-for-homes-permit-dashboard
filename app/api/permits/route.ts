import { type NextRequest, NextResponse } from "next/server";
import { fetchMilwaukeePermits } from "@/lib/milwaukee-open-data";
import { PERMIT_API_MAX_PAGE_SIZE, PERMIT_PAGE_SIZE } from "@/lib/permit-config";
import { filterPermits } from "@/lib/permits";
import type { Permit, PermitFilters } from "@/lib/types";

export const revalidate = 60 * 60 * 12;

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function permitsToCsv(permits: Permit[]): string {
  const header = [
    "id",
    "address",
    "zipCode",
    "type",
    "status",
    "rawStatus",
    "openedDate",
    "issuedDate",
    "constructionTotalCost",
    "useOfBuilding",
    "dwellingUnitsImpact",
  ];

  const rows = permits.map((permit) =>
    [
      permit.id,
      permit.address,
      permit.zipCode,
      permit.permitType,
      permit.status,
      permit.rawStatus,
      permit.openedDate,
      permit.issuedDate,
      permit.value,
      permit.useOfBuilding,
      permit.dwellingUnitsImpact,
    ]
      .map(csvCell)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page = positiveInt(searchParams.get("page"), 1);
  const limit = Math.min(
    PERMIT_API_MAX_PAGE_SIZE,
    positiveInt(searchParams.get("limit"), PERMIT_PAGE_SIZE),
  );
  const exportMode = searchParams.get("export");

  const raw = {
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    zipCode: searchParams.get("zipCode") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };

  // Strip undefined and "all" sentinel from type
  const filters: PermitFilters = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== "all"),
  );

  try {
    const { permits: allPermits } = await fetchMilwaukeePermits();
    const filtered = filterPermits(allPermits, filters);
    const total = filtered.length;

    if (exportMode === "csv") {
      return new NextResponse(permitsToCsv(filtered), {
        headers: {
          "Cache-Control": `public, s-maxage=${60 * 60 * 12}, stale-while-revalidate`,
          "Content-Disposition": `attachment; filename="permits-export.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    const pageCount = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, pageCount);
    const permits = filtered.slice(
      (currentPage - 1) * limit,
      currentPage * limit,
    );

    return NextResponse.json(
      { permits, total, page: currentPage, pageCount },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${60 * 60 * 12}, stale-while-revalidate`,
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
