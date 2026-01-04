"use client";

import { JourneyRoute } from "@/types/journey";
import { Clock, IndianRupee, ArrowRight, Zap, Wallet } from "lucide-react";

type Props = {
  route: JourneyRoute;
  allRoutes: JourneyRoute[];
  isSelected: boolean;
  onPreview: (route: JourneyRoute) => void;
  onSelect: (route: JourneyRoute) => void;
};

export default function RouteCard({
  route,
  allRoutes,
  isSelected,
  onPreview,
  onSelect,
}: Props) {
  const minCost = Math.min(...allRoutes.map((r) => r.totalCost));
  const minTime = Math.min(...allRoutes.map((r) => r.totalTime));
  const maxCost = Math.max(...allRoutes.map((r) => r.totalCost));
  const maxTime = Math.max(...allRoutes.map((r) => r.totalTime));

  const costScore =
    maxCost === minCost
      ? 100
      : 100 - ((route.totalCost - minCost) / (maxCost - minCost)) * 100;

  const timeScore =
    maxTime === minTime
      ? 100
      : 100 - ((route.totalTime - minTime) / (maxTime - minTime)) * 100;

  const isCheapest = route.totalCost === minCost;
  const isFastest = route.totalTime === minTime;

  return (
    <div
      onClick={() => onPreview(route)}
      className={`
        cursor-pointer
        rounded-2xl
        border
        p-4
        backdrop-blur
        transition
        ${
          isSelected
            ? "border-orange-500 bg-zinc-800/90 ring-2 ring-orange-500/30"
            : "border-white/10 bg-zinc-800/60 hover:border-orange-500/40 hover:bg-zinc-800/80"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold">
            {route.name || "Route option"}
          </h3>
          <p className="text-xs text-zinc-400 font-bold">
            {route.legs.length} segments · Multimodal
          </p>
        </div>

        {/* Badges */}
        <div className="flex gap-1">
          {isFastest && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs text-orange-400 font-bold">
              <Zap size={12} /> Fastest
            </span>
          )}
          {isCheapest && (
            <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400 font-bold">
              <Wallet size={12} /> Cheapest
            </span>
          )}
        </div>
      </div>

      {/* Time & Cost */}
      <div className="flex items-center gap-4 text-sm text-zinc-300 mb-3 font-bold">
        <span className="flex items-center gap-1">
          <Clock size={14} className="text-orange-400" />
          {route.totalTime} mins
        </span>
        <span className="flex items-center gap-1">
          <IndianRupee size={14} className="text-orange-400" />
          {route.totalCost}
        </span>
      </div>

      {/* Comparison bars */}
      <div className="mb-3 space-y-2 flex gap-2">
        <div className="w-full">
          <p className="text-xs text-zinc-400 mb-1 font-bold">
            Time efficiency
          </p>
          <div className="h-1.5 w-full rounded bg-zinc-700">
            <div
              className="h-full rounded bg-orange-500 transition-all"
              style={{ width: `${timeScore}%` }}
            />
          </div>
        </div>

        <div className="w-full">
          <p className="text-xs text-zinc-400 mb-1 font-bold">
            Cost efficiency
          </p>
          <div className="h-1.5 w-full rounded bg-zinc-700">
            <div
              className="h-full rounded bg-green-500 transition-all"
              style={{ width: `${costScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Route steps */}
      <div className="mb-4 space-y-1">
        {route.legs.map((leg, idx) => (
          <div key={idx} className="flex items-center text-xs text-zinc-400">
            <span className="min-w-12 text-zinc-300 font-bold">
              {leg.mode}
            </span>
            <ArrowRight size={12} className="mx-1 opacity-40" />
            <span className="truncate font-bold">
              {leg.source} → {leg.destination}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // 👈 prevents preview click
          onSelect(route);
        }}
        className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-black transition hover:bg-orange-400 active:scale-[0.98] cursor-pointer"
      >
        Select route
      </button>
    </div>
  );
}
