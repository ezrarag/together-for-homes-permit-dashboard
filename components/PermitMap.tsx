"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { Permit } from "@/lib/types";

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColors: Record<Permit["status"], string> = {
  issued: "#019cf2",
  open: "#22c55e",
  closed: "#9ca3af",
  expired: "#ef4444",
  pending: "#f59e0b",
};

interface MappablePermit extends Permit {
  lat: number;
  lng: number;
}

function isMappable(permit: Permit): permit is MappablePermit {
  return (
    typeof permit.lat === "number" &&
    typeof permit.lng === "number" &&
    Number.isFinite(permit.lat) &&
    Number.isFinite(permit.lng)
  );
}

interface PermitMapProps {
  permits: Permit[];
  loading?: boolean;
  selectedPermit?: Permit | null;
  onSelectPermit: (permit: Permit) => void;
}

function SelectedPermitPan({ permit }: { permit?: Permit | null }) {
  const map = useMap();

  useEffect(() => {
    if (permit && isMappable(permit)) {
      map.flyTo([permit.lat, permit.lng], Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [map, permit]);

  return null;
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "-";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function PermitMap({
  permits,
  loading,
  selectedPermit,
  onSelectPermit,
}: PermitMapProps) {
  const mappable = permits.filter(isMappable);
  const hasLocations = mappable.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-tfh-navy">
          Permit Map
        </h2>
        <span className="text-xs text-gray-400">
          {hasLocations
            ? `${mappable.length.toLocaleString()} pins`
            : "No location data in this dataset"}
        </span>
      </div>

      {!hasLocations && !loading ? (
        /* Polished empty state */
        <div className="flex h-[180px] flex-col items-center justify-center gap-2 bg-gray-50 px-6 text-center">
          {/* Map pin SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            No location data available from this source
          </p>
          <p className="text-xs text-gray-400">
            Permit records are available in the table below
          </p>
        </div>
      ) : (
        <div className="relative">
          <MapContainer
            center={[43.0389, -87.9065]}
            zoom={12}
            scrollWheelZoom
            className="h-[260px] w-full bg-gray-100 md:h-[380px]"
          >
            <SelectedPermitPan permit={selectedPermit} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappable.map((permit) => {
              const isSelected = selectedPermit?.id === permit.id;

              return (
                <CircleMarker
                  key={permit.id}
                  center={[permit.lat, permit.lng]}
                  radius={isSelected ? 9 : 6}
                  pathOptions={{
                    color: statusColors[permit.status],
                    fillColor: statusColors[permit.status],
                    fillOpacity: isSelected ? 0.95 : 0.75,
                    weight: isSelected ? 3 : 1,
                  }}
                  eventHandlers={{
                    click: () => onSelectPermit(permit),
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">{permit.address}</p>
                      <p>Type: {permit.permitType.replaceAll("_", " ")}</p>
                      <p>Status: {permit.rawStatus || permit.status}</p>
                      <p>Issued: {permit.issuedDate || "-"}</p>
                      <p>Value: {formatCurrency(permit.value)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          {loading ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-tfh-blue" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
