"use client";

import { AlertTriangle, BarChart2, Building2, Calendar, ChevronDown, ChevronUp, HardHat, Home, MapPin } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  {
    icon: <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />,
    title: "Days to Issue measures application-to-approval",
    body: "The clock starts at Date Opened (when the application was submitted) and stops at Date Issued (when the permit was approved). This includes any time the permit sat waiting for applicant corrections, fee payments, or resubmission — it is NOT a pure measure of city review time.",
  },
  {
    icon: <BarChart2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />,
    title: 'Current CKAN Status field is always "Issued"',
    body: 'All 16,000+ records in the Milwaukee Open Data permit feed carry Status = "Issued". Pending-Client and In-Progress buckets reflect permits with applicationDate but no issueDate — in the current feed that count is near zero. True processing-status history requires a separate city system endpoint.',
  },
  {
    icon: <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />,
    title: "Council District filtering not yet available",
    body: "The current permit feed does not include Ward, Council District, aldermanic district, latitude, or longitude. District filtering would require geocoding each address against Milwaukee's GIS parcel layer. This enrichment is planned but not yet implemented.",
  },
  {
    icon: <Home className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />,
    title: "Permit Type categories",
    body: 'The CKAN feed currently includes four permit types: Residential New Construction, Residential Alteration, Commercial New Construction, and Commercial Alteration. Plumbing, mechanical, and electrical permits are not in this resource. Project Category (Residential / Multi-Family / Commercial / Other) is computed from "Use of Building" and "Permit Type" via keyword matching.',
  },
  {
    icon: <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />,
    title: "Completion / Certificate of Occupancy data unavailable",
    body: 'The current source does not publish CO records. The "Completed" lifecycle stage is a UI placeholder; its count will always be 0 until a CO data source is integrated.',
  },
];

export default function MethodologyNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
            Methodology &amp; Data Limitations
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-700">
          {open ? (
            <>Hide <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show <ChevronDown className="h-3 w-3" /></>
          )}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-3">
          {ITEMS.map((item) => (
            <li key={item.title} className="flex gap-3">
              {item.icon}
              <div>
                <p className="text-xs font-semibold text-amber-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-800">{item.body}</p>
              </div>
            </li>
          ))}
          <li className="rounded-lg border border-amber-200 bg-white/60 px-3 py-2">
            <p className="text-xs font-semibold text-amber-900">Data source</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Milwaukee Open Data · Building Permits · CKAN resource{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[10px]">
                828e9630-d7cb-42e4-960e-964eae916397
              </code>{" "}
              · refreshed every 12 hours
            </p>
          </li>
        </ul>
      )}
    </div>
  );
}
