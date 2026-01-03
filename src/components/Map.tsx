"use client";

import dynamic from "next/dynamic";
import { MapProps } from "@/maps/types";

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
