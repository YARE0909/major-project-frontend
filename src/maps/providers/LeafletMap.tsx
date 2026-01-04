"use client";

import dynamic from "next/dynamic";
import "@/lib/leaflet";
import { useOSRMRoute } from "../hooks/useOSRMRoute";
import { MapProps } from "@/types/journey";

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
}: MapProps) {
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
        className="h-full w-full"
        zoomControl={false}
        dragging={interactive}
        scrollWheelZoom={interactive}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

        {from && <Marker position={from} />}
        {to && <Marker position={to} />}

        {route && (
          <>
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: "#f97316",
                weight: 6,
                opacity: 1,
              }}
            />
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: "#f97316",
                weight: 12,
                opacity: 0.25,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
