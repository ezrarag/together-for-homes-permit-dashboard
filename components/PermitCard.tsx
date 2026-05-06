import type { Permit } from "@/lib/types";

interface PermitCardProps {
  permit: Permit;
  selected?: boolean;
  onClick?: () => void;
}

const statusClassName: Record<Permit["status"], string> = {
  issued: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  open: "border-green-500/30 bg-green-500/10 text-green-400",
  closed: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  expired: "border-red-500/30 bg-red-500/10 text-red-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export default function PermitCard({ permit, selected, onClick }: PermitCardProps) {
  return (
    <article
      onClick={onClick}
      className={`rounded-lg border p-4 shadow-sm ${
        selected
          ? "border-green-500 bg-green-500/10"
          : "border-zinc-800 bg-zinc-950"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">
            {permit.displayAddress || permit.address}
          </h3>
          {permit.zipCode ? (
            <p className="text-xs text-zinc-500">ZIP {permit.zipCode}</p>
          ) : null}
          {permit.useOfBuilding ? (
            <p className="text-sm text-zinc-400">{permit.useOfBuilding}</p>
          ) : null}
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassName[permit.status]}`}
        >
          {permit.rawStatus || permit.status}
        </span>
      </div>
      {permit.dwellingUnitsImpact !== undefined ? (
        <p className="mt-3 text-sm text-zinc-400">
          Dwelling units: {permit.dwellingUnitsImpact}
        </p>
      ) : null}
    </article>
  );
}
