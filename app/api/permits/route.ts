import { type NextRequest, NextResponse } from "next/server";
import { fetchMilwaukeePermits } from "@/lib/milwaukee-open-data";
import { filterPermits } from "@/lib/permits";
import type { PermitFilters } from "@/lib/types";

export const revalidate = 60 * 60 * 12;

const PAGE_SIZE_MAX = 200;
const PAGE_SIZE_DEFAULT = 25;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number(searchParams.get("limit") ?? String(PAGE_SIZE_DEFAULT))),
  );

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
