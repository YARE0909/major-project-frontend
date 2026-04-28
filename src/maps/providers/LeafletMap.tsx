"use client";

import dynamic from "next/dynamic";
import "@/lib/leaflet";
import { useOSRMRoute } from "../hooks/useOSRMRoute";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

export default function LeafletMap({
  legs,
  className,
  interactive = true,
}: any) {
  const firstLeg = legs?.[0];
  const lastLeg = legs?.[legs.length - 1];

  const fallbackCenter: [number, number] = [13.0827, 80.2707];

  const from: [number, number] | undefined = firstLeg
    ? [firstLeg.fromCoords.lat, firstLeg.fromCoords.lon]
    : undefined;

  const to: [number, number] | undefined = lastLeg
    ? [lastLeg.toCoords.lat, lastLeg.toCoords.lon]
    : undefined;

  const center = from ?? fallbackCenter;

  const { route } = useOSRMRoute(from, to);

  return (
    <div className={className ?? "h-full w-full"}>
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full bg-neutral-950"
        zoomControl={false}
        dragging={interactive}
        scrollWheelZoom={interactive}
      >
        {/* ── FIX: Free, No-Auth Dark Mode Tiles from CartoDB ── */}
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {from && <Marker position={from} />}
        {to && <Marker position={to} />}

        {route && (
          <>
            {/* Inner solid line (Indigo) */}
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: "#6366f1", 
                weight: 5,
                opacity: 1,
              }}
            />
            {/* Outer glow line (Indigo) */}
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: "#6366f1",
                weight: 12,
                opacity: 0.2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}