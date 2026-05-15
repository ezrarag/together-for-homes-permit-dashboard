import { NextResponse } from "next/server";
import { auditAccelaRecordsSource } from "@/lib/accela-open-records";

export const dynamic = "force-dynamic";

export async function GET() {
  const audit = await auditAccelaRecordsSource();

  return NextResponse.json(audit, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
