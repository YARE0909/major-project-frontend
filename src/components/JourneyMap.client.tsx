"use client";

import dynamic from "next/dynamic";
import { JourneyLeg } from "@/types/journey";
import { locationCoords } from "@/lib/locations";
import "@/lib/leaflet";

// Dynamically import Leaflet components (CLIENT ONLY)
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

type Props = {
  legs: JourneyLeg[];
};

const modeColors: Record<string, string> = {
  METRO: "blue",
  BUS: "green",
  AUTO: "orange",
  CAB: "yellow",
  TRAIN: "purple",
  WALK: "gray",
};

export default function JourneyMapClient({ legs }: Props) {
  const hasLegs = legs && legs.length > 0;

  const points: [number, number][] = [];

  legs.forEach((leg) => {
    const src = locationCoords[leg.source];
    const dst = locationCoords[leg.destination];
    if (src) points.push(src);
    if (dst) points.push(dst);
  });

  const center: [number, number] = hasLegs
    ? locationCoords[legs[0].source] || [13.0827, 80.2707]
    : [13.0827, 80.2707]; // default "current location"

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Markers */}
        {hasLegs && points.map((p, idx) => <Marker key={idx} position={p} />)}

        {/* Route polylines */}
        {hasLegs &&
          legs.map((leg, idx) => {
            const src = locationCoords[leg.source];
            const dst = locationCoords[leg.destination];
            if (!src || !dst) return null;

            return (
              <Polyline
                key={idx}
                positions={[src, dst]}
                pathOptions={{
                  color: modeColors[leg.mode] || "white",
                  weight: 4,
                }}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}
