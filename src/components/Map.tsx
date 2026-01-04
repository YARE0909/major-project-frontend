"use client";

import { MapProps } from "@/types/journey";
import dynamic from "next/dynamic";

/**
 * CHANGE THIS IMPORT to switch providers
 */
const MapProvider = dynamic(
  () => import("../maps/providers/LeafletMap"),
  { ssr: false }
);

export default function Map(props: MapProps) {
  return <MapProvider {...props} />;
}
