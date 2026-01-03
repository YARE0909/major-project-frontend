"use client";

import { JourneyRoute } from "@/types/journey";
import { Clock, IndianRupee } from "lucide-react";

type Props = {
  route: JourneyRoute;
  onSelect: (route: JourneyRoute) => void;
};

export default function RouteCard({ route, onSelect }: Props) {
  return (
    <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
      <h3 className="text-lg font-semibold mb-2">
        {route.name || "Route Option"}
      </h3>

      <div className="flex gap-4 text-sm text-zinc-400 mb-3">
        <span className="flex items-center gap-1">
          <Clock size={14} /> {route.totalTime} mins
        </span>
        <span className="flex items-center gap-1">
          <IndianRupee size={14} /> {route.totalCost}
        </span>
      </div>

      <ul className="text-sm text-zinc-300 mb-4 space-y-1">
        {route.legs.map((leg, idx) => (
          <li key={idx}>
            {idx + 1}. {leg.mode}: {leg.source} → {leg.destination}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(route)}
        className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700"
      >
        Select & Book
      </button>
    </div>
  );
}
