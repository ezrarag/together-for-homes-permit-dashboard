import type { Permit } from "@/lib/types";

interface PermitCardProps {
  permit: Permit;
  selected?: boolean;
  onClick?: () => void;
}

const statusClassName: Record<Permit["status"], string> = {
  issued: "bg-blue-100 text-tfh-blue-btn border border-blue-200",
  open: "bg-green-100 text-green-700 border border-green-200",
  closed: "bg-gray-100 text-gray-500 border border-gray-200",
  expired: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
};

export default function PermitCard({ permit, selected, onClick }: PermitCardProps) {
  return (
    <article
      onClick={onClick}
      className={`rounded-xl border p-4 shadow-sm transition ${
        selected
          ? "border-tfh-blue bg-blue-50 ring-1 ring-tfh-blue"
          : "border-gray-200 bg-white hover:border-tfh-blue/40 hover:shadow-md"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-tfh-navy">
            {permit.displayAddress || permit.address}
          </h3>
          {permit.zipCode ? (
            <p className="text-xs text-gray-400">ZIP {permit.zipCode}</p>
          ) : null}
          {permit.useOfBuilding ? (
            <p className="mt-0.5 text-sm text-gray-500">{permit.useOfBuilding}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[permit.status]}`}
        >
          {permit.rawStatus || permit.status}
        </span>
      </div>
      {permit.dwellingUnitsImpact !== undefined ? (
        <p className="mt-2 text-xs text-gray-500">
          Dwelling units:{" "}
          <span className="font-medium text-tfh-navy">
            {permit.dwellingUnitsImpact}
          </span>
        </p>
      ) : null}
    </article>
  );
}
