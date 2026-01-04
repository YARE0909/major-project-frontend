import RouteCard from "@/components/RouteCard";
import { JourneyRoute } from "@/types/journey";
import { ArrowRight, MapPin } from "lucide-react";

export default function Content({
  source,
  setSource,
  destination,
  setDestination,
  planJourney,
  loading,
  error,
  routes,
  bookRoute,
  selectedRoute,
  setSelectedRoute,
}: any) {
  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-lg font-bold tracking-tight">TravelNest</h1>
      </div>
      <p className="text-xs text-zinc-400 -mt-2 font-bold">
        One app. Every journey.
      </p>

      <div className="space-y-3">
        <div className="relative">
          <MapPin
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
          />
          <input
            placeholder="From where?"
            className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <div className="relative">
          <ArrowRight
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
          />
          <input
            placeholder="Where to?"
            className="w-full rounded-xl bg-zinc-800/70 border border-zinc-700/60 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <button
          onClick={planJourney}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-3 font-bold text-black hover:bg-orange-400 active:scale-[0.98] disabled:opacity-60 transition cursor-pointer"
        >
          {loading ? "Finding routes…" : "Find routes"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {routes.map((route: JourneyRoute) => (
          <RouteCard
            key={route.id}
            route={route}
            allRoutes={routes}
            isSelected={selectedRoute?.id === route.id}
            onPreview={setSelectedRoute}
            onSelect={bookRoute}
          />
        ))}
      </div>
    </div>
  );
}
