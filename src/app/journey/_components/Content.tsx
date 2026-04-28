import RouteCard from "@/components/RouteCard";
import { JourneyRoute } from "@/types/journey";
import {
  MapPin,
  ArrowDown,
  Accessibility,
  AlertTriangle,
  EyeOff,
  EarOff,
  Brain,
  BatteryLow,
} from "lucide-react";

type Props = {
  source: string;
  setSource: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  planJourney: () => void;
  loading: boolean;
  error: string | null;
  routes: JourneyRoute[];
  selectedRoute: JourneyRoute | null;
  setSelectedRoute: (route: JourneyRoute) => void;
  accessibility: any;
  setAccessibility: any;
  liveDisclaimer?: string | null;
};

// Replaced string arrays with objects containing Lucide components
const ACCESS_OPTIONS = [
  { id: "wheelchair", icon: Accessibility, label: "Wheelchair" },
  { id: "blind", icon: EyeOff, label: "Low Vision" },
  { id: "deaf", icon: EarOff, label: "Deaf" },
  { id: "cognitive", icon: Brain, label: "Cognitive" },
  { id: "fatigue", icon: BatteryLow, label: "Fatigue" },
] as const;

export default function Content({
  source,
  setSource,
  destination,
  setDestination,
  planJourney,
  loading,
  error,
  routes,
  selectedRoute,
  setSelectedRoute,
  accessibility,
  setAccessibility,
  liveDisclaimer,
}: Props) {
  return (
    <div className="flex flex-col h-full font-[family-name:var(--font-geist-sans)] text-neutral-200 bg-neutral-900/50">
      {/* Header */}
      <div className="shrink-0 px-5 md:px-4 pt-2 md:pt-4 pb-4 md:pb-5 border-b border-neutral-800">
        <h1 className="text-xl font-bold tracking-tight text-white">
          TravelNest
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Professional Journey Intelligence
        </p>
      </div>

      {/* Scrollable Container with extra bottom padding for mobile safe areas */}
      <div className="flex-1 overflow-y-auto p-5 md:p-3 space-y-6 pb-12 md:pb-6 overscroll-contain">
        {liveDisclaimer && (
          <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <AlertTriangle
              size={16}
              className="text-neutral-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-neutral-300 leading-relaxed">
              {liveDisclaimer}
            </p>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-3">
          <div className="relative">
            <MapPin
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              placeholder="Origin"
              className="w-full h-12 md:h-14 rounded-xl bg-neutral-950 border border-neutral-800 pl-11 pr-4 text-[15px] md:text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all shadow-inner"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="relative">
            <ArrowDown
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              placeholder="Destination"
              className="w-full h-12 md:h-14 rounded-xl bg-neutral-950 border border-neutral-800 pl-11 pr-4 text-[15px] md:text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all shadow-inner"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>

        {/* Accessibility Needs */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Accessibility size={14} /> Accessibility Needs
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCESS_OPTIONS.map(({ id, icon: Icon, label }) => {
              const active = accessibility[id];
              return (
                <button
                  key={id}
                  onClick={() =>
                    setAccessibility((prev: any) => ({
                      ...prev,
                      [id]: !prev[id],
                    }))
                  }
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all border cursor-pointer ${
                    active
                      ? "bg-white text-black border-white shadow-md shadow-white/10"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <Icon
                    size={14}
                    className={active ? "text-black" : "text-neutral-500"}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action CTA */}
        <button
          onClick={planJourney}
          disabled={loading || !source || !destination}
          className="w-full h-14 rounded-xl font-bold text-sm bg-white text-black hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-black animate-spin" />
          ) : (
            "Analyze Routes"
          )}
        </button>

        {error && (
          <p className="text-xs text-red-400 text-center font-medium">
            {error}
          </p>
        )}

        {/* Route List */}
        {routes.length > 0 && (
          <div className="pt-6 border-t border-neutral-800 space-y-4">
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
              Available Options
            </p>
            <div className="space-y-3">
              {routes.map((route: JourneyRoute) => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className="cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <RouteCard
                    route={route}
                    allRoutes={routes}
                    isSelected={selectedRoute?.id === route.id}
                    onPreview={setSelectedRoute}
                    onSelect={setSelectedRoute}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
