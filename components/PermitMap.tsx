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

const statusColors = {
  open: "#22c55e",
  closed: "#71717a",
  expired: "#ef4444",
  pending: "#f59e0b",
};

interface PermitMapProps {
  permits: Permit[];
  loading?: boolean;
  selectedPermit?: Permit | null;
  onSelectPermit: (permit: Permit) => void;
}

function SelectedPermitPan({ permit }: { permit?: Permit | null }) {
  const map = useMap();

  useEffect(() => {
    if (permit) {
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
  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Permit Map</h2>
        <span className="text-xs text-zinc-500">
          {permits.length.toLocaleString()} pins
        </span>
      </div>
      <div className="relative">
        <MapContainer
          center={[43.0389, -87.9065]}
          zoom={12}
          scrollWheelZoom
          className="h-[300px] w-full bg-zinc-950 md:h-[420px]"
        >
          <SelectedPermitPan permit={selectedPermit} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {permits.map((permit) => {
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
                    <p>Status: {permit.status}</p>
                    <p>Issued: {permit.issuedDate || "-"}</p>
                    <p>Value: {formatCurrency(permit.value)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        {loading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950/35">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-green-500" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
