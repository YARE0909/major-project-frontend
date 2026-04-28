import { JourneyRoute } from "@/types/journey";
import {
  Clock,
  IndianRupee,
  ArrowRight,
  Zap,
  Wallet,
  ShieldAlert,
} from "lucide-react";

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
  /* ---------- cost/time comparison ---------- */

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

  /* ---------- accessibility score ---------- */

  const avgAccessibility =
    route.legs.length > 0
      ? route.legs.reduce(
          (acc, leg) => acc + (leg.accessibility?.score ?? 100),
          0
        ) / route.legs.length
      : 100;

  const accessibilityScore = Math.max(0, Math.min(100, avgAccessibility));

  /* ---------- failure risk ---------- */

  const failureRisk =
    route.failureProbability !== undefined
      ? route.failureProbability <= 1
        ? route.failureProbability * 100
        : route.failureProbability
      : 0;

  const riskScore = Math.max(0, Math.min(100, failureRisk));

  return (
    <div
      onClick={() => {
        onPreview(route);
        onSelect(route);
      }}
      className={`
        cursor-pointer
        rounded-2xl
        border
        p-4.5
        transition-all
        duration-300
        flex flex-col
        relative
        overflow-hidden
        ${
          isSelected
            ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_24px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20"
            : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-800/60"
        }
      `}
    >
      {/* Subtle background glow for selected state */}
      {isSelected && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      )}

      {/* ---------- HEADER ---------- */}
      <div className="flex items-start justify-between mb-4 gap-3 relative z-10">
        <div className="min-w-0">
          <h3 className={`text-base font-bold truncate ${isSelected ? "text-indigo-100" : "text-white"}`}>
            {route.name || "Route Option"}
          </h3>
          <p className="text-[11px] text-neutral-400 font-medium mt-1 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
            {route.legs.length} Segments
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isFastest && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400 font-bold uppercase tracking-wider shadow-sm shadow-amber-500/5">
              <Zap size={10} className="fill-amber-500/50" /> Fastest
            </span>
          )}
          {isCheapest && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/5">
              <Wallet size={10} /> Cheapest
            </span>
          )}
        </div>
      </div>

      {/* ---------- TIME & COST ---------- */}
      <div className="flex items-center gap-5 text-sm mb-5 font-semibold relative z-10 bg-neutral-950/50 p-3 rounded-xl border border-neutral-800/80">
        <span className="flex items-center gap-2 text-neutral-100">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
            <Clock size={14} />
          </div>
          {route.totalTime} min
        </span>
        <div className="w-[1px] h-6 bg-neutral-800" />
        <span className="flex items-center gap-2 text-neutral-100">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <IndianRupee size={14} />
          </div>
          {route.totalCost}
        </span>
      </div>

      {/* ---------- ACCESSIBILITY & RISK ---------- */}
      <div className="flex items-center justify-between mb-5 gap-4 relative z-10">
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">
            Accessibility
          </span>
          <span
            className={`text-xs font-bold ${
              accessibilityScore > 80
                ? "text-emerald-400"
                : accessibilityScore > 50
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {Math.round(accessibilityScore)}% Score
          </span>
        </div>

        <div className="w-[1px] h-6 bg-neutral-800" />

        <div className="flex-1 flex flex-col gap-1 items-end">
          <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">
            <ShieldAlert size={10} /> Failure Risk
          </span>
          <span
            className={`text-xs font-bold ${
              riskScore < 20
                ? "text-emerald-400"
                : riskScore < 40
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {riskScore.toFixed(0)}% Risk
          </span>
        </div>
      </div>

      {/* ---------- COMPARISON BARS ---------- */}
      <div className="mb-5 space-y-3 relative z-10">
        <div className="w-full group">
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1.5 font-semibold uppercase tracking-widest">
            <span>Time Efficiency</span>
            <span className="text-blue-400">{Math.round(timeScore)}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
              style={{ width: `${timeScore}%` }}
            />
          </div>
        </div>

        <div className="w-full group">
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1.5 font-semibold uppercase tracking-widest">
            <span>Cost Efficiency</span>
            <span className="text-emerald-400">{Math.round(costScore)}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${costScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ---------- ROUTE STEPS ---------- */}
      <div className="space-y-2 pt-4 border-t border-neutral-800/80 relative z-10">
        {route.legs.map((leg, idx) => (
          <div key={idx} className="flex items-center text-xs">
            <span className="min-w-[56px] text-indigo-300/80 font-bold uppercase tracking-wider text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-center">
              {leg.mode}
            </span>
            <ArrowRight size={12} className="mx-2 text-neutral-600 shrink-0" />
            <span className="truncate text-neutral-300 font-medium">
              {leg.source} <span className="text-neutral-600 mx-1">→</span> {leg.destination}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}