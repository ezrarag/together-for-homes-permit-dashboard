"use client";

import { useState } from "react";

const ITEMS = [
  {
    label: "Timing",
    title: "Days to Issue measures application-to-approval",
    body: "The clock starts at Date Opened and stops at Date Issued. This includes time waiting for applicant corrections, fee payments, or resubmission, so it is not a pure measure of city review time.",
  },
  {
    label: "Status",
    title: 'Current CKAN Status field is always "Issued"',
    body: 'All 16,000+ records in the Milwaukee Open Data permit feed carry Status = "Issued". Pending-Client, In-Progress, Fee-Due, and Denied statuses require live LMS/Accela workflow data.',
  },
  {
    label: "Districts",
    title: "Council District filtering not yet available",
    body: "The current permit feed does not include Ward, Council District, aldermanic district, latitude, or longitude. District filtering would require geocoding each address against Milwaukee's GIS parcel layer. This enrichment is planned but not yet implemented.",
  },
  {
    label: "Types",
    title: "Permit Type categories",
    body: 'The CKAN feed currently includes four permit types: Residential New Construction, Residential Alteration, Commercial New Construction, and Commercial Alteration. Plumbing, mechanical, and electrical permits are not in this resource. Project Category (Residential / Multi-Family / Commercial / Other) is computed from "Use of Building" and "Permit Type" via keyword matching.',
  },
  {
    label: "Units",
    title: "Unit counts are permit-count proxies",
    body: 'The current source has a Dwelling units impact flag, not a numeric housing-unit count. "Permits marked units added" counts permit records flagged Added or Gained, not the number of units approved.',
  },
  {
    label: "CO",
    title: "Completion / Certificate of Occupancy data unavailable",
    body: 'The current source does not publish CO records. Completion metrics require a separate certificate of occupancy or live workflow source.',
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
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
            Methodology & Data Limitations
          </span>
        </div>
        <span className="text-xs font-semibold text-amber-700">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-3">
          {ITEMS.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-0.5 w-16 shrink-0 rounded bg-amber-100 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-amber-800">
                {item.label}
              </span>
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
